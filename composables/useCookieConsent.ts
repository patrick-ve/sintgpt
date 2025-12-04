type ConsentStatus = 'pending' | 'accepted' | 'declined';

const showBanner = ref(false);
const showRequiredMessage = ref(false);
const consentStatus = ref<ConsentStatus>('pending');

export const useCookieConsent = () => {
  const checkConsent = (): ConsentStatus => {
    if (!import.meta.client) return 'pending';

    const stored = localStorage.getItem('cookie_consent');
    if (stored === 'accepted') return 'accepted';
    if (stored === 'declined') return 'declined';
    return 'pending';
  };

  const initConsent = () => {
    consentStatus.value = checkConsent();
  };

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    consentStatus.value = 'accepted';
    showBanner.value = false;
    showRequiredMessage.value = false;
  };

  const declineCookies = () => {
    localStorage.setItem('cookie_consent', 'declined');
    consentStatus.value = 'declined';
    showBanner.value = false;
    showRequiredMessage.value = false;
  };

  const showConsentBanner = (required = false) => {
    showRequiredMessage.value = required;
    showBanner.value = true;
  };

  const hideBanner = () => {
    showBanner.value = false;
    showRequiredMessage.value = false;
  };

  const hasAcceptedCookies = computed(() => consentStatus.value === 'accepted');
  const hasDeclinedCookies = computed(() => consentStatus.value === 'declined');
  const hasPendingConsent = computed(() => consentStatus.value === 'pending');

  return {
    showBanner,
    showRequiredMessage,
    consentStatus: readonly(consentStatus),
    hasAcceptedCookies,
    hasDeclinedCookies,
    hasPendingConsent,
    initConsent,
    checkConsent,
    acceptCookies,
    declineCookies,
    showConsentBanner,
    hideBanner,
  };
};
