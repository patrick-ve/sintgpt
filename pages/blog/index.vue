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
  <div class="min-h-screen bg-gradient-to-b from-black via-blue-950 to-gray-900">
    <!-- Header -->
    <header class="bg-red-900 text-white shadow-lg">
      <div class="container mx-auto px-6 py-8 text-[rgb(244,205,96)]">
        <div class="flex items-center justify-between">
          <NuxtLink to="/" class="hover:opacity-80 transition-opacity">
            <h1 class="text-3xl md:text-5xl font-bold">SintGPT Blog</h1>
          </NuxtLink>
          <NuxtLink
            to="/"
            class="px-4 py-2 bg-[rgb(244,205,96)] text-red-900 rounded-lg font-bold hover:bg-yellow-400 transition-colors"
          >
            {{ locale === 'nl' ? 'Terug naar Generator' : 'Back to Generator' }}
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-6 py-12">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-4xl font-bold text-white mb-4 text-center">
          {{ locale === 'nl' ? 'Tips & Inspiratie voor Sinterklaasgedichten' : 'Tips & Inspiration for Sinterklaas Poems' }}
        </h2>
        <p class="text-xl text-gray-300 mb-12 text-center">
          {{ locale === 'nl'
            ? 'Ontdek alles over het schrijven van perfecte sinterklaasgedichten'
            : 'Discover everything about writing perfect Sinterklaas poems' }}
        </p>

        <!-- Blog Posts Grid -->
        <div class="grid gap-8">
          <article
            v-for="post in blogPosts"
            :key="post.slug"
            class="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
          >
            <NuxtLink :to="`/blog/${post.slug}`" class="block">
              <div class="md:flex">
                <div class="md:w-1/3">
                  <img
                    :src="post.image"
                    :alt="post.title"
                    class="w-full h-64 md:h-full object-cover"
                  >
                </div>
                <div class="p-8 md:w-2/3">
                  <div class="flex items-center gap-4 text-sm text-gray-500 mb-3">
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
                  <h3 class="text-2xl font-bold text-gray-900 mb-3 hover:text-red-600 transition-colors">
                    {{ post.title }}
                  </h3>
                  <p class="text-gray-700 mb-4 leading-relaxed">
                    {{ post.description }}
                  </p>
                  <span class="text-red-600 font-semibold hover:text-red-700">
                    {{ locale === 'nl' ? 'Lees meer →' : 'Read more →' }}
                  </span>
                </div>
              </div>
            </NuxtLink>
          </article>
        </div>

        <!-- CTA Section -->
        <div class="mt-16 bg-white rounded-2xl shadow-xl p-8 text-center">
          <h3 class="text-2xl font-bold text-gray-900 mb-4">
            {{ locale === 'nl' ? 'Klaar om je eigen gedicht te maken?' : 'Ready to create your own poem?' }}
          </h3>
          <p class="text-gray-700 mb-6">
            {{ locale === 'nl'
              ? 'Gebruik SintGPT om binnen 30 seconden een gepersonaliseerd sinterklaasgedicht te genereren!'
              : 'Use SintGPT to generate a personalized Sinterklaas poem in 30 seconds!' }}
          </p>
          <NuxtLink
            to="/"
            class="inline-block px-8 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
          >
            {{ locale === 'nl' ? 'Start nu gratis' : 'Start free now' }}
          </NuxtLink>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-transparent mt-12">
      <div class="container mx-auto px-6 py-6 text-center text-gray-400">
        <p>Copyright {{ new Date().getFullYear() }} SintGPT. {{ locale === 'nl' ? 'Alle rechten voorbehouden.' : 'All rights reserved.' }}</p>
      </div>
    </footer>
  </div>
</template>
