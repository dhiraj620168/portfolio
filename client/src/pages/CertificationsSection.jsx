import { useEffect, useState } from "react";
import {
  Award,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import api from "../services/api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;

function resolveFileUrl(url) {
  if (!url || typeof url !== "string") return "";

  const value = url.trim();

  if (/^https?:\/\//i.test(value)) return value;

  return `${API_ORIGIN}/${value.replace(/^\/+/, "")}`;
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

function getCertificateStatus(expiryDate) {
  if (!expiryDate) {
    return {
      label: "No Expiry",
      classes:
        "bg-blue-100 text-blue-900 dark:bg-blue-400/15 dark:text-blue-200",
    };
  }

  const expiry = new Date(expiryDate);

  if (Number.isNaN(expiry.getTime())) {
    return {
      label: "Status Unavailable",
      classes:
        "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) {
    return {
      label: "Expired",
      classes:
        "bg-rose-100 text-rose-900 dark:bg-rose-400/15 dark:text-rose-200",
    };
  }

  return {
    label: "Valid",
    classes:
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-200",
  };
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function getCertificationArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.certifications)) {
    return response.certifications;
  }
  if (Array.isArray(response?.data?.certifications)) {
    return response.data.certifications;
  }

  return [];
}

function CertificationCard({ item }) {
  const status = getCertificateStatus(item.expiryDate);

  const certificateUrl = resolveFileUrl(
    item.certificateFileUrl || item.imageUrl,
  );

  const verifyUrl = isHttpUrl(item.credentialUrl)
    ? item.credentialUrl.trim()
    : "";

  const skills = Array.isArray(item.skills)
    ? item.skills.filter((skill) => typeof skill === "string" && skill.trim())
    : [];

  return (
    <article className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Header: icon on left, title and badges on right */}
      <div className="flex items-start gap-4 border-b border-slate-200 p-4  dark:border-slate-700 sm:p-5">
        <div className="flex h-14 w-14 shrink-0 items-center m-auto justify-center rounded-xl border border-slate-200 bg-white p-1.5 dark:border-slate-600 dark:bg-slate-800">
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">
            <Award size={27} />
          </div>
        </div>

        <div className="min-w-0 flex-1 text-left">
          <p className=" text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Certification IN
          </p>

          <h3 className="break-words text-xl font-extrabold leading-snug text-slate-950 dark:text-white sm:text-2xl">
            {item.title || "Untitled Certificate"}
          </h3>
        </div>
      </div>

      {/* Organization */}
      <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Organization
        </p>

        <p className="flex items-start gap-2 break-words text-base font-bold leading-6 text-cyan-800 dark:text-cyan-300">
          <Building2 size={17} className="mt-1 shrink-0" />
          {item.issuer || "Not specified"}
        </p>
      </div>

      {/* Dates and credential ID */}
      <div className="grid grid-cols-1 gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:grid-cols-3 sm:px-5">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            <CalendarDays size={15} />
            Issue Date
          </p>

          <p className="break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
            {formatDate(item.issueDate) || "Not specified"}
          </p>
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            <CalendarDays size={15} />
            Expiry Date
          </p>

          <p className="break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
            {formatDate(item.expiryDate) || "No expiry"}
          </p>
        </div>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Credential ID
          </p>

          <p className="break-all text-sm font-semibold text-slate-800 dark:text-slate-100">
            {item.credentialId || "Not provided"}
          </p>
        </div>
      </div>

      {/* Topics covered */}
      <div className="border-b border-slate-200 px-4 py-5 dark:border-slate-700 sm:px-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Topics Covered
        </p>

        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No topics added.
          </p>
        )}
      </div>

      {/* Description */}
      <div className="border-b border-slate-200 px-4 py-5 dark:border-slate-700 sm:px-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Description
        </p>

        <p className="whitespace-pre-line break-words text-base leading-7 text-slate-800 dark:text-slate-100">
          {item.description || "No description provided."}
        </p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:gap-5 sm:p-6">
        {certificateUrl ? (
          <a
            href={certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-violet-600/40 px-4 py-3 text-sm font-bold text-violet-800 transition hover:bg-violet-500/10 dark:border-violet-400/40 dark:text-violet-300 dark:hover:bg-violet-500/10"
          >
            <FileText size={18} />
            View Certificate
            <ExternalLink size={15} />
          </a>
        ) : (
          <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-400 dark:border-slate-700">
            <FileText size={18} />
            File Unavailable
          </span>
        )}

        {verifyUrl ? (
          <a
            href={verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            <ShieldCheck size={18} />
            Verify Credential
            <ExternalLink size={15} />
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-3 text-sm font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          >
            <ShieldCheck size={18} />
            Verify Unavailable
          </button>
        )}
      </div>
    </article>
  );
}

export default function CertificationsSection() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let mounted = true;

    async function loadCertifications() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/certifications");

        if (!mounted) return;

        const records = getCertificationArray(response)
          .filter((item) => item && item.isVisible !== false)
          .sort((a, b) => {
            const orderDifference =
              (Number(a.order) || 0) - (Number(b.order) || 0);

            if (orderDifference !== 0) return orderDifference;

            return (
              new Date(b.issueDate || 0).getTime() -
              new Date(a.issueDate || 0).getTime()
            );
          });

        setCertifications(records);
        setActiveIndex(0);
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load certification records.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCertifications();

    return () => {
      mounted = false;
    };
  }, [retryCount]);

  function showPrevious() {
    setActiveIndex((current) =>
      current === 0 ? certifications.length - 1 : current - 1,
    );
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % certifications.length);
  }

  return (
    <>
      <style>{`
        .certification-background-grid {
          background-size: 32px 32px;
          animation: certification-grid-drift 30s linear infinite;
        }

        @keyframes certification-grid-drift {
          from { background-position: 0 0; }
          to { background-position: 32px 32px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .certification-background-grid {
            animation: none !important;
          }
        }
      `}</style>

      <motion.section
        id="certifications"
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
          <motion.h2
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: reduceMotion ? 0 : 0.5 }}
            className="mb-8 text-left text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-6xl lg:text-7xl"
          >
            My{" "}
            <span className="bg-gradient-to-r from-violet-700 via-purple-600 to-cyan-700 bg-clip-text text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-cyan-400">
              Certifications
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

              <div className="min-w-0 flex-1">
                <p className="font-bold">Certifications could not be loaded</p>
                <p className="mt-1 break-words">{error}</p>

                <button
                  type="button"
                  onClick={() => setRetryCount((count) => count + 1)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-2 text-sm font-bold dark:border-rose-400/30"
                >
                  <RefreshCw size={15} />
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && certifications.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <Award
                size={32}
                className="mx-auto text-slate-600 dark:text-slate-300"
              />

              <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                No certifications to display
              </p>

              <p className="mt-2 text-base text-slate-700 dark:text-slate-300">
                Add a certification in the admin dashboard and make it visible
                on your portfolio.
              </p>
            </div>
          )}

          {!loading && !error && certifications.length > 0 && (
            <div className="relative isolate w-full overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-xl shadow-slate-300/40 dark:border-slate-700 dark:bg-slate-950/90 dark:shadow-violet-950/20 sm:p-5 lg:p-6">
              {/* Animated background */}
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

                <div className="certification-background-grid absolute inset-0 bg-[linear-gradient(rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.08)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)]" />
              </div>

              {/* Slider navigation */}
              <div className="mb-4 flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-800 dark:text-violet-300">
                    Learning Journey
                  </p>

                  <p className="mt-1 text-base text-slate-700 dark:text-slate-300">
                    Certification {activeIndex + 1} of {certifications.length}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous certification"
                    onClick={showPrevious}
                    disabled={certifications.length < 2}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 transition hover:border-violet-500 hover:bg-violet-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-violet-500/20"
                  >
                    <ChevronLeft size={21} />
                  </button>

                  <button
                    type="button"
                    aria-label="Next certification"
                    onClick={showNext}
                    disabled={certifications.length < 2}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 transition hover:border-violet-500 hover:bg-violet-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-violet-500/20"
                  >
                    <ChevronRight size={21} />
                  </button>
                </div>
              </div>

              {/* Dynamic height: no fixed-height viewport or internal scroll */}
              <div className="relative w-full overflow-hidden rounded-2xl">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={certifications[activeIndex]?._id || activeIndex}
                    initial={reduceMotion ? false : { opacity: 0, x: 45 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -45 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.3,
                      ease: "easeInOut",
                    }}
                    className="relative w-full rounded-2xl"
                  >
                    <CertificationCard item={certifications[activeIndex]} />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Pagination dots */}
              <div
                className="mt-5 flex flex-wrap items-center justify-center gap-2"
                aria-label="Choose certification"
              >
                {certifications.map((item, index) => (
                  <button
                    key={item._id || `${item.title}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Show certification ${index + 1}: ${
                      item.title || "Certification"
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
                {activeIndex + 1} / {certifications.length} · Use arrows or dots
                to explore
              </p>
            </div>
          )}
        </div>
      </motion.section>
    </>
  );
}
