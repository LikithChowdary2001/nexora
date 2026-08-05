import type { AIChatSession, AIAssistantMessage } from '@nexora/shared';
import { BaseRepository } from './base.repository.js';
import { Collections } from '../firebase/index.js';

export class AIChatRepository extends BaseRepository<AIChatSession> {
  protected collectionName = Collections.AI_CHATS;

  async getUserSessions(userId: string, limit = 20): Promise<AIChatSession[]> {
    return this.findWhere('userId', '==', userId, limit, { field: 'updatedAt', direction: 'desc' });
  }

  async addMessage(sessionId: string, message: AIAssistantMessage): Promise<void> {
    const session = await this.findById(sessionId);
    if (!session) return;
    const messages = [...(session.messages ?? []), message];
    await this.update(sessionId, {
      messages,
      updatedAt: new Date().toISOString(),
    } as Partial<AIChatSession>);
  }

  async createSession(userId: string, title: string): Promise<string> {
    const now = new Date().toISOString();
    return this.create({
      userId,
      title,
      messages: [],
      createdAt: now,
      updatedAt: now,
    } as Omit<AIChatSession, 'id'>);
  }
}

export const aiChatRepository = new AIChatRepository();
