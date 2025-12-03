<script setup lang="ts">
// Number of skeleton lines to show
const lineCount = 8;

// Generate varying line widths for natural look
const lineWidths = [
  '92%', '78%', '85%', '70%', '88%', '65%', '80%', '73%'
];
</script>

<template>
  <div class="poem-writing-container">
    <!-- Parchment background -->
    <div class="parchment-bg">
      <!-- Decorative corner flourishes -->
      <div class="corner-flourish top-left">❧</div>
      <div class="corner-flourish top-right">❧</div>

      <!-- Writing area -->
      <div class="writing-area">
        <!-- Animated quill pen -->
        <div class="quill-container">
          <div class="quill">🪶</div>
          <div class="ink-drop"></div>
        </div>

        <!-- Skeleton lines appearing one by one -->
        <div class="poem-lines">
          <div
            v-for="(width, index) in lineWidths.slice(0, lineCount)"
            :key="index"
            class="poem-line-wrapper"
            :style="{ animationDelay: `${index * 1}s` }"
          >
            <div
              class="poem-line"
              :style="{
                width: width,
                animationDelay: `${index * 1}s`
              }"
            >
              <div class="ink-shimmer"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom message -->
      <div class="writing-message">
        <span class="sparkle">✨</span>
        <span class="message-text">De rijmpiet schrijft jouw gedicht...</span>
        <span class="sparkle">✨</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.poem-writing-container {
  width: 100%;
  padding: 1rem;
}

.parchment-bg {
  position: relative;
  background: linear-gradient(135deg, #fff8e7 0%, #f5e6c8 50%, #fff8e7 100%);
  border-radius: 12px;
  padding: 2rem 2.5rem;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.1),
    inset 0 0 60px rgba(139, 69, 19, 0.06);
  border: 2px solid #d4c5a0;
  overflow: hidden;
}

/* Paper texture */
.parchment-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  border-radius: 12px;
}

/* Inner decorative border */
.parchment-bg::after {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border: 2px dashed #d4a853;
  border-radius: 8px;
  pointer-events: none;
  opacity: 0.4;
}

.corner-flourish {
  position: absolute;
  font-size: 1.5rem;
  color: #8b1538;
  opacity: 0.3;
  z-index: 1;
}

.corner-flourish.top-left {
  top: 16px;
  left: 18px;
}

.corner-flourish.top-right {
  top: 16px;
  right: 18px;
  transform: scaleX(-1);
}

.writing-area {
  position: relative;
  min-height: 280px;
  padding-top: 1rem;
}

/* Quill pen animation */
.quill-container {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  animation: write-across 8s ease-in-out infinite;
}

.quill {
  font-size: 2rem;
  transform: rotate(-30deg);
  filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.2));
  animation: quill-bob 0.3s ease-in-out infinite;
}

.ink-drop {
  position: absolute;
  bottom: -4px;
  left: 50%;
  width: 4px;
  height: 4px;
  background: #3d2914;
  border-radius: 50%;
  opacity: 0;
  animation: ink-drip 8s ease-in-out infinite;
}

@keyframes write-across {
  0% {
    top: 8px;
    left: 0;
    opacity: 1;
  }
  12% {
    top: 8px;
    left: 70%;
    opacity: 1;
  }
  14% {
    top: 8px;
    left: 70%;
    opacity: 0;
  }
  15% {
    top: 44px;
    left: 0;
    opacity: 0;
  }
  16% {
    top: 44px;
    left: 0;
    opacity: 1;
  }
  28% {
    top: 44px;
    left: 55%;
    opacity: 1;
  }
  30% {
    top: 44px;
    left: 55%;
    opacity: 0;
  }
  31% {
    top: 80px;
    left: 0;
    opacity: 0;
  }
  32% {
    top: 80px;
    left: 0;
    opacity: 1;
  }
  44% {
    top: 80px;
    left: 65%;
    opacity: 1;
  }
  46% {
    top: 80px;
    left: 65%;
    opacity: 0;
  }
  47% {
    top: 116px;
    left: 0;
    opacity: 0;
  }
  48% {
    top: 116px;
    left: 0;
    opacity: 1;
  }
  60% {
    top: 116px;
    left: 48%;
    opacity: 1;
  }
  62% {
    top: 116px;
    left: 48%;
    opacity: 0;
  }
  63% {
    top: 152px;
    left: 0;
    opacity: 0;
  }
  64% {
    top: 152px;
    left: 0;
    opacity: 1;
  }
  76% {
    top: 152px;
    left: 68%;
    opacity: 1;
  }
  78% {
    top: 152px;
    left: 68%;
    opacity: 0;
  }
  79% {
    top: 188px;
    left: 0;
    opacity: 0;
  }
  80% {
    top: 188px;
    left: 0;
    opacity: 1;
  }
  92% {
    top: 188px;
    left: 45%;
    opacity: 1;
  }
  94% {
    top: 188px;
    left: 45%;
    opacity: 0;
  }
  100% {
    top: 188px;
    left: 45%;
    opacity: 0;
  }
}

@keyframes quill-bob {
  0%, 100% {
    transform: rotate(-30deg) translateY(0);
  }
  50% {
    transform: rotate(-30deg) translateY(-2px);
  }
}

@keyframes ink-drip {
  0%, 14%, 30%, 46%, 62%, 78%, 94%, 100% {
    opacity: 0;
    transform: translateX(-50%) scale(0);
  }
  2%, 18%, 34%, 50%, 66%, 82% {
    opacity: 0.6;
    transform: translateX(-50%) scale(1);
  }
  10%, 26%, 42%, 58%, 74%, 90% {
    opacity: 0;
    transform: translateX(-50%) scale(0.5) translateY(10px);
  }
}

/* Poem lines */
.poem-lines {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-left: 2.5rem;
}

.poem-line-wrapper {
  opacity: 0;
  animation: line-appear 0.6s ease-out forwards;
}

.poem-line {
  height: 20px;
  background: linear-gradient(
    90deg,
    #d4c5a0 0%,
    #c9b896 20%,
    #d4c5a0 40%,
    #c9b896 60%,
    #d4c5a0 80%,
    #c9b896 100%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

/* Ink shimmer effect */
.ink-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(139, 21, 56, 0.08) 50%,
    transparent 100%
  );
  animation: shimmer-across 2s ease-in-out infinite;
}

@keyframes line-appear {
  0% {
    opacity: 0;
    transform: translateX(-10px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes skeleton-pulse {
  0%, 100% {
    background-position: 0% center;
    opacity: 0.6;
  }
  50% {
    background-position: 100% center;
    opacity: 0.8;
  }
}

@keyframes shimmer-across {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

/* Bottom message */
.writing-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px dashed #d4a853;
}

.message-text {
  font-family: 'IM Fell DW Pica', serif;
  font-size: 1.1rem;
  color: #8b1538;
  font-style: italic;
}

.sparkle {
  font-size: 1rem;
  animation: sparkle-pulse 1.5s ease-in-out infinite;
}

.sparkle:last-child {
  animation-delay: 0.75s;
}

@keyframes sparkle-pulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .parchment-bg {
    padding: 1.5rem;
  }

  .writing-area {
    min-height: 240px;
  }

  .poem-lines {
    padding-left: 2rem;
    gap: 14px;
  }

  .poem-line {
    height: 16px;
  }

  .quill {
    font-size: 1.5rem;
  }

  .message-text {
    font-size: 0.95rem;
  }
}
</style>
