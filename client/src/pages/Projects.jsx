import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Calculator,
  Code2,
  ChevronLeft,
  ChevronRight,
  Filter,
  FolderCode,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { getProjects } from "../services/projectService";
import { getProjectsPageSettings } from "../services/projectsPageSettingsService";

const DEFAULT_SETTINGS = {
  badgeText: "Ideas turned into applications",
  headingText: "My",
  highlightedText: "Projects",
  description:
    "A collection of my work in full-stack development, Python and AI. Each project represents a step in learning, experimenting and building practical solutions.",
  focusLabel: "Full Stack & AI",
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function resolveImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";

  const imageUrl = value.trim();

  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/api/images/")) {
    const backendOrigin = new URL(API_BASE_URL, window.location.origin).origin;

    return `${backendOrigin}${imageUrl}`;
  }

  return imageUrl;
}

const iconMap = {
  interviewiq: BrainCircuit,
  "python calculator": Calculator,
  "profile management": UserRound,
};

function getProjectIcon(title = "") {
  return iconMap[String(title).toLowerCase()] || Code2;
}

function getTechnologies(tech) {
  if (Array.isArray(tech)) {
    return tech
      .map((item) => {
        if (typeof item === "string") return item.trim();

        if (item && typeof item === "object") {
          return String(item.name || item.title || item.label || "").trim();
        }

        return "";
      })
      .filter(Boolean);
  }

  if (typeof tech === "string") {
    return tech
      .split(/[,|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getStatusStyle(status = "") {
  const value = String(status || "").toLowerCase();

  if (value.includes("progress")) {
    return "border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-200";
  }

  if (value.includes("complete") || value.includes("live")) {
    return "border-emerald-400 bg-emerald-100 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200";
  }

  return "border-indigo-400 bg-indigo-100 text-indigo-900 dark:border-indigo-500/50 dark:bg-indigo-500/15 dark:text-indigo-200";
}

function ProjectCard({ project, index }) {
  const Icon = getProjectIcon(project.title);

  const technologies = getTechnologies(
    project.tech ?? project.technologies ?? project.techStack,
  );

  const [imageError, setImageError] = useState(false);

  const imageUrl =
    project.imageUrl ||
    project.image ||
    project.thumbnailUrl ||
    project.coverImage ||
    project.previewImage ||
    "";

  const liveUrl =
    project.liveUrl ||
    project.demoUrl ||
    project.liveDemoUrl ||
    project.liveDemo ||
    "";

  const githubUrl =
    project.githubUrl || project.github || project.repoUrl || "";

  const status = project.status || "In Progress";

  return (
    <motion.article
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.55,
        delay: (index % 3) * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -5 }}
      className="group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm transition-colors duration-300 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-indigo-500/50"
    >
      {/* Category and status always stay above the image */}
      <div className="relative z-10 flex min-h-14 w-full items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900 sm:px-4">
        <span className="inline-flex min-w-0 max-w-[62%] items-center truncate rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold leading-4 text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white">
          {project.category || "Software Development"}
        </span>

        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-lg border px-2.5 py-1.5 text-[11px] font-bold leading-4 shadow-sm ${getStatusStyle(
            status,
          )}`}
        >
          {status}
        </span>
      </div>

      {/* Project image */}
      <div className="relative aspect-[16/8] overflow-hidden border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
        {imageUrl && !imageError ? (
          <img
            src={resolveImageUrl(imageUrl)}
            alt={`${project.title || "Project"} preview`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-blue-500/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-white/80 text-indigo-600 shadow-sm dark:bg-slate-900/80 dark:text-indigo-300">
              <Icon size={26} strokeWidth={1.5} />
            </div>

            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {imageUrl ? "Image unavailable" : "Project Preview"}
            </span>
          </div>
        )}
      </div>

      {/* Project information */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h2 className="line-clamp-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
          {project.title || "Untitled Project"}
        </h2>

        <p className="mt-1.5 min-h-[1.25rem] line-clamp-3 whitespace-pre-line text-[13px] leading-5 text-slate-600 dark:text-slate-400">
          {project.description || "Project details will be updated soon."}
        </p>

        {/* Technologies */}
        <div className="mt-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Technologies
          </h3>

          {technologies.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {technologies.map((technology, techIndex) => (
                <span
                  key={`${technology}-${techIndex}`}
                  className="inline-flex w-fit max-w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium leading-4 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {technology}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Technologies not added yet.
            </p>
          )}
        </div>

        {/* Project links */}
        <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:px-4"
            >
              <span>View Demo</span>
              <ArrowUpRight size={16} className="shrink-0" />
            </a>
          )}

          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300 sm:px-4"
            >
              <Code2 size={16} className="shrink-0" />
              <span>GitHub</span>
              <ArrowUpRight size={15} className="shrink-0" />
            </a>
          )}

          {!liveUrl && !githubUrl && (
            <p className="text-sm text-slate-500">Project links coming soon.</p>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function ProjectSkeleton() {
  return (
    <div className="w-full animate-pulse overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="h-16 bg-slate-200 dark:bg-slate-800" />
      <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-800" />

      <div className="space-y-4 p-6">
        <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />

        <div className="flex gap-2">
          <div className="h-7 w-16 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-7 w-20 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [pageSettings, setPageSettings] = useState(DEFAULT_SETTINGS);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getProjects();

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.projects)
          ? data.projects
          : [];

      setProjects(items);
    } catch (err) {
      console.error("Load projects error:", err);
      setError(
        "We couldn't load the projects. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    let active = true;

    async function loadPageSettings() {
      try {
        const data = await getProjectsPageSettings();

        if (active && data && typeof data === "object") {
          setPageSettings({
            ...DEFAULT_SETTINGS,
            ...data,
          });
        }
      } catch (err) {
        console.error("Projects page settings error:", err);
      }
    }

    loadPageSettings();

    return () => {
      active = false;
    };
  }, []);

  // Only show unique category labels from the project data.
  const categories = useMemo(() => {
    const dynamicCategories = projects
      .map((project) =>
        typeof project.category === "string" ? project.category.trim() : "",
      )
      .filter(Boolean);

    const seen = new Set(["all", "in progress", "completed"]);
    const uniqueCategories = [];

    for (const category of dynamicCategories) {
      const key = category.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        uniqueCategories.push(category);
      }
    }

    return ["All", ...uniqueCategories, "In Progress", "Completed"];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const technologies = getTechnologies(
        project.tech ?? project.technologies ?? project.techStack,
      );

      const category = String(project.category || "").toLowerCase();
      const title = String(project.title || "").toLowerCase();
      const description = String(project.description || "").toLowerCase();
      const status = String(project.status || "In Progress").toLowerCase();
      const technologyText = technologies.join(" ").toLowerCase();

      const projectText =
        `${category} ${title} ${description} ${technologyText}`.toLowerCase();

      const selected = activeCategory.toLowerCase();
      let matchesCategory = selected === "all";

      if (!matchesCategory) {
        if (selected === "in progress") {
          matchesCategory = status.includes("progress");
        } else if (selected === "completed") {
          matchesCategory =
            status.includes("complete") || status.includes("live");
        } else if (selected === "python development") {
          matchesCategory =
            category.includes("python") ||
            title.includes("python") ||
            technologyText.includes("python");
        } else if (selected === "ai & machine learning") {
          matchesCategory =
            /ai|machine learning|\bml\b|llm|gemini|openai|model|interviewiq|neural|transformer/i.test(
              projectText,
            );
        } else if (selected === "backend development") {
          matchesCategory =
            /backend|node|express|mongodb|mongoose|api|server|database|sql/i.test(
              projectText,
            );
        } else {
          // Dynamic categories match the actual category from the API.
          matchesCategory = category === selected;
        }
      }

      const searchableText = [
        title,
        description,
        category,
        status,
        ...technologies,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [projects, search, activeCategory]);

  // Reset the mobile carousel when search/filter results change.
  useEffect(() => {
    setActiveProjectIndex(0);
  }, [filteredProjects]);

  // Auto-advance the mobile project carousel every 30 seconds.
  useEffect(() => {
    if (filteredProjects.length < 2) return undefined;

    const intervalId = window.setInterval(() => {
      if (window.matchMedia("(min-width: 1024px)").matches) return;
      setActiveProjectIndex(
        (current) => (current + 1) % filteredProjects.length,
      );
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [filteredProjects]);

  const showPreviousProject = () => {
    setActiveProjectIndex((current) =>
      current === 0 ? filteredProjects.length - 1 : current - 1,
    );
  };

  const showNextProject = () => {
    setActiveProjectIndex((current) => (current + 1) % filteredProjects.length);
  };

  const handleTouchStart = (event) => {
    const touch = event.touches?.[0];
    if (touch) setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (event) => {
    if (!touchStart) return;
    const touch = event.changedTouches?.[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // Only treat a clear horizontal gesture as a carousel swipe.
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) showNextProject();
      else showPreviousProject();
    }
    setTouchStart(null);
  };

  return (
    <main className="relative isolate overflow-hidden bg-transparent text-slate-900 dark:text-white">
      <motion.section
        id="projects"
        className="!mt-0 scroll-mt-24 mx-auto max-w-7xl px-5 !pt-0 pb-10 sm:px-8 sm:pb-14 lg:px-12 lg:pb-16"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{
          duration: 0.65,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* Section heading and search */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{
            duration: 0.55,
            delay: 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
              Explore my work
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Selected work
            </h2>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects or technologies..."
              aria-label="Search projects"
              className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3.5 pl-11 pr-11 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-500"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Filter buttons */}
        {!loading && !error && projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="mt-7 flex flex-wrap items-center gap-2"
          >
            <span className="mr-1 inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Filter size={15} />
              Filter
            </span>

            {categories.map((category, index) => (
              <motion.button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.035,
                }}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  activeCategory === category
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-300"
                }`}
              >
                {category}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 text-center"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <Code2 size={24} />
            </div>

            <h3 className="mt-4 text-lg font-semibold">Something went wrong</h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
              {error}
            </p>

            <button
              type="button"
              onClick={loadProjects}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Try again <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <ProjectSkeleton key={item} />
            ))}
          </div>
        )}

        {/* Mobile project carousel; desktop keeps the responsive grid. */}
        {!loading && !error && filteredProjects.length > 0 && (
          <>
            <div className="relative mt-7 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-3 shadow-xl shadow-slate-300/30 dark:border-slate-800 dark:bg-slate-950/60 dark:shadow-indigo-950/20 sm:p-5 lg:hidden">
              {/* Theme-aware animated background */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <motion.div
                  className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-600/20"
                  animate={{
                    x: [0, 35, 0],
                    y: [0, 20, 0],
                    scale: [1, 1.12, 1],
                  }}
                  transition={{
                    duration: 14,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/15"
                  animate={{
                    x: [0, -30, 0],
                    y: [0, -20, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 17,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(100,116,139,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
              </div>

              <div className="relative z-10 mb-4 flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                    Project Showcase
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Project {activeProjectIndex + 1} of{" "}
                    {filteredProjects.length}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous project"
                    onClick={showPreviousProject}
                    disabled={filteredProjects.length < 2}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 transition hover:border-indigo-500 hover:bg-indigo-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-indigo-500/20"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next project"
                    onClick={showNextProject}
                    disabled={filteredProjects.length < 2}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 transition hover:border-indigo-500 hover:bg-indigo-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-indigo-500/20"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div
                className="relative z-10 touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={() => setTouchStart(null)}
                aria-label="Projects carousel. Swipe left or right to browse projects."
              >
                <motion.div
                  key={
                    filteredProjects[activeProjectIndex]?._id ||
                    activeProjectIndex
                  }
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-full"
                >
                  <ProjectCard
                    project={filteredProjects[activeProjectIndex]}
                    index={activeProjectIndex}
                  />
                </motion.div>
              </div>

              <div
                className="relative z-10 mt-4 flex flex-wrap items-center justify-center gap-2"
                aria-label="Choose project"
              >
                {filteredProjects.map((project, index) => (
                  <button
                    key={project._id || project.id || project.title || index}
                    type="button"
                    onClick={() => setActiveProjectIndex(index)}
                    aria-label={`Show project ${index + 1}: ${project.title || "Project"}`}
                    aria-current={
                      activeProjectIndex === index ? "true" : undefined
                    }
                    className={`h-3 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                      activeProjectIndex === index
                        ? "w-9 bg-indigo-600 dark:bg-indigo-400"
                        : "w-3 bg-slate-400 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-300"
                    }`}
                  />
                ))}
              </div>
              <p className="relative z-10 mt-3 text-center text-xs text-slate-600 dark:text-slate-300">
                Swipe to explore · Auto changes every 30 seconds
              </p>
            </div>

            {/* Desktop grid */}
            <div className="mt-7 hidden w-full items-stretch gap-4 sm:grid-cols-2 lg:grid lg:grid-cols-3 lg:gap-5">
              {filteredProjects.map((project, index) => (
                <ProjectCard
                  key={project._id || project.id || project.title || index}
                  project={project}
                  index={index}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !error && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 rounded-3xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-800"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
              {projects.length === 0 ? (
                <FolderCode size={27} />
              ) : (
                <Search size={27} />
              )}
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              {projects.length === 0
                ? "Projects are coming soon"
                : "No matching projects"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">
              {projects.length === 0
                ? "New projects will appear here as they are added to the portfolio."
                : "Try another search term or reset your filters to explore all projects."}
            </p>

            {(search || activeCategory !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All");
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:hover:text-indigo-300"
              >
                Clear filters <ArrowDownRight size={16} />
              </button>
            )}
          </motion.div>
        )}

        {/* Ending animation */}
        <motion.div
          initial={{ opacity: 0, y: 18, scaleX: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scaleX: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            duration: 0.6,
            delay: 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative mt-14 overflow-hidden rounded-2xl border border-indigo-500/15 bg-gradient-to-r from-indigo-500/[0.06] via-violet-500/[0.08] to-cyan-500/[0.06] px-5 py-5 sm:mt-16 sm:px-7"
        >
          <motion.div
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{
              duration: 0.9,
              delay: 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400"
          />

          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                More ideas. More things to build.
              </p>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                I’m always learning, experimenting, and improving my projects.
              </p>
            </div>

            <motion.span
              aria-hidden="true"
              animate={{ x: [0, 5, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-indigo-500"
            >
              <ArrowRight size={20} />
            </motion.span>
          </div>
        </motion.div>
      </motion.section>
    </main>
  );
}
