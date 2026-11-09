import { CAMPAIGN_PATTERN } from '~/utils/analyticsEvents';

// One "Page view" event per page the visitor sees. The first one also carries
// the domain they came from and the campaign tags of the landing URL. The
// path never includes the query or the hash, so payment IDs and shared poems
// do not end up in analytics.
export default defineNuxtPlugin((nuxtApp) => {
  const { track } = useAnalytics();
  const route = useRoute();
  let lastPath: string | null = null;

  const referrer = (): string | undefined => {
    try {
      const host = document.referrer ? new URL(document.referrer).hostname : '';
      return host && host !== window.location.hostname ? host : undefined;
    } catch {
      return undefined;
    }
  };

  // utm_* values in lower case; anything that does not look like a tag is dropped.
  const campaign = () => {
    const params = new URLSearchParams(window.location.search);
    const tag = (name: string) => {
      const value = params.get(name)?.trim().toLowerCase();
      return value && CAMPAIGN_PATTERN.test(value) ? value : undefined;
    };
    return { source: tag('utm_source'), medium: tag('utm_medium'), campaign: tag('utm_campaign') };
  };

  nuxtApp.hook('page:finish', () => {
    if (route.path === lastPath) return;
    const first = lastPath === null;
    lastPath = route.path;
    track('Page view', first ? { detail: referrer(), ...campaign() } : {});
  });

  // Links to the poem form on other pages carry data-cta="<where>", for
  // example "blog:lootjes-trekken-tips".
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest?.('[data-cta]');
    const where = link?.getAttribute('data-cta');
    if (where) track('Go to poem form', { detail: where });
  }, { capture: true });
});
