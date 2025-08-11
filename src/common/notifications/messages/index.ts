export interface NotificationMessage {
  content: string;
  heading?: string;
}

export interface NotificationMessages {
  [language: string]: NotificationMessage;
}

export interface NotificationTemplate {
  [key: string]: NotificationMessages;
}

// Export all message templates
export * from './woocommerce.messages';
export * from './general.messages';