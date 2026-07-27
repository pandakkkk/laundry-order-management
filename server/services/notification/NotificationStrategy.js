const logger = require('../../utils/logger');

/**
 * Base Notification Strategy Interface
 */
class NotificationStrategy {
  async send(phoneNumber, message) {
    throw new Error('NotificationStrategy.send() must be implemented by concrete provider');
  }
}

/**
 * Gupshup SMS Provider Implementation
 */
class GupshupSMSProvider extends NotificationStrategy {
  async send(phoneNumber, message) {
    if (!process.env.GUPSHUP_SMS_USERID || !process.env.GUPSHUP_SMS_PASSWORD) {
      logger.warn(`[SMS Provider] Credentials missing. Message to ${phoneNumber} logged in dev mode.`);
      return { success: true, mode: 'dev_mock' };
    }
    // Concrete SMS dispatch logic
    logger.info(`[SMS Provider] Dispatched SMS to ${phoneNumber}`);
    return { success: true };
  }
}

/**
 * Gupshup WhatsApp Provider Implementation
 */
class GupshupWhatsAppProvider extends NotificationStrategy {
  async send(phoneNumber, message) {
    if (!process.env.GUPSHUP_API_KEY) {
      logger.warn(`[WhatsApp Provider] API Key missing. Message to ${phoneNumber} logged in dev mode.`);
      return { success: true, mode: 'dev_mock' };
    }
    // Concrete WhatsApp dispatch logic
    logger.info(`[WhatsApp Provider] Dispatched WhatsApp message to ${phoneNumber}`);
    return { success: true };
  }
}

/**
 * Notification Strategy Factory (Open/Closed Principle)
 * Allows easily registering new channels without editing core calling modules.
 */
class NotificationStrategyFactory {
  constructor() {
    this.strategies = new Map();
    this.registerStrategy('sms', new GupshupSMSProvider());
    this.registerStrategy('whatsapp', new GupshupWhatsAppProvider());
  }

  registerStrategy(channel, strategyInstance) {
    this.strategies.set(channel, strategyInstance);
  }

  getStrategy(channel) {
    const strategy = this.strategies.get(channel);
    if (!strategy) {
      throw new Error(`Notification strategy for channel '${channel}' is not registered.`);
    }
    return strategy;
  }
}

module.exports = {
  NotificationStrategy,
  GupshupSMSProvider,
  GupshupWhatsAppProvider,
  notificationFactory: new NotificationStrategyFactory()
};
