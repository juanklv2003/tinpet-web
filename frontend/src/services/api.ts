const BASE = import.meta.env.VITE_API_URL ?? "http://192.168.1.134:3000";

type JsonRecord = Record<string, unknown>;

export interface ApiErrorInfo {
  status: number;
  method: string;
  path: string;
  message: string;
  code?: string;
  details?: unknown;
  requestId?: string;
  timestamp: string;
}

export class ApiClientError extends Error {
  readonly info: ApiErrorInfo;

  constructor(info: ApiErrorInfo) {
    super(info.message);
    this.name = "ApiClientError";
    this.info = info;
  }
}

const isDev = import.meta.env.DEV;

function logApiError(info: ApiErrorInfo, responseBody: unknown): void {
  if (!isDev) return;

  console.groupCollapsed(
    `[api] ${info.method} ${info.path} -> ${info.status} ${info.code ?? "UNSPECIFIED_ERROR"}`,
  );
  console.error("message:", info.message);
  console.error("requestId:", info.requestId ?? "n/a");
  console.error("details:", info.details ?? null);
  console.error("responseBody:", responseBody);
  console.groupEnd();
}

async function parseResponseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return res.json().catch(() => ({}));
  }

  const text = await res.text().catch(() => "");
  return text ? { raw: text } : {};
}

function buildApiErrorInfo(
  res: Response,
  path: string,
  method: string,
  responseBody: unknown,
): ApiErrorInfo {
  const body = responseBody as JsonRecord;

  const message =
    typeof body?.error === "string"
      ? body.error
      : typeof body?.message === "string"
        ? body.message
        : `HTTP ${res.status}`;

  const code = typeof body?.code === "string" ? body.code : undefined;
  const requestId = res.headers.get("x-request-id") ?? undefined;
  const details = body?.details;

  return {
    status: res.status,
    method,
    path,
    message,
    code,
    details,
    requestId,
    timestamp: new Date().toISOString(),
  };
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = localStorage.getItem("token");
  const method = options?.method?.toUpperCase() ?? "GET";

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch {
    const networkError: ApiErrorInfo = {
      status: 0,
      method,
      path,
      message: "No se pudo conectar con el servidor",
      code: "NETWORK_ERROR",
      timestamp: new Date().toISOString(),
    };
    logApiError(networkError, null);
    throw new ApiClientError(networkError);
  }

  if (!res.ok) {
    const responseBody = await parseResponseBody(res);
    const info = buildApiErrorInfo(res, path, method, responseBody);
    logApiError(info, responseBody);
    throw new ApiClientError(info);
  }

  // DELETE devuelve 204 sin body
  if (res.status === 204) return undefined as T;
  return res.json();
}
