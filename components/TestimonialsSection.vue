<script setup lang="ts">
const { t } = useI18n();

const testimonials = [
  {
    text: 'card1.text',
    author: 'card1.author',
    icon: '🎁',
  },
  {
    text: 'card2.text',
    author: 'card2.author',
    icon: '📜',
  },
  {
    text: 'card3.text',
    author: 'card3.author',
    icon: '✨',
  },
];
</script>

<template>
  <section class="container mx-auto px-6 pt-12 pb-4 relative z-10">
    <!-- Section header -->
    <div class="text-center mb-12">
      <!-- Animated stars -->
      <div class="flex justify-center gap-2 mb-4">
        <span
          v-for="i in 5"
          :key="i"
          class="text-2xl md:text-3xl star-icon"
          :style="{ animationDelay: `${i * 0.1}s` }"
        >
          ⭐
        </span>
      </div>

      <h2 class="text-2xl md:text-4xl font-bold text-[#f4cd60] font-cinzel drop-shadow-lg tracking-wide">
        {{ t('testimonials.title') }}
      </h2>

      <!-- Decorative line -->
      <div class="flex justify-center items-center gap-4 mt-4">
        <div class="w-16 h-0.5 bg-gradient-to-r from-transparent to-[#d4a853]/60"></div>
        <span class="text-[#d4a853]">✦</span>
        <div class="w-16 h-0.5 bg-gradient-to-l from-transparent to-[#d4a853]/60"></div>
      </div>
    </div>

    <!-- Testimonial cards -->
    <div class="grid md:grid-cols-3 gap-6 lg:gap-8">
      <div
        v-for="(testimonial, index) in testimonials"
        :key="index"
        class="testimonial-card group"
        :style="{ animationDelay: `${index * 0.15}s` }"
      >
        <!-- Card inner -->
        <div class="card-inner bg-gradient-to-br from-[#fef9e7] to-[#f5e6c8] p-6 rounded-2xl shadow-xl border-3 border-[#8b1538] relative transform transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl">
          <!-- Golden ribbon accent -->
          <div class="absolute top-0 right-0 w-20 h-20 overflow-hidden">
            <div class="absolute top-3 -right-6 w-24 h-6 bg-gradient-to-r from-[#f4cd60] via-[#d4a853] to-[#f4cd60] transform rotate-45 shadow-md"></div>
          </div>

          <!-- Inner decorative border -->
          <div class="absolute inset-2 border-2 border-dashed border-[#d4a853]/30 rounded-xl pointer-events-none"></div>

          <!-- Quote decoration -->
          <div class="absolute -top-2 -left-1 text-6xl text-[#8b1538]/20 font-serif leading-none">
            "
          </div>

          <!-- Icon badge -->
          <div class="absolute -top-3 left-6 w-10 h-10 bg-gradient-to-br from-[#8b1538] to-[#5c0f26] rounded-full flex items-center justify-center shadow-lg border-2 border-[#d4a853]">
            <span class="text-lg">{{ testimonial.icon }}</span>
          </div>

          <!-- Content -->
          <div class="relative z-10 pt-4">
            <p class="text-gray-700 italic mb-5 leading-relaxed font-handwriting text-lg">
              {{ t(`testimonials.${testimonial.text}`) }}
            </p>

            <!-- Author -->
            <div class="flex items-center justify-end gap-3 pt-3 border-t-2 border-[#d4a853]/20">
              <div class="w-8 h-0.5 bg-gradient-to-r from-transparent to-[#8b1538]/30 rounded-full"></div>
              <p class="font-bold text-[#8b1538] font-cinzel text-sm">
                {{ t(`testimonials.${testimonial.author}`) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.font-cinzel {
  font-family: 'Cinzel', serif;
}

.font-handwriting {
  font-family: 'IM Fell DW Pica', serif;
}

.star-icon {
  animation: star-pulse 2s ease-in-out infinite;
  filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.6));
}

@keyframes star-pulse {
  0%, 100% {
    opacity: 0.7;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.testimonial-card {
  animation: card-appear 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
  padding-top: 0.5rem;
}

@keyframes card-appear {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  border-radius: 1rem;
}
</style>
