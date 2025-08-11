import { Injectable, Logger } from '@nestjs/common';
import { WOOCOMMERCE_MESSAGES, GENERAL_MESSAGES, NotificationMessage } from './messages';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);
  private readonly messages = {
    ...WOOCOMMERCE_MESSAGES,
    ...GENERAL_MESSAGES,
  };

  /**
   * Get localized message for a specific key and language
   */
  getMessage(
    messageKey: string,
    language: string = 'en',
    variables: Record<string, any> = {},
  ): NotificationMessage | null {
    try {
      const messageTemplate = this.messages[messageKey];
      
      if (!messageTemplate) {
        this.logger.warn(`Message template not found for key: ${messageKey}`);
        return null;
      }

      // Try to get message in requested language, fallback to English
      const message = messageTemplate[language] || messageTemplate['en'];
      
      if (!message) {
        this.logger.warn(`Message not found for key: ${messageKey}, language: ${language}`);
        return null;
      }

      // Replace variables in content and heading
      const processedMessage: NotificationMessage = {
        content: this.replaceVariables(message.content, variables),
        heading: message.heading ? this.replaceVariables(message.heading, variables) : undefined,
      };

      return processedMessage;
    } catch (error) {
      this.logger.error(`Error getting message for key: ${messageKey}`, error);
      return null;
    }
  } 
 /**
   * Replace variables in message text
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    let processedText = text;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      processedText = processedText.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return processedText;
  }

  /**
   * Get all available message keys
   */
  getAvailableMessageKeys(): string[] {
    return Object.keys(this.messages);
  }

  /**
   * Get all supported languages for a message key
   */
  getSupportedLanguages(messageKey: string): string[] {
    const messageTemplate = this.messages[messageKey];
    return messageTemplate ? Object.keys(messageTemplate) : [];
  }

  /**
   * Check if a message key exists
   */
  hasMessage(messageKey: string): boolean {
    return messageKey in this.messages;
  }

  /**
   * Get message in multiple languages (useful for debugging)
   */
  getMessageInAllLanguages(
    messageKey: string,
    variables: Record<string, any> = {},
  ): Record<string, NotificationMessage> {
    const messageTemplate = this.messages[messageKey];
    if (!messageTemplate) {
      return {};
    }

    const result: Record<string, NotificationMessage> = {};
    
    Object.keys(messageTemplate).forEach(language => {
      const message = this.getMessage(messageKey, language, variables);
      if (message) {
        result[language] = message;
      }
    });

    return result;
  }
}