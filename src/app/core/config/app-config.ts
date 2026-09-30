/**
 * Client-side integration configuration.
 *
 * MindCare has no backend, so third-party integrations (EmailJS,
 * WhatsApp) are called directly from the browser using publishable keys.
 * Fill these in with your own account's values before going live — the app
 * runs perfectly fine in "demo mode" without them (OTP codes are shown
 * on-screen and WhatsApp always falls back to a wa.me deep link).
 */
export const APP_CONFIG = {
  clinic: {
    nameAr: 'مركز مايند كير الطبي',
    nameEn: 'MindCare Medical Center',
    phone: '+20 100 000 0000',
    address: 'القاهرة، مصر',
    whatsappNumber: '201000000000', // digits only, country code first, no '+'
  },
  emailjs: {
    // https://www.emailjs.com/ — create a service + an OTP template with a
    // {{otp_code}} and {{to_email}} variable, then paste the IDs below.
    serviceId: '',
    templateId: '',
    // Optional second template for general notifications (lab results ready,
    // low-stock alerts...) with {{to_email}}, {{subject}} and {{message}}
    // variables. Falls back to `templateId` when left empty.
    notifyTemplateId: '',
    publicKey: '',
    /** When any of the above is empty, OtpService runs in demo mode. */
    get isConfigured(): boolean {
      return !!(this.serviceId && this.templateId && this.publicKey);
    },
  },
  whatsapp: {
    // Optional WhatsApp Business Cloud API. When empty, the app sends via a
    // wa.me deep link automatically (the "Fallback" required by the brief).
    apiUrl: '',
    apiToken: '',
    get isConfigured(): boolean {
      return !!(this.apiUrl && this.apiToken);
    },
  },
  otp: {
    length: 6,
    ttlMinutes: 5,
    maxAttempts: 5,
  },
} as const;
