import { consola } from 'consola';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { z } from 'zod';

// Get API keys from runtime config
const runtimeConfig = useRuntimeConfig();

// Rate limiting storage
const rateLimitMap = new Map<
  string,
  { count: number; resetTime: number }
>();
const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

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

export default defineEventHandler(async (event) => {
  try {
    // Rate limiting check (skip in development)
    if (!import.meta.dev) {
      const ip =
        getRequestIP(event, { xForwardedFor: true }) || 'unknown';
      const now = Date.now();
      const rateLimitData = rateLimitMap.get(ip);

      // If no data or reset time has passed, initialize/reset the counter
      if (!rateLimitData || now >= rateLimitData.resetTime) {
        rateLimitMap.set(ip, {
          count: 0,
          resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
      } else if (rateLimitData.count >= RATE_LIMIT_MAX_REQUESTS) {
        // Rate limit exceeded
        const timeRemaining = rateLimitData.resetTime - now;
        const hoursRemaining = Math.ceil(
          timeRemaining / (60 * 60 * 1000)
        );

        consola.warn(
          `Rate limit exceeded for IP: ${ip} (${rateLimitData.count}/${RATE_LIMIT_MAX_REQUESTS} requests)`
        );

        throw createError({
          statusCode: 429,
          statusMessage: `You have reached the maximum of ${RATE_LIMIT_MAX_REQUESTS} free poems per 24 hours. Upgrade to unlimited access for just €3!`,
        });
      }
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

    const googleGenerativeAI = createGoogleGenerativeAI({
      apiKey: runtimeConfig.googleGenerativeAiApiKey,
    });

    const model = googleGenerativeAI('gemini-3-pro-preview');

    // Generate the poem using Gemini 3 Pro via AI SDK
    const result = streamText({
      model,
      prompt,
      temperature: 2,
      maxRetries: 3,
      providerOptions: {
        google: {
          thinkingConfig: {
            thinkingBudget: -1,
            includeThoughts: true,
          },
        },
      },
      onFinish({ usage }) {
        consola.info('Poem generated successfully');

        // Calculate cost based on Gemini 3 Pro pricing
        // Input: $2.00 per 1M tokens
        // Output (including reasoning tokens): $12.00 per 1M tokens
        const inputCost = ((usage.inputTokens || 0) / 1_000_000) * 2.0;
        const outputCost = ((usage.outputTokens || 0) / 1_000_000) * 12.0;
        const reasoningCost = ((usage.reasoningTokens || 0) / 1_000_000) * 12.0;
        const totalCost = inputCost + outputCost + reasoningCost;

        consola.info(`Total cost: $${totalCost.toFixed(6)}`);

        // Update rate limit counter on successful generation (skip in development)
        if (!import.meta.dev) {
          const ip =
            getRequestIP(event, { xForwardedFor: true }) || 'unknown';
          const currentData = rateLimitMap.get(ip);
          if (currentData) {
            rateLimitMap.set(ip, {
              count: currentData.count + 1,
              resetTime: currentData.resetTime,
            });

            consola.info(
              `Rate limit for IP ${ip}: ${currentData.count + 1}/${RATE_LIMIT_MAX_REQUESTS} requests used`
            );
          }
        }
      },
    });

    return result.toUIMessageStreamResponse();
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
