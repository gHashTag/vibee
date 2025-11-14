export interface InviteLink {
  id: string;
  code: string;
  creatorId: string;
  creatorName: string;
  uses: number;
  maxUses: number;
  rewards: {
    inviterBonus: number;
    inviteeBonus: number;
  };
  createdAt: string;
  expiresAt: string;
}

export interface InviteStats {
  totalInvites: number;
  successfulInvites: number;
  pendingInvites: number;
  totalRewards: number;
}

export interface InviteContext {
  chatId: string;
  userId: string;
  userName: string;
}

export interface InviteResult {
  success: boolean;
  data?: InviteLink | InviteStats | string;
  error?: string;
}
