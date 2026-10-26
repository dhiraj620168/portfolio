import { useCallback, useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  CalendarDays,
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  School,
  Building2,
  Percent,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import api from "../services/api";

const ENGINEERING_FIELDS = [
  "Software Engineering",
  "Artificial Intelligence",
  "Machine Learning",
  "Data Science",
  "Computer Engineering",
  "Full Stack Development",
  "Cloud Engineering",
  "Robotics Engineering",
];

const DEGREE_LABELS = {
  "10th": "Secondary Education",
  "12th": "Higher Secondary Education",
  Diploma: "Diploma",
  Graduation: "Undergraduate Degree",
  "Post-Graduation": "Postgraduate Degree",
  PhD: "Doctoral Degree",
  Other: "Additional Qualification",
};

const getDegreeLabel = (degree = "") =>
  DEGREE_LABELS[degree] || degree || "Education";

const getEducationArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.education)) return response.education;
  if (Array.isArray(response?.data?.education)) {
    return response.data.education;
  }
  return [];
};

const isHttpUrl = (value) =>
  typeof value === "string" && /^https?:\/\//i.test(value.trim());

const isSecondary = (degree = "") => ["10th", "12th"].includes(degree.trim());

const isGraduation = (degree = "") =>
  ["Graduation", "Post-Graduation", "PhD"].includes(degree.trim());

function EngineeringText({ reduceMotion }) {
  const [fieldIndex, setFieldIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return undefined;

    const timer = setInterval(() => {
      setFieldIndex((current) => (current + 1) % ENGINEERING_FIELDS.length);
    }, 2400);

    return () => clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div className="mt-3 flex min-h-7 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="text-slate-600 dark:text-slate-300">
        Exploring the world of
      </span>

      <span className="relative inline-grid min-w-[225px] overflow-hidden font-bold text-violet-700 dark:text-violet-300">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={ENGINEERING_FIELDS[fieldIndex]}
            initial={
              reduceMotion ? false : { opacity: 0, y: 12, filter: "blur(3px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={
              reduceMotion
                ? undefined
                : { opacity: 0, y: -12, filter: "blur(3px)" }
            }
            transition={{ duration: 0.35 }}
            className="col-start-1 row-start-1 whitespace-nowrap"
          >
            {ENGINEERING_FIELDS[fieldIndex]}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}

function AnimatedItem({ children, delay = 0, reduceMotion, className = "" }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.4, delay, ease: "easeOut" }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ResultItem({ label, value, icon: Icon, delay, reduceMotion }) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  return (
    <AnimatedItem
      delay={delay}
      reduceMotion={reduceMotion}
      className="min-w-0 rounded-xl border border-amber-300/40 bg-amber-50/80 p-3 dark:border-amber-400/20 dark:bg-amber-400/5 sm:p-4"
    >
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
        <Icon size={17} className="shrink-0" />
        <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 break-words text-base font-extrabold text-amber-950 dark:text-amber-100">
        {value}
      </p>
    </AnimatedItem>
  );
}

function EducationCard({ item, reduceMotion }) {
  const [logoFailed, setLogoFailed] = useState(false);

  const logoUrl = isHttpUrl(item.institutionLogoUrl)
    ? item.institutionLogoUrl.trim()
    : "";

  const secondary = isSecondary(item.degree);
  const graduation = isGraduation(item.degree);

  // Prefer dedicated result fields; support existing grade/gradeType fields.
  const marks =
    item.marks ??
    (item.gradeType?.toLowerCase().includes("mark") ? item.grade : undefined);

  const percentage = item.percentage;
  const division = item.division;
  const cgpa =
    item.cgpa ??
    (item.gradeType?.toLowerCase().includes("cgpa") ? item.grade : undefined);

  const showMarks = secondary && marks != null && String(marks).trim() !== "";
  const showPercentage =
    (secondary || graduation) &&
    percentage != null &&
    String(percentage).trim() !== "";
  const showDivision =
    secondary && division != null && String(division).trim() !== "";
  const showCgpa = graduation && cgpa != null && String(cgpa).trim() !== "";

  const boardLabel = secondary
    ? "Education Board"
    : item.degree === "Diploma"
      ? "Technical Board / University"
      : graduation
        ? "University"
        : "Board / University";

  const boardName = item.boardOrUniversity || item.board || item.university;

  const hasAcademicResults =
    showMarks || showPercentage || showDivision || showCgpa;

  const reveal = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduceMotion ? 0 : 0.4,
      delay: reduceMotion ? 0 : delay,
      ease: "easeOut",
    },
  });

  return (
    <article className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Qualification and institution / field side by side */}
      <motion.div
        {...reveal(0.03)}
        className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5"
      >
        <motion.div
          {...(reduceMotion
            ? {}
            : {
                initial: { opacity: 0, scale: 0.75, rotate: -8 },
                animate: { opacity: 1, scale: 1, rotate: 0 },
                transition: { duration: 0.45, delay: 0.05 },
              })}
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 dark:border-slate-600 sm:h-14 sm:w-14"
        >
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt={`${item.institution || "Institution"} logo`}
              className="h-full w-full object-contain"
              loading="lazy"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <GraduationCap
              size={25}
              className="text-violet-700 dark:text-violet-300"
            />
          )}
        </motion.div>

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {/* Left: institution */}
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-2">
              <motion.span
                {...reveal(0.07)}
                className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-900 dark:bg-violet-400/15 dark:text-violet-200"
              >
                {item.degree || "Education"}
              </motion.span>

              <motion.span
                {...reveal(0.12)}
                className="rounded-full border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:border-violet-400/20 dark:text-violet-300"
              >
                {getDegreeLabel(item.degree)}
              </motion.span>
            </div>

            <AnimatedItem delay={0.15} reduceMotion={reduceMotion}>
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Institution
              </p>
              <h3 className="break-words text-lg font-extrabold leading-snug text-slate-950 dark:text-white sm:text-xl">
                {item.institution || "Not specified"}
              </h3>
            </AnimatedItem>

            {item.isCurrentlyStudying && (
              <AnimatedItem delay={0.2} reduceMotion={reduceMotion}>
                <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200">
                  Currently Studying
                </span>
              </AnimatedItem>
            )}
          </div>

          {/* Right: field of study */}
          <div className="min-w-0 md:border-l md:border-slate-200 md:pl-5 dark:md:border-slate-700">
            <AnimatedItem delay={0.2} reduceMotion={reduceMotion}>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <BookOpen size={15} className="shrink-0 text-violet-500" />
                Field of Study
              </p>

              <p className="break-words text-base font-semibold leading-6 text-slate-800 dark:text-slate-100">
                {item.fieldOfStudy || "Not specified"}
              </p>
            </AnimatedItem>

            {boardName && (
              <AnimatedItem delay={0.26} reduceMotion={reduceMotion}>
                <div className="mt-4">
                  <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {secondary || item.degree === "Diploma" ? (
                      <School size={15} className="shrink-0 text-violet-500" />
                    ) : (
                      <Building2
                        size={15}
                        className="shrink-0 text-violet-500"
                      />
                    )}
                    {boardLabel}
                  </p>
                  <p className="break-words text-sm font-medium text-slate-700 dark:text-slate-200">
                    {boardName}
                  </p>
                </div>
              </AnimatedItem>
            )}
          </div>
        </div>
      </motion.div>

      {/* Shared date container: start left, completion right */}
      <motion.div
        {...reveal(0.2)}
        className="grid grid-cols-2 gap-3 border-y border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/40 sm:gap-5 sm:p-4"
      >
        <motion.div
          {...reveal(0.24)}
          className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-left dark:border-slate-700 dark:bg-slate-900 sm:p-4"
        >
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            <CalendarDays size={14} className="shrink-0 text-violet-500" />
            Start Year
          </p>
          <p className="mt-2 break-words text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
            {item.startYear || "Not specified"}
          </p>
        </motion.div>

        <motion.div
          {...reveal(0.3)}
          className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 text-right dark:border-slate-700 dark:bg-slate-900 sm:p-4"
        >
          <p className="flex items-center justify-end gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Completion Year
            <CalendarDays size={14} className="shrink-0 text-violet-500" />
          </p>
          <p className="mt-2 break-words text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
            {item.isCurrentlyStudying
              ? "Present"
              : item.endYear || "Not specified"}
          </p>
        </motion.div>
      </motion.div>

      {/* Qualification-specific academic results */}
      <div className="border-b border-slate-200 p-3 dark:border-slate-700 sm:p-4">
        <AnimatedItem delay={0.3} reduceMotion={reduceMotion}>
          <div className="mb-3 flex items-center gap-2">
            <Award size={19} className="text-amber-500" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Academic Achievement
            </h4>
          </div>
        </AnimatedItem>

        {hasAcademicResults ? (
          <div
            className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
              secondary ? "lg:grid-cols-3" : ""
            }`}
          >
            {secondary && (
              <>
                <ResultItem
                  label="Marks"
                  value={showMarks ? marks : null}
                  icon={Award}
                  delay={0.34}
                  reduceMotion={reduceMotion}
                />
                <ResultItem
                  label="Percentage"
                  value={showPercentage ? `${percentage}%` : null}
                  icon={Percent}
                  delay={0.4}
                  reduceMotion={reduceMotion}
                />
                <ResultItem
                  label="Division"
                  value={showDivision ? division : null}
                  icon={Trophy}
                  delay={0.46}
                  reduceMotion={reduceMotion}
                />
              </>
            )}

            {graduation && (
              <>
                <ResultItem
                  label="Percentage"
                  value={showPercentage ? `${percentage}%` : null}
                  icon={Percent}
                  delay={0.34}
                  reduceMotion={reduceMotion}
                />
                <ResultItem
                  label="CGPA"
                  value={showCgpa ? cgpa : null}
                  icon={Award}
                  delay={0.4}
                  reduceMotion={reduceMotion}
                />
              </>
            )}

            {!secondary && !graduation && (
              <ResultItem
                label={item.gradeType || "Grade"}
                value={item.grade}
                icon={Award}
                delay={0.34}
                reduceMotion={reduceMotion}
              />
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No academic result details have been added for this qualification.
          </p>
        )}
      </div>

      {/* Full description remains visible; card height grows with content */}
      {item.description && (
        <AnimatedItem delay={0.4} reduceMotion={reduceMotion}>
          <div className="p-4 sm:p-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Academic Details & Achievements
            </p>
            <p className="whitespace-pre-line break-words text-sm leading-7 text-slate-800 dark:text-slate-100 sm:text-base">
              {item.description}
            </p>
          </div>
        </AnimatedItem>
      )}
    </article>
  );
}

export default function EducationSection() {
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const reduceMotion = useReducedMotion();
  const touchStartX = useRef(null);

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null || education.length < 2) return;
    const deltaX =
      (event.changedTouches[0]?.clientX ?? touchStartX.current) -
      touchStartX.current;
    if (Math.abs(deltaX) > 45) {
      if (deltaX < 0) showNext();
      else showPrevious();
    }
    touchStartX.current = null;
  };

  const loadEducation = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/education");
      const records = getEducationArray(response.data)
        .filter((item) => item && item.isVisible !== false)
        .sort(
          (a, b) =>
            (a.order ?? 0) - (b.order ?? 0) ||
            (b.endYear ?? 0) - (a.endYear ?? 0),
        );

      setEducation(records);
      setActiveIndex(0);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load education records.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchEducation() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/education");
        if (!mounted) return;

        const records = getEducationArray(response.data)
          .filter((item) => item && item.isVisible !== false)
          .sort(
            (a, b) =>
              (a.order ?? 0) - (b.order ?? 0) ||
              (b.endYear ?? 0) - (a.endYear ?? 0),
          );

        setEducation(records);
        setActiveIndex(0);
      } catch (err) {
        if (mounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load education records.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchEducation();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (education.length < 2 || reduceMotion) return undefined;

    const timer = window.setInterval(() => {
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        setActiveIndex((current) => (current + 1) % education.length);
      }
    }, 30000);

    return () => window.clearInterval(timer);
  }, [education.length, reduceMotion]);

  const showPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? education.length - 1 : current - 1,
    );
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % education.length);
  };

  return (
    <>
      <motion.section
        id="education"
        className="relative scroll-mt-24 py-0"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.05 }}
        transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
      >
        {/* Same homepage alignment as ExperienceSection */}
        <div className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 lg:px-12 lg:pb-20">
          <motion.h2
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: reduceMotion ? 0 : 0.5 }}
            className="mb-4 text-left text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-6xl lg:text-7xl"
          >
            My{" "}
            <span className="bg-gradient-to-r from-violet-700 via-purple-600 to-cyan-700 bg-clip-text text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-cyan-400">
              Education
            </span>
          </motion.h2>

          <p className="mb-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            My academic journey, qualifications and the foundation behind my
            engineering interests.
          </p>

          <EngineeringText reduceMotion={reduceMotion} />

          {loading && (
            <div className="h-[420px] animate-pulse rounded-3xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900" />
          )}

          {!loading && error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-900 dark:border-rose-400/30 dark:bg-rose-950/30 dark:text-rose-200"
            >
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Education could not be loaded</p>
                <p className="mt-1 break-words">{error}</p>
                <button
                  type="button"
                  onClick={loadEducation}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700"
                >
                  <RefreshCw size={15} />
                  Retry
                </button>
              </div>
            </div>
          )}

          {!loading && !error && education.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <GraduationCap
                size={32}
                className="mx-auto text-slate-600 dark:text-slate-300"
              />
              <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                No education to display
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Add education records in the admin dashboard and make them
                visible on your portfolio.
              </p>
            </div>
          )}

          {!loading && !error && education.length > 0 && (
            <div className="relative isolate w-full overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-xl shadow-slate-300/40 dark:border-slate-700 dark:bg-slate-950/90 dark:shadow-violet-950/20 sm:p-5 lg:p-6">
              <div className="mb-4 flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-800 dark:text-violet-300">
                    Academic Journey
                  </p>
                  <p className="mt-1 text-base text-slate-700 dark:text-slate-300">
                    Education {activeIndex + 1} of {education.length}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous education"
                    onClick={showPrevious}
                    disabled={education.length < 2}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 transition hover:border-violet-500 hover:bg-violet-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-violet-500/20"
                  >
                    <ChevronLeft size={21} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next education"
                    onClick={showNext}
                    disabled={education.length < 2}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 transition hover:border-violet-500 hover:bg-violet-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-violet-500/20"
                  >
                    <ChevronRight size={21} />
                  </button>
                </div>
              </div>

              {/* Content-height slide: the page scrolls normally, not inside the card */}
              <div
                className="relative w-full overflow-hidden rounded-2xl touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={education[activeIndex]?._id || activeIndex}
                    initial={reduceMotion ? false : { opacity: 0, x: 45 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -45 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.3,
                      ease: "easeInOut",
                    }}
                    className="relative w-full rounded-2xl"
                  >
                    <EducationCard
                      item={education[activeIndex]}
                      reduceMotion={reduceMotion}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div
                className="mt-5 flex flex-wrap items-center justify-center gap-2"
                aria-label="Choose education"
              >
                {education.map((item, index) => (
                  <button
                    key={item._id || `${item.institution}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Show education ${index + 1}: ${
                      item.institution || item.degree || "Education"
                    }`}
                    aria-current={activeIndex === index ? "true" : undefined}
                    className={`h-3 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      activeIndex === index
                        ? "w-9 bg-violet-600 dark:bg-violet-400"
                        : "w-3 bg-slate-400 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-300"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-3 text-center text-sm text-slate-700 dark:text-slate-300">
                {activeIndex + 1} / {education.length} · Use arrows or dots to
                explore
              </p>
            </div>
          )}

          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <BookOpen size={16} className="text-violet-500" />
            Always learning. Always growing.
          </div>
        </div>
      </motion.section>
    </>
  );
}
