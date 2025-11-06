import { z } from 'zod';

export const IpcChannels = {
  APP_GET_VERSION: 'app:get-version',
  PROVIDER_CREATE_POST: 'provider:create-post',
  PROVIDER_FETCH_INSIGHTS: 'provider:fetch-insights',
} as const;

export const ProviderIdSchema = z.enum([
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'x',
  'ayrshare',
]);

export const CreatePostSchema = z.object({
  provider: ProviderIdSchema,
  profileId: z.string(),
  text: z.string().min(1),
  mediaPaths: z.array(z.string()).optional(),
  scheduleAt: z.coerce.date().optional(),
});
export type CreatePostPayload = z.infer<typeof CreatePostSchema>;

export const FetchInsightsSchema = z.object({
  provider: ProviderIdSchema,
  profileId: z.string(),
  since: z.coerce.date().optional(),
  until: z.coerce.date().optional(),
});
export type FetchInsightsPayload = z.infer<typeof FetchInsightsSchema>;

export const IpcResponseSchema = z.object({
  ok: z.literal(true),
  data: z.unknown(),
}).or(
  z.object({
    ok: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      retriable: z.boolean().optional(),
    }),
  })
);
export type IpcResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; retriable?: boolean } };

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
