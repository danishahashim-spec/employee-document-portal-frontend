
const API_BASE = "http://localhost:8000/api/v1";

export async function api(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  // attach token kalau ada
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const isJson = res.headers
    .get("content-type")
    ?.includes("application/json");

  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    throw body;
  }

  return body;
}