import { useEffect, useState } from "react";
import {
  FileText,
  Upload,
  Download,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950";

function resolveFileUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

export default function AdminResume() {
  const [resumeUrl, setResumeUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadResume() {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const token = sessionStorage.getItem("adminToken");
      if (!token)
        throw new Error("Please log in to the admin dashboard again.");

      const response = await fetch(`${API_BASE_URL}/profile/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await readResponse(response);
      setResumeUrl(data.resumeUrl || "");
    } catch (err) {
      setError(err.message || "Could not load the resume.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResume();
  }, []);

  async function uploadResume(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (
      file.type !== "application/pdf" ||
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a PDF file.");
      input.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Resume must be 5 MB or smaller.");
      input.value = "";
      return;
    }

    const token = sessionStorage.getItem("adminToken");
    if (!token) {
      setError("Please log in to the admin dashboard again.");
      input.value = "";
      return;
    }

    setUploading(true);
    setError("");
    setNotice("");

    try {
      // Upload PDF to the existing GridFS endpoint.
      const formData = new FormData();
      formData.append("resume", file);

      const uploadResponse = await fetch(`${API_BASE_URL}/resumes/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const uploaded = await readResponse(uploadResponse);

      if (!uploaded.success || !uploaded.resumeUrl) {
        throw new Error(uploaded.message || "Resume upload failed.");
      }

      // Save only resumeUrl so other profile fields are not overwritten.
      const saveResponse = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeUrl: uploaded.resumeUrl }),
      });

      const saved = await readResponse(saveResponse);

      if (!saved.success) {
        throw new Error("Upload completed, but saving the resume URL failed.");
      }

      setResumeUrl(saved.profile?.resumeUrl || uploaded.resumeUrl);
      setNotice("Resume uploaded and saved successfully.");
    } catch (err) {
      setError(
        err.message ||
          "Could not save the resume. Reload and check its status.",
      );
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  const fileUrl = resolveFileUrl(resumeUrl);
  const downloadUrl = resumeUrl
    ? `${fileUrl}${fileUrl.includes("?") ? "&" : "?"}mode=download`
    : "";

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
        <RefreshCw size={20} className="animate-spin" />
        Loading Resume Management...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 pb-12 text-slate-900 dark:text-white">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">
          Portfolio Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Resume Management
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
          Upload, preview, download, or replace your current resume. Changes are
          saved automatically.
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
          {notice && !error && (
            <CheckCircle2 size={17} className="mr-2 inline" />
          )}
          {error || notice}
        </div>
      )}

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <FileText size={22} className="text-indigo-500" />
          Current Resume
        </h2>

        {resumeUrl ? (
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="font-semibold">Resume is configured</p>
            <p className="mt-2 break-all text-xs text-slate-500 dark:text-slate-400">
              {resumeUrl}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                <ExternalLink size={16} />
                Preview PDF
              </a>

              <a
                href={downloadUrl}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
              >
                <Download size={16} />
                Download PDF
              </a>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">
            No resume URL is saved yet. Upload a PDF below.
          </p>
        )}

        <div className="space-y-3">
          <label htmlFor="resumeUpload" className="block text-sm font-semibold">
            {resumeUrl ? "Replace current resume" : "Upload your resume"}
          </label>

          <input
            id="resumeUpload"
            type="file"
            accept=".pdf,application/pdf"
            onChange={uploadResume}
            disabled={uploading}
            className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:font-semibold file:text-white`}
          />

          <p className="text-xs text-slate-500 dark:text-slate-400">
            PDF only. Maximum file size: 5 MB.
          </p>

          {uploading && (
            <p className="flex items-center gap-2 text-sm text-indigo-500">
              <RefreshCw size={16} className="animate-spin" />
              Uploading and saving resume...
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={loadResume}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold disabled:opacity-60 dark:border-slate-700"
        >
          <RefreshCw size={17} />
          Reload Saved Resume
        </button>
      </section>
    </main>
  );
}
