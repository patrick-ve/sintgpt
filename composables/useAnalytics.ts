import type { ClientEventName, ClientEventProps } from '~/utils/analyticsEvents';

const ENDPOINT = '/api/events';

/** The page without anything that opens a shared poem: `/g/<id>` becomes `/g/:id`. */
export function analyticsPath(pathname: string): string {
  return pathname.replace(/^\/g\/[^/]+/, '/g/:id').slice(0, 200) || '/';
}

/**
 * Sends a browser event to POST /api/events, which writes it to Workers
 * Analytics Engine. sendBeacon survives a page that is closing or navigating
 * away; a failed event is dropped and never bothers the visitor.
 */
export const useAnalytics = () => {
  // Read the locale state directly: this also runs in plugins, outside setup.
  const locale = useState<'nl' | 'en'>('locale', () => 'nl');

  const track = (name: ClientEventName, props: ClientEventProps = {}) => {
    if (import.meta.server) return;
    const body = JSON.stringify({
      name,
      path: analyticsPath(window.location.pathname),
      locale: locale.value,
      ...props,
    });
    try {
      if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'application/json' }))) return;
    } catch {
      // Fall through to fetch.
    }
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  };

  return { track };
};
