import { useEffect, useState } from "react";
import {
  Save,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  getProjectsPageSettings,
  updateProjectsPageSettings,
} from "../../services/projectsPageSettingsService";

const initialForm = {
  badgeText: "",
  headingText: "",
  highlightedText: "",
  description: "",
  focusLabel: "",
};

const fields = [
  {
    name: "badgeText",
    label: "Badge Text",
    placeholder: "Ideas turned into applications",
  },
  {
    name: "headingText",
    label: "Main Heading",
    placeholder: "My",
  },
  {
    name: "highlightedText",
    label: "Highlighted Heading",
    placeholder: "Projects",
  },
  {
    name: "focusLabel",
    label: "Focus Label",
    placeholder: "Full Stack & AI",
  },
];

export default function AdminProjectsPageSettings() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadSettings() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await getProjectsPageSettings();

      setForm({
        badgeText: data.badgeText ?? "",
        headingText: data.headingText ?? "",
        highlightedText: data.highlightedText ?? "",
        description: data.description ?? "",
        focusLabel: data.focusLabel ?? "",
      });
    } catch (err) {
      setError(err.message || "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateProjectsPageSettings(form);

      if (result.settings) {
        setForm({
          badgeText: result.settings.badgeText ?? "",
          headingText: result.settings.headingText ?? "",
          highlightedText: result.settings.highlightedText ?? "",
          description: result.settings.description ?? "",
          focusLabel: result.settings.focusLabel ?? "",
        });
      }

      setSuccess("Projects page settings saved successfully!");
    } catch (err) {
      setError(err.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950 sm:p-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
            <RefreshCw className="animate-spin" size={20} />
            Loading Projects page settings...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              ADMIN PANEL / PAGE CONTENT
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Edit Projects Page
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Update the heading, badge, description and focus label shown on
              your public Projects page.
            </p>
          </div>

          <a
            href="/projects"
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-900"
          >
            Preview page <ArrowUpRight size={16} />
          </a>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300"
          >
            <AlertCircle size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300"
          >
            <CheckCircle2 size={20} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="space-y-6 p-5 sm:p-8">
            {fields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm font-semibold"
                >
                  {field.label}
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  required
                  maxLength={160}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            ))}

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold"
              >
                Page Description
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the projects displayed in your portfolio..."
                rows={5}
                maxLength={2000}
                required
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950"
              />

              <p className="mt-2 text-right text-xs text-slate-500">
                {form.description.length}/2000 characters
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50 sm:flex-row sm:justify-between sm:px-8">
            <button
              type="button"
              onClick={loadSettings}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold transition hover:border-indigo-400 disabled:opacity-50 dark:border-slate-700"
            >
              <RefreshCw size={16} />
              Reload saved settings
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-sm leading-6 text-slate-500">
          Saved settings are stored in MongoDB. After saving, open the public
          Projects page to verify your changes.
        </p>
      </div>
    </main>
  );
}
