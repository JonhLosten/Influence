import { z } from 'zod';

export const NetworkIdSchema = z.enum(['instagram', 'facebook', 'tiktok', 'youtube']);
export type NetworkId = z.infer<typeof NetworkIdSchema>;
