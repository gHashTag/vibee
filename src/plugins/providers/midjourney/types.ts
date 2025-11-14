export interface MidjourneyParams extends ProviderGenerationParams {
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  version?: 'v5' | 'v6' | 'niji';
  stylize?: number;
  chaos?: number;
  quality?: 0.25 | 0.5 | 1 | 2;
}
