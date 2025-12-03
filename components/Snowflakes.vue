<script setup lang="ts">
// Snowflake characters for variety
const snowflakeChars = ['*', '+', '.'];

// Generate random snowflakes with different properties
const snowflakes = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  char: snowflakeChars[i % snowflakeChars.length],
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 10}s`,
  duration: `${12 + Math.random() * 10}s`,
  size: `${0.5 + Math.random() * 0.8}rem`,
  opacity: 0.4 + Math.random() * 0.4,
}));

// Golden sparkles for magical effect
const sparkles = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: `${Math.random() * 4}s`,
  size: `${3 + Math.random() * 4}px`,
}));
</script>

<template>
  <div class="snowflakes-wrapper">
    <!-- Snowflakes -->
    <div
      v-for="flake in snowflakes"
      :key="`snow-${flake.id}`"
      class="snowflake-item"
      :style="{
        left: flake.left,
        animationDelay: flake.delay,
        animationDuration: flake.duration,
        fontSize: flake.size,
        opacity: flake.opacity,
      }"
    >
      {{ flake.char }}
    </div>

    <!-- Golden sparkles -->
    <div
      v-for="sparkle in sparkles"
      :key="`sparkle-${sparkle.id}`"
      class="sparkle-item"
      :style="{
        left: sparkle.left,
        top: sparkle.top,
        animationDelay: sparkle.delay,
        width: sparkle.size,
        height: sparkle.size,
      }"
    />
  </div>
</template>

<style scoped>
.snowflakes-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
  overflow: hidden;
}

.snowflake-item {
  position: absolute;
  top: -20px;
  color: rgba(255, 255, 255, 0.9);
  font-family: serif;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.6);
  animation: snowfall-anim linear infinite;
  will-change: transform;
}

.sparkle-item {
  position: absolute;
  background: radial-gradient(circle, #f4cd60 0%, #d4a853 40%, transparent 70%);
  border-radius: 50%;
  animation: sparkle-anim 3s ease-in-out infinite;
  will-change: transform, opacity;
}

@keyframes snowfall-anim {
  0% {
    transform: translateY(-20px) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(100vh) translateX(30px) rotate(360deg);
    opacity: 0;
  }
}

@keyframes sparkle-anim {
  0%, 100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.3);
  }
}

/* Reduce snowflakes on mobile for performance */
@media (max-width: 768px) {
  .snowflake-item:nth-child(n+11) {
    display: none;
  }
  .sparkle-item:nth-child(n+8) {
    display: none;
  }
}
</style>
