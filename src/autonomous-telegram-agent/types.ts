/**
 * Types for Autonomous Telegram User-Agent Plugin
 */

export interface TelegramMessage {
  id: number;
  text: string;
  from: {
    id: number;
    firstName: string;
    username?: string;
  };
  date: Date;
  isOutgoing: boolean;
}

export interface SendMessageOptions {
  username: string;  // Bot username (e.g., 'agent_vibecoder_bot')
  message: string;   // Message text
  waitForResponse?: boolean;  // Wait for bot response (default: true)
  timeout?: number;  // Response timeout in ms (default: 5000)
}

export interface ReadMessagesOptions {
  username: string;  // Bot username
  limit?: number;    // Max messages to read (default: 10)
  onlyIncoming?: boolean;  // Only bot messages (default: true)
}

export interface TelegramSession {
  apiId: number;
  apiHash: string;
  sessionString: string;
  phone?: string;
  isValid: boolean;
  lastChecked?: Date;
}
