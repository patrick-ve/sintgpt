<script setup lang="ts">
const { t } = useI18n();
const videoRef = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);
const isMuted = ref(false);
const progress = ref(0);
const duration = ref(0);

// Update progress
const updateProgress = () => {
  if (videoRef.value) {
    progress.value =
      (videoRef.value.currentTime / videoRef.value.duration) * 100;
  }
};

// Toggle Play/Pause
const togglePlay = () => {
  if (videoRef.value) {
    if (videoRef.value.paused) {
      videoRef.value.play();
      isPlaying.value = true;
    } else {
      videoRef.value.pause();
      isPlaying.value = false;
    }
  }
};

// Toggle Mute
const toggleMute = () => {
  if (videoRef.value) {
    videoRef.value.muted = !videoRef.value.muted;
    isMuted.value = videoRef.value.muted;
  }
};

// Handle metadata loaded
const onLoadedMetadata = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration;
  }
};

// Handle video end
const onEnded = () => {
  isPlaying.value = false;
  progress.value = 0;
  if (videoRef.value) {
    videoRef.value.currentTime = 0;
  }
};

// Handle seek
const seek = (event: MouseEvent) => {
  const progressBar = event.currentTarget as HTMLElement;
  const rect = progressBar.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percentage = x / rect.width;

  if (videoRef.value) {
    videoRef.value.currentTime = percentage * videoRef.value.duration;
  }
};

// Helper to format time
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
</script>

<template>
  <div
    class="bg-[#fffdf0] rounded-2xl shadow-xl p-6 md:p-8 max-w-4xl mx-auto sint-border relative"
  >
    <h2
      class="text-3xl font-bold text-red-900 mb-6 text-center font-cinzel border-b-2 border-red-100 pb-4"
    >
      {{ t('video.title') }}
    </h2>

    <div
      class="relative group rounded-xl overflow-hidden border-4 border-[#F4CD60] shadow-2xl bg-black"
    >
      <video
        ref="videoRef"
        src="/sinterklaas_message.mp4"
        class="w-full h-auto block"
        @timeupdate="updateProgress"
        @loadedmetadata="onLoadedMetadata"
        @ended="onEnded"
        @click="togglePlay"
        playsinline
      ></video>

      <!-- Big Play Button Overlay (when paused) -->
      <div
        v-if="!isPlaying"
        class="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity hover:bg-black/20 z-10"
        @click="togglePlay"
      >
        <button
          class="w-20 h-20 md:w-24 md:h-24 bg-red-900 rounded-full flex items-center justify-center border-4 border-[#F4CD60] shadow-lg transform transition-transform hover:scale-110 group-hover:shadow-xl"
          aria-label="Play video"
        >
          <span class="ml-2 text-[#F4CD60] text-4xl md:text-5xl"
            >▶</span
          >
        </button>
      </div>

      <!-- Custom Controls Bar -->
      <div
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent pt-8 pb-4 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-3 z-20"
        :class="{ 'opacity-100': !isPlaying }"
      >
        <!-- Progress Bar -->
        <div
          class="w-full h-2 bg-white/30 rounded-full cursor-pointer relative overflow-hidden hover:h-3 transition-all"
          @click="seek"
        >
          <div
            class="absolute top-0 left-0 h-full bg-[#F4CD60]"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>

        <div class="flex items-center justify-between text-white">
          <div class="flex items-center gap-4">
            <!-- Play/Pause Small Button -->
            <button
              @click="togglePlay"
              class="text-[#F4CD60] hover:text-white transition-colors font-cinzel font-bold text-lg flex items-center gap-2"
            >
              <span v-if="isPlaying">⏸</span>
              <span v-else>▶</span>
              <span class="text-sm hidden md:inline">{{
                isPlaying ? 'Pauze' : 'Speel af'
              }}</span>
            </button>

            <!-- Time Display -->
            <div class="text-xs md:text-sm font-mono text-gray-200">
              {{ formatTime(videoRef?.currentTime || 0) }} /
              {{ formatTime(duration) }}
            </div>
          </div>

          <!-- Mute/Unmute -->
          <button
            @click="toggleMute"
            class="text-[#F4CD60] hover:text-white transition-colors"
          >
            <span v-if="isMuted">🔇</span>
            <span v-else>🔊</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');

.sint-border {
  border: 4px solid #7f1d1d;
  outline: 2px solid #f4cd60;
  outline-offset: -8px;
}

.font-cinzel {
  font-family: 'Cinzel', serif;
}
</style>
