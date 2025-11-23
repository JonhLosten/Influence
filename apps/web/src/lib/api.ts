const API_BASE_URL = "http://localhost:5174/api";

interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

async function handleApiResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody: ApiErrorResponse = await res.json();
    if (errorBody.code) {
      const error = new Error(errorBody.error);
      (error as any).code = errorBody.code;
      (error as any).details = errorBody.details;
      throw error;
    } else {
      throw new Error(errorBody.error || "An unknown API error occurred.");
    }
  }
  return res.json();
}

// Modified fetchSnapshot to include network parameter
export async function fetchNetworkSnapshot(network: string, days = 30) {
  const res = await fetch(`${API_BASE_URL}/networks/${network}?days=${days}`);
  return handleApiResponse(res);
}

export async function fetchOverview(days = 30) {
  const res = await fetch(`${API_BASE_URL}/overview?days=${days}`);
  return handleApiResponse(res);
}

export async function fetchAccountSuggestions(network: string, q: string) {
  const res = await fetch(`${API_BASE_URL}/suggest?network=${network}&q=${q}`);
  return handleApiResponse(res);
}

export async function searchYouTubeChannels(
  query: string
): Promise<{ results: any[] }> {
  const res = await fetch(
    `${API_BASE_URL}/youtube/search?q=${encodeURIComponent(query)}`
  );
  return handleApiResponse(res);
}

export async function createVideoPublishJob(
  payload: any
): Promise<{ message: string; jobId: string; status: any }> {
  const res = await fetch(`${API_BASE_URL}/publish/video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleApiResponse(res);
}

export async function getVideoPublishJobStatus(
  jobId: string
): Promise<{ job: any }> {
  const res = await fetch(`${API_BASE_URL}/publish/status/${jobId}`);
  return handleApiResponse(res);
}

export async function retryVideoPublishJob(
  jobId: string
): Promise<{ message: string; jobId: string; status: any }> {
  const res = await fetch(`${API_BASE_URL}/publish/retry/${jobId}`, {
    method: "POST",
  });
  return handleApiResponse(res);
}

export async function exportApplicationLogs(): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/logs/export`);
  if (!res.ok) {
    throw new Error(`Failed to fetch logs: ${res.statusText}`);
  }
  return res.blob();
}
