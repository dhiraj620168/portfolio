// const API_BASE_URL =
//   import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// async function request(path, options = {}) {
//   const token = sessionStorage.getItem("adminToken");

//   const response = await fetch(`${API_BASE_URL}${path}`, {
//     ...options,
//     headers: {
//       ...(options.body ? { "Content-Type": "application/json" } : {}),
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       ...options.headers,
//     },
//   });

//   const data = await response.json();

//   if (!response.ok) {
//     throw new Error(data.message || "Request failed");
//   }

//   return data;
// }

// const api = {
//   get(path) {
//     return request(path);
//   },

//   post(path, body) {
//     return request(path, {
//       method: "POST",
//       body: JSON.stringify(body),
//     });
//   },

//   put(path, body) {
//     return request(path, {
//       method: "PUT",
//       body: JSON.stringify(body),
//     });
//   },

//   delete(path) {
//     return request(path, {
//       method: "DELETE",
//     });
//   },
// };

// export default api;

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Cache configuration
const CACHE_DURATION = 30 * 1000; // 30 seconds

const cache = new Map();
const pendingRequests = new Map();

function getToken() {
  return sessionStorage.getItem("adminToken");
}

function getCacheKey(path) {
  return path;
}

function invalidateCache(path = null) {
  if (!path) {
    cache.clear();
    return;
  }

  // Invalidate the requested resource and its related cache entries.
  const resource = path.split("?")[0];

  for (const key of cache.keys()) {
    if (
      key === resource ||
      key.startsWith(`${resource}/`) ||
      key.startsWith(`${resource}?`)
    ) {
      cache.delete(key);
    }
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function request(path, options = {}) {
  const token = getToken();
  const method = (options.method || "GET").toUpperCase();

  const isGet = method === "GET";
  const isPublicGet = isGet && !token;

  const cacheKey = getCacheKey(path);

  // Return valid cached public GET response.
  if (isPublicGet) {
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    if (cached) {
      cache.delete(cacheKey);
    }

    // Prevent duplicate simultaneous GET requests.
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }
  }

  const requestPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      const message =
        typeof data === "object" && data !== null
          ? data.message || data.error
          : data;

      throw new Error(
        message || `Request failed with status ${response.status}`,
      );
    }

    // Cache only successful public GET requests.
    if (isPublicGet) {
      cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    }

    // Clear related cache after successful mutations.
    if (!isGet) {
      invalidateCache();
    }

    return data;
  })();

  if (isPublicGet) {
    pendingRequests.set(cacheKey, requestPromise);
  }

  try {
    return await requestPromise;
  } finally {
    if (isPublicGet) {
      pendingRequests.delete(cacheKey);
    }
  }
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

  clearCache() {
    invalidateCache();
  },
};

export default api;
