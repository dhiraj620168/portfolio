import { useEffect, useState } from "react";
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  UserRound,
  GraduationCap,
  Code2,
  BrainCircuit,
  Target,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const EMPTY_PROFILE = {
  name: "",
  careerType: "fresher",
  experienceCategory: "",
  professionalTitle: "",
  introduction: "",
  about: "",
  location: "",
  education: "",
  careerGoal: "",
  skills: [],
  // resumeUrl: "/resume.pdf",
  profileImageUrl: "/profile.jpg",
  highlights: [],
};

const ICONS = {
  Code2,
  GraduationCap,
  BrainCircuit,
  Target,
  UserRound,
  Sparkles,
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950";

function resolveFileUrl(url) {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

async function profileRequest(path, options = {}) {
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

export default function AdminAbout() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  // const [uploadingResume, setUploadingResume] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await profileRequest("/profile/admin");

      setProfile({
        ...EMPTY_PROFILE,
        ...data,
        skills: Array.isArray(data.skills) ? data.skills : [],
        highlights: Array.isArray(data.highlights)
          ? [...data.highlights]
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((card, index) => ({
                title: card.title || "",
                description: card.description || "",
                icon: card.icon || "Code2",
                order: card.order ?? index,
                isVisible: card.isVisible !== false,
              }))
          : [],
      });
    } catch (err) {
      setError(err.message || "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setNotice("");
  }

  // Upload profile image to POST /api/images/upload
  async function uploadProfileImage(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      setError("Select a JPG, PNG, WEBP, or GIF image.");
      input.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile image must be 5 MB or smaller.");
      input.value = "";
      return;
    }

    setUploadingImage(true);
    setError("");
    setNotice("");

    try {
      const token = sessionStorage.getItem("adminToken");

      if (!token) {
        throw new Error("Please log in to the admin dashboard again.");
      }

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_BASE_URL}/images/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success || !result.imageUrl) {
        throw new Error(result.message || "Profile image upload failed.");
      }

      setProfile((previous) => ({
        ...previous,
        profileImageUrl: result.imageUrl,
      }));

      setNotice(
        "Profile image uploaded. Click Save Profile & Cards to apply it.",
      );
    } catch (err) {
      setError(err.message || "Could not upload profile image.");
    } finally {
      setUploadingImage(false);
      input.value = "";
    }
  }

  // Upload resume PDF to POST /api/resumes/upload
  // async function uploadResume(event) {
  //   const input = event.currentTarget;
  //   const file = input.files?.[0];

  //   if (!file) return;

  //   if (
  //     file.type !== "application/pdf" ||
  //     !file.name.toLowerCase().endsWith(".pdf")
  //   ) {
  //     setError("Please select a PDF resume.");
  //     input.value = "";
  //     return;
  //   }

  //   if (file.size > 5 * 1024 * 1024) {
  //     setError("Resume PDF must be 5 MB or smaller.");
  //     input.value = "";
  //     return;
  //   }

  //   setUploadingResume(true);
  //   setError("");
  //   setNotice("");

  //   try {
  //     const token = sessionStorage.getItem("adminToken");

  //     if (!token) {
  //       throw new Error("Please log in to the admin dashboard again.");
  //     }

  //     const formData = new FormData();
  //     formData.append("resume", file);

  //     const response = await fetch(`${API_BASE_URL}/resumes/upload`, {
  //       method: "POST",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: formData,
  //     });

  //     const result = await response.json().catch(() => ({}));

  //     if (!response.ok || !result.success || !result.resumeUrl) {
  //       throw new Error(result.message || "Resume upload failed.");
  //     }

  //     setProfile((previous) => ({
  //       ...previous,
  //       resumeUrl: result.resumeUrl,
  //     }));

  //     setNotice("Resume uploaded. Click Save Profile & Cards to apply it.");
  //   } catch (err) {
  //     setError(err.message || "Could not upload resume.");
  //   } finally {
  //     setUploadingResume(false);
  //     input.value = "";
  //   }
  // }

  function updateCard(index, field, value) {
    setProfile((previous) => ({
      ...previous,
      highlights: previous.highlights.map((card, cardIndex) =>
        cardIndex === index ? { ...card, [field]: value } : card,
      ),
    }));

    setError("");
    setNotice("");
  }

  function addCard() {
    setProfile((previous) => ({
      ...previous,
      highlights: [
        ...previous.highlights,
        {
          title: "",
          description: "",
          icon: "Code2",
          order: previous.highlights.length,
          isVisible: true,
        },
      ],
    }));

    setError("");
    setNotice("");
  }

  function deleteCard(index) {
    const card = profile.highlights[index];

    if (!window.confirm(`Delete "${card.title || "this card"}"?`)) {
      return;
    }

    setProfile((previous) => ({
      ...previous,
      highlights: previous.highlights
        .filter((_, cardIndex) => cardIndex !== index)
        .map((item, order) => ({ ...item, order })),
    }));

    setNotice("");
    setError("");
  }

  function moveCard(index, direction) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= profile.highlights.length) {
      return;
    }

    setProfile((previous) => {
      const cards = [...previous.highlights];

      [cards[index], cards[targetIndex]] = [cards[targetIndex], cards[index]];

      return {
        ...previous,
        highlights: cards.map((card, order) => ({ ...card, order })),
      };
    });

    setNotice("");
    setError("");
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const highlights = profile.highlights.map((card, order) => {
        if (!card.title.trim()) {
          throw new Error(`Enter a title for card ${order + 1}.`);
        }

        return {
          title: card.title.trim(),
          description: card.description.trim(),
          icon: card.icon,
          order,
          isVisible: card.isVisible,
        };
      });

      const payload = {
        name: profile.name.trim(),
        professionalTitle: profile.professionalTitle.trim(),
        careerType: profile.careerType || "fresher",
        experienceCategory: profile.experienceCategory,
        introduction: profile.introduction.trim(),
        about: profile.about.trim(),
        location: profile.location.trim(),
        education: profile.education.trim(),
        careerGoal: profile.careerGoal.trim(),
        skills: profile.skills,
        // resumeUrl: (profile.resumeUrl || "").trim(),
        profileImageUrl: (profile.profileImageUrl || "").trim(),
        highlights,
      };

      if (!payload.name) {
        throw new Error("Name is required.");
      }

      const result = await profileRequest("/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (result.profile) {
        setProfile((previous) => ({
          ...previous,
          ...result.profile,
          highlights: result.profile.highlights || highlights,
        }));
      }

      setNotice("Profile and About cards saved successfully.");
    } catch (err) {
      setError(err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  // const busy = saving || uploadingImage || uploadingResume;
  const busy = saving || uploadingImage;

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
        <RefreshCw size={20} className="animate-spin" />
        Loading About Management...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 pb-12 text-slate-900 dark:text-white">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">
          Portfolio Admin
        </p>

        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          About Management
        </h1>

        <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
          Edit your profile, upload your profile image , and manage About
          highlight cards.
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

      <form onSubmit={saveProfile} className="space-y-8">
        {/* PROFILE INFORMATION */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <UserRound size={21} className="text-indigo-500" />
            Profile Information
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            {[
              ["name", "Name"],
              ["professionalTitle", "Professional Title"],
              ["location", "Location"],
              ["education", "Education"],
              ["careerGoal", "Career Goal"],
            ].map(([name, label]) => (
              <div key={name}>
                <label
                  className="mb-2 block text-sm font-semibold"
                  htmlFor={name}
                >
                  {label}
                </label>

                <input
                  id={name}
                  name={name}
                  value={profile[name] || ""}
                  onChange={updateField}
                  required={name === "name"}
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          {/* CAREER PROFILE SELECTION */}
          <div>
            <label
              htmlFor="careerType"
              className="mb-2 block text-sm font-semibold"
            >
              Career Profile
            </label>

            <select
              id="careerType"
              name="careerType"
              value={profile.careerType || "fresher"}
              onChange={updateField}
              disabled={busy}
              className={inputClass}
            >
              <option value="fresher">Fresher</option>
              <option value="experienced">Experienced</option>
            </select>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Choose your career stage.
            </p>
          </div>

          {profile.careerType === "experienced" && (
            <div className="mt-4">
              <label
                htmlFor="experienceCategory"
                className="mb-2 block text-sm font-semibold"
              >
                Experience Category
              </label>

              <select
                id="experienceCategory"
                name="experienceCategory"
                value={profile.experienceCategory || ""}
                onChange={updateField}
                disabled={busy}
                required
                className={inputClass}
              >
                <option value="">Select experience category</option>
                <option value="working-professional">
                  Working Professional
                </option>
                <option value="internship">Internship</option>
                <option value="industrial-training">Industrial Training</option>
                <option value="freelance">Freelance</option>
                <option value="contract">Contract</option>
              </select>
            </div>
          )}

          {/* PROFILE IMAGE UPLOAD */}
          <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <ImageIcon size={19} className="text-indigo-500" />
              Profile Image
            </h3>

            {profile.profileImageUrl && (
              <div className="flex items-center gap-4">
                <img
                  src={resolveFileUrl(profile.profileImageUrl)}
                  alt="Profile preview"
                  className="h-24 w-24 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />

                <div className="min-w-0">
                  <p className="text-sm font-medium">Current image</p>
                  <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
                    {profile.profileImageUrl}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="profileImageUpload"
                className="mb-2 block text-sm font-semibold"
              >
                Choose a new profile image
              </label>

              <input
                id="profileImageUpload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={uploadProfileImage}
                disabled={busy}
                className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:font-semibold file:text-white`}
              />

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                JPG, PNG, WEBP, or GIF. Maximum 5 MB.
              </p>
            </div>

            {uploadingImage && (
              <p className="text-sm text-indigo-500">
                Uploading profile image...
              </p>
            )}
          </div>

          {/* RESUME UPLOAD
          <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <FileText size={19} className="text-indigo-500" />
              Resume (PDF)
            </h3>

            <div>
              <label
                htmlFor="resumeUpload"
                className="mb-2 block text-sm font-semibold"
              >
                Choose a new resume
              </label>

              <input
                id="resumeUpload"
                type="file"
                accept=".pdf,application/pdf"
                onChange={uploadResume}
                disabled={busy}
                className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:font-semibold file:text-white`}
              />

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                PDF only. Maximum 5 MB.
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
              <p className="text-sm font-medium">Current resume</p>

              <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
                {profile.resumeUrl || "No resume selected"}
              </p>

              {profile.resumeUrl && (
                <a
                  href={resolveFileUrl(profile.resumeUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Preview current resume
                </a>
              )}
            </div>

            {uploadingResume && (
              <p className="text-sm text-indigo-500">Uploading resume...</p>
            )}
          </div> */}

          <div>
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor="introduction"
            >
              Introduction
            </label>

            <textarea
              id="introduction"
              name="introduction"
              value={profile.introduction}
              onChange={updateField}
              rows={3}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="about">
              About Description
            </label>

            <textarea
              id="about"
              name="about"
              value={profile.about}
              onChange={updateField}
              rows={5}
              className={inputClass}
            />
          </div>
        </section>

        {/* ABOUT HIGHLIGHT CARDS */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">About Highlight Cards</h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {profile.highlights.length} cards · Add as many as you need.
              </p>
            </div>

            <button
              type="button"
              onClick={addCard}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              <Plus size={17} />
              Add Card
            </button>
          </div>

          {profile.highlights.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
              No cards yet. Click “Add Card” to create your first one.
            </div>
          )}

          <div className="space-y-4">
            {profile.highlights.map((card, index) => {
              const Icon = ICONS[card.icon] || Code2;

              return (
                <article
                  key={card._id || index}
                  className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500">
                        <Icon size={22} />
                      </div>

                      <h3 className="font-semibold">Card {index + 1}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveCard(index, -1)}
                        disabled={index === 0 || busy}
                        aria-label="Move card up"
                        className="rounded-lg border border-slate-200 p-2 disabled:opacity-30 dark:border-slate-700"
                      >
                        <ArrowUp size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveCard(index, 1)}
                        disabled={
                          index === profile.highlights.length - 1 || busy
                        }
                        aria-label="Move card down"
                        className="rounded-lg border border-slate-200 p-2 disabled:opacity-30 dark:border-slate-700"
                      >
                        <ArrowDown size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteCard(index)}
                        disabled={busy}
                        aria-label="Delete card"
                        className="rounded-lg border border-rose-500/20 p-2 text-rose-500 disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Card Title
                      </label>

                      <input
                        value={card.title}
                        onChange={(event) =>
                          updateCard(index, "title", event.target.value)
                        }
                        maxLength={150}
                        required
                        disabled={busy}
                        className={inputClass}
                        placeholder="e.g. Artificial Intelligence"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Icon
                      </label>

                      <select
                        value={card.icon}
                        onChange={(event) =>
                          updateCard(index, "icon", event.target.value)
                        }
                        disabled={busy}
                        className={inputClass}
                      >
                        {Object.keys(ICONS).map((iconName) => (
                          <option key={iconName} value={iconName}>
                            {iconName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Description
                    </label>

                    <textarea
                      value={card.description}
                      onChange={(event) =>
                        updateCard(index, "description", event.target.value)
                      }
                      rows={3}
                      maxLength={2000}
                      disabled={busy}
                      className={inputClass}
                      placeholder="Describe this highlight..."
                    />
                  </div>

                  <label className="flex items-center gap-3 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={card.isVisible}
                      onChange={(event) =>
                        updateCard(index, "isVisible", event.target.checked)
                      }
                      disabled={busy}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    Show this card on the public About page
                  </label>
                </article>
              );
            })}
          </div>
        </section>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={loadProfile}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold disabled:opacity-60 dark:border-slate-700"
          >
            <RefreshCw size={17} />
            Reload Saved Data
          </button>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}

            {saving ? "Saving..." : "Save Profile & Cards"}
          </button>
        </div>
      </form>
    </main>
  );
}
