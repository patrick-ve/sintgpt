interface SharedPoemMeta {
  opening: string;
  language: 'nl' | 'en';
  /** The signed values, which the share image needs. */
  imageQuery: string;
  /** The address without anything private, for og:url. */
  url: string;
}

/** The tags that apps read for a link preview. They run no JavaScript. */
export function useSharedPoemMeta({ opening, language, imageQuery, url }: SharedPoemMeta) {
  const title = language === 'nl'
    ? 'Een sinterklaasgedicht van SintGPT'
    : 'A Sinterklaas poem from SintGPT';
  const description = opening.replace(/\n/g, ' ');
  const image = `${useRequestURL().origin}/gedicht/preview.png?${imageQuery}`;

  // Personal content that only makes sense for the people it is shared with.
  useSeoMeta({
    title,
    description,
    robots: 'noindex, follow',
    ogTitle: title,
    ogDescription: description,
    ogType: 'article',
    ogSiteName: 'SintGPT',
    ogLocale: language === 'nl' ? 'nl_NL' : 'en_US',
    ogUrl: url,
    ogImage: image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageType: 'image/png',
    ogImageAlt: description,
    twitterCard: 'summary_large_image',
    twitterImage: image,
    twitterImageAlt: description,
  });
}
