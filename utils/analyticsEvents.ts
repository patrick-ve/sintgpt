// Event names for Workers Analytics Engine. Queries filter on these names, so
// keep them stable. The server writes its own events; the browser may send
// only the client events, through POST /api/events.

export const SERVER_EVENTS = [
  'Generate poem',
  'Regenerate poem',
  'Poem generation failed',
  'Rate limited',
  'Proceed to payment',
  'Payments unavailable',
  'Poem aborted',
  'Payment verified',
  'Payment webhook',
  'Surprise ideas',
  'Surprise ideas failed',
  'Gift claimed',
] as const;

export const CLIENT_EVENTS = [
  'Page view',
  'Form started',
  'Form refused',
  'Poem ready',
  'Rate poem',
  'Edit poem',
  'Poem stream failed',
  'Open poem from history',
  'Open history',
  'Delete poem',
  'Clear history',
  'Switch language',
  'Payment succeeded',
  'Payment returned',
  'Access restored',
  'Restore failed',
  'Show payment modal',
  'Close payment modal',
  'Continue after payment',
  'Go to poem form',
  'Contact',
  'PDF failed',
  'Copy failed',
  'Copy share link',
  'Copy to clipboard',
  'Save as PDF',
  'Shared via WhatsApp',
  'Shared via Email',
  'Shared via Facebook',
  'Open shared poem',
  'Shared poem to form',
  'Scroll to poem form',
  'Scroll to FAQ',
  'Play video',
  'Show example',
  'Draw lootjes',
  'Show surprise ideas',
  'Open devtools',
] as const;

export type ServerEventName = (typeof SERVER_EVENTS)[number];
export type ClientEventName = (typeof CLIENT_EVENTS)[number];
export type AnalyticsEventName = ServerEventName | ClientEventName;

/** What a client event may carry besides its name. Short, and never personal. */
export interface ClientEventProps {
  /** A fixed value such as a style or a referring domain, never visitor text. */
  detail?: string;
  /** A count, such as the number of people in a lootjes draw. */
  value?: number;
  /** Campaign tags from the landing URL (utm_source, utm_medium, utm_campaign). */
  source?: string;
  medium?: string;
  campaign?: string;
}

/** Campaign tags are lower case and short, so free text cannot get in. */
export const CAMPAIGN_PATTERN = /^[a-z0-9_.-]{1,40}$/;

export const DETAIL_MAX_LENGTH = 60;
export const DETAIL_PATTERN = /^[\p{L}\p{N} ._:/-]*$/u;
export const PATH_MAX_LENGTH = 200;
