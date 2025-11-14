export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  features: string[];
  cost: number;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'low' | 'medium' | 'high';
  available: boolean;
}

export interface UserModelPreference {
  userId: string;
  modelId: string;
  setAt: string;
}

export interface ModelContext {
  chatId: string;
  userId: string;
  modelId?: string;
}

export interface ModelResult {
  success: boolean;
  data?: AIModel | UserModelPreference | AIModel[];
  error?: string;
}
