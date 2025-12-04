<script setup lang="ts">
defineProps<{
  poem: string;
}>();
</script>

<template>
  <div class="scroll-wrapper">
    <!-- Top scroll roll -->
    <div class="scroll-roll scroll-roll-top">
      <div class="roll-shadow"></div>
      <div class="roll-highlight"></div>
      <div class="roll-wood-cap left"></div>
      <div class="roll-wood-cap right"></div>
    </div>

    <!-- Main parchment body -->
    <div class="parchment-body">
      <!-- Aged paper texture layers -->
      <div class="texture-layer fiber-texture"></div>
      <div class="texture-layer stain-texture"></div>
      <div class="texture-layer noise-texture"></div>

      <!-- Edge darkening vignette -->
      <div class="vignette-overlay"></div>

      <!-- Red wax seal -->
      <div class="wax-seal">
        <div class="seal-inner">S</div>
      </div>

      <!-- Content area -->
      <div class="scroll-content">
        <pre class="poem-text has-dropcap">{{ poem }}</pre>
      </div>

      <!-- Decorative corner flourishes -->
      <div class="flourish top-left">❦</div>
      <div class="flourish bottom-right">❦</div>
    </div>

    <!-- Bottom scroll roll -->
    <div class="scroll-roll scroll-roll-bottom">
      <div class="roll-shadow"></div>
      <div class="roll-highlight"></div>
      <div class="roll-wood-cap left"></div>
      <div class="roll-wood-cap right"></div>
    </div>
  </div>
</template>

<style scoped>
.scroll-wrapper {
  position: relative;
  max-width: 100%;
  margin: 0 auto;
  filter: drop-shadow(0 8px 24px rgba(61, 41, 20, 0.25));
}

/* Scroll rolls (top and bottom) */
.scroll-roll {
  position: relative;
  height: 28px;
  background: linear-gradient(
    180deg,
    #e8d9b8 0%,
    #f5e6c8 15%,
    #d4c4a0 40%,
    #c4b08a 60%,
    #d8c8a8 85%,
    #e8d9b8 100%
  );
  border-radius: 14px;
  z-index: 10;
  margin: 0 12px;
}

.scroll-roll-top {
  margin-bottom: -6px;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.scroll-roll-bottom {
  margin-top: -6px;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.2),
    inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.roll-shadow {
  position: absolute;
  bottom: -4px;
  left: 10%;
  right: 10%;
  height: 8px;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.2) 0%, transparent 70%);
  border-radius: 50%;
}

.scroll-roll-top .roll-shadow {
  top: auto;
  bottom: -6px;
}

.scroll-roll-bottom .roll-shadow {
  top: -6px;
  bottom: auto;
}

.roll-highlight {
  position: absolute;
  top: 4px;
  left: 20px;
  right: 20px;
  height: 6px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5) 30%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.5) 70%, transparent);
  border-radius: 3px;
}

/* Wooden end caps */
.roll-wood-cap {
  position: absolute;
  top: -4px;
  width: 20px;
  height: 36px;
  background: linear-gradient(
    90deg,
    #6b4423 0%,
    #8b5a2b 20%,
    #a0522d 50%,
    #8b5a2b 80%,
    #6b4423 100%
  );
  border-radius: 4px;
  box-shadow:
    inset 0 0 4px rgba(0, 0, 0, 0.3),
    2px 2px 4px rgba(0, 0, 0, 0.2);
}

.roll-wood-cap.left {
  left: -8px;
}

.roll-wood-cap.right {
  right: -8px;
}

/* iOS flickering fix - force GPU acceleration */
.roll-wood-cap,
.scroll-roll {
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  will-change: transform;
}

.roll-wood-cap::before {
  content: '';
  position: absolute;
  top: 6px;
  left: 4px;
  right: 4px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  border-radius: 1px;
}

.roll-wood-cap::after {
  content: '';
  position: absolute;
  bottom: 6px;
  left: 4px;
  right: 4px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.2), transparent);
  border-radius: 1px;
}

/* Main parchment body */
.parchment-body {
  position: relative;
  background: linear-gradient(
    135deg,
    #f8eed8 0%,
    #f5e6c8 20%,
    #eedcb8 40%,
    #f2e4c4 60%,
    #f8eed8 80%,
    #f0e0c0 100%
  );
  padding: 3rem 2.5rem;
  min-height: 300px;
  overflow: hidden;
}

/* Texture layers */
.texture-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.fiber-texture {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)'/%3E%3C/svg%3E");
  opacity: 0.08;
  mix-blend-mode: multiply;
}

.stain-texture {
  background:
    radial-gradient(ellipse at 15% 20%, rgba(139, 90, 43, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 85% 75%, rgba(139, 90, 43, 0.06) 0%, transparent 40%),
    radial-gradient(ellipse at 60% 10%, rgba(101, 67, 33, 0.05) 0%, transparent 35%),
    radial-gradient(ellipse at 30% 90%, rgba(139, 90, 43, 0.04) 0%, transparent 45%);
}

.noise-texture {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
}

/* Vignette effect */
.vignette-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    ellipse at center,
    transparent 50%,
    rgba(101, 67, 33, 0.06) 80%,
    rgba(61, 41, 20, 0.12) 100%
  );
  pointer-events: none;
}

/* Wax seal */
.wax-seal {
  position: absolute;
  top: 20px;
  right: 24px;
  width: 48px;
  height: 48px;
  background: radial-gradient(
    circle at 35% 35%,
    #c41e3a 0%,
    #8b1538 40%,
    #5c0f26 80%,
    #3d0a19 100%
  );
  border-radius: 50%;
  box-shadow:
    2px 3px 6px rgba(0, 0, 0, 0.3),
    inset -2px -2px 4px rgba(0, 0, 0, 0.3),
    inset 2px 2px 4px rgba(255, 255, 255, 0.1);
  transform: rotate(-15deg);
  z-index: 5;
}

.wax-seal::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -6px;
  right: -6px;
  bottom: -4px;
  background: radial-gradient(
    ellipse at 30% 30%,
    #c41e3a 0%,
    #8b1538 50%,
    transparent 70%
  );
  border-radius: 50%;
  filter: blur(2px);
  opacity: 0.6;
  z-index: -1;
}

.seal-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Cinzel Decorative', 'Cinzel', serif;
  font-size: 1.5rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.15);
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
}

/* Corner flourishes */
.flourish {
  position: absolute;
  font-size: 1.5rem;
  color: #8b1538;
  opacity: 0.25;
  z-index: 2;
}

.flourish.top-left {
  top: 16px;
  left: 20px;
}

.flourish.bottom-right {
  bottom: 16px;
  right: 20px;
  transform: rotate(180deg);
}

/* Content area */
.scroll-content {
  position: relative;
  z-index: 3;
  padding: 0.5rem 1rem;
}

/* Poem text styling */
.poem-text {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  white-space: pre-wrap;
  color: #2d1810;
  line-height: 2;
  margin: 0;
  font-size: 1.2rem;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
}

.poem-text.has-dropcap::first-letter {
  font-family: 'Cinzel Decorative', 'Cinzel', serif;
  float: left;
  font-size: 4rem;
  line-height: 0.75;
  margin: 0.1em 0.15em 0 0;
  color: #8b1538;
  text-shadow:
    1px 1px 0 rgba(212, 168, 83, 0.3),
    2px 2px 4px rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 640px) {
  .parchment-body {
    padding: 2rem 0;
  }

  .scroll-roll {
    height: 22px;
    border-radius: 11px;
  }

  .roll-wood-cap {
    width: 16px;
    height: 30px;
    top: -4px;
  }

  .roll-wood-cap.left {
    left: -6px;
  }

  .roll-wood-cap.right {
    right: -6px;
  }

  .wax-seal {
    width: 40px;
    height: 40px;
    top: 12px;
    right: 16px;
  }

  .seal-inner {
    font-size: 1.2rem;
  }

  .poem-text {
    font-size: 1.1rem;
    line-height: 1.9;
  }

  .poem-text.has-dropcap::first-letter {
    font-size: 3rem;
  }

  .flourish {
    font-size: 1.2rem;
  }
}
</style>
