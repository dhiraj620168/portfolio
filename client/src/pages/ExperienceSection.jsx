import { useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  MapPin,
  ExternalLink,
  Code2,
  AlertCircle,
  GraduationCap,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import api from "../services/api";

const EXPERIENCE_LABELS = {
  "working-professional": "Professional Experience",
  internship: "Internship",
  "industrial-training": "Industrial Training",
  freelance: "Freelance",
  contract: "Contract",
};

function humanizeLabel(value = "") {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getExperienceArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.experiences)) {
    return response.experiences;
  }
  if (Array.isArray(response?.data?.experiences)) {
    return response.data.experiences;
  }

  return [];
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function LabeledValue({ label, value }) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    typeof value === "boolean"
  ) {
    return null;
  }

  return (
    <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {label}
      </p>

      <p className="whitespace-pre-line break-words text-sm leading-6 text-slate-800 dark:text-slate-100">
        {String(value)}
      </p>
    </div>
  );
}

function DetailLink({ href, children }) {
  if (!isHttpUrl(href)) return null;

  return (
    <a
      href={href.trim()}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-600/30 px-3 py-2 text-sm font-bold text-cyan-800 transition hover:bg-cyan-500/10 dark:border-cyan-400/30 dark:text-cyan-300"
    >
      {children}
      <ExternalLink size={15} />
    </a>
  );
}

function ExperienceCard({ item }) {
  const [logoFailed, setLogoFailed] = useState(false);

  const details = item.details || {};

  const logoUrl = isHttpUrl(item.institutionLogoUrl)
    ? item.institutionLogoUrl.trim()
    : "";

  const technologies = Array.isArray(item.tech)
    ? item.tech.filter((tech) => typeof tech === "string" && tech.trim())
    : [];

  const startDate = formatDate(item.startDate) || "Not specified";

  const endDate = item.currentlyWorking
    ? "Present"
    : formatDate(item.endDate) || "Not specified";

  const companyUrl = isHttpUrl(item.companyUrl) ? item.companyUrl.trim() : "";

  const categoryTitles = {
    "working-professional": "Professional Details",
    internship: "Internship Details",
    "industrial-training": "Training Details",
    freelance: "Freelance Project Details",
    contract: "Contract Details",
  };

  return (
    <article className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-900">
      {/* Role and organization */}
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 dark:border-slate-600">
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt={`${item.company || "Organization"} logo`}
              className="h-full w-full object-contain"
              loading="lazy"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">
              {item.experienceType === "industrial-training" ||
              item.experienceType === "internship" ? (
                <GraduationCap size={26} />
              ) : (
                <BriefcaseBusiness size={25} />
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-900 dark:bg-violet-400/15 dark:text-violet-200">
              {EXPERIENCE_LABELS[item.experienceType] ||
                humanizeLabel(item.experienceType || "Experience")}
            </span>

            {item.currentlyWorking && (
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200">
                Currently Working
              </span>
            )}
          </div>

          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Role
          </p>

          <h3 className="break-words text-xl font-extrabold leading-snug text-slate-950 dark:text-white sm:text-2xl">
            {item.role || "Not specified"}
          </h3>

          <p className="mb-1 mt-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Organization
          </p>

          <p className="flex items-start gap-2 break-words text-base font-bold leading-6 text-cyan-800 dark:text-cyan-300 sm:text-lg">
            <Building2 size={17} className="mt-1 shrink-0" />
            {item.company || "Not specified"}
          </p>
        </div>
      </div>

      {/* Location */}
      {item.location && (
        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-5">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Location
          </p>

          <p className="flex items-center gap-2 text-base text-slate-800 dark:text-slate-100">
            <MapPin
              size={17}
              className="shrink-0 text-violet-700 dark:text-violet-300"
            />
            {item.location}
          </p>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 border-t border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-5">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Start Date
          </p>

          <p className="break-words text-base font-medium text-slate-800 dark:text-slate-100">
            {startDate}
          </p>
        </div>

        <div className="min-w-0">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            End Date
          </p>

          <p className="break-words text-base font-medium text-slate-800 dark:text-slate-100">
            {endDate}
          </p>
        </div>
      </div>

      {/* Technologies */}
      {technologies.length > 0 && (
        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            <Code2 size={16} className="text-cyan-700 dark:text-cyan-300" />
            Technologies
          </p>

          <div className="flex flex-wrap gap-2">
            {technologies.map((tech, index) => (
              <span
                key={`${tech}-${index}`}
                className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Responsibilities */}
      {item.description && (
        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Responsibilities &amp; Achievements
          </p>

          <p className="whitespace-pre-line break-words text-base leading-7 text-slate-800 dark:text-slate-100">
            {item.description}
          </p>
        </div>
      )}

      {/* Category-specific details */}
      {item.details && typeof item.details === "object" && (
        <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-5">
          <h4 className="mb-3 text-lg font-extrabold text-slate-950 dark:text-white">
            {categoryTitles[item.experienceType] || "Additional Details"}
          </h4>

          <div className="flex flex-wrap gap-3">
            {item.experienceType === "working-professional" && (
              <>
                <LabeledValue label="Department" value={details.department} />
                <LabeledValue
                  label="Achievements"
                  value={details.achievements}
                />
              </>
            )}

            {item.experienceType === "internship" && (
              <>
                <LabeledValue label="Paid Status" value={details.paidStatus} />
                <LabeledValue label="Mentor" value={details.mentor} />
                <LabeledValue
                  label="Learning Outcomes"
                  value={details.learningOutcomes}
                />
              </>
            )}

            {item.experienceType === "industrial-training" && (
              <>
                <LabeledValue
                  label="Training Program"
                  value={details.trainingProgram}
                />
                <LabeledValue label="Trainer" value={details.trainer} />
              </>
            )}

            {item.experienceType === "freelance" && (
              <>
                <LabeledValue label="Client Name" value={details.clientName} />
                <LabeledValue
                  label="Deliverables"
                  value={details.deliverables}
                />
              </>
            )}

            {item.experienceType === "contract" && (
              <>
                <LabeledValue
                  label="Contract Type"
                  value={details.contractType}
                />
                <LabeledValue label="Client Name" value={details.clientName} />
                <LabeledValue
                  label="Deliverables"
                  value={details.deliverables}
                />
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {item.experienceType === "industrial-training" && (
              <DetailLink href={details.certificateUrl}>
                View Certificate
              </DetailLink>
            )}

            {item.experienceType === "freelance" && (
              <DetailLink href={details.projectUrl}>View Project</DetailLink>
            )}
          </div>
        </div>
      )}

      {/* Organization website */}
      {companyUrl && (
        <div className="flex justify-end border-t border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-5">
          <a
            href={companyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-cyan-800 hover:text-cyan-950 dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            Organization Website
            <ExternalLink size={15} />
          </a>
        </div>
      )}
    </article>
  );
}

export default function ExperienceSection() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let mounted = true;

    async function loadExperiences() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/experiences");

        if (!mounted) return;

        const records = getExperienceArray(response)
          .filter((item) => item && item.isVisible !== false)
          .sort(
            (a, b) =>
              new Date(b.startDate || 0).getTime() -
              new Date(a.startDate || 0).getTime(),
          );

        setExperiences(records);
        setActiveIndex(0);
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load experience records.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadExperiences();

    return () => {
      mounted = false;
    };
  }, []);

  function showPrevious() {
    setActiveIndex((current) =>
      current === 0 ? experiences.length - 1 : current - 1,
    );
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % experiences.length);
  }

  // Automatically advance on mobile every 30 seconds.
  useEffect(() => {
    if (experiences.length < 2) return;

    const intervalId = window.setInterval(() => {
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        setActiveIndex((current) => (current + 1) % experiences.length);
      }
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [experiences.length]);

  const touchStartX = useRef(null);

  function handleTouchStart(event) {
    touchStartX.current = event.touches?.[0]?.clientX ?? null;
  }

  function handleTouchEnd(event) {
    if (touchStartX.current === null) return;

    const touchEndX = event.changedTouches?.[0]?.clientX;
    const deltaX = touchEndX - touchStartX.current;
    touchStartX.current = null;

    // Ignore short taps and preserve normal vertical page scrolling.
    if (Math.abs(deltaX) < 45 || experiences.length < 2) return;
    if (deltaX < 0) showNext();
    else showPrevious();
  }

  return (
    <>
      <style>{`
        .experience-background-grid {
          background-size: 32px 32px;
          animation: experience-grid-drift 30s linear infinite;
        }

        @keyframes experience-grid-drift {
          from { background-position: 0 0; }
          to { background-position: 32px 32px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .experience-background-grid {
            animation: none !important;
          }
        }
      `}</style>

      <motion.section
        id="experience"
        className="relative scroll-mt-24 py-0"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.05 }}
        transition={{
          duration: reduceMotion ? 0 : 0.55,
          ease: "easeOut",
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 lg:px-12 lg:pb-20">
          {/* Theme-aware heading */}
          <motion.h2
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: reduceMotion ? 0 : 0.5,
            }}
            className="mb-8 text-left text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-6xl lg:text-7xl"
          >
            My{" "}
            <span className="bg-gradient-to-r from-violet-700 via-purple-600 to-cyan-700 bg-clip-text text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-cyan-400">
              Experience
            </span>
          </motion.h2>

          {loading && (
            <div className="h-[420px] animate-pulse rounded-3xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900" />
          )}

          {!loading && error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-base text-rose-900 dark:border-rose-400/30 dark:bg-rose-950/30 dark:text-rose-200"
            >
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Experience could not be loaded</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && experiences.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <BriefcaseBusiness
                size={32}
                className="mx-auto text-slate-600 dark:text-slate-300"
              />
              <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                No experience to display
              </p>
              <p className="mt-2 text-base text-slate-700 dark:text-slate-300">
                Add an experience in the admin dashboard and make it visible on
                your portfolio.
              </p>
            </div>
          )}

          {!loading && !error && experiences.length > 0 && (
            <div className="relative isolate w-full overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-xl shadow-slate-300/40 dark:border-slate-700 dark:bg-slate-950/90 dark:shadow-violet-950/20 sm:p-5 lg:p-6">
              {/* Animated background glows */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
              >
                <motion.div
                  className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl dark:bg-violet-600/20"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          x: [0, 55, 0],
                          y: [0, 28, 0],
                          scale: [1, 1.15, 1],
                        }
                  }
                  transition={{
                    duration: 14,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <motion.div
                  className="absolute -right-16 -top-16 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/15"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          x: [0, -45, 0],
                          y: [0, 45, 0],
                          scale: [1, 1.12, 1],
                        }
                  }
                  transition={{
                    duration: 17,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <motion.div
                  className="absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-500/15"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          x: [0, 45, 0],
                          y: [0, -35, 0],
                        }
                  }
                  transition={{
                    duration: 19,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <div className="experience-background-grid absolute inset-0 bg-[linear-gradient(rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)]" />
              </div>

              {/* Slider navigation */}
              <div className="mb-4 flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-800 dark:text-violet-300">
                    Career Journey
                  </p>
                  <p className="mt-1 text-base text-slate-700 dark:text-slate-300">
                    Experience {activeIndex + 1} of {experiences.length}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous experience"
                    onClick={showPrevious}
                    disabled={experiences.length < 2}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 transition hover:border-violet-500 hover:bg-violet-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-violet-500/20"
                  >
                    <ChevronLeft size={21} />
                  </button>

                  <button
                    type="button"
                    aria-label="Next experience"
                    onClick={showNext}
                    disabled={experiences.length < 2}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 transition hover:border-violet-500 hover:bg-violet-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-violet-500/20"
                  >
                    <ChevronRight size={21} />
                  </button>
                </div>
              </div>

              {/* Content-sized card viewport: no internal vertical scrolling.
                  Swipe left/right on touch devices to change experiences. */}
              <div
                className="relative w-full overflow-hidden rounded-2xl touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                aria-label="Experience carousel. Swipe left or right to change experience."
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={experiences[activeIndex]?._id || activeIndex}
                    initial={reduceMotion ? false : { opacity: 0, x: 45 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -45 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.3,
                      ease: "easeInOut",
                    }}
                    className="relative w-full rounded-2xl"
                  >
                    <ExperienceCard item={experiences[activeIndex]} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Pagination dots */}
              <div
                className="mt-5 flex flex-wrap items-center justify-center gap-2"
                aria-label="Choose experience"
              >
                {experiences.map((item, index) => (
                  <button
                    key={item._id || `${item.company}-${item.role}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Show experience ${index + 1}: ${
                      item.role || item.company || "Experience"
                    }`}
                    aria-current={activeIndex === index ? "true" : undefined}
                    className={`h-3 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                      activeIndex === index
                        ? "w-9 bg-violet-600 dark:bg-violet-400"
                        : "w-3 bg-slate-400 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-300"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-3 text-center text-sm text-slate-700 dark:text-slate-300">
                {activeIndex + 1} / {experiences.length} · Use arrows or dots to
                explore
              </p>
            </div>
          )}
        </div>
      </motion.section>
    </>
  );
}
