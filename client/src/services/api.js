const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const token = sessionStorage.getItem("adminToken");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

const api = {
  get(path) {
    return request(path);
  },

  post(path, body) {
    return request(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put(path, body) {
    return request(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete(path) {
    return request(path, {
      method: "DELETE",
    });
  },
};

export default api;
