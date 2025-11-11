<script setup lang="ts">
import { ref } from 'vue';
import { useOcr } from '../composables/useOcr';

const acceptedFileTypes =
  'image/jpeg,image/png,image/tiff,application/pdf';
const inputId = 'file-upload'; // Unique ID for the input
const selectedFile = ref<File | null>(null);
const errorMessage = ref<string | null>(null);

// Define the emits
const emit = defineEmits<{
  (e: 'file-selected', file: File): void;
  (e: 'analysis-complete', analysis: any): void;
  (e: 'analysis-error', error: string): void;
}>();

const { analyzeDocument, isLoading, error, analysis } = useOcr();

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    const fileType = file.type;
    if (acceptedFileTypes.split(',').includes(fileType)) {
      selectedFile.value = file;
      errorMessage.value = null;
      emit('file-selected', file);

      // Trigger document analysis
      await analyzeDocument(file);
      if (error.value) {
        emit('analysis-error', error.value);
      } else {
        emit('analysis-complete', analysis.value);
      }
    } else {
      selectedFile.value = null;
      errorMessage.value = `Invalid file type: ${fileType}. Please select a JPEG, PNG, TIFF, or PDF file.`;
      target.value = '';
    }
  } else {
    selectedFile.value = null;
    errorMessage.value = null;
  }
};
</script>

<template>
  <UFormGroup label="Upload Document" :name="inputId">
    <UInput
      :id="inputId"
      type="file"
      :accept="acceptedFileTypes"
      @change="handleFileChange"
      size="lg"
    />
    <template #error>
      <p v-if="errorMessage" role="alert" class="mt-1">
        {{ errorMessage }}
      </p>
    </template>
    <template #hint>
      <div v-if="selectedFile && !errorMessage" class="mt-2">
        <p>
          Selected file: {{ selectedFile.name }} ({{
            selectedFile.type
          }})
        </p>
      </div>
    </template>
  </UFormGroup>
</template>
