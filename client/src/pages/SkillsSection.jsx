import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import api from "../services/api";

function SkillIcon({ icon, name }) {
  const [imageError, setImageError] = useState(false);

  const isImageUrl =
    typeof icon === "string" && /^https?:\/\//i.test(icon.trim());

  if (isImageUrl && !imageError) {
    return (
      <img
        src={icon}
        alt={`${name} icon`}
        className="h-7 w-7 object-contain"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <span
      className="text-2xl leading-none"
      role="img"
      aria-label={`${name} icon`}
    >
      {icon?.trim() && !isImageUrl ? icon : "✦"}
    </span>
  );
}

export default function SkillsSection() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;

    async function loadSkills() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/skills");

        if (active) {
          const records =
            response.success && Array.isArray(response.data)
              ? response.data.filter((item) => item && item.isVisible !== false)
              : [];
          setSkills(records);
          setActiveIndex(0);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load skills.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSkills();

    return () => {
      active = false;
    };
  }, []);

  // Mobile carousel advances every 30 seconds, matching the Experience section.
  useEffect(() => {
    if (skills.length < 2) return;

    const intervalId = window.setInterval(() => {
      if (window.matchMedia("(min-width: 1024px)").matches) return;
      setActiveIndex((current) => (current + 1) % skills.length);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [skills.length]);

  function showPrevious() {
    setActiveIndex((current) =>
      current === 0 ? skills.length - 1 : current - 1,
    );
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % skills.length);
  }

  function handleTouchStart(event) {
    const touch = event.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }

  function handleTouchEnd(event) {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Only treat a clear horizontal gesture as a carousel swipe.
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) showNext();
      else showPrevious();
    }
  }

  return (
    <>
      <style>{`
        .skills-background-grid {
          background-size: 32px 32px;
          animation: skills-grid-drift 30s linear infinite;
        }
        @keyframes skills-grid-drift {
          from { background-position: 0 0; }
          to { background-position: 32px 32px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .skills-background-grid { animation: none !important; }
        }
      `}</style>
      <motion.section
        id="skills"
        className="relative isolate scroll-mt-24 overflow-hidden py-0"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.05 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Section background animation */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <motion.div
            className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl sm:h-80 sm:w-80"
            animate={
              reduceMotion
                ? undefined
                : {
                    x: [0, 35, -10, 0],
                    y: [0, 25, -15, 0],
                    scale: [1, 1.15, 0.95, 1],
                  }
            }
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl sm:h-96 sm:w-96"
            animate={
              reduceMotion
                ? undefined
                : {
                    x: [0, -30, 15, 0],
                    y: [0, -20, 20, 0],
                    scale: [1, 0.9, 1.12, 1],
                  }
            }
            transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent"
            animate={
              reduceMotion
                ? undefined
                : { opacity: [0.25, 0.8, 0.25], scaleX: [0.7, 1, 0.7] }
            }
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-12 pt-0 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
          {/* Animated heading */}
          <motion.h2
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-6 text-left text-4xl font-extrabold tracking-tight text-slate-900 transition-colors duration-300 sm:mb-8 sm:text-5xl lg:mb-10 lg:text-6xl dark:text-white"
          >
            My{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Skills
            </span>
          </motion.h2>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/80 dark:border-slate-700/60 dark:bg-slate-900/50"
                />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          )}

          {/* Empty state */}
          {!loading && !error && skills.length === 0 && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No skills available yet.
            </p>
          )}

          {/* Skills grid */}
          {!loading && !error && skills.length > 0 && (
            <div className="relative isolate w-full overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-xl shadow-slate-300/30 dark:border-slate-700 dark:bg-slate-950/80 dark:shadow-violet-950/20 sm:p-5 lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
              {/* Theme-aware animated background, like the Experience section */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl"
              >
                <motion.div
                  className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-violet-400/25 blur-3xl dark:bg-violet-600/20"
                  animate={
                    reduceMotion
                      ? undefined
                      : { x: [0, 40, 0], y: [0, 24, 0], scale: [1, 1.12, 1] }
                  }
                  transition={{
                    duration: 14,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/15"
                  animate={
                    reduceMotion
                      ? undefined
                      : { x: [0, -35, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }
                  }
                  transition={{
                    duration: 17,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <div className="skills-background-grid absolute inset-0 bg-[linear-gradient(rgba(100,116,139,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.07)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)]" />
              </div>

              {/* Mobile carousel controls; desktop keeps the three-column grid */}
              <div className="mb-4 flex items-center justify-between gap-3 px-1 lg:hidden">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-800 dark:text-violet-300">
                    Skills
                  </p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    Skill {activeIndex + 1} of {skills.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous skill"
                    onClick={showPrevious}
                    disabled={skills.length < 2}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 transition hover:border-violet-500 hover:bg-violet-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-violet-500/20"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next skill"
                    onClick={showNext}
                    disabled={skills.length < 2}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 transition hover:border-violet-500 hover:bg-violet-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-violet-500/20"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div
                className="relative rounded-2xl"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                aria-label="Skills carousel. Swipe left or right to view skills."
              >
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  {skills.map((skill, index) => {
                    const proficiency = Math.min(
                      100,
                      Math.max(0, Number(skill.proficiency) || 0),
                    );

                    const experience = Number(skill.experience) || 0;

                    return (
                      <motion.article
                        key={skill._id || skill.id || skill.name}
                        initial={
                          reduceMotion
                            ? false
                            : { opacity: 0, y: 28, scale: 0.97 }
                        }
                        whileInView={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                        }}
                        viewport={{ once: true, amount: 0.15 }}
                        transition={{
                          duration: 0.55,
                          delay: reduceMotion ? 0 : Math.min(index * 0.1, 0.4),
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        whileHover={
                          reduceMotion ? undefined : { y: -5, scale: 1.01 }
                        }
                        className={`skill-card group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition-colors duration-500 hover:border-violet-400/60 hover:shadow-xl hover:shadow-violet-500/15 sm:p-5 lg:min-h-64 lg:p-6 dark:border-slate-700/60 dark:bg-slate-900/90 ${
                          index === activeIndex ? "flex" : "hidden lg:flex"
                        }`}
                      >
                        {/* Animated purple glow */}
                        <motion.div
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl"
                          animate={
                            reduceMotion
                              ? undefined
                              : {
                                  x: [0, -25, 10, 0],
                                  y: [0, 20, -10, 0],
                                  scale: [1, 1.2, 0.9, 1],
                                  opacity: [0.3, 0.7, 0.4, 0.3],
                                }
                          }
                          transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />

                        {/* Animated cyan glow */}
                        <motion.div
                          aria-hidden="true"
                          className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl"
                          animate={
                            reduceMotion
                              ? undefined
                              : {
                                  x: [0, 25, -10, 0],
                                  y: [0, -15, 10, 0],
                                  scale: [1, 0.9, 1.15, 1],
                                  opacity: [0.2, 0.55, 0.3, 0.2],
                                }
                          }
                          transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />

                        {/* Moving top highlight */}
                        <motion.div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/80 to-transparent"
                          animate={
                            reduceMotion ? undefined : { x: ["-100%", "100%"] }
                          }
                          transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />

                        <div className="relative flex min-h-0 flex-1 flex-col">
                          {/* Icon, name, Featured and category */}
                          <div className="mb-4 flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/15 transition-colors duration-300 group-hover:border-violet-400/50 group-hover:bg-violet-500/25">
                              <SkillIcon icon={skill.icon} name={skill.name} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <motion.h3
                                animate={
                                  reduceMotion
                                    ? undefined
                                    : {
                                        backgroundPosition: [
                                          "0% 50%",
                                          "100% 50%",
                                          "0% 50%",
                                        ],
                                      }
                                }
                                transition={{
                                  duration: 6,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                                className="w-fit max-w-full break-words bg-gradient-to-r from-violet-700 via-purple-600 to-cyan-700 bg-[length:200%_auto] bg-clip-text text-xl font-bold text-transparent dark:from-white dark:via-violet-300 dark:to-cyan-300"
                              >
                                {skill.name}
                              </motion.h3>

                              {skill.isFeatured && (
                                <motion.span
                                  animate={
                                    reduceMotion
                                      ? undefined
                                      : {
                                          borderColor: [
                                            "rgba(251,191,36,0.2)",
                                            "rgba(251,191,36,0.7)",
                                            "rgba(251,191,36,0.2)",
                                          ],
                                          boxShadow: [
                                            "0 0 0px rgba(251,191,36,0)",
                                            "0 0 12px rgba(251,191,36,0.12)",
                                            "0 0 0px rgba(251,191,36,0)",
                                          ],
                                        }
                                  }
                                  transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                  className="mt-2 inline-flex items-center rounded-full border bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300"
                                >
                                  <span className="mr-1" aria-hidden="true">
                                    ★
                                  </span>
                                  Featured
                                </motion.span>
                              )}
                            </div>

                            {skill.category && (
                              <span className="ml-auto shrink-0 rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-xs font-medium text-violet-300">
                                {skill.category}
                              </span>
                            )}
                          </div>

                          {/* Proficiency */}
                          <div className="mb-4">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Proficiency
                              </span>

                              <motion.span
                                animate={
                                  reduceMotion
                                    ? undefined
                                    : { opacity: [0.8, 1, 0.8] }
                                }
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                                className="text-sm font-bold tabular-nums text-slate-900 dark:text-white"
                              >
                                {proficiency}%
                              </motion.span>
                            </div>

                            <div
                              className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/70"
                              role="progressbar"
                              aria-label={`${skill.name} proficiency`}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={proficiency}
                            >
                              <motion.div
                                initial={reduceMotion ? false : { width: 0 }}
                                whileInView={{
                                  width: `${proficiency}%`,
                                }}
                                viewport={{ once: true }}
                                transition={{
                                  duration: reduceMotion ? 0 : 0.9,
                                  ease: "easeOut",
                                }}
                                className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-400"
                              >
                                {!reduceMotion && (
                                  <motion.div
                                    aria-hidden="true"
                                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                    animate={{ x: ["-100%", "350%"] }}
                                    transition={{
                                      duration: 2.5,
                                      repeat: Infinity,
                                      ease: "linear",
                                    }}
                                  />
                                )}
                              </motion.div>
                            </div>
                          </div>

                          {/* Experience */}
                          <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700/60">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                              Experience
                            </span>

                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {experience} {experience === 1 ? "year" : "years"}
                            </span>
                          </div>

                          {/* Description */}
                          <div className="min-h-0 flex-1 overflow-hidden">
                            <h4 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                              About this skill
                            </h4>

                            <p className="break-words text-sm leading-5 text-slate-600 dark:text-slate-400">
                              {skill.description?.trim() ||
                                "No description has been added yet."}
                            </p>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </div>

              {/* Pagination dots */}
              <div
                className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:hidden"
                aria-label="Choose skill"
              >
                {skills.map((skill, index) => (
                  <button
                    key={skill._id || skill.id || `${skill.name}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Show skill ${index + 1}: ${skill.name || "Skill"}`}
                    aria-current={activeIndex === index ? "true" : undefined}
                    className={`h-3 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                      activeIndex === index
                        ? "w-9 bg-violet-600 dark:bg-violet-400"
                        : "w-3 bg-slate-400 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-300"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-slate-700 dark:text-slate-300 lg:hidden">
                {activeIndex + 1} / {skills.length} · Use arrows or dots to
                explore
              </p>
            </div>
          )}

          {/* Section ending animation */}
          <motion.div
            aria-hidden="true"
            initial={reduceMotion ? false : { opacity: 0, scaleX: 0.4 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: "easeOut",
            }}
            className="mt-8 h-px origin-center bg-gradient-to-r from-transparent via-violet-400/50 to-transparent sm:mt-12"
          />
        </div>
      </motion.section>
    </>
  );
}
