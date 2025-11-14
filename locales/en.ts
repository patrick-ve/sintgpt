export default {
  header: {
    title: 'SintGPT',
    subtitle1: 'Create personalized Sinterklaas poems and let AI do the rhyming.',
    subtitle2: 'Fast & easy. Ready in 30 seconds!',
  },
  form: {
    title: 'Poem details',
    name: {
      label: 'Recipient name',
      placeholder: 'Saint Nicholas',
    },
    present: {
      label: 'Sinterklaas present',
      placeholder: 'A book, toy, kitchenware, etc.',
    },
    revealPresent: {
      label: 'Mention the present?',
      yes: 'Yes, mention the present in the poem',
      no: 'No, keep the present secret (describe vaguely)',
    },
    funFacts: {
      label: 'Fun facts about the recipient',
      placeholder: 'Tell as much detail as possible about hobbies, work, sports, interests or other anecdotes...',
      help: 'This information is used to make the poem more personal',
    },
    style: {
      label: 'Poem style',
      funny: '😄 Funny',
      classic: '📜 Classic',
      ironic: '😏 Ironic',
      oldFashioned: '🎩 Old-fashioned',
    },
    rhymeScheme: {
      label: 'Rhyme scheme',
      aabb: 'AABB (Couplets)',
      abba: 'ABBA (Enclosed)',
      limerick: 'Limerick',
    },
    language: {
      label: 'Language',
      dutch: '🇳🇱 Dutch',
      english: '🇬🇧 English',
    },
    lines: {
      label: 'Number of lines',
      min: 'lines',
      max: 'lines',
      limerickNote: 'Limericks are always 5 lines (AABBA rhyme scheme)',
    },
    submit: {
      generate: 'Generate poem',
      generating: 'Generating poem...',
    },
    required: '*',
  },
  poem: {
    title: 'Poem for {name}',
    defaultTitle: 'Your poem',
    copy: 'Copy',
    copied: 'Copied!',
    loading: 'Your personalized poem is being created...',
    error: 'Error',
    empty: 'Fill out the form to generate a poem',
  },
  footer: {
    copyright: 'Copyright {year} SintGPT. All rights reserved.',
  },
  error: {
    title: 'Oops! Something went wrong.',
    message: 'An error occurred while displaying this part of the page.',
    label: 'Error',
    retry: 'Try again',
  },
  seo: {
    title: 'SintGPT - Create personalized Sinterklaas poems with AI. Fast, easy and ready in 30 seconds!',
    description: 'SintGPT creates the perfect Sinterklaas poem for you. Fast, easy and ready in 30 seconds!',
    ogTitle: 'SintGPT - Create personalized Sinterklaas poems with AI',
    ogDescription: 'SintGPT creates the perfect Sinterklaas poem for you. Fast, easy and ready in 30 seconds!',
    ogImageAlt: 'SintGPT - AI Sinterklaas Poem Generator',
  },
};
