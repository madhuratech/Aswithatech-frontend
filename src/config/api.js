const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "https://api.aswithatech.tech/api";

export default API_BASE_URL;
