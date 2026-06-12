const DEFAULT_API_ORIGIN = "/api";

function stripTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  // const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const configuredUrl = "https://dhara-rag-2.onrender.com" ;
  const normalizedBase = configuredUrl
    ? stripTrailingSlashes(configuredUrl)
    : DEFAULT_API_ORIGIN;

  return normalizedBase.endsWith("/api")
    ? normalizedBase
    : `${normalizedBase}/api`;
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
