import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard,
  UserRound,
  FolderKanban,
  GraduationCap,
  FileText,
  Image,
  Mail,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  BriefcaseBusiness,
  Award,
} from "lucide-react";
const menuItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Profile", path: "/admin/profile", icon: UserRound },
  { name: "Projects", path: "/admin/projects", icon: FolderKanban },
  { name: "Skills", path: "/admin/skills", icon: GraduationCap },
  { name: "Education", path: "/admin/education", icon: GraduationCap },
  { name: "Experience", path: "/admin/experience", icon: BriefcaseBusiness },
  { name: "Certifications", path: "/admin/certifications", icon: Award },
  { name: "Resume", path: "/admin/resume", icon: FileText },
  { name: "Media Library", path: "/admin/media", icon: Image },
  { name: "Messages", path: "/admin/messages", icon: Mail },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme, activeTheme } = useTheme();

  const isDark = activeTheme === "dark";

  const pageBg = isDark ? "bg-slate-950" : "bg-slate-50";
  const surface = isDark
    ? "bg-slate-900 border-slate-800"
    : "bg-white border-slate-200";
  const textColor = isDark ? "text-white" : "text-slate-900";
  const mutedText = isDark ? "text-slate-400" : "text-slate-500";
  const borderStyle = isDark ? "border-slate-800" : "border-slate-200";
  const hoverStyle = isDark
    ? "hover:bg-slate-800 hover:text-white"
    : "hover:bg-slate-100 hover:text-slate-900";
  const activeStyle = isDark
    ? "bg-blue-500/15 text-blue-400"
    : "bg-blue-50 text-blue-700";

  function handleLogout() {
    sessionStorage.removeItem("adminToken");
    navigate("/admin/login", { replace: true });
  }

  return (
    <div
      className={`flex h-screen flex-col overflow-hidden ${pageBg} ${textColor}`}
    >
      {/* FULL-WIDTH HEADER — ABOVE SIDEBAR AND CONTENT */}
      <header
        className={`relative z-50 flex h-18.75 w-full shrink-0 items-center justify-between gap-3 border-b px-4 sm:px-6 lg:px-8 ${surface}`}
      >
        {/* Brand and mobile menu */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            onClick={() => setSidebarOpen((open) => !open)}
            className={`rounded-lg p-2 transition-colors md:hidden ${hoverStyle}`}
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight sm:text-xl">
              Portfolio <span className="text-blue-500">Admin</span>
            </h1>
            <p className={`mt-1 text-xs ${mutedText}`}>Content Management</p>
          </div>
        </div>

        {/* Theme controls and portfolio link */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div
            className={`flex items-center gap-1 rounded-xl border p-1 ${borderStyle}`}
            aria-label="Choose theme"
          >
            <button
              type="button"
              title="Light theme"
              aria-label="Light theme"
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
              className={`rounded-lg p-2 ${
                theme === "light" ? activeStyle : `${mutedText} ${hoverStyle}`
              }`}
            >
              <Sun size={17} />
            </button>

            <button
              type="button"
              title="Dark theme"
              aria-label="Dark theme"
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
              className={`rounded-lg p-2 ${
                theme === "dark" ? activeStyle : `${mutedText} ${hoverStyle}`
              }`}
            >
              <Moon size={17} />
            </button>

            <button
              type="button"
              title="System theme"
              aria-label="System theme"
              aria-pressed={theme === "system"}
              onClick={() => setTheme("system")}
              className={`rounded-lg p-2 ${
                theme === "system" ? activeStyle : `${mutedText} ${hoverStyle}`
              }`}
            >
              <Monitor size={17} />
            </button>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:px-4"
          >
            <ExternalLink size={16} />
            <span className="hidden sm:inline">View Portfolio</span>
            <span className="sm:hidden">View</span>
          </a>
        </div>
      </header>

      {/* AREA BELOW THE FULL-WIDTH HEADER */}
      <div className="relative flex min-h-0 flex-1">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 z-30 bg-black/50 md:hidden"
          />
        )}

        {/* LEFT SIDEBAR */}
        <aside
          className={`
            absolute inset-y-0 left-0 z-40 flex w-72
            flex-col border-r transition-transform duration-200
            md:relative md:z-10 md:translate-x-0
            ${surface}
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* Navigation */}
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin/dashboard"}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive ? activeStyle : `${mutedText} ${hoverStyle}`
                    }`
                  }
                >
                  <Icon size={19} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Logout pinned to the bottom */}
          <div className={`shrink-0 border-t p-4 ${borderStyle}`}>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
            >
              <LogOut size={19} />
              Logout
            </button>
          </div>
        </aside>

        {/* RIGHT-SIDE PAGE CONTENT */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
