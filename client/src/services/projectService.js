const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function getProjects() {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.status}`);
  }

  return response.json();
}
