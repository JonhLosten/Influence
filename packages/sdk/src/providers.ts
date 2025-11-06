import { ProviderIdSchema, type CreatePostPayload } from './ipc';
import { z } from 'zod';

export const PublishResultSchema = z.object({
  id: z.string(),
  url: z.string().url().optional(),
  publishedAt: z.date(),
});
export type PublishResult = z.infer<typeof PublishResultSchema>;

export const InsightsPointSchema = z.object({
  timestamp: z.date(),
  impressions: z.number().nonnegative(),
  clicks: z.number().nonnegative().optional(),
  engagements: z.number().nonnegative().optional(),
});
export type InsightsPoint = z.infer<typeof InsightsPointSchema>;

export const InsightsSchema = z.object({
  provider: ProviderIdSchema,
  profileId: z.string(),
  metrics: z.array(InsightsPointSchema),
});
export type Insights = z.infer<typeof InsightsSchema>;

export type RateLimitWindow = 'minute' | 'hour' | 'day';

export interface RateLimitConfig {
  window: RateLimitWindow;
  requests: number;
  burst?: number;
}

export interface AuthResult {
  provider: z.infer<typeof ProviderIdSchema>;
  profileId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface SocialProvider {
  readonly id: z.infer<typeof ProviderIdSchema>;
  readonly rateLimit: RateLimitConfig;
  authenticate(): Promise<AuthResult>;
  refreshToken?(profileId: string): Promise<void>;
  fetchProfiles(): Promise<AuthResult[]>;
  fetchInsights(params: { profileId: string; since?: Date; until?: Date }): Promise<Insights>;
  createPost(input: CreatePostPayload): Promise<PublishResult>;
  schedulePost?(input: CreatePostPayload, at: Date): Promise<string>;
  cancelScheduled?(id: string): Promise<void>;
}

export interface ProviderRegistryItem {
  provider: SocialProvider;
  enabled: boolean;
  featureFlag?: string;
}
