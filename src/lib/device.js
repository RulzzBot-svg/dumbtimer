const PHONE_UA = /iPhone|iPod|Windows Phone|IEMobile|webOS|BlackBerry/i
const ANDROID_PHONE_UA = /Android.+Mobile/i

export function isPhoneUserAgent(userAgent = '', uaDataMobile) {
  if (typeof uaDataMobile === 'boolean') return uaDataMobile
  return PHONE_UA.test(userAgent) || ANDROID_PHONE_UA.test(userAgent)
}

export function detectDevice() {
  if (typeof window === 'undefined') return 'desk'
  const requested = new URLSearchParams(window.location.search).get('device')
  if (requested === 'phone' || requested === 'desk') return requested
  const uaDataMobile = navigator.userAgentData?.mobile
  return isPhoneUserAgent(navigator.userAgent, uaDataMobile) ? 'phone' : 'desk'
}

export function applyDevice(device) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.device = device
}

export function isStandaloneApp() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}
