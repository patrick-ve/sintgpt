import { consola } from 'consola';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { DocumentAnalysisSchema } from '~/server/utils/documentSchema';
import { pdf } from 'pdf-to-img';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Get OpenAI API key from runtime config
const runtimeConfig = useRuntimeConfig();

// Define cost per 1M tokens (as of GPT-4 Vision pricing)
const INPUT_TOKEN_COST = 0.4; // $0.40 per 1M input tokens
const OUTPUT_TOKEN_COST = 1.6; // $1.60 per 1M output tokens

interface PageAnalysisResult {
  pageNumber: number;
  analysis: any; // Adjust 'any' to your specific analysis schema type if available
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

// Define the expected structure for the request body (multipart/form-data)
// Nitro/h3 automatically handles multipart/form-data parsing
// We expect a field named 'image' containing the file
interface ImageRequestBody {
  image: File; // This will be a File object provided by Nitro
}

// Define the system prompt for the AI
const systemPrompt = `You are a specialized AI assistant for analyzing historical WWII documents. Your task is to analyze the provided image and generate a structured analysis in JSON format. The JSON object must strictly adhere to the following schema:

${JSON.stringify(DocumentAnalysisSchema.shape, null, 2)}

Focus on:
1. Accurately transcribing handwritten text from the WWII era
2. Identifying key historical figures, locations, and organizations
3. Extracting dates and creating a timeline of events
4. Identifying important topics and themes
5. Analyzing the sentiment and emotional tone
6. Explaining historical terms and vocabulary
7. Mapping mentioned locations

Ensure that all text is transcribed as accurately as possible, maintaining the original language and terminology.
Ensure the output is ONLY the JSON object.
`;

export default defineEventHandler(async (event) => {
  try {
    // Read the multipart/form-data body
    const body = await readMultipartFormData(event);

    // Find the image file part
    const imagePart = body?.find((part) => part.name === 'image');

    if (!imagePart || !imagePart.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request: Missing file in the request.',
      });
    }

    const analyses: PageAnalysisResult[] = [];
    let totalPagesProcessed = 0;
    let overallPromptTokens = 0;
    let overallCompletionTokens = 0;

    // Handle PDF conversion if needed
    if (imagePart.type === 'application/pdf') {
      const tempPdfPath = join(tmpdir(), `temp-${Date.now()}.pdf`);
      try {
        await writeFile(tempPdfPath, imagePart.data);
        const document = await pdf(tempPdfPath, { scale: 2.0 });
        totalPagesProcessed = document.length;

        if (totalPagesProcessed === 0) {
          // Handle empty PDF
          consola.warn('PDF has 0 pages.');
          // Return empty analysis or appropriate error
        } else {
          const pageProcessingPromises = Array.from(
            { length: totalPagesProcessed },
            (_, k) => k + 1
          ).map(async (pageNumber) => {
            consola.info(
              `Processing PDF page ${pageNumber} of ${totalPagesProcessed} (parallel)...`
            );
            const pageImageBuffer =
              await document.getPage(pageNumber);
            const base64Image = pageImageBuffer.toString('base64');
            const imageUrl = `data:image/png;base64,${base64Image}`; // pdf-to-img outputs PNG

            const userMessageContent: Array<
              | { type: 'text'; text: string }
              | { type: 'image'; image: URL | Buffer | string }
            > = [
              {
                type: 'text',
                text: `Analyze this WWII document (Page ${pageNumber} of ${totalPagesProcessed}) and extract all relevant information following the schema.`,
              },
              {
                type: 'image',
                image: imageUrl,
              },
            ];

            consola.info(
              `Sending page ${pageNumber} to OpenAI Vision for analysis (parallel)...`
            );
            const { object: pageAnalysis, usage: pageUsage } =
              await generateObject({
                model: openai('gpt-4.1-mini'),
                schema: DocumentAnalysisSchema,
                mode: 'json',
                messages: [
                  { role: 'user', content: userMessageContent },
                ],
                system: systemPrompt,
                temperature: 0,
              });

            return {
              pageNumber,
              analysis: pageAnalysis,
              usage: {
                promptTokens: pageUsage?.promptTokens || 0,
                completionTokens: pageUsage?.completionTokens || 0,
              },
            } as PageAnalysisResult;
          });

          const results = await Promise.all(pageProcessingPromises);

          results.forEach((result) => {
            analyses.push(result);
            overallPromptTokens += result.usage.promptTokens;
            overallCompletionTokens += result.usage.completionTokens;
          });
        }
        await unlink(tempPdfPath);
      } catch (error) {
        consola.error('Error processing PDF:', error);
        if (tempPdfPath) {
          try {
            await unlink(tempPdfPath); // Ensure cleanup on error
          } catch (cleanupError) {
            consola.error(
              'Error cleaning up temp PDF file:',
              cleanupError
            );
          }
        }
        throw createError({
          statusCode: 500,
          statusMessage: 'Error processing PDF document.',
        });
      }
    } else {
      // Handle regular image
      if (!imagePart.type?.startsWith('image/')) {
        throw createError({
          statusCode: 400,
          statusMessage:
            'Bad Request: Invalid file type. Only images and PDFs are supported.',
        });
      }
      const imageBuffer = imagePart.data;
      const mimeType = imagePart.type;
      totalPagesProcessed = 1;

      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:${mimeType};base64,${base64Image}`;

      const userMessageContent: Array<
        | { type: 'text'; text: string }
        | { type: 'image'; image: URL | Buffer | string }
      > = [
        {
          type: 'text',
          text: 'Analyze this WWII document and extract all relevant information following the schema.',
        },
        {
          type: 'image',
          image: imageUrl,
        },
      ];

      consola.info('Sending image to OpenAI Vision for analysis...');
      const { object: singleAnalysis, usage: singleUsage } =
        await generateObject({
          model: openai('gpt-4.1-mini'),
          schema: DocumentAnalysisSchema,
          mode: 'json',
          messages: [{ role: 'user', content: userMessageContent }],
          system: systemPrompt,
          temperature: 0,
        });

      const promptTokens = singleUsage?.promptTokens || 0;
      const completionTokens = singleUsage?.completionTokens || 0;

      analyses.push({
        pageNumber: 1,
        analysis: singleAnalysis,
        usage: {
          promptTokens,
          completionTokens,
        },
      });
      overallPromptTokens += promptTokens;
      overallCompletionTokens += completionTokens;
    }

    // Calculate overall costs
    const inputCost =
      (overallPromptTokens / 1000000) * INPUT_TOKEN_COST;
    const outputCost =
      (overallCompletionTokens / 1000000) * OUTPUT_TOKEN_COST;
    const totalCost = inputCost + outputCost;

    // Log overall token usage and costs
    consola.info('Overall Token Usage:', {
      totalPagesProcessed,
      inputTokens: overallPromptTokens,
      outputTokens: overallCompletionTokens,
      totalTokens: overallPromptTokens + overallCompletionTokens,
      inputCost: `$${inputCost.toFixed(4)}`,
      outputCost: `$${outputCost.toFixed(4)}`,
      totalCost: `$${totalCost.toFixed(4)}`,
    });

    return {
      analyses, // Array of analysis results, each with pageNumber
      totalPages: totalPagesProcessed,
      overallUsage: {
        inputTokens: overallPromptTokens,
        outputTokens: overallCompletionTokens,
        totalTokens: overallPromptTokens + overallCompletionTokens,
        inputCost: `$${inputCost.toFixed(4)}`,
        outputCost: `$${outputCost.toFixed(4)}`,
        totalCost: `$${totalCost.toFixed(4)}`,
      },
    };
  } catch (error: any) {
    console.error(
      'Error processing document analysis request:',
      error
    );

    // Check if it's an h3 error from file reading/parsing
    if (error.statusCode && error.statusMessage) {
      throw error;
    }

    // Handle potential errors from generateObject
    let statusCode = 500;
    let statusMessage =
      'Internal Server Error: Could not analyze document.';

    if (error.message?.includes('schema validation failed')) {
      statusMessage =
        'AI failed to generate an analysis matching the required format.';
    }

    // Add a more specific check for OpenAI API errors if possible, e.g. based on error.type or error.status
    if (error.name === 'APIError' && error.status === 429) {
      statusCode = 429;
      statusMessage =
        'API rate limit exceeded. Please try again later.';
    } else if (error.name === 'APIError') {
      statusCode = error.status || 500;
      statusMessage = `AI API Error: ${error.message}`;
    }

    throw createError({
      statusCode,
      statusMessage,
      data: { originalError: error.message },
    });
  }
});
