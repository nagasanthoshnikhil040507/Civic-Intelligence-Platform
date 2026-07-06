import { BaseService } from './BaseService';
import { AIInsightRepository } from '../database/repositories/AIInsightRepository';
import { IAIInsight } from '../database/models/AIInsight';
import { ClientSession } from 'mongoose';

export class AIInsightService extends BaseService<IAIInsight, AIInsightRepository> {
  constructor(repository: AIInsightRepository) {
    super(repository);
  }

  async savePrediction(data: Partial<IAIInsight>, session?: ClientSession) {
    return this.create(data, session);
  }

  async updatePrediction(complaintId: string, updates: Partial<IAIInsight>) {
    return this.repository.updatePrediction(complaintId, updates);
  }

  async attachInsightToComplaint(insightData: Partial<IAIInsight>, session?: ClientSession) {
    return this.create(insightData, session);
  }

  async retrieveLatestPrediction(complaintId: string) {
    return this.repository.latestInsight(complaintId);
  }
}
