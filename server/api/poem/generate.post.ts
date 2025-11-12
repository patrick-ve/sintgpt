import { consola } from 'consola';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

// Get API keys from runtime config
const runtimeConfig = useRuntimeConfig();

// Rate limiting storage
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Define the request schema for validation
const PoemRequestSchema = z.object({
  name: z.string().min(1, 'Recipient name is required'),
  present: z.string().optional(),
  revealPresent: z.boolean().default(true),
  funFacts: z.string().optional(),
  style: z.enum(['funny', 'classic', 'ironic', 'old-fashioned']),
  rhymeScheme: z.enum(['AABB', 'ABBA', 'Limerick']),
  lines: z.number().int().min(8).max(40),
  language: z.enum(['dutch', 'english']),
});

function buildPrompt(
  data: z.infer<typeof PoemRequestSchema>
): string {
  const languageInstruction =
    data.language === 'dutch'
      ? 'Schrijf het gedicht in het Nederlands.'
      : 'Schrijf het gedicht in het Engels.';

  const styleDescriptions = {
    funny: 'grappig, speels en luchtig',
    classic: 'traditioneel, warm en respectvol',
    ironic: 'ironisch, geestig en subtiel sarcastisch',
    'old-fashioned':
      'ouderwets, formeel en traditioneel in taal en toon',
  };

  const rhymeSchemeDescriptions = {
    AABB: 'AABB rijmschema (rijmparen: eerste regel rijmt met tweede, derde met vierde, etc.)',
    ABBA: 'ABBA rijmschema (omarmend rijm: eerste en vierde regel rijmen, tweede en derde regel rijmen)',
    Limerick:
      'Limerick formaat (AABBA rijmschema met een lekkere cadans)',
  };

  // Build context about the recipient
  let recipientContext = `Het gedicht is voor ${data.name}.`;

  if (data.present) {
    if (data.revealPresent) {
      recipientContext += ` Ze krijgen: ${data.present} als Sinterklaascadeau.`;
    } else {
      recipientContext += ` Ze krijgen een Sinterklaascadeau (het cadeau is: ${data.present}, maar beschrijf dit VAAG en MYSTERIEUS in het gedicht zonder te onthullen wat het precies is - gebruik hints, omschrijvingen of raadsels).`;
    }
  }

  if (data.funFacts && data.funFacts.trim() !== '') {
    recipientContext += `\n\nLeuke weetjes over ${data.name}:\n${data.funFacts}`;
  }

  const presentInstruction =
    data.present && !data.revealPresent
      ? '\n- BELANGRIJK: Vermeldt het cadeau NIET letterlijk in het gedicht. Gebruik alleen vage hints, omschrijvingen of raadsels zodat de ontvanger moet raden wat het cadeau is.'
      : '';

  const prompt = `Je bent een creatieve dichter gespecialiseerd in Sinterklaasgedichten.

${languageInstruction}

Maak een Sinterklaasgedicht met de volgende specificaties:
- Ontvanger: ${recipientContext}
- Stijl: ${styleDescriptions[data.style]}
- Rijmschema: ${rhymeSchemeDescriptions[data.rhymeScheme]}
- Lengte: precies ${data.lines} regels

Belangrijke instructies:
- Het gedicht moet ${styleDescriptions[data.style]} zijn in toon
- Volg het ${rhymeSchemeDescriptions[data.rhymeScheme]} strikt
- Maak het gedicht persoonlijk door te verwijzen naar de hobby's, interesses, het cadeau of andere leuke weetjes van de ontvanger waar gepast${presentInstruction}
- Zorg dat het gedicht natuurlijk loopt en vermakelijk is
- Scheid coupletten met een lege regel (dubbele nieuwe regel)
- Voeg geen titel of extra tekst toe - geef alleen het gedicht zelf

Schrijf nu het gedicht:`;

  return prompt;
}

async function generatePoemWithRetry(
  ai: GoogleGenAI,
  config: any,
  contents: any[],
  maxRetries: number = 3
): Promise<any> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      consola.info(`Attempt ${attempt} of ${maxRetries} to generate poem...`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        config,
        contents,
      });

      return response;
    } catch (error: any) {
      lastError = error;

      // Check if it's a 503 overload error
      const isOverloadError = error?.error?.code === 503 ||
                              error?.error?.status === 'UNAVAILABLE' ||
                              error?.message?.includes('overloaded');

      if (isOverloadError && attempt < maxRetries) {
        consola.warn(`Model overloaded, retrying in 5 seconds... (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }

      // If it's not an overload error or we're out of retries, throw
      throw error;
    }
  }

  throw lastError;
}

export default defineEventHandler(async (event) => {
  try {
    // Rate limiting check
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
    const now = Date.now();
    const lastRequestTime = rateLimitMap.get(ip);

    if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_WINDOW_MS) {
      const timeRemaining = RATE_LIMIT_WINDOW_MS - (now - lastRequestTime);
      const minutesRemaining = Math.ceil(timeRemaining / 60000);

      consola.warn(`Rate limit exceeded for IP: ${ip}`);

      throw createError({
        statusCode: 429,
        statusMessage: `Je kunt maar 1 gedicht per uur genereren. Probeer het over ${minutesRemaining} ${minutesRemaining === 1 ? 'minuut' : 'minuten'} opnieuw.`,
      });
    }

    // Read and parse the request body
    const body = await readBody(event);

    // Validate the request data
    const validatedData = PoemRequestSchema.parse(body);

    consola.info('Generating poem with parameters:', {
      name: validatedData.name,
      style: validatedData.style,
      rhymeScheme: validatedData.rhymeScheme,
      lines: validatedData.lines,
      language: validatedData.language,
      hasFunFacts: !!validatedData.funFacts,
    });

    // Build the prompt
    const prompt = buildPrompt(validatedData);

    consola.info('Sending request to Gemini 2.5 Pro...');

    // Initialize the Google GenAI client
    const ai = new GoogleGenAI({
      apiKey: 'AIzaSyCc1Ch0F_o-lsp-FiFPIeyf-Hn-MNCk2E8',
    });

    // Configure the model
    const config = {
      temperature: 2,
      thinkingConfig: {
        thinkingBudget: -1,
      },
    };

    // Build the contents array for the API
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    // Generate the poem using Gemini 2.5 Pro with retry logic
    const response = await generatePoemWithRetry(ai, config, contents);

    consola.info('Poem generated successfully');
    console.dir(response.usageMetadata, { depth: null });

    // Update rate limit timestamp on successful generation
    rateLimitMap.set(ip, now);

    return {
      poem: response.text?.trim() || '',
    };
  } catch (error: any) {
    consola.error('Error generating poem:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: { errors: error.errors },
      });
    }

    // Handle API errors
    if (error.name === 'APIError') {
      throw createError({
        statusCode: error.status || 500,
        statusMessage: `AI API Error: ${error.message}`,
      });
    }

    // Generic error
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate poem',
      data: { originalError: error.message },
    });
  }
});
