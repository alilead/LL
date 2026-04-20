export const featureFlags = {
  navigation: {
    showEmail: false,
    showEmailSequences: false,
    showForecasting: false,
    showDataImport: false,
    showMindMapping: true,
  },
} as const;

export type FeatureFlags = typeof featureFlags;
