const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

if (!API_BASE_URL) {
  throw new Error("Missing VITE_API_BASE_URL in frontend/.env");
}

if (!SOCKET_URL) {
  throw new Error("Missing VITE_SOCKET_URL in frontend/.env");
}

export { API_BASE_URL, SOCKET_URL };
