import { BaseRepository } from './BaseRepository';
import { AIInsight, IAIInsight } from '../models/AIInsight';

export class AIInsightRepository extends BaseRepository<IAIInsight> {
  constructor() {
    super(AIInsight);
  }

  async latestInsight(complaintId: string) {
    return this.findOne({ complaintId }, { lean: true });
  }

  async updatePrediction(complaintId: string, updates: Partial<IAIInsight>) {
    return this.model.findOneAndUpdate(
      { complaintId },
      { $set: updates },
      { new: true, upsert: true }
    ).exec();
  }

  async duplicateCandidates(duplicateReferenceId: string) {
    return this.findMany(
      { 'duplicateInformation.duplicateReferenceId': duplicateReferenceId, 'duplicateInformation.isDuplicate': true },
      { lean: true }
    );
  }
}
