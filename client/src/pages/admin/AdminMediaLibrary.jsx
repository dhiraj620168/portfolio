

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Upload,
  Copy,
  Check,
  Image as ImageIcon,
  FileText,
  File,
  ExternalLink,
  Trash2,
  X,
  LoaderCircle,
  FolderOpen,
  AlertCircle,
  CheckCircle2,
  HardDrive,
  CalendarDays,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

const BUCKET_FILTERS = [
  { value: "", label: "All storage" },
  { value: "projectImages", label: "Project images" },
  { value: "portfolioResumes", label: "Resume PDFs" },
  { value: "certificationFiles", label: "Certification files" },
];

const TYPE_FILTERS = [
  { value: "", label: "All file types" },
  { value: "image", label: "Images" },
  { value: "pdf", label: "PDFs" },
  { value: "other", label: "Other" },
];

function resolveMediaUrl(url) {
  if (!url) return "";
  try {
    return new URL(url, API_ORIGIN).toString();
  } catch {
    return url;
  }
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    date,
  );
}

export default function AdminMediaLibrary() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [bucketFilter, setBucketFilter] = useState("");
  const [uploadType, setUploadType] = useState("projectImages");
  const [uploading, setUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [previewItem, setPreviewItem] = useState(null);

  const apiRequest = useCallback(async (path, options = {}) => {
    const token = sessionStorage.getItem("adminToken");
    if (!token)
      throw new Error("Admin session not found. Please sign in again.");

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : options.body
            ? { "Content-Type": "application/json" }
            : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        response.status === 401
          ? "Session expired or invalid. Please sign in again."
          : "Admin access is required to manage media.",
      );
    }
    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Request failed. Please try again.");
    }
    return data;
  }, []);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      if (bucketFilter) params.set("bucket", bucketFilter);
      const query = params.toString();
      const result = await apiRequest(`/media${query ? `?${query}` : ""}`);
      setMedia(
        Array.isArray(result.media)
          ? result.media
          : Array.isArray(result.data)
            ? result.data
            : [],
      );
    } catch (requestError) {
      setError(requestError.message || "Could not load media library.");
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, [apiRequest, search, typeFilter, bucketFilter]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const counts = useMemo(
    () => ({
      total: media.length,
      images: media.filter((item) => item.type === "image").length,
      pdfs: media.filter((item) => item.type === "pdf").length,
      storage: media.reduce((total, item) => total + (item.size || 0), 0),
    }),
    [media],
  );

  const showNotice = (type, message) => setNotice({ type, message });

  const handleSearch = (event) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_UPLOAD_SIZE) {
      showNotice("error", "File exceeds the 5 MB upload limit.");
      return;
    }

    let endpoint = "";
    let fieldName = "";

    if (uploadType === "projectImages") {
      if (
        !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
          file.type,
        )
      ) {
        showNotice("error", "Project images must be JPG, PNG, WEBP, or GIF.");
        return;
      }
      endpoint = "/images/upload";
      fieldName = "image";
    } else if (uploadType === "portfolioResumes") {
      if (file.type !== "application/pdf") {
        showNotice("error", "Resume uploads must be PDF files.");
        return;
      }
      endpoint = "/resumes/upload";
      fieldName = "resume";
    } else {
      if (
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "application/pdf",
        ].includes(file.type)
      ) {
        showNotice(
          "error",
          "Certification files must be supported images or PDFs.",
        );
        return;
      }
      endpoint = "/certification-files/upload";
      fieldName = "file";
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append(fieldName, file);
      const result = await apiRequest(endpoint, {
        method: "POST",
        body: formData,
      });
      showNotice("success", result.message || "File uploaded successfully.");
      await fetchMedia();
    } catch (uploadError) {
      showNotice("error", uploadError.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = async (item) => {
    const url = resolveMediaUrl(item.url);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(`${item.bucket}:${item.id}`);
      showNotice("success", "Media URL copied to clipboard.");
      window.setTimeout(() => setCopiedKey(""), 1800);
    } catch {
      showNotice(
        "error",
        "Could not copy URL. Open the file and copy its address manually.",
      );
    }
  };

  const deleteMedia = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.name}" permanently? If the file is used by a project, profile, or certification, the server will block deletion.`,
    );
    if (!confirmed) return;

    const key = `${item.bucket}:${item.id}`;
    setDeletingKey(key);
    try {
      const result = await apiRequest(
        `/media/${encodeURIComponent(item.bucket)}/${encodeURIComponent(item.id)}`,
        { method: "DELETE" },
      );
      showNotice("success", result.message || "Media deleted.");
      setPreviewItem((current) =>
        current && current.id === item.id && current.bucket === item.bucket
          ? null
          : current,
      );
      await fetchMedia();
    } catch (deleteError) {
      showNotice("error", deleteError.message || "Could not delete media.");
    } finally {
      setDeletingKey("");
    }
  };

  const cardClass =
    "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950";
  const mutedText = "text-slate-500 dark:text-slate-400";
  const inputClass =
    "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900";

  return (
    <section className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <FolderOpen size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Media Library
            </h1>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Browse and manage uploaded portfolio files across existing
              storage.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchMedia}
          disabled={loading || uploading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {notice && (
        <div
          role={notice.type === "error" ? "alert" : "status"}
          className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${
            notice.type === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          <div className="flex items-start gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
            className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          <p className="font-semibold">Unable to load media</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={fetchMedia}
            className="mt-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Files shown", value: counts.total, icon: FolderOpen },
          { label: "Images", value: counts.images, icon: ImageIcon },
          { label: "PDF files", value: counts.pdfs, icon: FileText },
          {
            label: "Size shown",
            value: formatBytes(counts.storage),
            icon: HardDrive,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${cardClass} p-5`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm ${mutedText}`}>{stat.label}</p>
                <Icon size={19} className="text-blue-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className={`${cardClass} p-4 sm:p-5`}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <form onSubmit={handleSearch} className="flex gap-2">
            <label htmlFor="media-search" className="sr-only">
              Search media
            </label>
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="media-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                maxLength={100}
                placeholder="Search filename, category, or file type..."
                className={`${inputClass} w-full pl-9`}
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          <label className="flex items-center gap-2">
            <span className={`whitespace-nowrap text-sm ${mutedText}`}>
              Type
            </span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={inputClass}
            >
              {TYPE_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className={`whitespace-nowrap text-sm ${mutedText}`}>
              Storage
            </span>
            <select
              value={bucketFilter}
              onChange={(event) => setBucketFilter(event.target.value)}
              className={inputClass}
            >
              {BUCKET_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            All media
          </h2>
          <p className={`text-sm ${mutedText}`}>
            {media.length} file(s) match the current filters
          </p>
        </div>

        {loading ? (
          <div
            className={`flex min-h-56 items-center justify-center gap-3 ${mutedText}`}
          >
            <LoaderCircle size={24} className="animate-spin text-blue-600" />
            Loading media...
          </div>
        ) : media.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <FolderOpen size={32} className="text-slate-400" />
            <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">
              No media found
            </h3>
            <p className={`mt-1 max-w-md text-sm ${mutedText}`}>
              No files match the current filters, or no files have been uploaded
              to these GridFS buckets yet.
            </p>
            {(search || typeFilter || bucketFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setTypeFilter("");
                  setBucketFilter("");
                }}
                className="mt-3 text-sm font-semibold text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {media.map((item) => {
              const key = `${item.bucket}:${item.id}`;
              const isImage = item.type === "image";
              const url = resolveMediaUrl(item.url);
              return (
                <article
                  key={key}
                  className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800"
                    title={`Preview ${item.name}`}
                  >
                    {isImage ? (
                      <img
                        src={url}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    ) : item.type === "pdf" ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={48} className="text-red-500" />
                        <span className="text-xs font-semibold">
                          PDF DOCUMENT
                        </span>
                      </div>
                    ) : (
                      <File size={48} />
                    )}
                  </button>

                  <div className="space-y-3 p-4">
                    <div>
                      <h3
                        className="truncate font-semibold text-slate-900 dark:text-white"
                        title={item.name}
                      >
                        {item.name}
                      </h3>
                      <p className={`mt-1 text-xs ${mutedText}`}>
                        {Array.isArray(item.usage) && item.usage.length
                          ? item.usage.join(", ")
                          : item.category || item.bucketLabel || item.bucket}
                      </p>
                    </div>
                    <div
                      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${mutedText}`}
                    >
                      <span>{formatBytes(item.size)}</span>
                      <span>{item.contentType}</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} />
                        {formatDate(item.uploadDate)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        <ExternalLink size={14} /> Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => copyUrl(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        {copiedKey === key ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                        {copiedKey === key ? "Copied" : "Copy URL"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMedia(item)}
                        disabled={Boolean(deletingKey)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                      >
                        {deletingKey === key ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className={`${cardClass} p-5 sm:p-6`}>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Upload size={21} />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Upload media
            </h2>
            <p className={`mt-1 text-sm ${mutedText}`}>
              Uploads reuse your existing backend routes. Maximum file size is 5
              MB.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-end">
          <div>
            <label
              htmlFor="media-upload-type"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Destination
            </label>
            <select
              id="media-upload-type"
              value={uploadType}
              onChange={(event) => setUploadType(event.target.value)}
              disabled={uploading}
              className={`${inputClass} w-full`}
            >
              {BUCKET_FILTERS.filter((item) => item.value).map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="media-upload-file"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Choose file
            </label>
            <input
              id="media-upload-file"
              type="file"
              accept={
                uploadType === "portfolioResumes"
                  ? "application/pdf"
                  : uploadType === "projectImages"
                    ? "image/jpeg,image/png,image/webp,image/gif"
                    : "image/jpeg,image/png,image/webp,image/gif,application/pdf"
              }
              onChange={handleUpload}
              disabled={uploading}
              className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-white text-sm text-slate-700 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:font-semibold file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-slate-200"
            />
          </div>
        </div>

        {uploading && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <LoaderCircle size={17} className="animate-spin" /> Uploading
            file...
          </p>
        )}

        <p className={`mt-3 text-xs leading-5 ${mutedText}`}>
          Note: uploading a file stores it in the selected bucket; it does not
          automatically attach it to a project, profile, or certification.
        </p>
      </div>

      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewItem(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-preview-title"
            className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-950 sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="min-w-0">
                <h2
                  id="media-preview-title"
                  className="truncate font-bold text-slate-900 dark:text-white"
                >
                  {previewItem.name}
                </h2>
                <p className={`mt-1 text-xs ${mutedText}`}>
                  {Array.isArray(previewItem.usage) && previewItem.usage.length
                    ? previewItem.usage.join(", ")
                    : previewItem.category ||
                      previewItem.bucketLabel ||
                      previewItem.bucket}
                  {" · "}
                  {formatBytes(previewItem.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                aria-label="Close preview"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex min-h-72 items-center justify-center bg-slate-100 p-4 dark:bg-slate-900 sm:p-8">
              {previewItem.type === "image" ? (
                <img
                  src={resolveMediaUrl(previewItem.url)}
                  alt={previewItem.name}
                  className="max-h-[65vh] max-w-full object-contain"
                />
              ) : previewItem.type === "pdf" ? (
                <iframe
                  title={previewItem.name}
                  src={resolveMediaUrl(previewItem.url)}
                  className="h-[65vh] w-full rounded-xl bg-white"
                />
              ) : (
                <div className="text-center">
                  <File size={48} className="mx-auto text-slate-400" />
                  <p className={`mt-3 text-sm ${mutedText}`}>
                    Preview is not available for this file type.
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 p-4 sm:p-5">
              <button
                type="button"
                onClick={() => copyUrl(previewItem)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <Copy size={16} /> Copy URL
              </button>
              <a
                href={resolveMediaUrl(previewItem.url)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <ExternalLink size={16} /> Open file
              </a>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
