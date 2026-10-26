import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";

import { motion } from "motion/react";
import { SiGithub, SiInstagram } from "@icons-pack/react-simple-icons";
import { ArrowUp, Sparkles, Mail } from "lucide-react";

import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import GlobalAnimatedBackground from "./components/GlobalAnimatedBackground";
import Home from "./pages/Home.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminAboutPageSettings from "./pages/admin/AdminAboutPageSettings.jsx";
import AdminProjects from "./pages/admin/AdminProjects.jsx";
import AdminSkills from "./pages/admin/AdminSkills";
import AdminEducation from "./pages/admin/AdminEducation";
import AdminResume from "./pages/admin/AdminResume.jsx";
import AdminExperience from "./pages/admin/AdminExperience";
import AdminCertifications from "./pages/admin/AdminCertifications.jsx";

import AdminMediaLibrary from "./pages/admin/AdminMediaLibrary";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminSettings from "./pages/admin/AdminSettings";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminLayout from "./layouts/AdminLayout";

function LinkedInIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function PortfolioFooter() {
  const socialLinks = [
    {
      label: "GitHub",
      Icon: SiGithub,
      brandColor: "#181717",
      href: "https://github.com/dhiraj620168",
    },
    {
      label: "LinkedIn",
      Icon: LinkedInIcon,
      brandColor: "#0A66C2",
      href: "https://www.linkedin.com/in/dhirajkumarpatel/",
    },
    {
      label: "Instagram",
      Icon: SiInstagram,
      brandColor: "#E4405F",
      href: "https://www.instagram.com/dhiraj_kumar_05052003/",
    },
  ];

  const navigationLinks = [
    { label: "Home", id: "home" },
    { label: "About", id: "about" },
    { label: "Skills", id: "skills" },
    { label: "Projects", id: "projects" },
    { label: "Experience", id: "experience" },
    { label: "Education", id: "education" },
    { label: "Certifications", id: "certifications" },
    { label: "Contact", id: "contact" },
  ];

  function handleFooterNavigation(event, id) {
    event.preventDefault();

    const hash = `#${id}`;

    if (window.location.pathname !== "/") {
      window.location.href = `/${hash}`;
      return;
    }

    if (window.location.hash !== hash) {
      window.history.pushState(null, "", `/${hash}`);
    }

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <footer className="relative isolate mt-0 overflow-hidden border-t border-slate-200 bg-slate-50 text-slate-900 transition-colors duration-500 dark:border-white/10 dark:bg-[#050914] dark:text-white">
      {/* Animated ambient lighting — no grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-blue-500/10 blur-[100px] dark:bg-blue-500/15"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-[100px] dark:bg-cyan-400/10"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 py-0 sm:px-8 lg:px-12">
        {/* Main footer panel */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-black/20 sm:p-8 lg:p-10">
          {/* Gradient overlay behind portrait */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 top-0 hidden w-[58%] bg-gradient-to-l from-blue-500/10 via-cyan-500/5 to-transparent md:block dark:from-blue-500/15"
          />

          <div className="relative z-10 grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-8 lg:gap-16">
            {/* Brand and socials */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="max-w-lg"
            >
              <Link
                to="/#home"
                onClick={(event) => handleFooterNavigation(event, "home")}
                aria-label="DHIRAJ.DEV - Home"
                className="group flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight"
              >
                <img
                  src="/Mylogo.png"
                  alt="DHIRAJ.DEV logo"
                  className="h-9 w-9 shrink-0 rounded-xl object-contain transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
                />

                <span className="text-slate-900 dark:text-white">
                  DHIRAJ
                  <span className="text-blue-600 dark:text-cyan-400">
                    KUMAR
                  </span>
                </span>
              </Link>

              <h2 className="mt-7 max-w-md text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                Building ideas into{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-300">
                  digital experiences.
                </span>
              </h2>

              <p className="mt-4 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">
                Full Stack Developer in the making, exploring Generative AI and
                building practical applications through continuous learning.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {socialLinks.map(({ label, Icon, href, brandColor }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    title={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/80 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10"
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center"
                      style={{ color: brandColor }}
                    >
                      <Icon size={19} />
                    </span>
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="relative z-20 md:pt-2"
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-cyan-300">
                Explore
              </p>

              <h3 className="mt-3 text-xl font-bold">Quick navigation</h3>

              <nav
                aria-label="Footer navigation"
                className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3"
              >
                {navigationLinks.map(({ label, id }, index) => (
                  <motion.a
                    key={id}
                    href={`/#${id}`}
                    onClick={(event) => handleFooterNavigation(event, id)}
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                    className="group inline-flex w-fit items-center gap-1.5 text-sm text-slate-600 transition-colors duration-200 hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-300"
                  >
                    <span className="h-1 w-1 rounded-full bg-slate-300 transition-colors group-hover:bg-blue-500 dark:bg-slate-600 dark:group-hover:bg-cyan-300" />
                    {label}
                  </motion.a>
                ))}
              </nav>

              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=dk3152544@gmail.com&su=Portfolio%20Inquiry"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 dark:border-cyan-400/20 dark:text-cyan-300 dark:hover:bg-cyan-400/10"
              >
                <Mail size={16} aria-hidden="true" />
                Let&apos;s connect
                <ArrowUp size={14} className="rotate-45" aria-hidden="true" />
              </a>
            </motion.div>
          </div>
        </div>

        {/* Copyright and back to top */}
        <div className="flex flex-col gap-4 py-0 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-6 text-slate-500 dark:text-slate-500 sm:text-sm">
            © {new Date().getFullYear()} Dhiraj Kumar. All rights reserved.
          </p>

          <button
            type="button"
            onClick={() =>
              document.getElementById("home")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
            className="group inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:text-cyan-300 sm:self-auto"
          >
            Back to top
            <ArrowUp
              size={16}
              className="transition-transform duration-300 group-hover:-translate-y-1"
            />
          </button>
        </div>
      </div>
    </footer>
  );
}

function Placeholder({ title }) {
  return (
    <main className="mx-auto min-h-[70vh] max-w-6xl px-6 py-20">
      <h1 className="text-4xl font-bold">{title}</h1>
    </main>
  );
}

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Scroll to the requested section when a URL contains a hash.
  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) return;

    const sectionId = decodeURIComponent(location.hash.slice(1));

    const frameId = requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [location.pathname, location.hash]);

  return (
    // <div
    //   className="min-h-screen bg-white text-slate-900
    //     transition-colors duration-300 dark:bg-slate-950
    //     dark:text-white"
    // >
    <div
      className={
        isAdminRoute
          ? "min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white"
          : "portfolio-shell"
      }
    >
      {!isAdminRoute && <GlobalAnimatedBackground />}
      {!isAdminRoute && <Navbar />}

      <Routes>
        {/* All public portfolio sections belong to Home.jsx */}
        <Route path="/" element={<Home />} />

        {/* Optional redirect from old public URLs to Home sections */}
        <Route path="/about" element={<SectionRedirect section="about" />} />
        <Route path="/skills" element={<SectionRedirect section="skills" />} />
        <Route
          path="/projects"
          element={<SectionRedirect section="projects" />}
        />
        <Route
          path="/contact"
          element={<SectionRedirect section="contact" />}
        />

        {/* Admin login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected admin area */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="profile" element={<AdminAboutPageSettings />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="skills" element={<AdminSkills />} />
          <Route path="education" element={<AdminEducation />} />
          <Route path="experience" element={<AdminExperience />} />
          <Route path="certifications" element={<AdminCertifications />} />
          <Route path="resume" element={<AdminResume />} />
          <Route path="media" element={<AdminMediaLibrary />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Placeholder title="Page Not Found" />} />
      </Routes>

      {!isAdminRoute && <PortfolioFooter />}
    </div>
  );
}

function SectionRedirect({ section }) {
  const location = useLocation();

  useEffect(() => {
    window.location.replace(`/#${section}`);
  }, [section, location.pathname]);

  return (
    <main className="min-h-[50vh] p-10 text-center">
      Redirecting to portfolio section...
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ThemeProvider>
  );
}
