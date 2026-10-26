import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Save,
  BriefcaseBusiness,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950";

const EMPTY_FORM = {
  company: "",
  institutionLogoUrl: "",
  role: "",
  experienceType: "",
  employmentType: "Full-time",
  location: "",
  startDate: "",
  endDate: "",
  currentlyWorking: false,
  description: "",
  tech: "",
  companyUrl: "",
  isVisible: true,

  // Category-specific fields
  details: {
    department: "",
    achievements: "",
    paidStatus: "",
    mentor: "",
    learningOutcomes: "",
    trainingProgram: "",
    trainer: "",
    certificateUrl: "",
    clientName: "",
    deliverables: "",
    projectUrl: "",
    contractType: "",
  },
};
const EXPERIENCE_TYPES = [
  { value: "working-professional", label: "Working Professional" },
  { value: "internship", label: "Internship" },
  { value: "industrial-training", label: "Industrial Training" },
  { value: "freelance", label: "Freelance" },
  { value: "contract", label: "Contract" },
];

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

export default function AdminExperience() {
  const [experiences, setExperiences] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadExperiences() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/experiences/admin");
      setExperiences(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load experiences.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExperiences();
  }, []);

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "currentlyWorking" && checked ? { endDate: "" } : {}),
    }));
  }
  function updateDetail(name, value) {
    setForm((previous) => ({
      ...previous,
      details: {
        ...previous.details,
        [name]: value,
      },
    }));
  }
  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setNotice("");
  }

  function editExperience(item) {
    setEditingId(item._id);
    setForm({
      company: item.company || "",
      institutionLogoUrl: item.institutionLogoUrl || "",
      role: item.role || "",
      experienceType: item.experienceType || "",
      employmentType: item.employmentType || "Full-time",
      location: item.location || "",
      startDate: item.startDate ? item.startDate.slice(0, 10) : "",
      endDate: item.endDate ? item.endDate.slice(0, 10) : "",
      currentlyWorking: Boolean(item.currentlyWorking),
      description: item.description || "",
      tech: Array.isArray(item.tech) ? item.tech.join(", ") : "",
      companyUrl: item.companyUrl || "",
      isVisible: item.isVisible !== false,
      details: {
        ...EMPTY_FORM.details,
        ...(item.details || {}),
      },
    });

    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (!form.experienceType) {
        throw new Error("Please select an experience category.");
      }

      const payload = {
        ...form,
        company: form.company.trim(),
        institutionLogoUrl: form.institutionLogoUrl.trim(),
        role: form.role.trim(),
        description: form.description.trim(),
        tech: form.tech
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        startDate: form.startDate,
        endDate: form.currentlyWorking || !form.endDate ? null : form.endDate,
        details: form.details,
      };

      delete payload.currentlyWorking;
      payload.currentlyWorking = form.currentlyWorking;

      const result = await apiRequest(
        editingId ? `/experiences/${editingId}` : "/experiences",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );

      setNotice(result.message || "Experience saved successfully.");
      resetForm();
      await loadExperiences();
    } catch (err) {
      setError(err.message || "Could not save experience.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExperience(item) {
    if (!window.confirm(`Delete "${item.role}" at "${item.company}"?`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const result = await apiRequest(`/experiences/${item._id}`, {
        method: "DELETE",
      });

      setNotice(result.message || "Experience deleted.");
      await loadExperiences();
    } catch (err) {
      setError(err.message || "Could not delete experience.");
    }
  }

  async function toggleVisibility(item) {
    setError("");
    setNotice("");

    try {
      await apiRequest(`/experiences/${item._id}`, {
        method: "PUT",
        body: JSON.stringify({ isVisible: item.isVisible === false }),
      });

      setNotice("Experience visibility updated.");
      await loadExperiences();
    } catch (err) {
      setError(err.message || "Could not update visibility.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
        <RefreshCw size={20} className="animate-spin" />
        Loading experiences...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 pb-12 text-slate-900 dark:text-white">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">
          Portfolio Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold">Experience Management</h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Add jobs, internships, training, freelance and contract experience.
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
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-8"
      >
        <h2 className="text-xl font-bold">
          {editingId ? "Edit Experience" : "Add Experience"}
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Experience category *
            </label>
            <select
              name="experienceType"
              value={form.experienceType}
              onChange={updateField}
              required
              className={inputClass}
            >
              <option value="">Select category</option>
              {EXPERIENCE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {form.experienceType === "working-professional" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Department
                  </label>
                  <input
                    className={inputClass}
                    value={form.details.department}
                    onChange={(e) => updateDetail("department", e.target.value)}
                    placeholder="e.g. Engineering"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Achievements
                  </label>
                  <textarea
                    className={inputClass}
                    value={form.details.achievements}
                    onChange={(e) =>
                      updateDetail("achievements", e.target.value)
                    }
                    placeholder="Key achievements"
                  />
                </div>
              </div>
            )}

            {form.experienceType === "internship" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Paid or unpaid
                  </label>
                  <select
                    className={inputClass}
                    value={form.details.paidStatus}
                    onChange={(e) => updateDetail("paidStatus", e.target.value)}
                  >
                    <option value="">Select status</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Mentor
                  </label>
                  <input
                    className={inputClass}
                    value={form.details.mentor}
                    onChange={(e) => updateDetail("mentor", e.target.value)}
                    placeholder="Mentor name"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">
                    Learning outcomes
                  </label>
                  <textarea
                    className={inputClass}
                    value={form.details.learningOutcomes}
                    onChange={(e) =>
                      updateDetail("learningOutcomes", e.target.value)
                    }
                    placeholder="What did you learn?"
                  />
                </div>
              </div>
            )}

            {form.experienceType === "industrial-training" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Training program
                  </label>
                  <input
                    className={inputClass}
                    value={form.details.trainingProgram}
                    onChange={(e) =>
                      updateDetail("trainingProgram", e.target.value)
                    }
                    placeholder="e.g. MERN Stack Training"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Trainer
                  </label>
                  <input
                    className={inputClass}
                    value={form.details.trainer}
                    onChange={(e) => updateDetail("trainer", e.target.value)}
                    placeholder="Trainer name"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">
                    Certificate URL
                  </label>
                  <input
                    type="url"
                    className={inputClass}
                    value={form.details.certificateUrl}
                    onChange={(e) =>
                      updateDetail("certificateUrl", e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}

            {form.experienceType === "freelance" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Client name
                  </label>
                  <input
                    className={inputClass}
                    value={form.details.clientName}
                    onChange={(e) => updateDetail("clientName", e.target.value)}
                    placeholder="Client or business name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Project URL
                  </label>
                  <input
                    type="url"
                    className={inputClass}
                    value={form.details.projectUrl}
                    onChange={(e) => updateDetail("projectUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">
                    Deliverables
                  </label>
                  <textarea
                    className={inputClass}
                    value={form.details.deliverables}
                    onChange={(e) =>
                      updateDetail("deliverables", e.target.value)
                    }
                    placeholder="What did you deliver to the client?"
                  />
                </div>
              </div>
            )}

            {form.experienceType === "contract" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Contract type
                  </label>
                  <select
                    className={inputClass}
                    value={form.details.contractType}
                    onChange={(e) =>
                      updateDetail("contractType", e.target.value)
                    }
                  >
                    <option value="">Select contract type</option>
                    <option value="Fixed-term">Fixed-term</option>
                    <option value="Project-based">Project-based</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Client name
                  </label>
                  <input
                    className={inputClass}
                    value={form.details.clientName}
                    onChange={(e) => updateDetail("clientName", e.target.value)}
                    placeholder="Client or company name"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">
                    Deliverables
                  </label>
                  <textarea
                    className={inputClass}
                    value={form.details.deliverables}
                    onChange={(e) =>
                      updateDetail("deliverables", e.target.value)
                    }
                    placeholder="Contract responsibilities and deliverables"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Role / Job title *
            </label>
            <input
              name="role"
              value={form.role}
              onChange={updateField}
              required
              maxLength={150}
              className={inputClass}
              placeholder="e.g. Software Developer"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Company / Organization *
            </label>
            <input
              name="company"
              value={form.company}
              onChange={updateField}
              required
              maxLength={150}
              className={inputClass}
              placeholder="Company or institute name"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold">
              Institute / Company Logo URL
            </label>
            <input
              type="url"
              name="institutionLogoUrl"
              value={form.institutionLogoUrl}
              onChange={updateField}
              className={inputClass}
              placeholder="https://example.com/logo.png"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Optional. Paste a publicly accessible image URL.
            </p>
            {form.institutionLogoUrl.trim() && (
              <div className="mt-3 flex items-center gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700">
                  <img
                    src={form.institutionLogoUrl.trim()}
                    alt="Institute or company logo preview"
                    className="h-full w-full object-contain"
                    onError={(event) => {
                      event.currentTarget.style.visibility = "hidden";
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Logo preview</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    This logo will appear on the experience card if the URL is
                    accessible.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Employment type
            </label>
            <select
              name="employmentType"
              value={form.employmentType}
              onChange={updateField}
              className={inputClass}
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Internship</option>
              <option>Training</option>
              <option>Freelance</option>
              <option>Contract</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Location</label>
            <input
              name="location"
              value={form.location}
              onChange={updateField}
              className={inputClass}
              placeholder="e.g. Patna, India / Remote"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Company website
            </label>
            <input
              type="url"
              name="companyUrl"
              value={form.companyUrl}
              onChange={updateField}
              className={inputClass}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Start date *
            </label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={updateField}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">End date</label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={updateField}
              disabled={form.currentlyWorking}
              className={inputClass}
            />
          </div>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            name="currentlyWorking"
            checked={form.currentlyWorking}
            onChange={updateField}
            className="h-4 w-4 accent-indigo-600"
          />
          I currently work / train here
        </label>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Responsibilities and achievements *
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={updateField}
            required
            rows={5}
            maxLength={3000}
            className={inputClass}
            placeholder="Describe your work, responsibilities, learning and achievements..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Technologies (comma-separated)
          </label>
          <input
            name="tech"
            value={form.tech}
            onChange={updateField}
            className={inputClass}
            placeholder="React, Node.js, MongoDB"
          />
        </div>

        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            name="isVisible"
            checked={form.isVisible}
            onChange={updateField}
            className="h-4 w-4 accent-indigo-600"
          />
          Show this experience on the public portfolio
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
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
                ? "Update Experience"
                : "Save Experience"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold dark:border-slate-700"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            Saved Experiences ({experiences.length})
          </h2>
          <button
            type="button"
            onClick={loadExperiences}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {experiences.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
            No experiences added yet.
          </div>
        ) : (
          experiences.map((item) => (
            <article
              key={item._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700">
                    {item.institutionLogoUrl ? (
                      <img
                        src={item.institutionLogoUrl}
                        alt={`${item.company} logo`}
                        className="h-full w-full object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <BriefcaseBusiness
                        size={25}
                        className="text-indigo-500"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold">{item.role}</h3>
                    <p className="text-sm text-slate-500">{item.company}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {EXPERIENCE_TYPES.find(
                        (type) => type.value === item.experienceType,
                      )?.label || item.experienceType}
                      {item.location ? ` · ${item.location}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.startDate?.slice(0, 10)} —{" "}
                      {item.currentlyWorking
                        ? "Present"
                        : item.endDate?.slice(0, 10) || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleVisibility(item)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700"
                  >
                    {item.isVisible === false ? "Show" : "Hide"}
                  </button>
                  <button
                    type="button"
                    onClick={() => editExperience(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteExperience(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-600"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
                {item.description}
              </p>
              {item.experienceType === "internship" &&
                item.details?.learningOutcomes && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Learning Outcomes
                    </h4>

                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {item.details.learningOutcomes}
                    </p>
                  </div>
                )}
              {item.tech?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.tech.map((technology) => (
                    <span
                      key={technology}
                      className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300"
                    >
                      {technology}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </main>
  );
}
