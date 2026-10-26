import { useEffect, useState } from "react";
import {
  Award,
  Pencil,
  Trash2,
  RefreshCw,
  Save,
  ExternalLink,
  Eye,
  EyeOff,
  CalendarDays,
  Link as LinkIcon,
  Hash,
  Building2,
  GraduationCap,
  Image as ImageIcon,
  Wrench,
  FileText,
  Upload,
  Download,
  X,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200";

const EMPTY_FORM = {
  title: "",
  issuer: "",
  issueDate: "",
  expiryDate: "",
  credentialId: "",
  credentialUrl: "",
  skills: "",
  imageUrl: "",
  certificateFileUrl: "",
  certificateFileType: "",
  description: "",
  isVisible: true,
  order: 0,
};

function resolveFileUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem("adminToken");
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(!isFormData && options.body
        ? { "Content-Type": "application/json" }
        : {}),
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

function formatDate(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function FieldValue({ label, value, icon: Icon }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {Icon && <Icon size={14} />}
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-slate-900 dark:text-slate-100">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function CertificateFileActions({ url, type, title = "Certificate" }) {
  if (!url) return null;
  const viewUrl = resolveFileUrl(url);
  const downloadUrl = `${viewUrl}${viewUrl.includes("?") ? "&" : "?"}mode=download`;
  const isImage = type === "image";
  const extension = isImage ? "jpg" : "pdf";

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <a
        href={viewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-slate-50 dark:border-slate-700 dark:text-indigo-300 dark:hover:bg-slate-800"
      >
        <Eye size={15} /> View {isImage ? "image" : "PDF"}
        <ExternalLink size={14} />
      </a>
      <a
        href={downloadUrl}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        download={`${(title || "certificate").replace(/[^a-z0-9-_]+/gi, "-")}.${extension}`}
      >
        <Download size={15} /> Download
      </a>
    </div>
  );
}

export default function AdminCertifications() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadCertifications() {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest("/certifications/admin");
      setItems(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || "Could not load certifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCertifications();
  }, []);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setSelectedFile(null);
    setError("");
    setNotice("");
  }

  function editCertification(item) {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      issuer: item.issuer || "",
      issueDate: item.issueDate ? item.issueDate.slice(0, 10) : "",
      expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : "",
      credentialId: item.credentialId || "",
      credentialUrl: item.credentialUrl || "",
      skills: Array.isArray(item.skills) ? item.skills.join(", ") : "",
      imageUrl: item.imageUrl || "",
      certificateFileUrl: item.certificateFileUrl || "",
      certificateFileType: item.certificateFileType || "",
      description: item.description || "",
      isVisible: item.isVisible !== false,
      order: item.order ?? 0,
    });
    setSelectedFile(null);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseFile(event) {
    const file = event.target.files?.[0] || null;
    setError("");
    setNotice("");
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setSelectedFile(null);
      event.target.value = "";
      setError("Select a JPG, PNG, WEBP, GIF or PDF file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSelectedFile(null);
      event.target.value = "";
      setError("File size must not exceed 5 MB.");
      return;
    }
    setSelectedFile(file);
  }

  async function uploadCertificateFile() {
    if (!selectedFile) {
      setError("Please choose an image or PDF first.");
      return;
    }

    setUploading(true);
    setError("");
    setNotice("");
    try {
      const body = new FormData();
      body.append("file", selectedFile);
      const result = await apiRequest("/certification-files/upload", {
        method: "POST",
        body,
      });

      if (!result.certificateFileUrl || !result.certificateFileType) {
        throw new Error(
          "Upload response did not include the file URL and type.",
        );
      }

      setForm((previous) => ({
        ...previous,
        certificateFileUrl: result.certificateFileUrl,
        certificateFileType: result.certificateFileType,
      }));
      setSelectedFile(null);
      setNotice("File uploaded. Save the certification to keep its reference.");
    } catch (err) {
      setError(err.message || "Could not upload certificate file.");
    } finally {
      setUploading(false);
    }
  }

  function removeUploadedFileFromForm() {
    setForm((previous) => ({
      ...previous,
      certificateFileUrl: "",
      certificateFileType: "",
    }));
    setSelectedFile(null);
    setNotice(
      "File removed from this form. Save changes to update the record.",
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (!form.title.trim() || !form.issuer.trim()) {
        throw new Error("Certificate title and issuer are required.");
      }
      if (selectedFile) {
        throw new Error(
          "Upload the selected file before saving the certification.",
        );
      }

      const order = Number(form.order);
      if (!Number.isInteger(order) || order < 0) {
        throw new Error("Display order must be a non-negative integer.");
      }

      const payload = {
        ...form,
        title: form.title.trim(),
        issuer: form.issuer.trim(),
        issueDate: form.issueDate || null,
        expiryDate: form.expiryDate || null,
        credentialId: form.credentialId.trim(),
        credentialUrl: form.credentialUrl.trim(),
        imageUrl: form.imageUrl.trim(),
        certificateFileUrl: form.certificateFileUrl,
        certificateFileType: form.certificateFileType,
        description: form.description.trim(),
        skills: form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        order,
      };

      const result = await apiRequest(
        editingId ? `/certifications/${editingId}` : "/certifications",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );

      setNotice(result.message || "Certification saved successfully.");
      resetForm();
      await loadCertifications();
    } catch (err) {
      setError(err.message || "Could not save certification.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCertification(item) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(`/certifications/${item._id}`, {
        method: "DELETE",
      });
      setNotice(result.message || "Certification deleted.");
      if (editingId === item._id) resetForm();
      await loadCertifications();
    } catch (err) {
      setError(err.message || "Could not delete certification.");
    }
  }

  async function toggleVisibility(item) {
    setError("");
    setNotice("");
    try {
      await apiRequest(`/certifications/${item._id}`, {
        method: "PUT",
        body: JSON.stringify({ isVisible: item.isVisible === false }),
      });
      setNotice("Certificate visibility updated.");
      await loadCertifications();
    } catch (err) {
      setError(err.message || "Could not update visibility.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
        <RefreshCw size={20} className="animate-spin" />
        Loading certifications...
      </div>
    );
  }

  const uploadedUrl = resolveFileUrl(form.certificateFileUrl);
  const uploadedIsImage = form.certificateFileType === "image";

  return (
    <main className="mx-auto max-w-6xl space-y-8 pb-12 text-slate-900 dark:text-white">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">
          Portfolio Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold">Certification Management</h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Manage certificates, upload image/PDF files, and provide view and
          download links.
        </p>
      </header>

      {(error || notice) && (
        <div
          role={error ? "alert" : "status"}
          className={`rounded-xl border p-4 text-sm ${
            error
              ? "border-rose-500/30 bg-rose-500/10 text-rose-600"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
          }`}
        >
          {error || notice}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-8"
      >
        <h2 className="text-xl font-bold">
          {editingId ? "Edit Certification" : "Add Certification"}
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Certificate Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={updateField}
              required
              maxLength={200}
              className={inputClass}
              placeholder="e.g. Python Programming"
            />
          </div>
          <div>
            <label className={labelClass}>Issuing Organization *</label>
            <input
              name="issuer"
              value={form.issuer}
              onChange={updateField}
              required
              maxLength={150}
              className={inputClass}
              placeholder="e.g. Coursera"
            />
          </div>
          <div>
            <label className={labelClass}>Issue Date</label>
            <input
              type="date"
              name="issueDate"
              value={form.issueDate}
              onChange={updateField}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Expiry Date</label>
            <input
              type="date"
              name="expiryDate"
              value={form.expiryDate}
              onChange={updateField}
              min={form.issueDate || undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Credential ID</label>
            <input
              name="credentialId"
              value={form.credentialId}
              onChange={updateField}
              maxLength={150}
              className={inputClass}
              placeholder="Certificate ID"
            />
          </div>
          <div>
            <label className={labelClass}>Display Order</label>
            <input
              type="number"
              name="order"
              value={form.order}
              onChange={updateField}
              min="0"
              step="1"
              required
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Credential Verification URL</label>
            <input
              type="url"
              name="credentialUrl"
              value={form.credentialUrl}
              onChange={updateField}
              className={inputClass}
              placeholder="https://..."
            />
          </div>

          <div className="sm:col-span-2 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <label className={labelClass}>
              Upload Certificate Image or PDF (max 5 MB)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.jpg,.jpeg,.png,.webp,.gif,.pdf"
              onChange={chooseFile}
              className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-700`}
            />
            <p className="mt-2 text-xs text-slate-500">
              Supported: JPG, PNG, WEBP, GIF and PDF. The file is uploaded to
              GridFS.
            </p>

            {selectedFile && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                <div className="min-w-0 text-sm">
                  <p className="break-all font-semibold">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={uploadCertificateFile}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {uploading ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  {uploading ? "Uploading..." : "Upload file"}
                </button>
              </div>
            )}

            {form.certificateFileUrl && (
              <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Uploaded{" "}
                  {form.certificateFileType === "pdf" ? "PDF" : "image"} is
                  ready
                </p>
                {uploadedIsImage ? (
                  <img
                    src={uploadedUrl}
                    alt="Uploaded certificate preview"
                    className="mt-3 max-h-72 rounded-lg border border-slate-200 object-contain dark:border-slate-700"
                  />
                ) : (
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <FileText size={16} /> PDF certificate uploaded
                  </p>
                )}
                <CertificateFileActions
                  url={form.certificateFileUrl}
                  type={form.certificateFileType}
                  title={form.title}
                />
                <button
                  type="button"
                  onClick={removeUploadedFileFromForm}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-500/30 px-3 py-2 text-sm font-semibold text-rose-600"
                >
                  <X size={15} /> Remove from form
                </button>
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>
              Legacy/Public Certificate URL (optional)
            </label>
            <input
              type="url"
              name="imageUrl"
              value={form.imageUrl}
              onChange={updateField}
              className={inputClass}
              placeholder="https://..."
            />
            <p className="mt-2 text-xs text-slate-500">
              Optional external URL for older records. For local files, use the
              upload control above.
            </p>
            {form.imageUrl && (
              <a
                href={resolveFileUrl(form.imageUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300"
              >
                Open external certificate URL <ExternalLink size={15} />
              </a>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Skills (comma-separated)</label>
            <input
              name="skills"
              value={form.skills}
              onChange={updateField}
              className={inputClass}
              placeholder="Python, React, MongoDB"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Certificate Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              rows={4}
              maxLength={1500}
              className={inputClass}
              placeholder="What did you learn or achieve?"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            name="isVisible"
            checked={form.isVisible}
            onChange={updateField}
            className="h-4 w-4 accent-indigo-600"
          />
          Show this certificate on the public portfolio
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            {saving
              ? "Saving..."
              : editingId
                ? "Update Certification"
                : "Save Certification"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving || uploading}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold dark:border-slate-700"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">
              Saved Certifications ({items.length})
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage saved details, file previews and downloads.
            </p>
          </div>
          <button
            type="button"
            onClick={loadCertifications}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
            No certifications added yet.
          </div>
        ) : (
          items.map((item) => {
            const uploadedFileUrl = item.certificateFileUrl;
            const legacyUrl = item.imageUrl;
            const uploadedFileIsImage = item.certificateFileType === "image";
            const legacyIsImage = /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(
              legacyUrl || "",
            );
            return (
              <article
                key={item._id}
                className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-500">
                      <Award size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.issuer}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.isVisible === false ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"}`}
                      >
                        {item.isVisible === false
                          ? "Hidden"
                          : "Visible on portfolio"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleVisibility(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700"
                    >
                      {item.isVisible === false ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}
                      {item.isVisible === false ? "Show" : "Hide"}
                    </button>
                    <button
                      type="button"
                      onClick={() => editCertification(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCertification(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-600"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <FieldValue
                    label="Certificate Title"
                    value={item.title}
                    icon={Award}
                  />
                  <FieldValue
                    label="Issuing Organization"
                    value={item.issuer}
                    icon={Building2}
                  />
                  <FieldValue
                    label="Issue Date"
                    value={formatDate(item.issueDate)}
                    icon={CalendarDays}
                  />
                  <FieldValue
                    label="Expiry Date"
                    value={formatDate(item.expiryDate)}
                    icon={CalendarDays}
                  />
                  <FieldValue
                    label="Credential ID"
                    value={item.credentialId}
                    icon={Hash}
                  />
                  <FieldValue
                    label="Display Order"
                    value={String(item.order ?? 0)}
                    icon={GraduationCap}
                  />
                  <FieldValue
                    label="Visibility"
                    value={item.isVisible === false ? "Hidden" : "Visible"}
                    icon={item.isVisible === false ? EyeOff : Eye}
                  />
                  <FieldValue
                    label="Certificate File"
                    value={uploadedFileUrl || legacyUrl}
                    icon={ImageIcon}
                  />
                  <FieldValue
                    label="Verification URL"
                    value={item.credentialUrl}
                    icon={LinkIcon}
                  />
                </div>

                {uploadedFileUrl && (
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <FileText size={16} /> Uploaded Certificate
                    </h4>
                    {uploadedFileIsImage ? (
                      <img
                        src={resolveFileUrl(uploadedFileUrl)}
                        alt={item.title}
                        className="max-h-96 max-w-full rounded-lg object-contain"
                      />
                    ) : (
                      <p className="text-sm text-slate-500">
                        PDF certificate is available to view or download.
                      </p>
                    )}
                    <CertificateFileActions
                      url={uploadedFileUrl}
                      type={item.certificateFileType}
                      title={item.title}
                    />
                  </div>
                )}

                {!uploadedFileUrl && legacyUrl && (
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <ImageIcon size={16} /> Existing Certificate URL
                    </h4>
                    {legacyIsImage && (
                      <img
                        src={resolveFileUrl(legacyUrl)}
                        alt={item.title}
                        className="max-h-96 max-w-full rounded-lg object-contain"
                      />
                    )}
                    <a
                      href={resolveFileUrl(legacyUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300"
                    >
                      Open existing certificate <ExternalLink size={15} />
                    </a>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <FileText size={16} /> Certificate Description
                    </h4>
                    <p className="whitespace-pre-line break-words text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {item.description || "No description provided."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Wrench size={16} /> Skills
                    </h4>
                    {item.skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {item.skills.map((skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="rounded-full bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No skills provided.
                      </p>
                    )}
                  </div>
                  {item.credentialUrl && (
                    <a
                      href={item.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      Verify Credential <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
