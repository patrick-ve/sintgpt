<script setup lang="ts">
const videoRef = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);
const isMuted = ref(true);
const progress = ref(0);
const duration = ref(0);
const isHovering = ref(false);

const updateProgress = () => {
  if (videoRef.value) {
    progress.value =
      (videoRef.value.currentTime / videoRef.value.duration) * 100;
  }
};

const togglePlay = () => {
  if (videoRef.value) {
    if (videoRef.value.paused) {
      videoRef.value.muted = false;
      isMuted.value = false;
      videoRef.value.play();
      isPlaying.value = true;
    } else {
      videoRef.value.pause();
      isPlaying.value = false;
    }
  }
};

const toggleMute = () => {
  if (videoRef.value) {
    videoRef.value.muted = !videoRef.value.muted;
    isMuted.value = videoRef.value.muted;
  }
};

const onLoadedMetadata = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration;
  }
};

const onEnded = () => {
  isPlaying.value = false;
  progress.value = 0;
  if (videoRef.value) {
    videoRef.value.currentTime = 0;
  }
};

const seek = (event: MouseEvent) => {
  const progressBar = event.currentTarget as HTMLElement;
  const rect = progressBar.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const percentage = x / rect.width;

  if (videoRef.value) {
    videoRef.value.currentTime = percentage * videoRef.value.duration;
  }
};

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
</script>

<template>
  <div
    class="hero-video-container relative"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <!-- Ornate frame decoration -->
    <div class="absolute -inset-3 md:-inset-4 pointer-events-none z-10">
      <!-- Corner ornaments -->
      <div class="absolute -top-2 -left-2 w-8 h-8 md:w-12 md:h-12">
        <svg viewBox="0 0 48 48" class="w-full h-full text-[#d4a853]">
          <path fill="currentColor" d="M0 0h6v48H0zM0 0h48v6H0zM6 6l12 12-4 4L2 10V6h4z"/>
        </svg>
      </div>
      <div class="absolute -top-2 -right-2 w-8 h-8 md:w-12 md:h-12 rotate-90">
        <svg viewBox="0 0 48 48" class="w-full h-full text-[#d4a853]">
          <path fill="currentColor" d="M0 0h6v48H0zM0 0h48v6H0zM6 6l12 12-4 4L2 10V6h4z"/>
        </svg>
      </div>
      <div class="absolute -bottom-2 -left-2 w-8 h-8 md:w-12 md:h-12 -rotate-90">
        <svg viewBox="0 0 48 48" class="w-full h-full text-[#d4a853]">
          <path fill="currentColor" d="M0 0h6v48H0zM0 0h48v6H0zM6 6l12 12-4 4L2 10V6h4z"/>
        </svg>
      </div>
      <div class="absolute -bottom-2 -right-2 w-8 h-8 md:w-12 md:h-12 rotate-180">
        <svg viewBox="0 0 48 48" class="w-full h-full text-[#d4a853]">
          <path fill="currentColor" d="M0 0h6v48H0zM0 0h48v6H0zM6 6l12 12-4 4L2 10V6h4z"/>
        </svg>
      </div>
    </div>

    <!-- Main video container with fancy border -->
    <div
      class="relative rounded-xl overflow-hidden border-4 border-[#d4a853] shadow-[0_8px_32px_rgba(139,21,56,0.4),0_0_60px_rgba(212,168,83,0.2)] bg-[#1a0a10]"
    >
      <!-- Inner glow border -->
      <div class="absolute inset-0 rounded-lg border-2 border-[#f4cd60]/20 pointer-events-none z-20"></div>

      <video
        ref="videoRef"
        src="/sinterklaas_message.mp4"
        class="w-full h-auto block aspect-video object-cover"
        @timeupdate="updateProgress"
        @loadedmetadata="onLoadedMetadata"
        @ended="onEnded"
        @click="togglePlay"
        playsinline
        muted
      ></video>

      <!-- Gradient vignette overlay -->
      <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(26,10,16,0.4)_100%)]"></div>

      <!-- Big Play Button Overlay -->
      <div
        v-if="!isPlaying"
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-[#1a0a10]/60 via-transparent to-[#1a0a10]/30 cursor-pointer transition-all duration-300 z-10"
        @click="togglePlay"
      >
        <button
          class="play-button w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#8b1538] to-[#5c0f26] rounded-full flex items-center justify-center border-3 border-[#d4a853] shadow-[0_4px_20px_rgba(139,21,56,0.6),0_0_30px_rgba(212,168,83,0.3)] transform transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_30px_rgba(139,21,56,0.8),0_0_50px_rgba(212,168,83,0.5)]"
          aria-label="Play video"
          data-umami-event="Play hero video"
        >
          <span class="ml-1.5 text-[#f4cd60] text-2xl md:text-3xl drop-shadow-lg">▶</span>
        </button>

        <!-- Animated ring -->
        <div class="absolute w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-[#d4a853]/40 animate-ping-slow"></div>
      </div>

      <!-- Custom Controls Bar -->
      <div
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1a0a10] via-[#1a0a10]/80 to-transparent pt-12 pb-3 px-4 transition-opacity duration-300 flex flex-col gap-2 z-20"
        :class="isHovering || !isPlaying ? 'opacity-100' : 'opacity-0'"
      >
        <!-- Progress Bar -->
        <div
          class="w-full h-1.5 bg-white/20 rounded-full cursor-pointer relative overflow-hidden hover:h-2 transition-all group/progress"
          @click="seek"
        >
          <div
            class="absolute top-0 left-0 h-full bg-gradient-to-r from-[#d4a853] to-[#f4cd60] rounded-full transition-all"
            :style="{ width: `${progress}%` }"
          ></div>
          <div
            class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#f4cd60] rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
            :style="{ left: `calc(${progress}% - 6px)` }"
          ></div>
        </div>

        <div class="flex items-center justify-between text-white">
          <div class="flex items-center gap-3">
            <!-- Play/Pause -->
            <button
              @click="togglePlay"
              class="w-8 h-8 flex items-center justify-center text-[#f4cd60] hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <span v-if="isPlaying" class="text-lg">⏸</span>
              <span v-else class="text-lg ml-0.5">▶</span>
            </button>

            <!-- Time Display -->
            <div class="text-xs font-mono text-[#f4cd60]/80">
              {{ formatTime(videoRef?.currentTime || 0) }} / {{ formatTime(duration) }}
            </div>
          </div>

          <!-- Mute/Unmute -->
          <button
            @click="toggleMute"
            class="w-8 h-8 flex items-center justify-center text-[#f4cd60] hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <span v-if="isMuted" class="text-lg">🔇</span>
            <span v-else class="text-lg">🔊</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Decorative shadow underneath -->
    <div class="absolute -bottom-4 left-4 right-4 h-8 bg-[#1a0a10]/30 blur-xl rounded-full"></div>
  </div>
</template>

<style scoped>
.hero-video-container {
  filter: drop-shadow(0 20px 40px rgba(139, 21, 56, 0.3));
}

.play-button {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(139, 21, 56, 0.6), 0 0 30px rgba(212, 168, 83, 0.3);
  }
  50% {
    box-shadow: 0 4px 30px rgba(139, 21, 56, 0.8), 0 0 50px rgba(212, 168, 83, 0.5);
  }
}

@keyframes ping-slow {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

.animate-ping-slow {
  animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
