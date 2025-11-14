export interface HelpSection {
  id: string;
  title: string;
  description: string;
  commands: string[];
  category: string;
}

export interface HelpContext {
  chatId: string;
  userId: string;
  section?: string;
}

export interface HelpResult {
  success: boolean;
  data?: HelpSection[];
  error?: string;
}
