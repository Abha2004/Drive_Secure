const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

if (!API_BASE_URL) {
  console.error("Missing VITE_API_BASE_URL in environment! Make sure to add it in Render Environment Variables.");
}

if (!SOCKET_URL) {
  console.error("Missing VITE_SOCKET_URL in environment! Make sure to add it in Render Environment Variables.");
}

export { API_BASE_URL, SOCKET_URL };

