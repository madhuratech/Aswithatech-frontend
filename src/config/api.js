const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "https://api.aswithatech.tech/api";

// Auto-inject JWT token into all API fetch requests
// Call once at app startup to patch window.fetch
export function initAuthFetch() {
  const originalFetch = window.fetch;
  window.fetch = async function (input, init = {}) {
    const url = typeof input === "string" ? input : input.url;
    const isApiRequest =
      url.startsWith(API_BASE_URL) ||
      (typeof input === "string" && input.startsWith("/api"));

    if (isApiRequest && !url.endsWith("/auth/login")) {
      const token = localStorage.getItem("token");
      if (token) {
        init.headers = init.headers || {};
        if (init.headers instanceof Headers) {
          init.headers.set("Authorization", `Bearer ${token}`);
        } else {
          init.headers["Authorization"] = `Bearer ${token}`;
        }
      }
    }

    const response = await originalFetch.call(window, input, init);

    if (
      response.status === 401 &&
      isApiRequest &&
      !url.endsWith("/auth/login")
    ) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return response;
  };
}

export default API_BASE_URL;
