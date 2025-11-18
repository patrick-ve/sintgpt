<script setup lang="ts">
const { t } = useI18n();

const testimonials = [
  {
    text: 'card1.text',
    author: 'card1.author',
  },
  {
    text: 'card2.text',
    author: 'card2.author',
  },
  {
    text: 'card3.text',
    author: 'card3.author',
  },
];
</script>

<template>
  <section class="container mx-auto px-6 pt-12 pb-4">
    <div class="text-center mb-10">
      <div
        class="flex justify-center gap-1 mb-3 text-2xl text-yellow-500 drop-shadow-sm animate-pulse"
      >
        <span>⭐</span>
        <span>⭐</span>
        <span>⭐</span>
        <span>⭐</span>
        <span>⭐</span>
      </div>
      <h2
        class="text-2xl md:text-3xl font-bold text-white font-cinzel drop-shadow-sm"
      >
        {{ t('testimonials.title') }}
      </h2>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <div
        v-for="(testimonial, index) in testimonials"
        :key="index"
        class="bg-[#fffdf0] p-6 rounded-xl shadow-lg border-2 border-red-100 relative transform hover:-translate-y-1 transition-transform duration-300"
      >
        <!-- Quote Icon -->
        <div
          class="absolute -top-4 -left-2 text-4xl text-red-200 font-serif"
        >
          "
        </div>

        <div class="relative z-10">
          <p
            class="text-gray-800 italic mb-4 font-medium leading-relaxed"
          >
            {{ t(`testimonials.${testimonial.text}`) }}
          </p>
          <div class="flex items-center justify-end">
            <div class="w-8 h-1 bg-red-100 rounded-full mr-3"></div>
            <p class="font-bold text-red-900 font-cinzel">
              {{ t(`testimonials.${testimonial.author}`) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');

.font-cinzel {
  font-family: 'Cinzel', serif;
}
</style>
