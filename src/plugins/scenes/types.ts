/**
 * Типы для Scene плагинов
 */

import { Scenes } from 'telegraf';

export interface SceneContext extends Scenes.SceneContext {
  session: {
    wizardData: Record<string, any>;
  };
}

export interface ScenePlugin {
  scene: Scenes.WizardScene<SceneContext> | Scenes.BaseScene<SceneContext>;
}

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: 'RUB' | 'STARS';
  features: string[];
  description: string;
}

export interface InviteData {
  inviterId: string;
  inviteCode: string;
  createdAt: number;
  usedCount: number;
}

export interface BalanceData {
  userId: string;
  rubles: number;
  stars: number;
  subscription?: {
    plan: string;
    expiresAt: number;
  };
  history: Array<{
    type: 'payment' | 'refund' | 'subscription' | 'spend';
    amount: number;
    currency: 'RUB' | 'STARS';
    description: string;
    date: number;
  }>;
}
