import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  GraduationCap,
  Eye,
  EyeOff,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  CalendarDays,
  Star,
} from "lucide-react";
import api from "../../services/api";

const DEGREES = [
  "10th",
  "12th",
  "Diploma",
  "Graduation",
  "Post-Graduation",
  "PhD",
  "Other",
];

const GRADE_TYPES = ["Percentage", "CGPA", "Marks", "Grade", "Other"];

const EMPTY_FORM = {
  degree: "Graduation",
  institution: "",
  institutionLogoUrl: "",
  boardOrUniversity: "",
  fieldOfStudy: "",
  startYear: "",
  endYear: "",
  gradeType: "Percentage",
  grade: "",
  marks: "",
  maxMarks: "",
  percentage: "",
  division: "",
  cgpa: "",
  cgpaScale: 10,
  cgpaConversionFactor: "",
  description: "",
  isCurrentlyStudying: false,
  isVisible: true,
  order: 0,
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-indigo-950";

const labelClass =
  "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

function formatPeriod(item) {
  const start = item.startYear || "Start year not set";
  const end = item.isCurrentlyStudying
    ? "Present"
    : item.endYear || "Year not set";

  return `${start} – ${end}`;
}

export default function AdminEducation() {
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [visibilityId, setVisibilityId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("All");
  const [visibilityFilter, setVisibilityFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [logoPreviewError, setLogoPreviewError] = useState(false);

  const loadEducation = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/education/admin");
      const records = response.data?.data ?? response.data ?? [];
      setEducation(Array.isArray(records) ? records : []);
    } catch (err) {
      setError(err.message || "Failed to load education records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEducation();
  }, [loadEducation]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : [
                "startYear",
                "endYear",
                "order",
                "marks",
                "maxMarks",
                "percentage",
                "cgpa",
                "cgpaScale",
                "cgpaConversionFactor",
              ].includes(name)
            ? value === ""
              ? ""
              : Number(value)
            : value,
    }));
  };

  const openCreateModal = () => {
    setEditingRecord(null);
    setForm({ ...EMPTY_FORM });
    setLogoPreviewError(false);
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingRecord(item);
    setForm({
      degree: item.degree || "Graduation",
      institution: item.institution || "",
      institutionLogoUrl: item.institutionLogoUrl || "",
      boardOrUniversity: item.boardOrUniversity || "",
      fieldOfStudy: item.fieldOfStudy || "",
      startYear: item.startYear ?? "",
      endYear: item.endYear ?? "",
      gradeType: item.gradeType || "Percentage",
      grade: item.grade || "",
      marks: item.marks ?? "",
      maxMarks: item.maxMarks ?? "",
      percentage: item.percentage ?? "",
      division: item.division || "",
      cgpa: item.cgpa ?? "",
      cgpaScale: item.cgpaScale ?? 10,
      cgpaConversionFactor: item.cgpaConversionFactor ?? "",
      description: item.description || "",
      isCurrentlyStudying: Boolean(item.isCurrentlyStudying),
      isVisible: item.isVisible !== false,
      order: item.order ?? 0,
    });
    setLogoPreviewError(false);
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingRecord(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const institution = form.institution.trim();
    const institutionLogoUrl = form.institutionLogoUrl.trim();
    const boardOrUniversity = form.boardOrUniversity.trim();
    const fieldOfStudy = form.fieldOfStudy.trim();
    const grade = form.grade.trim();
    const description = form.description.trim();

    const startYear = form.startYear === "" ? null : Number(form.startYear);
    const endYear = form.endYear === "" ? NaN : Number(form.endYear);
    const order = Number(form.order);
    const toOptionalNumber = (value) =>
      value === "" || value == null ? null : Number(value);

    const marks = toOptionalNumber(form.marks);
    const maxMarks = toOptionalNumber(form.maxMarks);
    let percentage = toOptionalNumber(form.percentage);
    const cgpa = toOptionalNumber(form.cgpa);
    const cgpaScale = toOptionalNumber(form.cgpaScale) ?? 10;
    const cgpaConversionFactor = toOptionalNumber(form.cgpaConversionFactor);
    const isSecondary = ["10th", "12th"].includes(form.degree);
    const isGraduation = ["Graduation", "Post-Graduation", "PhD"].includes(
      form.degree,
    );

    // Calculate secondary percentage only when both marks and total marks are supplied.
    if (
      isSecondary &&
      percentage == null &&
      marks != null &&
      maxMarks != null &&
      maxMarks > 0
    ) {
      percentage = (marks / maxMarks) * 100;
    }

    // For graduation, convert CGPA only when an explicit institution-approved factor is supplied.
    if (
      isGraduation &&
      percentage == null &&
      cgpa != null &&
      cgpaConversionFactor != null
    ) {
      percentage = cgpa * cgpaConversionFactor;
    }

    if (!form.degree || !institution) {
      setError("Qualification and institution are required.");
      return;
    }

    if (institution.length > 200) {
      setError("Institution name cannot exceed 200 characters.");
      return;
    }

    if (institutionLogoUrl.length > 1000) {
      setError("Institution logo URL cannot exceed 1000 characters.");
      return;
    }

    if (institutionLogoUrl && !/^https?:\/\//i.test(institutionLogoUrl)) {
      setError("Institution logo URL must start with http:// or https://.");
      return;
    }

    if (boardOrUniversity.length > 200) {
      setError("Board or university cannot exceed 200 characters.");
      return;
    }

    if (fieldOfStudy.length > 150) {
      setError("Field of study cannot exceed 150 characters.");
      return;
    }

    if (!Number.isInteger(endYear) || endYear < 1950 || endYear > 2100) {
      setError("Enter a valid passing or expected completion year.");
      return;
    }

    if (
      startYear !== null &&
      (!Number.isInteger(startYear) || startYear < 1950 || startYear > 2100)
    ) {
      setError("Start year must be between 1950 and 2100.");
      return;
    }

    if (startYear !== null && startYear > endYear) {
      setError("Start year cannot be after the completion year.");
      return;
    }

    if (!Number.isFinite(order) || !Number.isInteger(order) || order < 0) {
      setError("Display order must be a non-negative whole number.");
      return;
    }

    if (grade.length > 50) {
      setError("Grade cannot exceed 50 characters.");
      return;
    }

    if (marks != null && marks < 0) {
      setError("Marks cannot be negative.");
      return;
    }
    if (maxMarks != null && maxMarks <= 0) {
      setError("Maximum marks must be greater than zero.");
      return;
    }
    if (marks != null && maxMarks != null && marks > maxMarks) {
      setError("Marks cannot exceed maximum marks.");
      return;
    }
    if (percentage != null && (percentage < 0 || percentage > 100)) {
      setError("Percentage must be between 0 and 100.");
      return;
    }
    if (cgpa != null && cgpa < 0) {
      setError("CGPA cannot be negative.");
      return;
    }
    if (cgpaScale <= 0) {
      setError("CGPA scale must be greater than zero.");
      return;
    }
    if (cgpaConversionFactor != null && cgpaConversionFactor <= 0) {
      setError("Conversion factor must be greater than zero.");
      return;
    }

    if (description.length > 1500) {
      setError("Description cannot exceed 1500 characters.");
      return;
    }

    const payload = {
      degree: form.degree,
      institution,
      institutionLogoUrl,
      boardOrUniversity,
      fieldOfStudy,
      startYear,
      endYear,
      gradeType: form.gradeType,
      grade,
      marks: isSecondary ? marks : null,
      maxMarks: isSecondary ? maxMarks : null,
      percentage:
        isSecondary || isGraduation
          ? percentage == null
            ? null
            : Number(percentage.toFixed(2))
          : null,
      division: isSecondary ? form.division : "",
      cgpa: isGraduation ? cgpa : null,
      cgpaScale: isGraduation ? cgpaScale : 10,
      cgpaConversionFactor: isGraduation ? cgpaConversionFactor : null,
      description,
      isCurrentlyStudying: form.isCurrentlyStudying,
      isVisible: form.isVisible,
      order,
    };

    setSaving(true);

    try {
      if (editingRecord) {
        await api.put(`/education/${editingRecord._id}`, payload);
        setNotice("Education record updated successfully.");
      } else {
        await api.post("/education", payload);
        setNotice("Education record created successfully.");
      }

      setModalOpen(false);
      setEditingRecord(null);
      setForm({ ...EMPTY_FORM });

      await loadEducation();
    } catch (err) {
      setError(err.message || "Failed to save education record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete the education record "${item.degree} - ${item.institution}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(item._id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/education/${item._id}`);

      setEducation((previous) =>
        previous.filter((record) => record._id !== item._id),
      );

      setNotice("Education record deleted successfully.");
    } catch (err) {
      setError(err.message || "Failed to delete education record.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleVisibility = async (item) => {
    setVisibilityId(item._id);
    setError("");
    setNotice("");

    try {
      const response = await api.put(`/education/${item._id}`, {
        isVisible: !item.isVisible,
      });

      const updatedRecord = response.data?.data ?? response.data;

      setEducation((previous) =>
        previous.map((record) =>
          record._id === item._id ? { ...record, ...updatedRecord } : record,
        ),
      );

      setNotice(
        updatedRecord.isVisible
          ? "Education record is now visible."
          : "Education record is now hidden.",
      );
    } catch (err) {
      setError(err.message || "Failed to update visibility.");
    } finally {
      setVisibilityId(null);
    }
  };

  const degreeOptions = [
    "All",
    ...new Set(education.map((item) => item.degree)),
  ];

  const filteredEducation = education.filter((item) => {
    const query = search.toLowerCase().trim();

    const searchableText = [
      item.degree,
      item.institution,
      item.institutionLogoUrl,
      item.boardOrUniversity,
      item.fieldOfStudy,
      item.grade,
      item.marks,
      item.percentage,
      item.division,
      item.cgpa,
      item.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !query || searchableText.includes(query);

    const matchesDegree =
      degreeFilter === "All" || item.degree === degreeFilter;

    const matchesVisibility =
      visibilityFilter === "All" ||
      (visibilityFilter === "Visible" && item.isVisible) ||
      (visibilityFilter === "Hidden" && !item.isVisible);

    return matchesSearch && matchesDegree && matchesVisibility;
  });

  const visibleCount = education.filter((item) => item.isVisible).length;

  const currentCount = education.filter(
    (item) => item.isCurrentlyStudying,
  ).length;

  return (
    <div className="min-h-full space-y-6 text-slate-900 dark:text-slate-100">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap
              size={28}
              className="text-indigo-600 dark:text-indigo-400"
            />
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Education Management
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Manage your qualifications, institutions, grades and study history.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadEducation}
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
            Add Education
          </button>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Records",
            value: education.length,
            icon: GraduationCap,
          },
          {
            label: "Visible Records",
            value: visibleCount,
            icon: Eye,
          },
          {
            label: "Currently Studying",
            value: currentCount,
            icon: BookOpen,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {label}
              </p>
              <Icon size={20} className="text-indigo-500" />
            </div>
            <p className="mt-3 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_160px]">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-label="Search education records"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search institution, degree, subject..."
            className={`${inputClass} pl-10`}
          />
        </div>

        <select
          aria-label="Filter by qualification"
          value={degreeFilter}
          onChange={(event) => setDegreeFilter(event.target.value)}
          className={inputClass}
        >
          {degreeOptions.map((degree) => (
            <option key={degree} value={degree}>
              {degree === "All" ? "All qualifications" : degree}
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

      {/* Education list */}
      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-3 text-slate-500">
          <LoaderCircle size={23} className="animate-spin" />
          Loading education records...
        </div>
      ) : filteredEducation.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-16 text-center dark:border-slate-700">
          <GraduationCap size={38} className="mx-auto mb-3 text-slate-400" />
          <h2 className="text-lg font-semibold">No education records found</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Change your filters or add an education record.
          </p>

          {education.length === 0 && (
            <button
              onClick={openCreateModal}
              className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Add your first education record
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="font-semibold">Education History</h2>
            <span className="text-xs text-slate-500">
              {filteredEducation.length} record(s)
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEducation.map((item) => (
              <div
                key={item._id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                  {item.institutionLogoUrl ? (
                    <img
                      src={item.institutionLogoUrl}
                      alt={`${item.institution} logo`}
                      className="h-full w-full rounded-xl object-contain p-1"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        event.currentTarget.nextElementSibling?.classList.remove(
                          "hidden",
                        );
                      }}
                    />
                  ) : null}
                  <GraduationCap
                    size={25}
                    className={item.institutionLogoUrl ? "hidden" : ""}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words font-semibold">{item.degree}</h3>

                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.isVisible
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {item.isVisible ? "Visible" : "Hidden"}
                    </span>

                    {item.isCurrentlyStudying && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        In Progress
                      </span>
                    )}
                  </div>

                  <p className="mt-1 break-words text-sm font-medium text-slate-700 dark:text-slate-300">
                    {item.institution}
                  </p>

                  {(item.boardOrUniversity || item.fieldOfStudy) && (
                    <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
                      {[item.boardOrUniversity, item.fieldOfStudy]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={14} />
                      {formatPeriod(item)}
                    </span>

                    {item.grade && (
                      <span className="inline-flex items-center gap-1.5">
                        <Star size={14} />
                        {item.gradeType}: {item.grade}
                      </span>
                    )}

                    <span>Order: {item.order ?? 0}</span>
                  </div>

                  {item.description && (
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  <button
                    onClick={() => handleVisibility(item)}
                    disabled={visibilityId === item._id}
                    title={item.isVisible ? "Hide record" : "Show record"}
                    aria-label={item.isVisible ? "Hide record" : "Show record"}
                    className="rounded-lg border border-slate-200 p-2.5 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    {visibilityId === item._id ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : item.isVisible ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                  <button
                    onClick={() => openEditModal(item)}
                    aria-label={`Edit ${item.degree}`}
                    className="rounded-lg border border-slate-200 p-2.5 text-indigo-600 hover:bg-indigo-50 dark:border-slate-700 dark:text-indigo-400 dark:hover:bg-indigo-950"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item._id}
                    aria-label={`Delete ${item.degree}`}
                    className="rounded-lg border border-red-200 p-2.5 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    {deletingId === item._id ? (
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

      {/* Create/edit modal */}
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
            aria-labelledby="education-modal-title"
            className="my-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:px-6">
              <div>
                <h2 id="education-modal-title" className="text-lg font-bold">
                  {editingRecord ? "Edit Education" : "Add Education"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Enter your qualification details below.
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
                  <label className={labelClass} htmlFor="edu-degree">
                    Qualification *
                  </label>
                  <select
                    id="edu-degree"
                    name="degree"
                    value={form.degree}
                    onChange={updateField}
                    required
                    className={inputClass}
                  >
                    {DEGREES.map((degree) => (
                      <option key={degree} value={degree}>
                        {degree}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="edu-institution">
                    School / College *
                  </label>
                  <input
                    id="edu-institution"
                    name="institution"
                    value={form.institution}
                    onChange={updateField}
                    maxLength={200}
                    required
                    placeholder="e.g. College or school name"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="edu-institution-logo">
                    Institution Logo URL
                  </label>
                  <input
                    id="edu-institution-logo"
                    name="institutionLogoUrl"
                    type="url"
                    value={form.institutionLogoUrl}
                    onChange={(event) => {
                      setLogoPreviewError(false);
                      updateField(event);
                    }}
                    maxLength={1000}
                    placeholder="https://example.com/college-logo.png"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Paste a publicly accessible image URL. Leave blank to use
                    the graduation icon.
                  </p>

                  {form.institutionLogoUrl.trim() &&
                    /^https?:\/\//i.test(form.institutionLogoUrl.trim()) &&
                    !logoPreviewError && (
                      <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                        <img
                          src={form.institutionLogoUrl.trim()}
                          alt="Institution logo preview"
                          className="h-14 w-14 rounded-lg object-contain"
                          onError={() => setLogoPreviewError(true)}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Logo preview</p>
                          <p className="break-all text-xs text-slate-500 dark:text-slate-400">
                            {form.institutionLogoUrl.trim()}
                          </p>
                        </div>
                      </div>
                    )}

                  {logoPreviewError && (
                    <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                      Preview unavailable. Check that the URL points directly to
                      an accessible image.
                    </p>
                  )}
                </div>

                <div>
                  <label className={labelClass} htmlFor="edu-university">
                    Board / University
                  </label>
                  <input
                    id="edu-university"
                    name="boardOrUniversity"
                    value={form.boardOrUniversity}
                    onChange={updateField}
                    maxLength={200}
                    placeholder="e.g. University name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="edu-field">
                    Field of Study
                  </label>
                  <input
                    id="edu-field"
                    name="fieldOfStudy"
                    value={form.fieldOfStudy}
                    onChange={updateField}
                    maxLength={150}
                    placeholder="e.g. Computer Science Engineering"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="edu-start-year">
                    Start Year
                  </label>
                  <input
                    id="edu-start-year"
                    name="startYear"
                    type="number"
                    min="1950"
                    max="2100"
                    step="1"
                    value={form.startYear}
                    onChange={updateField}
                    placeholder="e.g. 2022"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="edu-end-year">
                    Passing / Expected Year *
                  </label>
                  <input
                    id="edu-end-year"
                    name="endYear"
                    type="number"
                    min="1950"
                    max="2100"
                    step="1"
                    value={form.endYear}
                    onChange={updateField}
                    required
                    placeholder="e.g. 2026"
                    className={inputClass}
                  />
                </div>

                {["10th", "12th"].includes(form.degree) && (
                  <>
                    <div className="sm:col-span-2 mt-2 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                      <h3 className="mb-1 font-semibold text-amber-900 dark:text-amber-200">
                        Secondary Academic Results
                      </h3>
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        Enter marks and total marks to calculate percentage
                        automatically if percentage is left blank.
                      </p>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="edu-marks">
                        Marks Obtained
                      </label>
                      <input
                        id="edu-marks"
                        name="marks"
                        type="number"
                        min="0"
                        step="any"
                        value={form.marks}
                        onChange={updateField}
                        placeholder="e.g. 289"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="edu-max-marks">
                        Maximum Marks
                      </label>
                      <input
                        id="edu-max-marks"
                        name="maxMarks"
                        type="number"
                        min="0.01"
                        step="any"
                        value={form.maxMarks}
                        onChange={updateField}
                        placeholder="e.g. 500"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="edu-percentage">
                        Percentage (%)
                      </label>
                      <input
                        id="edu-percentage"
                        name="percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={form.percentage}
                        onChange={updateField}
                        placeholder="Auto-calculated if blank"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="edu-division">
                        Division
                      </label>
                      <select
                        id="edu-division"
                        name="division"
                        value={form.division}
                        onChange={updateField}
                        className={inputClass}
                      >
                        <option value="">Select division</option>
                        <option value="First Division">First Division</option>
                        <option value="Second Division">Second Division</option>
                        <option value="Third Division">Third Division</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </>
                )}

                {["Graduation", "Post-Graduation", "PhD"].includes(
                  form.degree,
                ) && (
                  <>
                    <div className="sm:col-span-2 mt-2 rounded-xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900/60 dark:bg-violet-950/20">
                      <h3 className="mb-1 font-semibold text-violet-900 dark:text-violet-200">
                        Higher Education Results
                      </h3>
                      <p className="text-xs text-violet-800 dark:text-violet-300">
                        Percentage can be entered directly. CGPA conversion is
                        only applied when you enter your institution's approved
                        factor.
                      </p>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="edu-cgpa">
                        CGPA
                      </label>
                      <input
                        id="edu-cgpa"
                        name="cgpa"
                        type="number"
                        min="0"
                        step="any"
                        value={form.cgpa}
                        onChange={updateField}
                        placeholder="e.g. 7.8"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="edu-cgpa-scale">
                        CGPA Scale
                      </label>
                      <input
                        id="edu-cgpa-scale"
                        name="cgpaScale"
                        type="number"
                        min="0.1"
                        step="any"
                        value={form.cgpaScale}
                        onChange={updateField}
                        placeholder="e.g. 10"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label
                        className={labelClass}
                        htmlFor="edu-grad-percentage"
                      >
                        Percentage (%)
                      </label>
                      <input
                        id="edu-grad-percentage"
                        name="percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={form.percentage}
                        onChange={updateField}
                        placeholder="Enter official percentage"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="edu-cgpa-factor">
                        Approved CGPA Conversion Factor (optional)
                      </label>
                      <input
                        id="edu-cgpa-factor"
                        name="cgpaConversionFactor"
                        type="number"
                        min="0.1"
                        step="any"
                        value={form.cgpaConversionFactor}
                        onChange={updateField}
                        placeholder="Only if specified by university"
                        className={inputClass}
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Percentage = CGPA × factor, only where your institution
                        officially uses this rule.
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label className={labelClass} htmlFor="edu-grade-type">
                    Legacy Grade Type
                  </label>
                  <select
                    id="edu-grade-type"
                    name="gradeType"
                    value={form.gradeType}
                    onChange={updateField}
                    className={inputClass}
                  >
                    {GRADE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="edu-grade">
                    Legacy Grade / Score
                  </label>
                  <input
                    id="edu-grade"
                    name="grade"
                    value={form.grade}
                    onChange={updateField}
                    maxLength={50}
                    placeholder="Optional, for compatibility with old records"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="edu-order">
                    Display Order
                  </label>
                  <input
                    id="edu-order"
                    name="order"
                    type="number"
                    min="0"
                    step="1"
                    value={form.order}
                    onChange={updateField}
                    required
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Lower numbers appear first.
                  </p>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="edu-description">
                  Description
                </label>
                <textarea
                  id="edu-description"
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  maxLength={1500}
                  rows={4}
                  placeholder="Achievements, coursework or other details..."
                  className={inputClass}
                />
                <p className="mt-1 text-right text-xs text-slate-500">
                  {form.description.length}/1500
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <input
                    type="checkbox"
                    name="isCurrentlyStudying"
                    checked={form.isCurrentlyStudying}
                    onChange={updateField}
                    className="mt-1 h-4 w-4 accent-indigo-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      Currently studying
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Mark this qualification as ongoing.
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
                      Visible records can appear on your portfolio.
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
                    : editingRecord
                      ? "Save Changes"
                      : "Create Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
