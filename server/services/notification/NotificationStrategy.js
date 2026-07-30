const logger = require('../../utils/logger');
const { sendWhatsApp } = require('../notificationService');

/**
 * Base Notification Strategy Interface
 */
class NotificationStrategy {
  async send(phoneNumber, message) {
    throw new Error('NotificationStrategy.send() must be implemented by concrete provider');
  }
}

/**
 * WATI WhatsApp Provider Implementation
 */
class WatiWhatsAppProvider extends NotificationStrategy {
  async send(phoneNumber, message) {
    if (!process.env.WATI_API_ENDPOINT || !process.env.WATI_AUTH_TOKEN) {
      logger.warn(`[WATI WhatsApp Provider] WATI Credentials missing. Message to ${phoneNumber} logged in dev mode.`);
      return { success: true, mode: 'dev_mock' };
    }
    const result = await sendWhatsApp(phoneNumber, message);
    if (result.success) {
      logger.info(`[WATI WhatsApp Provider] Dispatched WhatsApp message to ${phoneNumber}`);
    } else {
      logger.error(`[WATI WhatsApp Provider] Failed to dispatch WhatsApp message to ${phoneNumber}: ${result.error}`);
    }
    return result;
  }
}

/**
 * Notification Strategy Factory (Open/Closed Principle)
 * Allows easily registering new channels without editing core calling modules.
 */
class NotificationStrategyFactory {
  constructor() {
    this.strategies = new Map();
    const watiProvider = new WatiWhatsAppProvider();
    this.registerStrategy('sms', watiProvider);
    this.registerStrategy('whatsapp', watiProvider);
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
  WatiWhatsAppProvider,
  GupshupWhatsAppProvider: WatiWhatsAppProvider, // Backward compatibility alias
  notificationFactory: new NotificationStrategyFactory()
};
