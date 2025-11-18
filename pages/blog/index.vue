<script setup lang="ts">
const { t, locale } = useI18n();

const blogPosts = computed(() => [
  {
    title: 'Hoe schrijf je het perfecte sinterklaasgedicht in 2025',
    description: 'Ontdek praktische tips en trucs om een geweldig sinterklaasgedicht te schrijven dat gegarandeerd indruk maakt.',
    slug: 'hoe-schrijf-je-het-perfecte-sinterklaasgedicht',
    date: '2025-11-17',
    image: '/sint.png',
    readTime: '5 min',
  },
  {
    title: 'Grappige sinterklaasgedichten: Tips en voorbeelden',
    description: 'Leer hoe je humor toevoegt aan je sinterklaasgedichten met praktische voorbeelden en creatieve technieken.',
    slug: 'grappige-sinterklaasgedichten-tips',
    date: '2025-11-17',
    image: '/sint.png',
    readTime: '4 min',
  },
  {
    title: 'Sinterklaas tradities: Van gedichten tot surprises',
    description: 'Een uitgebreide gids over de geschiedenis en betekenis van sinterklaasgedichten in de Nederlandse cultuur.',
    slug: 'sinterklaas-tradities',
    date: '2025-11-17',
    image: '/sint.png',
    readTime: '3 min',
  },
]);

useSeoMeta({
  title: 'SintGPT Blog - Tips voor Perfecte Sinterklaasgedichten',
  description: 'Ontdek tips, trucs en inspiratie voor het schrijven van sinterklaasgedichten. Van grappige gedichten tot klassieke rijmschema\'s.',
  ogTitle: 'SintGPT Blog - Sinterklaasgedichten Tips & Inspiratie',
  ogDescription: 'Alles wat je moet weten over sinterklaasgedichten: tips, voorbeelden, en creatieve ideeën voor het perfecte gedicht.',
  ogImage: '/og-image.png',
  keywords: 'sinterklaasgedichten tips, sinterklaas blog, gedichten schrijven, sinterklaas inspiratie, grappige gedichten',
});

useHead({
  link: [
    { rel: 'canonical', href: 'https://sintgpt.com/blog' },
  ],
});
</script>

<template>
  <div class="min-h-screen bg-sinterklaas-pattern">
    <!-- Header -->
    <header class="bg-red-900 text-white shadow-xl border-b-4 border-[#F4CD60] relative overflow-hidden">
      <!-- Decorative corner elements -->
      <div class="absolute top-0 left-0 w-16 h-16 bg-[#F4CD60] -translate-x-8 -translate-y-8 rotate-45 transform"></div>
      <div class="absolute top-0 right-0 w-16 h-16 bg-[#F4CD60] translate-x-8 -translate-y-8 rotate-45 transform"></div>

      <div class="container mx-auto px-6 py-8 text-[#F4CD60] relative z-10">
        <div class="flex items-center justify-between">
          <NuxtLink to="/" class="hover:opacity-80 transition-opacity flex items-center gap-4">
            <div class="hidden md:block text-4xl">🎁</div>
            <h1 class="text-3xl md:text-5xl font-bold font-cinzel drop-shadow-md">SintGPT Blog</h1>
          </NuxtLink>
          <NuxtLink
            to="/"
            class="px-4 py-2 bg-[#F4CD60] text-red-900 rounded-lg font-bold hover:bg-yellow-400 transition-colors font-cinzel border-2 border-red-900 shadow-md"
          >
            {{ locale === 'nl' ? 'Terug naar Generator' : 'Back to Generator' }}
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-12">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12 relative">
           <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-12 text-6xl opacity-20 pointer-events-none">✍️</div>
           <h2 class="text-4xl font-bold text-white mb-4 font-cinzel drop-shadow-lg">
            {{ locale === 'nl' ? 'Tips & Inspiratie voor Sinterklaasgedichten' : 'Tips & Inspiration for Sinterklaas Poems' }}
          </h2>
          <p class="text-xl text-[#F4CD60] font-medium drop-shadow-md">
            {{ locale === 'nl'
              ? 'Ontdek alles over het schrijven van perfecte sinterklaasgedichten'
              : 'Discover everything about writing perfect Sinterklaas poems' }}
          </p>
        </div>

        <!-- Blog Posts Grid -->
        <div class="grid gap-8">
          <article
            v-for="post in blogPosts"
            :key="post.slug"
            class="bg-[#fffdf0] rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1 border-4 border-red-900 relative group"
          >
            <div class="absolute top-2 right-2 text-2xl opacity-50 group-hover:opacity-100 transition-opacity">📜</div>
            <NuxtLink :to="`/blog/${post.slug}`" class="block">
              <div class="md:flex">
                <div class="md:w-1/3 relative">
                   <div class="absolute inset-0 bg-red-900/10 group-hover:bg-transparent transition-colors"></div>
                  <img
                    :src="post.image"
                    :alt="post.title"
                    class="w-full h-64 md:h-full object-cover"
                  >
                </div>
                <div class="p-8 md:w-2/3 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center gap-4 text-sm text-red-700 mb-3 font-bold font-cinzel">
                      <time :datetime="post.date">
                        {{ new Date(post.date).toLocaleDateString(locale === 'nl' ? 'nl-NL' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) }}
                      </time>
                      <span>•</span>
                      <span>{{ post.readTime }}</span>
                    </div>
                    <h3 class="text-2xl font-bold text-red-900 mb-3 group-hover:text-red-700 transition-colors font-cinzel">
                      {{ post.title }}
                    </h3>
                    <p class="text-gray-800 mb-4 leading-relaxed font-medium">
                      {{ post.description }}
                    </p>
                  </div>
                  <span class="text-red-600 font-bold hover:text-red-800 font-cinzel flex items-center gap-2">
                    {{ locale === 'nl' ? 'Lees meer' : 'Read more' }} <span class="text-xl">→</span>
                  </span>
                </div>
              </div>
            </NuxtLink>
          </article>
        </div>

        <!-- CTA Section -->
        <div class="mt-16 bg-[#fffdf0] rounded-2xl shadow-xl p-8 text-center sint-border relative overflow-hidden">
           <div class="absolute -left-4 -bottom-4 text-6xl opacity-20 rotate-45">🎁</div>
           <div class="absolute -right-4 -top-4 text-6xl opacity-20 -rotate-12">🌙</div>
          <h3 class="text-3xl font-bold text-red-900 mb-4 font-cinzel">
            {{ locale === 'nl' ? 'Klaar om je eigen gedicht te maken?' : 'Ready to create your own poem?' }}
          </h3>
          <p class="text-gray-800 mb-8 text-lg font-medium max-w-2xl mx-auto">
            {{ locale === 'nl'
              ? 'Gebruik SintGPT om binnen 30 seconden een gepersonaliseerd sinterklaasgedicht te genereren!'
              : 'Use SintGPT to generate a personalized Sinterklaas poem in 30 seconds!' }}
          </p>
          <NuxtLink
            to="/"
            class="inline-block px-8 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-transform transform hover:scale-105 shadow-lg border-2 border-[#F4CD60] font-cinzel text-xl"
          >
            {{ locale === 'nl' ? 'Start nu gratis' : 'Start free now' }}
          </NuxtLink>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-red-900 mt-12 border-t-4 border-[#F4CD60] relative">
      <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-900 border-4 border-[#F4CD60] rounded-full p-3">
        <div class="text-2xl">🎁</div>
      </div>
      <div
        class="container mx-auto px-6 py-12 text-center text-[#F4CD60]"
      >
        <div class="flex justify-center gap-8 mb-6 text-3xl opacity-80">
           <span>🌙</span>
           <span>🐴</span>
           <span>🥕</span>
        </div>
        <p class="font-cinzel font-bold text-lg">
         Copyright {{ new Date().getFullYear() }} SintGPT. {{ locale === 'nl' ? 'Alle rechten voorbehouden.' : 'All rights reserved.' }}
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@400;700;900&family=IM+Fell+DW+Pica+SC&family=IM+Fell+DW+Pica:ital@0;1&display=swap');

.font-cinzel {
  font-family: 'Cinzel', serif;
}

.bg-sinterklaas-pattern {
  background-color: #7f1d1d;
  background-image: 
    radial-gradient(#F4CD60 1px, transparent 1px), 
    radial-gradient(#F4CD60 1px, transparent 1px);
  background-size: 50px 50px;
  background-position: 0 0, 25px 25px;
  background-attachment: fixed;
}

.sint-border {
  border: 4px solid #7f1d1d;
  outline: 2px solid #F4CD60;
  outline-offset: -8px;
}
</style>