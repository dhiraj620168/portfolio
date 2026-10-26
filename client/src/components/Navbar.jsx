import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  FileText,
  Download,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "../context/ThemeContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_ORIGIN = new URL(API_BASE_URL).origin;

function resolveResumeUrl(url) {
  if (!url) return "";

  const value = url.trim();

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return new URL(value.replace(/^\/+/, ""), `${API_ORIGIN}/`).href;
}

// All navigation links are visible directly.
const links = [
  { label: "Home", id: "home" },
  { label: "About", id: "about" },
  { label: "Skills", id: "skills" },
  { label: "Projects", id: "projects" },
  { label: "Experience", id: "experience" },
  { label: "Education", id: "education" },
  { label: "Certifications", id: "certifications" },
  { label: "Contact", id: "contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [resumeMenuOpen, setResumeMenuOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("/resume.pdf");
  const [activeSection, setActiveSection] = useState("home");

  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Load resume URL from the profile API.
  useEffect(() => {
    const controller = new AbortController();

    async function loadResume() {
      try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load resume URL");
        }

        const result = await response.json();
        const profile = result.profile ?? result.data ?? result;

        if (profile.resumeUrl) {
          setResumeUrl(profile.resumeUrl);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Could not load resume URL:", error);
        }
      }
    }

    loadResume();

    return () => controller.abort();
  }, []);

  const resolvedResumeUrl = resolveResumeUrl(resumeUrl);

  const resumeDownloadUrl = resolvedResumeUrl
    ? `${resolvedResumeUrl}${
        resolvedResumeUrl.includes("?") ? "&" : "?"
      }mode=download`
    : "";

  // Navigate to a section, including from other routes.
  function handleSectionClick(event, sectionId) {
    event.preventDefault();

    setActiveSection(sectionId);
    setMenuOpen(false);
    setResumeMenuOpen(false);

    navigate(
      { pathname: "/", hash: `#${sectionId}` },
      { preventScrollReset: true },
    );
  }

  // Scroll to the selected section after navigation.
  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    const sectionId = decodeURIComponent(location.hash.slice(1)) || "home";

    const frameId = requestAnimationFrame(() => {
      const section = document.getElementById(sectionId);

      if (section) {
        setActiveSection(sectionId);
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [location.pathname, location.hash]);

  // Update active navigation item while scrolling.
  useEffect(() => {
    if (location.pathname !== "/") return;

    const sectionIds = links.map((link) => link.id);
    let ticking = false;

    const updateActiveSection = () => {
      const marker = 150;

      const sections = sectionIds
        .map((id) => document.getElementById(id))
        .filter(Boolean);

      let currentSection = null;
      let closestTop = -Infinity;

      for (const section of sections) {
        const top = section.getBoundingClientRect().top;

        if (top <= marker && top > closestTop) {
          closestTop = top;
          currentSection = section;
        }
      }

      if (!currentSection && sections.length > 0) {
        currentSection = sections.reduce((first, section) =>
          section.getBoundingClientRect().top <
          first.getBoundingClientRect().top
            ? section
            : first,
        );
      }

      const current = currentSection?.id || "home";

      setActiveSection((previous) =>
        previous === current ? previous : current,
      );

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateActiveSection);
        ticking = true;
      }
    };

    updateActiveSection();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [location.pathname]);

  const desktopLinkClass = (id) =>
    `relative inline-flex shrink-0 items-center py-2 text-sm font-medium
    transition-colors duration-200 ${
      activeSection === id
        ? "text-blue-600 dark:text-blue-400"
        : "text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
    }`;

  const mobileLinkClass = (id) =>
    `rounded-xl px-4 py-3 text-sm font-medium transition ${
      activeSection === id
        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
    }`;

  const closeMobileMenu = () => {
    setMenuOpen(false);
    setResumeMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/90"
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8"
      >
        {/* Logo */}
        <Link
          to="/#home"
          onClick={(event) => handleSectionClick(event, "home")}
          aria-label="DHIRAJ.DEV - Home"
          className="group flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight"
        >
          <img
            src="/Mylogo.png"
            alt="DHIRAJ.DEV logo"
            className="h-9 w-9 shrink-0 rounded-xl object-contain transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
          />

          <span className="text-slate-900 dark:text-white">PORTFOLIO</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden min-w-0 flex-1 items-center justify-end gap-4 xl:gap-5 md:flex">
          <div className="flex min-w-0 items-center gap-3  lg:gap-4 xl:gap-5">
            {links.map((link) => (
              <a
                key={link.id}
                href={`/#${link.id}`}
                onClick={(event) => handleSectionClick(event, link.id)}
                aria-current={
                  activeSection === link.id ? "location" : undefined
                }
                className={desktopLinkClass(link.id)}
              >
                {link.label}

                {activeSection === link.id && (
                  <motion.span
                    layoutId="navbar-active-indicator"
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-blue-600"
                  />
                )}
              </a>
            ))}
          </div>

          {/* Resume dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setResumeMenuOpen((open) => !open)}
              aria-expanded={resumeMenuOpen}
              className="inline-flex items-center gap-1 py-2 text-sm font-medium text-slate-600 transition hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              Resume
              <ChevronDown
                size={15}
                className={`transition-transform ${
                  resumeMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {resumeMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-full z-50 mt-3 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                >
                  <a
                    href={resolvedResumeUrl || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={!resolvedResumeUrl}
                    onClick={() => setResumeMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-blue-600 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                  >
                    <FileText size={16} />
                    View Resume
                  </a>

                  <a
                    href={resumeDownloadUrl || undefined}
                    aria-disabled={!resumeDownloadUrl}
                    onClick={() => setResumeMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-blue-600 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                  >
                    <Download size={16} />
                    Download Resume
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Admin button */}
          <Link
            to="/admin"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25"
          >
            <ShieldCheck size={16} />
            Admin
          </Link>
        </div>

        {/* Theme toggle and mobile menu */}
        <div className="flex shrink-0 items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title="Toggle theme"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{
                  rotate: -45,
                  opacity: 0,
                  scale: 0.7,
                }}
                animate={{
                  rotate: 0,
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  rotate: 45,
                  opacity: 0,
                  scale: 0.7,
                }}
                transition={{ duration: 0.18 }}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={
              menuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 transition hover:border-blue-500 md:hidden dark:border-slate-700"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile navigation */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-navigation"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-slate-200 md:hidden dark:border-slate-800"
          >
            <div className="mx-auto flex max-h-[75vh] max-w-7xl flex-col gap-1 overflow-y-auto px-5 py-4">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={`/#${link.id}`}
                  onClick={(event) => handleSectionClick(event, link.id)}
                  aria-current={
                    activeSection === link.id ? "location" : undefined
                  }
                  className={mobileLinkClass(link.id)}
                >
                  {link.label}
                </a>
              ))}

              {/* Mobile resume links */}
              <button
                type="button"
                onClick={() => setResumeMenuOpen((open) => !open)}
                aria-expanded={resumeMenuOpen}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Resume
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    resumeMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {resumeMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pl-4"
                  >
                    <a
                      href={resolvedResumeUrl || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-disabled={!resolvedResumeUrl}
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                      <FileText size={16} />
                      View Resume
                    </a>

                    <a
                      href={resumeDownloadUrl || undefined}
                      aria-disabled={!resumeDownloadUrl}
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-100 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                      <Download size={16} />
                      Download Resume
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile Admin button */}
              <Link
                to="/admin"
                onClick={closeMobileMenu}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <ShieldCheck size={17} />
                Admin Panel
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
