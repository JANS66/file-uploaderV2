const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(endpoint, options = {}) {
  const { body, headers = {}, ...customConfig } = options;

  const config = {
    method: "GET",
    credentials: "include", // Sent by default on all requests
    ...customConfig,
    headers: { ...headers },
  };

  if (body && !(body instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(body);
  } else if (body) {
    config.body = body;
  }

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
