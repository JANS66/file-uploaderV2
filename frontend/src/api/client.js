const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Default timeout: 10 seconds for standard requests
const DEFAULT_TIMEOUT_MS = 10000;

export async function apiFetch(endpoint, options = {}) {
  const {
    body,
    headers = {},
    timeout = DEFAULT_TIMEOUT_MS,
    ...customConfig
  } = options;

  // Setup AbortController for the timeout
  const controller = new AbortController();
  const timeoutId =
    timeout > 0 ? setTimeout(() => controller.abort(), timeout) : null;

  const config = {
    method: "GET",
    credentials: "include", // Sent by default on all requests
    ...customConfig,
    signal: controller.signal,
    headers: { ...headers },
  };

  if (body && !(body instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(body);
  } else if (body) {
    config.body = body;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    const contentType = response.headers.get("content-type");
    const data =
      contentType && contentType.includes("application/json")
        ? await response.json()
        : null;

    if (!response.ok) {
      const errorMessage = data?.message || "An unexpected error occurred.";
      throw new Error(errorMessage);
    }
    return data;
  } catch (error) {
    // Catch the abort event and turn it into a clear Timeout Error
    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeout / 1000} seconds.`, {
        cause: error,
      });
    }
    throw error;
  } finally {
    // Always clear the times so memory if freed immediately upon completion
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// Shortcut HTTP method helpers for cleaner usage
apiFetch.get = (endpoint, options) =>
  apiFetch(endpoint, { ...options, method: "GET" });
apiFetch.post = (endpoint, body, options) =>
  apiFetch(endpoint, { ...options, method: "POST", body });
apiFetch.put = (endpoint, body, options) =>
  apiFetch(endpoint, { ...options, method: "PUT", body });
apiFetch.delete = (endpoint, options) =>
  apiFetch(endpoint, { ...options, method: "DELETE" });
