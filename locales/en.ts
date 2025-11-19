export default {
  header: {
    title: 'SintGPT',
    subtitle1:
      'Create personalized Sinterklaas poems and let AI do the rhyming.',
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
      placeholder:
        'Tell as much detail as possible about hobbies, work, sports, interests or other anecdotes...',
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
      limerickNote:
        'Limericks are always 5 lines (AABBA rhyme scheme)',
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
    contact: 'Contact us',
  },
  error: {
    title: 'Oops! Something went wrong.',
    message:
      'An error occurred while displaying this part of the page.',
    label: 'Error',
    retry: 'Try again',
  },
  seo: {
    title:
      'SintGPT - Sinterklaas Poem Generator | Create Funny & Personalized Sinterklaas Poems with AI',
    description:
      'Create unique Sinterklaas poems with AI in 30 seconds! Funny, classic, or ironic styles. Personalized poems with any rhyme scheme. Try 3 poems free!',
    ogTitle: 'SintGPT - AI Sinterklaas Poem Generator | Free Trial',
    ogDescription:
      'Generate personalized Sinterklaas poems in any style. AI poem generator creates perfectly rhyming poems for Sinterklaas 2025. Fast, easy, and personal! 3 free poems!',
    ogImageAlt:
      'SintGPT - Free AI Sinterklaas Poem Generator for Personalized Poems',
    keywords:
      'sinterklaas poem generator, create sinterklaas poems, funny sinterklaas poems, personalized sinterklaas poem, sinterklaas poem AI, dutch sinterklaas tradition, sinterklaas 2025',
  },
  faq: {
    title: 'Frequently Asked Questions',
    questions: [
      {
        question: 'How do I create a Sinterklaas poem with SintGPT?',
        answer:
          'Simply fill in the recipient\'s name, optionally add fun facts about hobbies or work, choose a style (funny, classic, ironic, or old-fashioned) and a rhyme scheme. Click "Generate poem" and within 30 seconds you\'ll have a unique, personalized Sinterklaas poem!',
      },
      {
        question: 'Is SintGPT free?',
        answer:
          'Yes! You can generate 3 Sinterklaas poems for free. After that, you can upgrade to unlimited access for just €3, allowing you to create as many poems as you want for the entire Sinterklaas celebration.',
      },
      {
        question: 'What poem styles are available?',
        answer:
          'SintGPT offers 4 different styles: Funny (with humor and wordplay), Classic (traditional and atmospheric), Ironic (with a wink and sarcasm), and Old-fashioned (in old Dutch style). You can also choose from different rhyme schemes like AABB, ABBA, or Limerick.',
      },
      {
        question: 'How personal do the poems get?',
        answer:
          'The more details you provide, the more personal the poem! You can add information about hobbies, work, special characteristics, or funny anecdotes. Our AI processes this information and creates a unique poem that perfectly fits the recipient.',
      },
      {
        question: 'Can I keep the present secret in the poem?',
        answer:
          "Yes! You can choose whether to explicitly mention the present or have the poem describe it vaguely, keeping it a surprise. Perfect for when you don't want to reveal the gift yet!",
      },
      {
        question: 'In which languages can SintGPT create poems?',
        answer:
          'SintGPT can generate Sinterklaas poems in Dutch and English. This is ideal for Dutch families abroad or international friends who want to participate in the Sinterklaas tradition.',
      },
      {
        question: 'How long does it take to generate a poem?',
        answer:
          'Generating a Sinterklaas poem takes an average of 20-30 seconds. Our AI analyzes your input and creates a unique, rhyming poem that perfectly matches your preferences.',
      },
      {
        question: 'Can I edit or regenerate the poems?',
        answer:
          "You can easily copy the generated poem to your clipboard and then edit it in your favorite text editor. If you're not satisfied, you can generate a new poem with different details or style until you have the perfect result!",
      },
    ],
  },
  payment: {
    title: 'Upgrade to unlimited access',
    description: 'You have used your 3 free poems',
    limitReached:
      "You've reached your limit of 3 free poems. Upgrade to unlimited access for just €3!",
    oneTimePayment: 'One-time payment',
    includesVAT: 'incl. VAT',
    whatYouGet: 'What you get:',
    benefit1: 'Generate unlimited Sinterklaas poems',
    benefit2: 'No more limits',
    benefit3: 'Instant access after payment',
    feature1: 'Unlimited poem generation',
    feature2: 'All styles and rhyme schemes',
    feature3: 'One-time payment, lifetime access',
    emailLabel: 'Email address for invoice',
    emailPlaceholder: 'your@email.com',
    emailHelp: 'We will send your invoice to this email address',
    proceedToPayment: 'Proceed to payment',
    payNow: 'Pay €3 for unlimited access',
    processing: 'Processing...',
    securePayment: 'Secure payment via Dodo Payments',
    poweredByStripe: 'Powered by Stripe',
    invalidEmail: 'Please enter a valid email address',
    initError:
      'Could not initialize payment. Please try again later.',
    notInitialized: 'Payment is not properly initialized',
    cardError: 'Please check your card details',
    error: 'Payment failed. Please try again.',
    errorTitle: 'Payment Error',
    unexpectedError: 'Something went wrong. Please try again.',
    confirmError: 'Could not complete payment. Please try again.',
    processingMessage:
      'Your payment is being processed. Please wait...',
    successTitle: 'Payment successful!',
    successMessage:
      'You now have unlimited access to generate poems!',
    successDescription:
      'You now have unlimited access to the poem generator.',
    remainingPoems: '{count} free poems remaining',
    unlimitedAccess: 'Unlimited access for just €3',
  },
  testimonials: {
    title: 'Over 5,000 happy assistant Sinterklazen',
    card1: {
      text: 'Amazing! Done in 1 minute, while I usually sweat for hours.',
      author: 'Anouk',
    },
    card2: {
      text: 'Finally a poem that doesn\'t start with "Saint was thinking".',
      author: 'Mark',
    },
    card3: {
      text: 'My mother-in-law was crying with laughter. Top!',
      author: 'Lisa',
    },
  },
  video: {
    title: 'Sinterklaas talks about sintgpt.com',
  },
};
