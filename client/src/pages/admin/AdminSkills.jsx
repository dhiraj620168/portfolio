import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Code2,
  Star,
  Eye,
  EyeOff,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";

const EMPTY_FORM = {
  name: "",
  category: "Frontend",
  proficiency: 70,
  experience: 0,
  description: "",
  icon: "",
  isFeatured: false,
  isVisible: true,
  order: 0,
};

const CATEGORIES = [
  "Frontend",
  "Backend",
  "Database",
  "Programming Languages",
  "AI & Machine Learning",
  "Tools & Platforms",
  "Other",
];

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-indigo-950";

const labelClass =
  "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

export default function AdminSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [visibilityFilter, setVisibilityFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/skills/admin");
      setSkills(response.data || []);
    } catch (err) {
      setError(err.message || "Failed to load skills.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : ["proficiency", "experience", "order"].includes(name)
            ? value === ""
              ? ""
              : Number(value)
            : value,
    }));
  };

  const openCreateModal = () => {
    setEditingSkill(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const openEditModal = (skill) => {
    setEditingSkill(skill);
    setForm({
      name: skill.name || "",
      category: skill.category || "Other",
      proficiency: skill.proficiency ?? 70,
      experience: skill.experience ?? 0,
      description: skill.description || "",
      icon: skill.icon || "",
      isFeatured: Boolean(skill.isFeatured),
      isVisible: skill.isVisible !== false,
      order: skill.order ?? 0,
    });
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingSkill(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const name = form.name.trim();
    const category = form.category.trim();
    const proficiency = Number(form.proficiency);
    const experience = Number(form.experience);
    const order = Number(form.order);

    if (!name || !category) {
      setError("Skill name and category are required.");
      return;
    }

    if (name.length > 60 || category.length > 50) {
      setError("Name must be at most 60 characters and category 50.");
      return;
    }

    if (
      form.proficiency === "" ||
      !Number.isFinite(proficiency) ||
      proficiency < 0 ||
      proficiency > 100
    ) {
      setError("Proficiency must be between 0 and 100.");
      return;
    }

    if (
      form.experience === "" ||
      !Number.isFinite(experience) ||
      experience < 0
    ) {
      setError("Experience must be zero or greater.");
      return;
    }

    if (form.order === "" || !Number.isFinite(order)) {
      setError("Display order must be a valid number.");
      return;
    }

    if (form.description.length > 500) {
      setError("Description cannot exceed 500 characters.");
      return;
    }

    const payload = {
      name,
      category,
      proficiency,
      experience,
      description: form.description.trim(),
      icon: form.icon.trim(),
      isFeatured: form.isFeatured,
      isVisible: form.isVisible,
      order,
    };

    setSaving(true);

    try {
      if (editingSkill) {
        await api.put(`/skills/${editingSkill._id}`, payload);
        setNotice("Skill updated successfully.");
      } else {
        await api.post("/skills", payload);
        setNotice("Skill created successfully.");
      }

      setModalOpen(false);
      setEditingSkill(null);
      setForm({ ...EMPTY_FORM });
      await loadSkills();
    } catch (err) {
      setError(err.message || "Failed to save skill.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (skill) => {
    const confirmed = window.confirm(
      `Delete "${skill.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(skill._id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/skills/${skill._id}`);
      setSkills((previous) =>
        previous.filter((item) => item._id !== skill._id),
      );
      setNotice(`"${skill.name}" deleted successfully.`);
    } catch (err) {
      setError(err.message || "Failed to delete skill.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleVisibility = async (skill) => {
    setError("");
    setNotice("");

    try {
      const response = await api.put(`/skills/${skill._id}`, {
        isVisible: !skill.isVisible,
      });

      const updatedSkill = response.data;

      setSkills((previous) =>
        previous.map((item) => (item._id === skill._id ? updatedSkill : item)),
      );

      setNotice(
        updatedSkill.isVisible
          ? `${skill.name} is now visible.`
          : `${skill.name} is now hidden.`,
      );
    } catch (err) {
      setError(err.message || "Failed to update visibility.");
    }
  };

  const categories = ["All", ...new Set(skills.map((skill) => skill.category))];

  const filteredSkills = skills.filter((skill) => {
    const query = search.toLowerCase().trim();

    const matchesSearch =
      !query ||
      skill.name.toLowerCase().includes(query) ||
      skill.category.toLowerCase().includes(query) ||
      (skill.description || "").toLowerCase().includes(query);

    const matchesCategory =
      categoryFilter === "All" || skill.category === categoryFilter;

    const matchesVisibility =
      visibilityFilter === "All" ||
      (visibilityFilter === "Visible" && skill.isVisible) ||
      (visibilityFilter === "Hidden" && !skill.isVisible);

    return matchesSearch && matchesCategory && matchesVisibility;
  });

  const visibleCount = skills.filter((skill) => skill.isVisible).length;
  const featuredCount = skills.filter((skill) => skill.isFeatured).length;

  return (
    <div className="min-h-full space-y-6 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="text-indigo-600 dark:text-indigo-400" size={27} />
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Skills Management
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Add, edit, organize and control the visibility of your skills.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadSkills}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={17} />
            Add Skill
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && !error && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Skills", value: skills.length, icon: Code2 },
          { label: "Visible Skills", value: visibleCount, icon: Eye },
          { label: "Featured Skills", value: featuredCount, icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {label}
              </p>
              <Icon size={19} className="text-indigo-500" />
            </div>
            <p className="mt-3 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_160px]">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-label="Search skills"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by skill, category or description..."
            className={`${inputClass} pl-10`}
          />
        </div>

        <select
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className={inputClass}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "All" ? "All categories" : category}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by visibility"
          value={visibilityFilter}
          onChange={(event) => setVisibilityFilter(event.target.value)}
          className={inputClass}
        >
          <option value="All">All visibility</option>
          <option value="Visible">Visible only</option>
          <option value="Hidden">Hidden only</option>
        </select>
      </div>

      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-3 text-slate-500">
          <LoaderCircle className="animate-spin" size={23} />
          Loading skills...
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-16 text-center dark:border-slate-700">
          <Code2 className="mx-auto mb-3 text-slate-400" size={35} />
          <h2 className="text-lg font-semibold">No skills found</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Try changing the filters or add your first skill.
          </p>
          {skills.length === 0 && (
            <button
              onClick={openCreateModal}
              className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Add your first skill
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="font-semibold">Your Skills</h2>
            <span className="text-xs text-slate-500">
              {filteredSkills.length} result(s)
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredSkills.map((skill) => (
              <div
                key={skill._id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                    {skill.icon ? (
                      <span className="text-xl">{skill.icon}</span>
                    ) : (
                      <Code2 size={23} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words font-semibold">
                        {skill.name}
                      </h3>
                      {skill.isFeatured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <Star size={12} />
                          Featured
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          skill.isVisible
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {skill.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {skill.category} · {skill.experience} years experience ·{" "}
                      Order: {skill.order}
                    </p>

                    {skill.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {skill.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-2 max-w-xs flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, skill.proficiency || 0),
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                        {skill.proficiency}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <button
                    onClick={() => handleVisibility(skill)}
                    title={skill.isVisible ? "Hide skill" : "Show skill"}
                    aria-label={skill.isVisible ? "Hide skill" : "Show skill"}
                    className="rounded-lg border border-slate-200 p-2.5 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    {skill.isVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>

                  <button
                    onClick={() => openEditModal(skill)}
                    aria-label={`Edit ${skill.name}`}
                    className="rounded-lg border border-slate-200 p-2.5 text-indigo-600 hover:bg-indigo-50 dark:border-slate-700 dark:text-indigo-400 dark:hover:bg-indigo-950"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    onClick={() => handleDelete(skill)}
                    disabled={deletingId === skill._id}
                    aria-label={`Delete ${skill.name}`}
                    className="rounded-lg border border-red-200 p-2.5 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    {deletingId === skill._id ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <Trash2 size={17} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 py-6 sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="skill-modal-title"
            className="my-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
              <div>
                <h2 id="skill-modal-title" className="text-lg font-bold">
                  {editingSkill ? "Edit Skill" : "Add New Skill"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Fields are saved to your skills database.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close dialog"
                className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="skill-name">
                    Skill name *
                  </label>
                  <input
                    id="skill-name"
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    maxLength={60}
                    required
                    placeholder="e.g. React.js"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="skill-category">
                    Category *
                  </label>
                  <input
                    id="skill-category"
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    list="skill-categories"
                    maxLength={50}
                    required
                    placeholder="e.g. Frontend"
                    className={inputClass}
                  />
                  <datalist id="skill-categories">
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className={labelClass} htmlFor="skill-proficiency">
                    Proficiency: {form.proficiency || 0}%
                  </label>
                  <input
                    id="skill-proficiency"
                    name="proficiency"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={form.proficiency}
                    onChange={updateField}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="skill-experience">
                    Experience (years)
                  </label>
                  <input
                    id="skill-experience"
                    name="experience"
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.experience}
                    onChange={updateField}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="skill-icon">
                    Icon or emoji
                  </label>
                  <input
                    id="skill-icon"
                    name="icon"
                    value={form.icon}
                    onChange={updateField}
                    placeholder="e.g. ⚛️ or 🐍"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="skill-order">
                    Display order
                  </label>
                  <input
                    id="skill-order"
                    name="order"
                    type="number"
                    step="1"
                    value={form.order}
                    onChange={updateField}
                    required
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Smaller numbers appear first when sorted by order.
                  </p>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="skill-description">
                  Description
                </label>
                <textarea
                  id="skill-description"
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  maxLength={500}
                  rows={3}
                  placeholder="Briefly describe your experience with this skill..."
                  className={inputClass}
                />
                <p className="mt-1 text-right text-xs text-slate-500">
                  {form.description.length}/500
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={form.isFeatured}
                    onChange={updateField}
                    className="mt-1 h-4 w-4 accent-indigo-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      Featured skill
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Mark this skill as a highlight.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <input
                    type="checkbox"
                    name="isVisible"
                    checked={form.isVisible}
                    onChange={updateField}
                    className="mt-1 h-4 w-4 accent-indigo-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      Public visibility
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Visible skills can appear on your public portfolio.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <LoaderCircle size={17} className="animate-spin" />
                  )}
                  {saving
                    ? "Saving..."
                    : editingSkill
                      ? "Save Changes"
                      : "Create Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
