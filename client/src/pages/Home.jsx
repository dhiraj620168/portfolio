import { useEffect, useState } from "react";
import { motion } from "motion/react";
import About from "./About";
import Projects from "./Projects";
import SkillsSection from "./SkillsSection.jsx";
import ExperienceSection from "./ExperienceSection.jsx";
import EducationSection from "./EducationSection";
import CertificationsSection from "./CertificationsSection";
import ContactSection from "./ContactSection";
import {
  ArrowDown,
  ArrowUpRight,
  BrainCircuit,
  Code2,
  FileText,
  LoaderCircle,
  Sparkles,
  UserRound,
} from "lucide-react";
import api from "../services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BACKEND_URL = API_URL.replace(/\/api\/?$/, "");

const fallbackProfile = {
  name: "Dhiraj Kumar",
  careerType: "fresher",
  professionalTitle: "Full Stack Developer · AI Enthusiast",
  introduction:
    "I build modern web applications and explore AI-powered solutions with a focus on useful features, clean interfaces and scalable software.",
  about: "",
  resumeUrl: "/resume.pdf",
  profileImageUrl: "",
};

function resolveBackendUrl(url) {
  if (!url || typeof url !== "string") return "";

  const value = url.trim();

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${BACKEND_URL}/${value.replace(/^\/+/, "")}`;
}

function getProfileTitle(title = "") {
  const parts = title
    .split(/\s*[·|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    primary: parts[0] || "Full Stack Developer",
    secondary: parts.slice(1).join(" · ") || "AI Enthusiast",
  };
}

function getSkillsArray(result) {
  if (Array.isArray(result)) return result;

  if (Array.isArray(result?.skills)) return result.skills;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.skills)) return result.data.skills;

  return [];
}

function getSkillName(skill) {
  if (typeof skill === "string") return skill.trim();

  if (!skill || typeof skill !== "object") return "";

  return (
    skill.name ??
    skill.title ??
    skill.skillName ??
    skill.technology ??
    ""
  ).trim();
}

export default function Home() {
  const [profile, setProfile] = useState(fallbackProfile);
  const [skills, setSkills] = useState([]);

  const [loading, setLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] = useState(true);

  const [profileError, setProfileError] = useState(false);
  const [skillsError, setSkillsError] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fetch the profile from the existing backend API.
  // useEffect(() => {
  //   const controller = new AbortController();

  //   async function fetchProfile() {
  //     try {
  //       const response = await fetch(`${API_URL}/profile`, {
  //         signal: controller.signal,
  //         cache: "no-store",
  //       });

  //       if (!response.ok) {
  //         throw new Error(`Profile request failed: ${response.status}`);
  //       }

  //       const result = await response.json();
  //       const data = result.profile ?? result.data ?? result;

  //       setProfile((previous) => ({
  //         ...previous,
  //         ...data,
  //       }));

  //       setProfileError(false);
  //     } catch (error) {
  //       if (error.name !== "AbortError") {
  //         console.error("Failed to fetch profile:", error);
  //         setProfileError(true);
  //       }
  //     } finally {
  //       if (!controller.signal.aborted) {
  //         setLoading(false);
  //       }
  //     }
  //   }

  //   fetchProfile();

  //   return () => controller.abort();
  // }, []);
  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      try {
        const result = await api.get("/profile");
        const data = result.profile ?? result.data ?? result;

        if (!isMounted) return;

        setProfile((previous) => ({
          ...previous,
          ...data,
        }));

        setProfileError(false);
      } catch (error) {
        if (!isMounted) return;

        console.error("Failed to fetch profile:", error);
        setProfileError(true);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch skills from the existing backend skills endpoint.
  // useEffect(() => {
  //   const controller = new AbortController();

  //   async function fetchSkills() {
  //     try {
  //       const response = await fetch(`${API_URL}/skills`, {
  //         signal: controller.signal,
  //         cache: "no-store",
  //       });

  //       if (!response.ok) {
  //         throw new Error(`Skills request failed: ${response.status}`);
  //       }

  //       const result = await response.json();
  //       const skillsData = getSkillsArray(result);

  //       setSkills(skillsData);
  //       setSkillsError(false);
  //     } catch (error) {
  //       if (error.name !== "AbortError") {
  //         console.error("Failed to fetch skills:", error);
  //         setSkillsError(true);
  //       }
  //     } finally {
  //       if (!controller.signal.aborted) {
  //         setSkillsLoading(false);
  //       }
  //     }
  //   }

  //   fetchSkills();

  //   return () => controller.abort();
  // }, []);
  useEffect(() => {
    let isMounted = true;

    async function fetchSkills() {
      try {
        const result = await api.get("/skills");
        const skillsData = getSkillsArray(result);

        if (!isMounted) return;

        setSkills(skillsData);
        setSkillsError(false);
      } catch (error) {
        if (!isMounted) return;

        console.error("Failed to fetch skills:", error);
        setSkillsError(true);
      } finally {
        if (isMounted) {
          setSkillsLoading(false);
        }
      }
    }

    fetchSkills();

    return () => {
      isMounted = false;
    };
  }, []);
  const { primary, secondary } = getProfileTitle(profile.professionalTitle);

  const introduction =
    profile.introduction?.trim() ||
    profile.about?.trim() ||
    fallbackProfile.introduction;

  const isFresher =
    (profile.careerType || "fresher").toLowerCase() === "fresher";

  const profileImageUrl = resolveBackendUrl(profile.profileImageUrl);
  const resumeUrl = resolveBackendUrl(profile.resumeUrl);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const entrance = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  };

  // Normalize skills for rendering and avoid duplicate names.
  const visibleSkills = [
    ...new Map(
      skills
        .map((skill, index) => {
          const name = getSkillName(skill);

          if (!name) return null;

          return [
            name.toLowerCase(),
            {
              id: skill?._id ?? skill?.id ?? `${name}-${index}`,
              name,
            },
          ];
        })
        .filter(Boolean),
    ).values(),
  ];

  return (
    <>
      <section
        id="home"
        className="relative isolate flex min-h-[calc(100svh-72px)]
  scroll-mt-10 items-center overflow-hidden
  bg-transparent py-5 text-slate-900 transition-colors duration-300
  dark:bg-transparent dark:text-white
  lg:min-h-[calc(100svh-80px)] lg:py-14"
      >
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-10">
            {/* LEFT: Introduction */}
            <motion.div
              initial="hidden"
              animate="visible"
              transition={{
                staggerChildren: 0.12,
                delayChildren: 0.1,
              }}
              className="relative z-10 flex min-w-0 flex-col items-start"
            >
              {/* Availability badge */}
              <motion.div
                variants={entrance}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mb-7 inline-flex items-center gap-2.5
                rounded-full border border-emerald-400/20
                bg-emerald-400/[0.07] px-4 py-2
                text-xs font-medium text-emerald-300 sm:text-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full
                  animate-ping rounded-full bg-emerald-400 opacity-50"
                  />
                  <span
                    className="relative inline-flex h-2 w-2
                  rounded-full bg-emerald-400"
                  />
                </span>
                Available for opportunities
                {isFresher && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-cyan-300">Fresher</span>
                  </>
                )}
              </motion.div>

              <motion.p
                variants={entrance}
                transition={{ duration: 0.6 }}
                className="mb-3 text-lg font-medium text-slate-600 dark:text-slate-300 sm:text-xl"
              >
                Hello, I'm
              </motion.p>

              <motion.h1
                variants={entrance}
                transition={{ duration: 0.65, ease: "easeOut" }}
                className="max-w-full break-words text-4xl
                font-black leading-[1.08] tracking-tight
                sm:text-6xl lg:text-6xl xl:text-7xl"
              >
                {profile.name || fallbackProfile.name}

                <span
                  className="mt-3 block bg-gradient-to-r
                from-cyan-300 via-sky-400 to-violet-400
                bg-clip-text pb-2 text-transparent"
                >
                  {primary}
                </span>
              </motion.h1>

              <motion.div
                variants={entrance}
                transition={{ duration: 0.6 }}
                className="my-6 h-1 w-20 rounded-full
                bg-gradient-to-r from-cyan-400 to-violet-500"
              />

              <motion.p
                variants={entrance}
                transition={{ duration: 0.6 }}
                className="text-lg font-semibold text-violet-300 sm:text-xl"
              >
                {secondary}
              </motion.p>

              <motion.p
                variants={entrance}
                transition={{ duration: 0.6 }}
                className="mt-5 max-w-xl text-sm leading-7
                text-slate-600 dark:text-slate-400 sm:text-base sm:leading-8"
              >
                {introduction}
              </motion.p>

              {/* Action buttons */}
              <motion.div
                variants={entrance}
                transition={{ duration: 0.6 }}
                className="mt-8 flex w-full flex-col gap-3
                min-[420px]:w-auto min-[420px]:flex-row"
              >
                <a
                  href="#projects"
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToSection("projects");
                  }}
                  className="group inline-flex min-h-12 items-center
  justify-center gap-2 rounded-xl bg-cyan-300
  px-5 py-3 text-sm font-bold text-slate-950
  shadow-lg shadow-cyan-500/10 transition duration-300
  hover:-translate-y-0.5 hover:bg-cyan-200
  hover:shadow-cyan-400/20
  focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-cyan-300"
                >
                  <span>Explore Projects</span>

                  <ArrowUpRight
                    size={18}
                    className="transition-transform duration-300
    group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </a>

                {resumeUrl && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center
                    justify-center gap-2 rounded-xl border
                    border-slate-300 bg-white/80 px-5 py-3
                    text-sm font-semibold text-slate-700 dark:border-slate-700
                    dark:bg-white/[0.03] dark:text-slate-200
                    transition duration-300 hover:-translate-y-0.5
                    hover:border-violet-400/60 hover:bg-violet-400/10
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-violet-300"
                  >
                    <FileText size={17} />
                    View Resume
                    <ArrowUpRight size={15} />
                  </a>
                )}
              </motion.div>

              {/* Dynamic skills from database */}
              <motion.div
                variants={entrance}
                transition={{ duration: 0.6 }}
                className="mt-9 w-full"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p
                    className="text-[11px] font-bold uppercase
                  tracking-[0.2em] text-slate-500 dark:text-slate-500"
                  >
                    Technologies I Work With
                  </p>

                  {visibleSkills.length > 0 && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {visibleSkills.length} skills
                    </span>
                  )}
                </div>

                {skillsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <LoaderCircle size={14} className="animate-spin" />
                    Loading skills...
                  </div>
                ) : skillsError ? (
                  <p role="status" className="text-xs text-amber-300">
                    Skills could not be loaded. Please check the skills API.
                  </p>
                ) : visibleSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {visibleSkills.map((skill, index) => (
                      <motion.span
                        key={skill.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.08 * Math.min(index, 5),
                          duration: 0.35,
                        }}
                        title={skill.name}
                        className="rounded-lg border border-slate-200
                        bg-white/80 px-3 py-2 text-xs
                        font-medium text-slate-700 transition
                        hover:border-cyan-400/60 hover:text-cyan-700
                        dark:border-slate-700/80 dark:bg-slate-900/70
                        dark:text-slate-300 dark:hover:border-cyan-400/40
                        dark:hover:text-cyan-200"
                      >
                        {skill.name}
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs leading-6 text-slate-600 dark:text-slate-500">
                    No skills added yet. Add skills from your Admin Panel to
                    display them here.
                  </p>
                )}
              </motion.div>

              {loading && (
                <p className="mt-5 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-500">
                  <LoaderCircle size={14} className="animate-spin" />
                  Loading profile...
                </p>
              )}

              {!loading && profileError && (
                <p role="status" className="mt-4 text-xs text-amber-300">
                  Could not load the latest profile. Showing fallback data.
                </p>
              )}
            </motion.div>

            {/* RIGHT: Animated AI illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
              className="relative mx-auto w-full max-w-[510px] lg:max-w-none"
            >
              <div
                className="relative overflow-hidden rounded-[30px]
              border border-slate-200 bg-white/90
              p-5 shadow-2xl shadow-slate-300/30 backdrop-blur-xl
              dark:border-slate-700/80 dark:bg-[#0C1425]/80
              dark:shadow-cyan-950/20 sm:p-7 lg:p-8"
              >
                {/* Card header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-xs font-semibold uppercase
                    tracking-[0.2em] text-slate-500"
                    >
                      Developer profile
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      AI-powered creativity
                    </p>
                  </div>

                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  </div>
                </div>

                {/* Orbit animation */}
                <div
                  className="relative mx-auto my-6 flex aspect-square
                w-full max-w-[350px] items-center justify-center"
                >
                  <div
                    className="absolute inset-[4%] rounded-full
                  bg-cyan-400/[0.04] blur-2xl"
                  />

                  <motion.div
                    aria-hidden="true"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 42,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-full
                    border border-dashed border-cyan-300/25"
                  >
                    <span
                      className="absolute -top-1 left-1/2 h-3 w-3
                    -translate-x-1/2 rounded-full bg-cyan-300
                    shadow-[0_0_16px_rgba(103,232,249,0.9)]"
                    />
                  </motion.div>

                  <motion.div
                    aria-hidden="true"
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 32,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-[12%] rounded-full
                    border border-violet-400/30"
                  >
                    <span
                      className="absolute right-[8%] top-[13%]
                    h-2.5 w-2.5 rounded-full bg-violet-300
                    shadow-[0_0_14px_rgba(167,139,250,0.9)]"
                    />
                  </motion.div>

                  <motion.div
                    aria-hidden="true"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 24,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-[24%] rounded-full
                    border border-cyan-500/30"
                  >
                    <span
                      className="absolute bottom-[12%] left-[5%]
                    h-2 w-2 rounded-full bg-cyan-200"
                    />
                  </motion.div>

                  {/* Profile avatar */}
                  <motion.div
                    animate={{ y: [0, -7, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="relative z-10 flex aspect-square w-[40%]
                    items-center justify-center overflow-hidden
                    rounded-full border border-cyan-200/40
                    bg-gradient-to-br from-cyan-300/20
                    via-slate-900 to-violet-500/30 p-1.5
                    shadow-[0_0_55px_rgba(34,211,238,0.13)]"
                  >
                    <div
                      className="flex h-full w-full items-center
                    justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-[#0C1425]"
                    >
                      {profileImageUrl && !imageError ? (
                        <img
                          src={profileImageUrl}
                          alt={profile.name || "Profile"}
                          className="h-full w-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <UserRound
                          size={60}
                          strokeWidth={1.3}
                          className="text-cyan-200"
                        />
                      )}
                    </div>
                  </motion.div>

                  {/* Floating AI icon */}
                  <motion.div
                    animate={{ y: [0, -6, 0], rotate: [0, 5, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute right-[8%] top-[10%]
                    flex h-12 w-12 items-center justify-center
                    rounded-2xl border border-violet-300/20
                    bg-violet-400/10 text-violet-300 shadow-lg"
                  >
                    <BrainCircuit size={25} />
                  </motion.div>

                  {/* Floating code icon */}
                  <motion.div
                    animate={{ y: [0, 7, 0], rotate: [0, -5, 0] }}
                    transition={{
                      duration: 4.5,
                      delay: 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute bottom-[12%] left-[5%]
                    flex h-12 w-12 items-center justify-center
                    rounded-2xl border border-cyan-300/20
                    bg-cyan-400/10 text-cyan-300 shadow-lg"
                  >
                    <Code2 size={25} />
                  </motion.div>

                  <motion.div
                    animate={{
                      scale: [1, 1.12, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute left-[12%] top-[16%] text-violet-300"
                  >
                    <Sparkles size={20} />
                  </motion.div>
                </div>

                {/* Development card */}
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-4 rounded-2xl
                  border border-cyan-200 bg-cyan-50 p-4
                  transition-colors hover:border-cyan-400/60
                  dark:border-cyan-300/15 dark:bg-[#122137]
                  dark:hover:border-cyan-300/35"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center
                  justify-center rounded-xl bg-cyan-300/10 text-cyan-300"
                  >
                    <Code2 size={23} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
                      Full Stack Development
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                      React · Node.js · MongoDB
                    </p>
                  </div>

                  <ArrowUpRight size={17} className="text-slate-500" />
                </motion.div>

                {/* AI card */}
                <motion.div
                  whileHover={{ x: 4 }}
                  className="mt-3 flex items-center gap-4 rounded-2xl
                  border border-violet-200 bg-violet-50 p-4
                  transition-colors hover:border-violet-400/60
                  dark:border-violet-300/15 dark:bg-[#1A1933]
                  dark:hover:border-violet-300/35"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center
                  justify-center rounded-xl bg-violet-300/10 text-violet-300"
                  >
                    <BrainCircuit size={23} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
                      AI Exploration
                    </h3>
                    <p className="mt-1 text-xs text-violet-700/80 dark:text-violet-200/70 sm:text-sm">
                      LLMs · Intelligent Applications
                    </p>
                  </div>

                  <Sparkles size={17} className="text-violet-300/70" />
                </motion.div>
              </div>

              {/* Caption */}
              <div
                className="mt-5 flex items-center justify-center gap-2
              text-center text-xs text-slate-500 sm:text-sm"
              >
                <Sparkles size={15} className="text-cyan-300" />
                Building today. Innovating for tomorrow.
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      <SkillsSection />
      <Projects />
      <ExperienceSection />
      <EducationSection />
      <CertificationsSection />
      <ContactSection />
      <About />
    </>
  );
}
