/**
 * Service client — génération de séances d'entraînement IA (Cloud Functions).
 */
import { callFunction } from '../lib/firebaseFunctions';
import type {
  GenerateCollectiveRequest,
  GenerateIndividualRequest,
  TrainingPhase,
} from '../models/TrainingSession';

interface AiTrainingResponse {
  source: string;
  phases: TrainingPhase[];
  objective: string;
  duration_min: number;
  level: string;
}

export const aiTrainingService = {
  async generateCollective(
    params: GenerateCollectiveRequest,
  ): Promise<AiTrainingResponse> {
    return callFunction<GenerateCollectiveRequest, AiTrainingResponse>(
      'generateTrainingSession',
      params,
      'europe-west1',
    );
  },

  async generateIndividual(
    params: GenerateIndividualRequest,
  ): Promise<AiTrainingResponse> {
    return callFunction<GenerateIndividualRequest, AiTrainingResponse>(
      'generateHomeTraining',
      params,
      'europe-west1',
    );
  },
};
