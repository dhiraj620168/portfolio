import { useCallback, useEffect, useState } from "react";
import {
  Save,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  Image as ImageIcon,
  FolderKanban,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";

import {
  getProjectsPageSettings,
  updateProjectsPageSettings,
} from "../../services/projectsPageSettingsService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DEFAULT_SETTINGS = {
  badgeText: "Ideas turned into applications",
  headingText: "My",
  highlightedText: "Projects",
  description:
    "A collection of my work in full-stack development, Python and AI. Each project represents a step in learning, experimenting and building practical solutions.",
  focusLabel: "Full Stack & AI",
};

const EMPTY_PROJECT = {
  title: "",
  category: "Software Development",
  description: "",
  tech: "",
  status: "In Progress",
  imageUrl: "",
  githubUrl: "",
  liveUrl: "",
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function isValidHttpUrl(value) {
  if (!value.trim()) return true;

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Supports both GridFS paths and existing external image URLs.
function resolveImageUrl(value) {
  if (!value) return "";

  const imageUrl = value.trim();

  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/api/images/")) {
    try {
      const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin;

      return `${apiOrigin}${imageUrl}`;
    } catch {
      return imageUrl;
    }
  }

  return imageUrl;
}

async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem("adminToken");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-500">
        <Icon size={22} />
      </div>

      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={500}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950"
      />
    </div>
  );
}

export default function AdminProjects() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [projects, setProjects] = useState([]);
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT);

  const [editingId, setEditingId] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [localImagePreview, setLocalImagePreview] = useState("");
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [projectSaving, setProjectSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const clearSelectedImage = useCallback(() => {
    setSelectedImage(null);

    setLocalImagePreview((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return "";
    });

    const input = document.getElementById("project-image-file");

    if (input) {
      input.value = "";
    }
  }, []);

  useEffect(() => {
    return () => {
      if (localImagePreview) {
        URL.revokeObjectURL(localImagePreview);
      }
    };
  }, [localImagePreview]);

  const loadData = useCallback(async () => {
    setInitialLoading(true);
    setError("");

    try {
      const [settingsResult, projectsResult] = await Promise.all([
        getProjectsPageSettings(),
        apiRequest("/projects"),
      ]);

      setSettings({
        ...DEFAULT_SETTINGS,
        ...settingsResult,
      });

      const list = Array.isArray(projectsResult)
        ? projectsResult
        : Array.isArray(projectsResult?.projects)
          ? projectsResult.projects
          : [];

      setProjects(list);
    } catch (err) {
      setError(err.message || "Failed to load Project Management.");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleSettingsChange(event) {
    const { name, value } = event.target;

    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setNotice("");
  }

  async function handleSettingsSave(event) {
    event.preventDefault();

    setSettingsSaving(true);
    setError("");
    setNotice("");

    try {
      const result = await updateProjectsPageSettings(settings);

      if (result.settings) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...result.settings,
        });
      }

      setNotice("Projects page content saved successfully.");
    } catch (err) {
      setError(err.message || "Could not save page content.");
    } finally {
      setSettingsSaving(false);
    }
  }

  function handleProjectChange(event) {
    const { name, value } = event.target;

    setProjectForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "imageUrl") {
      setImagePreviewError(false);
    }

    setError("");
    setNotice("");
  }

  function handleImageSelect(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setNotice("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, WEBP or GIF image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    setLocalImagePreview((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }

      return URL.createObjectURL(file);
    });

    setSelectedImage(file);
    setImagePreviewError(false);
  }

  async function handleImageUpload() {
    if (!selectedImage) {
      setError("Please select an image first.");
      return;
    }

    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      setError("Please log in to the admin dashboard again.");
      return;
    }

    setImageUploading(true);
    setError("");
    setNotice("");

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);

      const response = await fetch(`${API_BASE_URL}/images/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Image upload failed.");
      }

      if (!data.imageUrl) {
        throw new Error("Upload succeeded, but the image URL is missing.");
      }

      setProjectForm((previous) => ({
        ...previous,
        imageUrl: data.imageUrl,
      }));

      clearSelectedImage();
      setImagePreviewError(false);

      setNotice(
        "Image uploaded successfully. Save the project to keep its image reference.",
      );
    } catch (err) {
      setError(err.message || "Could not upload image.");
    } finally {
      setImageUploading(false);
    }
  }

  function startNewProject() {
    clearSelectedImage();
    setEditingId(null);
    setProjectForm({ ...EMPTY_PROJECT });
    setImagePreviewError(false);
    setError("");
    setNotice("");

    document
      .getElementById("project-editor")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function startEditProject(project) {
    clearSelectedImage();

    setEditingId(project._id || project.id);
    setImagePreviewError(false);

    setProjectForm({
      title: project.title || "",
      category: project.category || "Software Development",
      description: project.description || "",
      tech: Array.isArray(project.tech)
        ? project.tech.join(", ")
        : project.tech || "",
      status: project.status || "In Progress",
      imageUrl:
        project.imageUrl ||
        project.image ||
        project.thumbnailUrl ||
        project.coverImage ||
        "",
      githubUrl: project.githubUrl || "",
      liveUrl: project.liveUrl || project.demoUrl || project.liveDemoUrl || "",
    });

    setError("");
    setNotice("");

    document
      .getElementById("project-editor")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleProjectSave(event) {
    event.preventDefault();

    setProjectSaving(true);
    setError("");
    setNotice("");

    const payload = {
      title: projectForm.title.trim(),
      category: projectForm.category.trim() || "Software Development",
      description: projectForm.description.trim(),
      tech: projectForm.tech
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      status: projectForm.status,
      imageUrl: projectForm.imageUrl.trim(),
      githubUrl: projectForm.githubUrl.trim(),
      liveUrl: projectForm.liveUrl.trim(),
    };

    try {
      const isGridFSImage = payload.imageUrl.startsWith("/api/images/");

      if (!isGridFSImage && !isValidHttpUrl(payload.imageUrl)) {
        throw new Error(
          "Enter a valid image URL or upload an image from your computer.",
        );
      }

      if (
        payload.imageUrl &&
        !/^https?:\/\//i.test(payload.imageUrl) &&
        !payload.imageUrl.startsWith("/api/images/")
      ) {
        throw new Error("Relative image paths must start with /api/images/.");
      }

      if (editingId) {
        await apiRequest(`/projects/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setNotice("Project updated successfully.");
      } else {
        await apiRequest("/projects", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setNotice("Project added successfully.");
      }

      clearSelectedImage();
      setProjectForm({ ...EMPTY_PROJECT });
      setEditingId(null);

      await loadData();
    } catch (err) {
      setError(err.message || "Could not save project.");
    } finally {
      setProjectSaving(false);
    }
  }

  async function handleDeleteProject(project) {
    const id = project._id || project.id;

    if (!id) {
      setError("This project has no valid ID.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${project.title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/projects/${id}`, {
        method: "DELETE",
      });

      if (editingId === id) {
        clearSelectedImage();
        setEditingId(null);
        setProjectForm({ ...EMPTY_PROJECT });
      }

      setProjects((previous) =>
        previous.filter((item) => (item._id || item.id) !== id),
      );

      setNotice("Project deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete project.");
    } finally {
      setDeletingId(null);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
        <RefreshCw size={20} className="animate-spin" />
        Loading Project Management...
      </div>
    );
  }

  const imagePreviewUrl = localImagePreview
    ? localImagePreview
    : resolveImageUrl(projectForm.imageUrl);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">
            Portfolio Admin
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Project Management
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            Control your public Projects page and manage every project from this
            single dashboard.
          </p>
        </div>

        <a
          href="/projects"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold transition hover:border-indigo-400 dark:border-slate-700"
        >
          <Eye size={17} />
          Preview public page
          <ExternalLink size={15} />
        </a>
      </header>

      {(error || notice) && (
        <div
          role={error ? "alert" : "status"}
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            error
              ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {error ? (
            <AlertCircle size={20} className="shrink-0" />
          ) : (
            <CheckCircle2 size={20} className="shrink-0" />
          )}
          <span>{error || notice}</span>
        </div>
      )}

      {/* PUBLIC PROJECTS PAGE CONTENT */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <SectionHeading
          icon={FileText}
          title="Projects Page Content"
          description="Edit the hero text displayed above the public project cards."
        />

        <form onSubmit={handleSettingsSave} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Badge Text"
              name="badgeText"
              value={settings.badgeText}
              onChange={handleSettingsChange}
              placeholder="Ideas turned into applications"
              required
            />
            <Field
              label="Main Heading"
              name="headingText"
              value={settings.headingText}
              onChange={handleSettingsChange}
              placeholder="My"
              required
            />
            <Field
              label="Highlighted Heading"
              name="highlightedText"
              value={settings.highlightedText}
              onChange={handleSettingsChange}
              placeholder="Projects"
              required
            />
            <Field
              label="Focus Label"
              name="focusLabel"
              value={settings.focusLabel}
              onChange={handleSettingsChange}
              placeholder="Full Stack & AI"
              required
            />
          </div>

          <div>
            <label
              htmlFor="page-description"
              className="mb-2 block text-sm font-semibold"
            >
              Page Description
            </label>
            <textarea
              id="page-description"
              name="description"
              value={settings.description}
              onChange={handleSettingsChange}
              rows={4}
              maxLength={2000}
              required
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950"
            />
            <p className="mt-1 text-right text-xs text-slate-500">
              {settings.description.length}/2000 characters
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              Saved content will be used by the public Projects page.
            </p>
            <button
              type="submit"
              disabled={settingsSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {settingsSaving ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {settingsSaving ? "Saving..." : "Save Page Content"}
            </button>
          </div>
        </form>
      </section>

      {/* PROJECT CRUD */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeading
            icon={FolderKanban}
            title="Manage Projects"
            description={`${projects.length} ${
              projects.length === 1 ? "project" : "projects"
            } currently loaded.`}
          />

          <button
            type="button"
            onClick={startNewProject}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            <Plus size={18} />
            Add Project
          </button>
        </div>

        <div
          id="project-editor"
          className="mb-8 scroll-mt-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] p-5 sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold">
              {editingId ? "Edit Project" : "Add New Project"}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={startNewProject}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X size={16} />
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleProjectSave} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Project Title"
                name="title"
                value={projectForm.title}
                onChange={handleProjectChange}
                placeholder="InterviewIQ"
                required
              />

              <Field
                label="Category"
                name="category"
                value={projectForm.category}
                onChange={handleProjectChange}
                placeholder="AI / Full Stack"
                required
              />

              <div>
                <label
                  htmlFor="project-status"
                  className="mb-2 block text-sm font-semibold"
                >
                  Status
                </label>
                <select
                  id="project-status"
                  name="status"
                  value={projectForm.status}
                  onChange={handleProjectChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Live</option>
                  <option>Planned</option>
                </select>
              </div>

              <Field
                label="Technologies (comma-separated)"
                name="tech"
                value={projectForm.tech}
                onChange={handleProjectChange}
                placeholder="React, Node.js, MongoDB"
              />

              <Field
                label="Project Image URL (optional)"
                name="imageUrl"
                value={projectForm.imageUrl}
                onChange={handleProjectChange}
                placeholder="https://example.com/image.jpg or upload below"
              />

              <Field
                label="GitHub URL"
                name="githubUrl"
                value={projectForm.githubUrl}
                onChange={handleProjectChange}
                placeholder="https://github.com/username/repository"
              />

              <div className="md:col-span-2">
                <Field
                  label="Live Demo URL"
                  name="liveUrl"
                  value={projectForm.liveUrl}
                  onChange={handleProjectChange}
                  placeholder="https://your-project.example.com"
                />
              </div>
            </div>

            {/* PROJECT DESCRIPTION */}
            <div>
              <label
                htmlFor="project-description"
                className="mb-2 block text-sm font-semibold"
              >
                Project Description
              </label>

              <textarea
                id="project-description"
                name="description"
                value={projectForm.description}
                onChange={handleProjectChange}
                rows={4}
                maxLength={5000}
                required
                placeholder="Describe your project, its features, and the problem it solves..."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-7 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            {/* IMAGE UPLOAD */}
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <label
                htmlFor="project-image-file"
                className="mb-2 block text-sm font-semibold"
              >
                Upload Image from Computer
              </label>

              <input
                id="project-image-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
                className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:font-semibold file:text-white"
              />

              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG, WEBP or GIF. Maximum file size: 5 MB.
              </p>

              {selectedImage && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm">
                    Selected: <strong>{selectedImage.name}</strong>
                  </p>

                  {localImagePreview && (
                    <img
                      src={localImagePreview}
                      alt="Selected project preview"
                      className="max-h-64 w-full rounded-lg bg-slate-100 object-contain dark:bg-slate-800"
                    />
                  )}

                  <button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={imageUploading}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {imageUploading ? (
                      <RefreshCw size={17} className="animate-spin" />
                    ) : (
                      <ImageIcon size={17} />
                    )}
                    {imageUploading ? "Uploading Image..." : "Upload Image"}
                  </button>
                </div>
              )}
            </div>

            {/* IMAGE PREVIEW */}
            {projectForm.imageUrl.trim() && (
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <ImageIcon size={17} />
                  Image Preview
                </p>

                {imagePreviewUrl &&
                (isValidHttpUrl(projectForm.imageUrl.trim()) ||
                  projectForm.imageUrl.trim().startsWith("/api/images/")) ? (
                  <img
                    key={imagePreviewUrl}
                    src={imagePreviewUrl}
                    alt="Project preview"
                    className="max-h-64 w-full rounded-lg bg-slate-100 object-contain dark:bg-slate-800"
                    onError={() => setImagePreviewError(true)}
                    onLoad={() => setImagePreviewError(false)}
                    style={{
                      display: imagePreviewError ? "none" : "block",
                    }}
                  />
                ) : null}

                {imagePreviewError && (
                  <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-rose-300 bg-rose-500/5 px-4 py-6 text-center text-sm text-rose-600 dark:border-rose-500/30 dark:text-rose-300">
                    <AlertCircle size={24} />
                    <span className="font-semibold">
                      Image could not be loaded
                    </span>
                    <span className="text-xs">
                      Check the image URL and backend connection.
                    </span>
                    <button
                      type="button"
                      onClick={() => setImagePreviewError(false)}
                      className="mt-2 rounded-lg border border-current px-3 py-1.5 text-xs font-semibold"
                    >
                      Retry Preview
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <button
                type="submit"
                disabled={projectSaving || imageUploading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {projectSaving ? (
                  <RefreshCw size={17} className="animate-spin" />
                ) : editingId ? (
                  <Save size={17} />
                ) : (
                  <Plus size={17} />
                )}

                {projectSaving
                  ? "Saving..."
                  : editingId
                    ? "Update Project"
                    : "Create Project"}
              </button>

              <button
                type="button"
                onClick={startNewProject}
                disabled={projectSaving || imageUploading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold transition hover:border-indigo-400 disabled:opacity-50 dark:border-slate-700"
              >
                <X size={17} />
                Clear Form
              </button>
            </div>
          </form>
        </div>

        {/* EXISTING PROJECTS */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-bold">Existing Projects</h3>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
            <FolderKanban size={32} className="mx-auto text-slate-400" />
            <h3 className="mt-4 font-semibold">No projects found</h3>
            <p className="mt-2 text-sm text-slate-500">
              Use the form above to add your first project.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const id = project._id || project.id;
              const image =
                project.imageUrl ||
                project.image ||
                project.thumbnailUrl ||
                project.coverImage;

              return (
                <article
                  key={id || project.title}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center"
                >
                  <div className="flex h-20 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 sm:w-28">
                    {image ? (
                      <img
                        src={resolveImageUrl(image)}
                        alt={project.title || "Project"}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <ImageIcon size={25} className="text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold">
                        {project.title || "Untitled Project"}
                      </h4>
                      <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
                        {project.status || "In Progress"}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {project.category || "Software Development"}
                    </p>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {project.description}
                    </p>

                    {Array.isArray(project.tech) && (
                      <p className="mt-2 text-xs text-slate-500">
                        {project.tech.join(" · ")}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open GitHub"
                        aria-label={`Open GitHub for ${project.title}`}
                        className="rounded-lg border border-slate-200 p-2.5 transition hover:border-indigo-400 dark:border-slate-700"
                      >
                        <span className="text-xs font-bold">GH</span>
                      </a>
                    )}

                    {(project.liveUrl || project.demoUrl) && (
                      <a
                        href={project.liveUrl || project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open live demo"
                        aria-label={`Open demo for ${project.title}`}
                        className="rounded-lg border border-slate-200 p-2.5 transition hover:border-indigo-400 dark:border-slate-700"
                      >
                        <ExternalLink size={17} />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => startEditProject(project)}
                      title="Edit project"
                      aria-label={`Edit ${project.title}`}
                      className="rounded-lg border border-slate-200 p-2.5 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-700"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProject(project)}
                      disabled={deletingId === id}
                      title="Delete project"
                      aria-label={`Delete ${project.title}`}
                      className="rounded-lg border border-rose-500/20 p-2.5 text-rose-500 transition hover:bg-rose-500/10 disabled:opacity-50"
                    >
                      {deletingId === id ? (
                        <RefreshCw size={17} className="animate-spin" />
                      ) : (
                        <Trash2 size={17} />
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
