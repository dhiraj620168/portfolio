const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function getProjectsPageSettings() {
  const response = await fetch(`${API_BASE_URL}/projects-page-settings`);

  if (!response.ok) {
    throw new Error("Failed to load Projects page settings");
  }

  return response.json();
}

export async function updateProjectsPageSettings(settings) {
  const token = sessionStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Admin session missing. Please log in again.");
  }

  const response = await fetch(`${API_BASE_URL}/projects-page-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Failed to save Projects page settings");
  }

  return data;
}
