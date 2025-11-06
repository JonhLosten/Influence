import type { CreatePostPayload, FetchInsightsPayload, IpcResponse } from './ipc';

export interface DesktopBridge {
  getVersion(): Promise<IpcResponse<string>>;
  createPost(input: CreatePostPayload): Promise<IpcResponse<never>>;
  fetchInsights(input: FetchInsightsPayload): Promise<IpcResponse<never>>;
}
