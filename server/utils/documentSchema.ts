import { z } from 'zod';

// Basic entity types
const NamedEntity = z
  .object({
    text: z
      .string()
      .describe(
        'The exact string of the named entity found in the text.'
      ),
    type: z
      .enum([
        'PERSON',
        'LOCATION',
        'DATE',
        'ORG',
        'EVENT',
        'MILITARY_UNIT',
      ])
      .describe('The category of the named entity.'),
    startIndex: z
      .number()
      .describe('Start index of the entity in the transcription.'),
    endIndex: z
      .number()
      .describe(
        'End index (exclusive) of the entity in the transcription.'
      ),
  })
  .describe('A named entity identified in the text.');

const TimelineEvent = z
  .object({
    date: z
      .string()
      .describe("ISO 8601 date of the event, e.g., '1944-06-06'."),
    description: z.string().describe('A brief summary of the event.'),
    linkedEntities: z
      .array(z.string())
      .optional()
      .describe(
        'Text of entities (e.g., locations, people) related to this event.'
      ),
  })
  .describe(
    'An extracted historical event with a date and description.'
  );

const TopicTag = z
  .string()
  .describe(
    "High-level thematic tags related to the document's content."
  );

const SentimentEmotion = z
  .object({
    sentiment: z
      .enum(['positive', 'neutral', 'negative'])
      .describe('Overall sentiment of the document.'),
    emotions: z
      .array(z.string())
      .optional()
      .describe('Detected emotions within the text.'),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .describe(
        'Confidence score for the sentiment and emotion analysis (0 to 1).'
      ),
  })
  .describe(
    'Analysis of emotional tone and sentiment in the document.'
  );

const VocabularyEntry = z
  .object({
    term: z
      .string()
      .describe(
        'Word or phrase from the document needing clarification.'
      ),
    definition: z
      .string()
      .describe('Explanation or meaning of the term.'),
    contextSentence: z
      .string()
      .optional()
      .describe(
        'Example sentence from the document where the term appears.'
      ),
  })
  .describe(
    'A glossary item for enhancing understanding of obscure or historic terms.'
  );

const LocationMention = z
  .object({
    name: z.string().describe('Name of the location mentioned.'),
    coordinates: z
      .object({
        lat: z.number().describe('Latitude of the location.'),
        lon: z.number().describe('Longitude of the location.'),
      })
      .describe('Geographical coordinates of the location.'),
    relatedTextIndices: z
      .array(z.tuple([z.number(), z.number()]))
      .describe(
        'Array of [start, end] character index pairs where this location appears in the transcription.'
      ),
  })
  .describe(
    'A geographical location mentioned in the document with coordinates.'
  );

// Final schema
export const DocumentAnalysisSchema = z
  .object({
    transcription: z
      .string()
      .describe(
        'The full transcribed text from the handwritten document.'
      ),
    namedEntities: z
      .array(NamedEntity)
      .describe(
        'List of named entities extracted from the document.'
      ),
    timeline: z
      .array(TimelineEvent)
      .describe(
        'Chronological sequence of events derived from the text.'
      ),
    topicTags: z
      .array(TopicTag)
      .describe('Themes detected in the document.'),
    sentimentAnalysis: SentimentEmotion.describe(
      'Overall emotional and sentiment analysis.'
    ),
    vocabulary: z
      .array(VocabularyEntry)
      .describe(
        'Glossary of historical or obscure terms in the text.'
      ),
    locations: z
      .array(LocationMention)
      .describe('Geographic locations mentioned in the document.'),
  })
  .describe(
    'Complete analysis results of a WWII handwritten document.'
  );
