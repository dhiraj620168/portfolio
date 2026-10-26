import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  GraduationCap,
  Code2,
  BrainCircuit,
  Target,
  MapPin,
  BriefcaseBusiness,
  Sparkles,
  Layers3,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ICONS = {
  GraduationCap,
  Code2,
  BrainCircuit,
  Target,
  Sparkles,
  Layers3,
  Globe,
  BriefcaseBusiness,
};

const focusAreas = [
  {
    icon: Code2,
    title: "Full Stack Development",
    description:
      "Building scalable, responsive web applications with clean interfaces, reliable APIs, secure authentication, and database-driven functionality.",
  },
  {
    icon: BrainCircuit,
    title: "Generative AI",
    description:
      "Learning how LLMs, prompt engineering, embeddings, and AI APIs can power intelligent applications and solve practical problems.",
  },
  {
    icon: Target,
    title: "Problem Solving",
    description:
      "Developing logical thinking, strengthening data structures and algorithms, and solving problems through clear, structured approaches.",
  },
  {
    icon: Layers3,
    title: "AI Integration & Product Building",
    description:
      "Exploring how to connect AI models with web applications and turn useful ideas into working products.",
  },
  {
    icon: Layers3,
    title: "Engineering Excellence",
    description:
      "Following software development best practices with a focus on security, performance, maintainability, and reliable application architecture.",
  },
];

function Detail({ icon: Icon, label, value }) {
  if (typeof value !== "string" || !value.trim()) return null;

  return (
    <div className="flex items-start gap-3 border-b border-slate-200 dark:border-white/[0.08] py-3 last:border-b-0 last:pb-0">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-600/20 dark:border-cyan-300/15 bg-cyan-50 dark:bg-cyan-300/[0.06] text-cyan-700 dark:text-cyan-200">
        <Icon size={17} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>
        <p className="mt-1 break-words whitespace-pre-line text-sm leading-6 text-slate-800 dark:text-slate-200">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function About() {
  const reducedMotion = useReducedMotion();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFocusIndex, setActiveFocusIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Profile request failed (${response.status})`);
        }

        const result = await response.json();
        const data = result.profile ?? result.data ?? result;
        setProfile(data);
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load About profile:", err);
          setError(
            "Profile details could not be loaded. Please try again later.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProfile();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (reducedMotion || focusAreas.length < 2) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveFocusIndex((current) => (current + 1) % focusAreas.length);
    }, 5500);

    return () => window.clearInterval(intervalId);
  }, [reducedMotion]);

  const highlights = (
    Array.isArray(profile?.highlights) ? profile.highlights : []
  )
    .filter(
      (item) =>
        item.isVisible !== false &&
        typeof item.title === "string" &&
        item.title.trim() &&
        typeof item.description === "string" &&
        item.description.trim(),
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const information = [
    { label: "Education", value: profile?.education, icon: GraduationCap },
    { label: "Location", value: profile?.location, icon: MapPin },
    { label: "Career Goal", value: profile?.careerGoal, icon: Target },
  ].filter((item) => typeof item.value === "string" && item.value.trim());

  return (
    <motion.section
      id="about"
      aria-labelledby="about-title"
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.65, ease: "easeOut" }}
      className="relative isolate m-0 scroll-mt-10 overflow-hidden bg-transparent px-0 pb-14 pt-0 text-slate-950 transition-colors duration-300 dark:text-white sm:pb-16 lg:pb-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-40 top-20 h-72 w-72 rounded-full bg-blue-500/[0.06] dark:bg-blue-600/[0.07] blur-[110px]" />
        <div className="absolute -right-40 top-40 h-80 w-80 rounded-full bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06] blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        {/* Heading and database-driven introduction */}
        <motion.header
          initial={reducedMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.65,
            delay: reducedMotion ? 0 : 0.08,
            ease: "easeOut",
          }}
          className="border-b border-slate-200 dark:border-white/15 pb-5 sm:pb-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2
              id="about-title"
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            >
              About{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-blue-300 dark:to-cyan-200">
                Me.
              </span>
              <hr />
            </h2>
          </div>

          <p className="mt-4 w-full whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300 sm:text-base sm:leading-8">
            {profile?.about ||
              profile?.introduction ||
              "I'm a Computer Science Engineering student passionate about building practical web applications, improving my development skills, and exploring how AI can solve real-world problems. I learn by building projects, strengthening fundamentals, and turning ideas into working products."}
          </p>

          {loading && (
            <p role="status" className="mt-3 text-xs text-slate-500">
              Loading profile information…
            </p>
          )}
          {error && (
            <p role="status" className="mt-3 text-xs text-amber-300">
              {error}
            </p>
          )}
        </motion.header>

        {/* Two-card layout based on the user's sketch */}
        <motion.div
          initial="hidden"
          animate="visible"
          viewport={{ once: true, amount: 0.12 }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: reducedMotion ? 0 : 0.12 },
            },
          }}
          className="mt-7 grid items-stretch gap-5 md:grid-cols-2 md:gap-6 lg:mt-9 lg:gap-8"
        >
          <motion.article
            variants={{
              hidden: { opacity: 0, y: reducedMotion ? 0 : 18 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.55, ease: "easeOut" },
              },
            }}
            whileHover={reducedMotion ? undefined : { y: -4 }}
            className="flex h-full flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/45 p-5 shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-colors duration-300 hover:border-cyan-300/25 hover:bg-slate-50 dark:hover:bg-slate-900/65 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-200">
                  01 / Background
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  A little about me
                </h3>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-cyan-700 dark:border-white/10 dark:bg-white/[0.035] dark:text-cyan-200">
                <GraduationCap size={19} />
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              My background, current direction, and the goals guiding my
              development journey.
            </p>

            <div className="mt-5">
              {information.length > 0 ? (
                information.map((item) => (
                  <Detail
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    value={item.value}
                  />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 p-4 text-sm leading-6 text-slate-500">
                  Education, location, and career goal can be managed through
                  your profile data in the backend.
                </div>
              )}
            </div>
          </motion.article>

          <motion.article
            variants={{
              hidden: { opacity: 0, y: reducedMotion ? 0 : 18 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.55, ease: "easeOut" },
              },
            }}
            whileHover={reducedMotion ? undefined : { y: -4 }}
            className="flex h-full flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/45 p-5 shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-colors duration-300 hover:border-cyan-300/25 hover:bg-slate-50 dark:hover:bg-slate-900/65 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-200">
                  02 / What I do
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                  Areas of focus
                </h3>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-cyan-700 dark:border-white/10 dark:bg-white/[0.035] dark:text-cyan-200">
                <Code2 size={19} />
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              The skills and interests I am developing through practical
              projects.
            </p>

            <div className="mt-5 flex flex-1 flex-col">
              <div
                className="relative flex min-h-[190px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.025] p-5 sm:min-h-[205px]"
                aria-live="polite"
                aria-atomic="true"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={focusAreas[activeFocusIndex].title}
                    initial={reducedMotion ? false : { opacity: 0, x: 22 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reducedMotion ? undefined : { opacity: 0, x: -22 }}
                    transition={{
                      duration: reducedMotion ? 0 : 0.28,
                      ease: "easeOut",
                    }}
                    className="flex flex-1 flex-col"
                  >
                    {(() => {
                      const item = focusAreas[activeFocusIndex];
                      const Icon = item.icon;
                      return (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-600/20 dark:border-cyan-300/15 bg-cyan-50 dark:bg-cyan-300/[0.06] text-cyan-700 dark:text-cyan-200">
                              <Icon size={19} />
                            </span>
                            <span className="font-mono text-xs tracking-wider text-slate-500">
                              {String(activeFocusIndex + 1).padStart(2, "0")} /{" "}
                              {String(focusAreas.length).padStart(2, "0")}
                            </span>
                          </div>
                          <h4 className="mt-4 text-base font-semibold leading-6 text-slate-900 dark:text-slate-100 sm:text-lg">
                            {item.title}
                          </h4>
                          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                            {item.description}
                          </p>
                        </>
                      );
                    })()}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div
                  className="flex items-center gap-2"
                  aria-label="Choose area of focus"
                >
                  {focusAreas.map((item, index) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setActiveFocusIndex(index)}
                      aria-label={`Show ${item.title}`}
                      aria-current={
                        activeFocusIndex === index ? "true" : undefined
                      }
                      className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${
                        activeFocusIndex === index
                          ? "w-7 bg-cyan-300"
                          : "w-2.5 bg-slate-300 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-400"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="mr-1 text-xs tabular-nums text-slate-500">
                    {activeFocusIndex + 1} of {focusAreas.length}
                  </span>
                  <button
                    type="button"
                    aria-label="Previous area of focus"
                    onClick={() =>
                      setActiveFocusIndex((current) =>
                        current === 0 ? focusAreas.length - 1 : current - 1,
                      )
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.03] text-slate-800 dark:text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-100 dark:hover:bg-cyan-300/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next area of focus"
                    onClick={() =>
                      setActiveFocusIndex(
                        (current) => (current + 1) % focusAreas.length,
                      )
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.03] text-slate-800 dark:text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-100 dark:hover:bg-cyan-300/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        </motion.div>

        {/* Optional dynamic highlights remain connected to the profile API */}
        {highlights.length > 0 && (
          <section
            className="mt-10 sm:mt-12"
            aria-labelledby="about-highlights-title"
          >
            <div className="mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-200">
                More about me
              </p>
              <h3
                id="about-highlights-title"
                className="mt-2 text-2xl font-semibold tracking-tight"
              >
                Additional Deatils
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {highlights.map((item, index) => {
                // const Icon = ICONS[item.icon] || Code2;
                return (
                  <motion.article
                    key={item._id || `${item.title}-${index}`}
                    initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{
                      duration: 0.45,
                      delay: reducedMotion ? 0 : (index % 2) * 0.08,
                    }}
                    whileHover={reducedMotion ? undefined : { y: -3 }}
                    className="h-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.025] p-5 transition-colors duration-300 hover:border-cyan-300/25 hover:bg-slate-100 dark:hover:bg-white/[0.045]"
                  >
                    {/* <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-600/20 dark:border-cyan-300/15 bg-cyan-50 dark:bg-cyan-300/[0.06] text-cyan-700 dark:text-cyan-200">
                      <Icon size={17} />
                    </span> */}
                    <h4 className="m-auto font-semibold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h4>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  </motion.article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </motion.section>
  );
}
