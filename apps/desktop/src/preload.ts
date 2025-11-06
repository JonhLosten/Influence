import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopBridge } from '@influence/sdk';
import { CreatePostSchema, FetchInsightsSchema, IpcChannels, type CreatePostPayload, type FetchInsightsPayload, type IpcResponse } from '@influence/sdk';

const secureInvoke = async <TInput, TResult>(channel: string, payload?: TInput): Promise<IpcResponse<TResult>> => {
  return ipcRenderer.invoke(channel, payload);
};

const api: DesktopBridge = {
  getVersion: () => secureInvoke(IpcChannels.APP_GET_VERSION),
  async createPost(input: CreatePostPayload) {
    const parsed = CreatePostSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'validation_error', message: parsed.error.message },
      };
    }
    return secureInvoke<typeof parsed.data, never>(IpcChannels.PROVIDER_CREATE_POST, parsed.data);
  },
  async fetchInsights(input: FetchInsightsPayload) {
    const parsed = FetchInsightsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: { code: 'validation_error', message: parsed.error.message },
      };
    }
    return secureInvoke<typeof parsed.data, never>(IpcChannels.PROVIDER_FETCH_INSIGHTS, parsed.data);
  },
};

contextBridge.exposeInMainWorld('influence', api);
