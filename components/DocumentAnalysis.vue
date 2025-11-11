<script setup lang="ts">
interface NamedEntity {
  text: string;
  type: string;
  startIndex: number;
  endIndex: number;
}

interface TimelineEvent {
  date: string;
  description: string;
  linkedEntities?: string[];
}

interface Location {
  name: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  relatedTextIndices?: number[][];
}

interface VocabularyItem {
  term: string;
  definition: string;
  contextSentence?: string;
}

interface Sentiment {
  sentiment: string;
  emotions?: string[];
  confidence?: number;
}

// Add ref for the map instance
const map = ref<any>(null); // Consider a more specific type if available from vue-leaflet/nuxt-leaflet

interface AnalysisResult {
  transcription: string;
  namedEntities?: NamedEntity[];
  timeline?: TimelineEvent[];
  topicTags?: string[];
  sentimentAnalysis?: Sentiment;
  vocabulary?: VocabularyItem[];
  locations?: Location[];
}

const props = defineProps<{
  uploadedFile: File | null;
  analysisResult: AnalysisResult | null;
  analysisError: string | null;
  isLoading: boolean;
}>();

const people = computed(
  () =>
    props.analysisResult?.namedEntities
      ?.filter((e) => e.type === 'PERSON')
      .map((e) => e.text) || []
);

const locationEntities = computed(
  () =>
    props.analysisResult?.namedEntities
      ?.filter((e) => ['LOCATION', 'LOC', 'GPE'].includes(e.type))
      .map((e) => e.text) || []
);

const dates = computed(
  () =>
    props.analysisResult?.namedEntities
      ?.filter((e) => e.type === 'DATE')
      .map((e) => e.text) || []
);

const organizations = computed(
  () =>
    props.analysisResult?.namedEntities
      ?.filter((e) => e.type === 'ORG')
      .map((e) => e.text) || []
);

const formatTopicTag = (tag: string): string => {
  if (!tag) return '';
  return tag
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
};

const formatEmotion = (emotion: string): string => {
  if (!emotion) return '';
  return (
    emotion.charAt(0).toUpperCase() + emotion.slice(1).toLowerCase()
  );
};

const enrichedTranscriptionParagraphs = computed(() => {
  const transcription = props.analysisResult?.transcription;
  const vocabulary = props.analysisResult?.vocabulary;

  if (!transcription) return [];

  // If no vocabulary or vocabulary is empty, just split transcription into simple text paragraphs
  if (!vocabulary || vocabulary.length === 0) {
    return transcription
      .split('\n')
      .map((pText) => {
        if (pText.trim() === '') return null; // Handle empty or whitespace-only lines
        return [{ type: 'text', content: pText }];
      })
      .filter((p) => p !== null) as Array<
      Array<{ type: 'text'; content: string }>
    >; // Ensure TS knows it's not null
  }

  // Sort vocabulary by term length (descending) to prioritize longer matches
  const sortedVocabulary = [...vocabulary].sort(
    (a, b) => b.term.length - a.term.length
  );

  let segments: Array<
    | { type: 'text'; content: string }
    | {
        type: 'term';
        term: string;
        definition: string;
        contextSentence?: string;
        originalTerm: string;
      }
  > = [{ type: 'text', content: transcription }];

  sortedVocabulary.forEach((vocabItem) => {
    const nextSegments: typeof segments = [];
    // Escape regex special characters in vocabItem.term
    const escapedTerm = vocabItem.term.replace(
      /[.*+?^${}()|[\\]\\]/g,
      '\\\\$&'
    );
    // Create a regex that captures the term, case-insensitive
    const regex = new RegExp(`(${escapedTerm})`, 'gi');

    segments.forEach((segment) => {
      if (segment.type === 'term') {
        nextSegments.push(segment);
        return;
      }

      const parts = segment.content.split(regex);
      parts.forEach((part) => {
        if (part && part.length > 0) {
          // Ensure part is not empty or undefined
          // Check if the part is one of the terms (case-insensitive match with original vocabItem.term)
          if (part.toLowerCase() === vocabItem.term.toLowerCase()) {
            nextSegments.push({
              type: 'term',
              term: vocabItem.term, // Use canonical term from vocabItem
              definition: vocabItem.definition,
              contextSentence: vocabItem.contextSentence,
              originalTerm: part, // This is the actual matched string from the text
            });
          } else {
            nextSegments.push({ type: 'text', content: part });
          }
        }
      });
    });
    // Clean up empty text segments that might have been created by split
    segments = nextSegments.filter(
      (s) =>
        s.type === 'term' ||
        (s.type === 'text' && s.content.length > 0)
    );
  });

  // Now, structure the flat 'segments' array into paragraphs based on '\\n' in text segments
  const paragraphs: Array<typeof segments> = [];
  let currentParagraph: typeof segments = [];

  segments.forEach((segment) => {
    if (segment.type === 'text') {
      const lines = segment.content.split('\n');
      lines.forEach((line, index) => {
        if (line.trim().length > 0) {
          // Add non-empty line content
          currentParagraph.push({ type: 'text', content: line });
        }
        if (index < lines.length - 1) {
          // A newline was here, so finalize current paragraph
          if (
            currentParagraph.length > 0 &&
            currentParagraph.some(
              (s) =>
                (s.type === 'text' && s.content.trim().length > 0) ||
                s.type === 'term'
            )
          ) {
            paragraphs.push(currentParagraph);
          }
          currentParagraph = [];
        }
      });
    } else {
      // segment.type === 'term'
      currentParagraph.push(segment);
    }
  });

  // Add the last paragraph if it has content
  if (
    currentParagraph.length > 0 &&
    currentParagraph.some(
      (s) =>
        (s.type === 'text' && s.content.trim().length > 0) ||
        s.type === 'term'
    )
  ) {
    paragraphs.push(currentParagraph);
  }

  return paragraphs.filter((p) => p && p.length > 0); // Ensure no empty paragraph arrays are returned
});

const mapCenter = computed<[number, number]>(() => {
  const firstLocationWithCoords =
    props.analysisResult?.locations?.find((loc) => loc.coordinates);

  if (
    firstLocationWithCoords &&
    firstLocationWithCoords.coordinates
  ) {
    return [
      firstLocationWithCoords.coordinates.lat,
      firstLocationWithCoords.coordinates.lon,
    ];
  }
  return [47.21322, -1.559482]; // Default center if no locations with coords
});

const getTooltipText = (segment: {
  definition: string;
  contextSentence?: string;
}) => {
  let text = segment.definition;
  return text;
};

// Method to pan the map to a specific location
const panToLocation = (location: Location) => {
  if (map.value && map.value.leafletObject && location.coordinates) {
    const currentZoom = map.value.leafletObject.getZoom();
    map.value.leafletObject.flyTo(
      [location.coordinates.lat, location.coordinates.lon],
      currentZoom
    );
  }
};
</script>

<template>
  <div
    class="lg:w-1/2 bg-white p-6 rounded-lg shadow flex flex-col gap-4"
  >
    <div class="flex-grow">
      <div
        v-if="isLoading"
        class="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 py-10"
      >
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-12 h-12 animate-spin mb-4"
        />
        <p class="text-lg font-semibold">Analyzing Document...</p>
        <p class="text-sm">
          Please wait while we process your document.
        </p>
      </div>
      <div
        v-else-if="!uploadedFile"
        class="text-center text-gray-500 dark:text-gray-400 py-10"
      >
        <p class="mb-2 text-lg">
          Upload a document to begin analysis.
        </p>
        <p class="text-sm">Once uploaded, you'll see:</p>
        <ul
          class="list-disc list-inside text-left inline-block mt-2 text-xs"
        >
          <li>Full Transcription</li>
          <li>Named Entities (People, Places, Dates, etc.)</li>
          <li>Interactive Timeline of Events</li>
          <li>Key Topic Tags</li>
          <li>Sentiment and Emotion Analysis</li>
          <li>Historical Vocabulary Explanations</li>
          <li>Interactive Map of Mentioned Locations</li>
        </ul>
      </div>
      <div v-else-if="!isLoading" class="space-y-6">
        <div
          v-if="analysisError"
          class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg"
        >
          <p class="text-red-600 dark:text-red-400">
            {{ analysisError }}
          </p>
        </div>

        <template v-if="analysisResult">
          <div>
            <h3
              class="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2"
            >
              <UIcon
                name="i-heroicons-document-text"
                class="w-5 h-5"
              />
              Transcription
            </h3>
            <div
              class="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300"
              :class="{
                'space-y-2':
                  enrichedTranscriptionParagraphs.length > 0,
              }"
            >
              <template
                v-if="enrichedTranscriptionParagraphs.length > 0"
              >
                <p
                  v-for="(
                    paragraph, pIndex
                  ) in enrichedTranscriptionParagraphs"
                  :key="`para-${pIndex}`"
                  class="whitespace-pre-wrap mb-3"
                >
                  <template
                    v-for="(segment, sIndex) in paragraph"
                    :key="`seg-${pIndex}-${sIndex}`"
                  >
                    <span v-if="segment.type === 'text'">{{
                      segment.content
                    }}</span>

                    <UPopover
                      v-else-if="segment.type === 'term'"
                      mode="hover"
                    >
                      <span
                        class="font-semibold underline decoration-dotted decoration-primary-500 dark:decoration-primary-400 cursor-pointer text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        {{ segment.originalTerm }}
                      </span>

                      <template #content>
                        <div
                          class="p-2 text-sm bg-white dark:bg-gray-800 rounded shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 max-w-md"
                        >
                          {{ getTooltipText(segment) }}
                        </div>
                      </template>
                    </UPopover>
                  </template>
                </p>
              </template>
              <p
                v-else-if="
                  analysisResult?.transcription &&
                  analysisResult.transcription.trim() !== ''
                "
                class="text-gray-500 dark:text-gray-400 italic"
              >
                Transcription processed, but no specific segments to
                display.
              </p>
              <p
                v-else-if="analysisResult?.transcription"
                class="text-gray-500 dark:text-gray-400 italic"
              >
                Transcription is empty or contains only whitespace.
              </p>
              <p
                v-else
                class="text-gray-500 dark:text-gray-400 italic"
              >
                No transcription available.
              </p>
            </div>
          </div>

          <div v-if="analysisResult.namedEntities?.length">
            <h3
              class="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2"
            >
              <UIcon name="i-heroicons-user-group" class="w-5 h-5" />
              Mentioned in this document
            </h3>
            <div
              class="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300"
            >
              <div class="flex flex-col md:flex-row gap-4">
                <!-- People Column -->
                <div class="md:w-1/4">
                  <h4 class="font-medium mb-1">People</h4>
                  <div
                    v-if="people.length"
                    class="flex flex-col space-y-0.5"
                  >
                    <span v-for="person in people" :key="person">{{
                      person
                    }}</span>
                  </div>
                  <p
                    v-else
                    class="text-xs text-gray-500 dark:text-gray-400"
                  >
                    None
                  </p>
                </div>

                <!-- Locations (Entities) Column -->
                <div class="md:w-1/4">
                  <h4 class="font-medium mb-1">Locations</h4>
                  <div
                    v-if="locationEntities.length"
                    class="flex flex-col space-y-0.5"
                  >
                    <span
                      v-for="locationName in locationEntities"
                      :key="locationName"
                      >{{ locationName }}</span
                    >
                  </div>
                  <p
                    v-else
                    class="text-xs text-gray-500 dark:text-gray-400"
                  >
                    None
                  </p>
                </div>

                <!-- Dates Column -->
                <div class="md:w-1/4">
                  <h4 class="font-medium mb-1">Dates</h4>
                  <div
                    v-if="dates.length"
                    class="flex flex-col space-y-0.5"
                  >
                    <span v-for="date in dates" :key="date">{{
                      date
                    }}</span>
                  </div>
                  <p
                    v-else
                    class="text-xs text-gray-500 dark:text-gray-400"
                  >
                    None
                  </p>
                </div>

                <!-- Organizations Column -->
                <div class="md:w-1/4">
                  <h4 class="font-medium mb-1">Organizations</h4>
                  <div
                    v-if="organizations.length"
                    class="flex flex-col space-y-0.5"
                  >
                    <span v-for="org in organizations" :key="org">{{
                      org
                    }}</span>
                  </div>
                  <p
                    v-else
                    class="text-xs text-gray-500 dark:text-gray-400"
                  >
                    None
                  </p>
                </div>
              </div>
              <div
                v-if="
                  analysisResult.namedEntities?.length && // Check if there are entities overall
                  !people.length &&
                  !locationEntities.length &&
                  !dates.length &&
                  !organizations.length
                "
                class="mt-4 text-center"
              >
                <p>
                  No specific entities found in these categories
                  (People, Locations, Dates, Organizations).
                </p>
              </div>
            </div>
          </div>

          <div v-if="analysisResult.timeline?.length">
            <h3
              class="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2"
            >
              <UIcon name="i-heroicons-clock" class="w-5 h-5" />
              Timeline of Events
            </h3>
            <div
              class="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300"
            >
              <ol class="list-inside space-y-2">
                <li
                  v-for="(
                    eventItem, index
                  ) in analysisResult.timeline"
                  :key="index"
                >
                  <span class="font-medium"
                    >{{ eventItem.date }}:</span
                  >
                  {{ eventItem.description }}
                </li>
              </ol>
            </div>
          </div>

          <!-- Two-column layout for Key Topics and Sentiment Analysis -->
          <div class="flex flex-col md:flex-row gap-4">
            <div class="md:w-1/2 space-y-6">
              <div v-if="analysisResult.topicTags?.length">
                <h3
                  class="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2"
                >
                  <UIcon name="i-heroicons-tag" class="w-5 h-5" />
                  Key Topics
                </h3>
                <div
                  class="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300"
                >
                  <div class="flex flex-wrap gap-2">
                    <UBadge
                      v-for="topic in analysisResult.topicTags"
                      :key="topic"
                      color="neutral"
                      variant="soft"
                    >
                      {{ formatTopicTag(topic) }}
                    </UBadge>
                  </div>
                </div>
              </div>
            </div>

            <div class="md:w-1/2 space-y-6">
              <div v-if="analysisResult.sentimentAnalysis">
                <h3
                  class="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2"
                >
                  <UIcon name="i-heroicons-heart" class="w-5 h-5" />
                  Sentiment Analysis
                </h3>
                <div
                  class="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300 space-y-1"
                >
                  <div
                    v-if="
                      analysisResult.sentimentAnalysis.emotions
                        ?.length
                    "
                    class="flex flex-wrap gap-2"
                  >
                    <UBadge
                      v-for="emotion in analysisResult
                        .sentimentAnalysis.emotions"
                      :key="emotion"
                    >
                      {{ formatEmotion(emotion) }}
                    </UBadge>
                  </div>
                  <p v-else>No specific emotions detected.</p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="analysisResult.locations?.length">
            <h3
              class="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2"
            >
              <UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
              Mentioned Locations
            </h3>
            <div
              class="p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300"
            >
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="location in analysisResult.locations"
                  :key="location.name"
                  size="sm"
                  class="whitespace-nowrap uppercase cursor-pointer"
                  @click="panToLocation(location)"
                  icon="i-heroicons-map-pin"
                  :label="`${location.name}`"
                />
              </div>
              <div
                v-if="
                  analysisResult.locations.some(
                    (loc) => loc.coordinates
                  )
                "
                style="height: 400px; width: 100%"
                class="mt-4 rounded-lg overflow-hidden"
              >
                <LMap
                  ref="map"
                  :zoom="12"
                  :center="mapCenter"
                  :use-global-leaflet="false"
                >
                  <LTileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&amp;copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                    layer-type="base"
                    name="OpenStreetMap"
                  />
                  <template
                    v-for="location in analysisResult.locations.filter(
                      (loc) => loc.coordinates
                    )"
                    :key="location.name + '-marker'"
                  >
                    <LMarker
                      v-if="location.coordinates"
                      :lat-lng="[
                        location.coordinates.lat,
                        location.coordinates.lon,
                      ]"
                    >
                      <LPopup>{{ location.name }}</LPopup>
                    </LMarker>
                  </template>
                </LMap>
              </div>
              <p
                v-else
                class="mt-2 text-xs text-gray-500 dark:text-gray-400 italic"
              >
                No locations with coordinates to display on map.
              </p>
            </div>
          </div>
        </template>

        <template v-else-if="!analysisError">
          <div
            class="text-center text-gray-500 dark:text-gray-400 py-10"
          >
            <p class="mb-2 text-lg">
              Upload a document to begin analysis.
            </p>
            <p class="text-sm">Once uploaded, you'll see:</p>
            <ul
              class="list-disc list-inside text-left inline-block mt-2 text-xs"
            >
              <li>Full Transcription</li>
              <li>Named Entities (People, Places, Dates, etc.)</li>
              <li>Interactive Timeline of Events</li>
              <li>Key Topic Tags</li>
              <li>Sentiment and Emotion Analysis</li>
              <li>Historical Vocabulary Explanations</li>
              <li>Interactive Map of Mentioned Locations</li>
            </ul>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
