import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  Eye,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Mail,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Zap,
} from "lucide-react";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const ENDPOINTS = {
  projects: "/projects",
  certifications: "/certifications",
  messages: "/messages",
  media: "/media",
  profile: "/profile",
};

const NAV_LINKS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: BarChart3 },
  { label: "Profile", href: "/admin/profile", icon: UserRound },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Certifications", href: "/admin/certifications", icon: Award },
  { label: "Media library", href: "/admin/media", icon: ImageIcon },
  { label: "Messages", href: "/admin/messages", icon: Mail },
];

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function getItems(payload, key) {
  if (Array.isArray(payload)) return payload;
  const candidates = [
    payload?.[key],
    payload?.data,
    payload?.items,
    payload?.results,
  ];
  return candidates.find(Array.isArray) || [];
}

function getCount(payload, key) {
  const candidates = [
    payload?.total,
    payload?.count,
    payload?.totalCount,
    payload?.pagination?.total,
  ];
  const found = candidates.find((value) => typeof value === "number");
  return typeof found === "number" ? found : getItems(payload, key).length;
}

async function request(path, token, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }
  return payload;
}

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "blue",
  loading,
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-900",
    violet:
      "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950/60 dark:text-violet-300 dark:ring-violet-900",
    emerald:
      "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900",
    amber:
      "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          {loading ? (
            <div className="mt-3 h-9 w-20 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ) : (
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              {value}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ring-1 ${tones[tone] || tones.blue}`}>
          <Icon size={21} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Activity size={14} />
        <span>{helper}</span>
      </div>
    </article>
  );
}

function ActionLink({ href, icon: Icon, title, description }) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-900 dark:hover:bg-blue-950/20"
    >
      <span className="rounded-xl bg-slate-100 p-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
          {description}
        </span>
      </span>
      <ChevronRight
        size={17}
        className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
      />
    </a>
  );
}

function PanelHeading({ eyebrow, title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState({
    projects: [],
    certifications: [],
    messages: [],
    media: [],
    profile: null,
  });
  const [status, setStatus] = useState({
    projects: "loading",
    certifications: "loading",
    messages: "loading",
    media: "loading",
    profile: "loading",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [globalError, setGlobalError] = useState("");
  const [activeRange, setActiveRange] = useState("7d");

  const loadDashboard = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setGlobalError("");

    const token = sessionStorage.getItem("adminToken");
    if (!token) {
      setGlobalError("Admin session nahi mili. Dobara login karein.");
      setStatus({
        projects: "error",
        certifications: "error",
        messages: "error",
        media: "error",
        profile: "error",
      });
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const controller = new AbortController();
    const entries = Object.entries(ENDPOINTS);
    const results = await Promise.allSettled(
      entries.map(async ([key, path]) => ({
        key,
        payload: await request(path, token, controller.signal),
      })),
    );

    const nextData = {
      projects: [],
      certifications: [],
      messages: [],
      media: [],
      profile: null,
    };
    const nextStatus = {};
    const failures = [];

    results.forEach((result, index) => {
      const key = entries[index][0];
      if (result.status === "rejected") {
        nextStatus[key] = "error";
        failures.push(key);
        return;
      }

      const payload = result.value.payload;
      nextStatus[key] = "ready";

      if (key === "profile") {
        nextData.profile =
          payload?.profile || payload?.data || payload?.user || payload || null;
      } else {
        nextData[key] = getItems(payload, key);
      }
    });

    setData(nextData);
    setStatus(nextStatus);

    if (failures.length === entries.length) {
      setGlobalError(
        "Dashboard API se data nahi aa saka. API routes, token aur server URL check karein.",
      );
    } else if (failures.length) {
      setGlobalError(
        `Kuch endpoints available nahi hain: ${failures.join(", ")}. Un sections ko unavailable dikhaya jayega.`,
      );
    }

    setLastUpdated(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const counts = useMemo(
    () => ({
      projects: status.projects === "ready" ? data.projects.length : null,
      certifications:
        status.certifications === "ready" ? data.certifications.length : null,
      messages: status.messages === "ready" ? data.messages.length : null,
      media: status.media === "ready" ? data.media.length : null,
    }),
    [data, status],
  );

  const unreadMessages = useMemo(
    () =>
      data.messages.filter((message) => {
        const state = String(
          message.status || message.state || "",
        ).toLowerCase();
        return (
          message.read === false ||
          message.isRead === false ||
          ["new", "unread", "pending"].includes(state)
        );
      }).length,
    [data.messages],
  );

  const activity = useMemo(() => {
    const entries = [
      ...data.projects.map((item, index) => ({
        id: item._id || item.id || `project-${index}`,
        kind: "project",
        title: item.title || item.name || "Untitled project",
        subtitle: "Project",
        date: item.updatedAt || item.createdAt,
      })),
      ...data.messages.map((item, index) => ({
        id: item._id || item.id || `message-${index}`,
        kind: "message",
        title:
          item.name || item.fullName || item.subject || "Contact submission",
        subtitle: item.email || item.message || "New contact message",
        date: item.createdAt || item.updatedAt,
      })),
      ...data.certifications.map((item, index) => ({
        id: item._id || item.id || `cert-${index}`,
        kind: "certification",
        title: item.title || item.name || "Certification",
        subtitle: "Certification",
        date: item.updatedAt || item.createdAt,
      })),
    ];

    return entries
      .sort((a, b) => {
        const aDate = a.date ? new Date(a.date).getTime() : 0;
        const bDate = b.date ? new Date(b.date).getTime() : 0;
        return bDate - aDate;
      })
      .slice(0, 7);
  }, [data]);

  const projectStatuses = useMemo(() => {
    const published = data.projects.filter(
      (item) =>
        item.published === true ||
        item.isPublished === true ||
        item.status === "published",
    ).length;
    return { published, drafts: Math.max(data.projects.length - published, 0) };
  }, [data.projects]);

  const display = (value) => (value === null ? "—" : formatNumber(value));
  const updatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Not synced";

  const profileName = data.profile?.name || data.profile?.fullName || "Admin";
  const initials = profileName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-900/40 dark:text-white">
      <div className="mx-auto max-w-[1600px] space-y-7 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                Workspace / Overview
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Good to see you, {profileName}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Here is what is happening across your portfolio today.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {lastUpdated ? `Synced ${updatedLabel}` : "Connecting to API"}
            </div>
            <button
              type="button"
              onClick={() => loadDashboard({ quiet: true })}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing || loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </header>

        {globalError && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <CircleAlert size={19} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Data connection notice</p>
              <p className="mt-1">{globalError}</p>
            </div>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <StatCard
            title="Total projects"
            value={display(counts.projects)}
            helper={`${projectStatuses.published} published · ${projectStatuses.drafts} other`}
            icon={FolderKanban}
            tone="blue"
            loading={loading}
          />
          <StatCard
            title="Certifications"
            value={display(counts.certifications)}
            helper="Credentials and achievements"
            icon={Award}
            tone="violet"
            loading={loading}
          />
          <StatCard
            title="Contact messages"
            value={display(counts.messages)}
            helper={
              unreadMessages
                ? `${unreadMessages} potentially unread`
                : "Stored contact submissions"
            }
            icon={Mail}
            tone="emerald"
            loading={loading}
          />
          <StatCard
            title="Media assets"
            value={display(counts.media)}
            helper="Images and documents in storage"
            icon={ImageIcon}
            tone="amber"
            loading={loading}
          />
        </section>

        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
              <PanelHeading
                eyebrow="Shortcuts"
                title="Manage your portfolio"
                subtitle="Jump directly to the work you want to do."
              />
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <ActionLink
                  href="/admin/projects/new"
                  icon={Plus}
                  title="Create a project"
                  description="Add a new portfolio case study"
                />
                <ActionLink
                  href="/admin/profile"
                  icon={UserRound}
                  title="Update profile"
                  description="Bio, social links and resume"
                />
                <ActionLink
                  href="/admin/media"
                  icon={ImageIcon}
                  title="Open media library"
                  description="Upload and organize files"
                />
                <ActionLink
                  href="/admin/certifications"
                  icon={Award}
                  title="Add certification"
                  description="Showcase your achievements"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
              <PanelHeading
                eyebrow="Latest changes"
                title="Recent activity"
                subtitle="Built from records returned by your API."
                action={
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Clock3 size={14} /> Live API data
                  </span>
                }
              />
              {loading ? (
                <div className="mt-5 space-y-4">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="flex animate-pulse gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                        <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity.length ? (
                <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                  {activity.map((item) => {
                    const Icon =
                      item.kind === "message"
                        ? Mail
                        : item.kind === "certification"
                          ? Award
                          : BriefcaseBusiness;
                    const iconClass =
                      item.kind === "message"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : item.kind === "certification"
                          ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
                    const parsedDate = item.date ? new Date(item.date) : null;
                    return (
                      <div
                        key={`${item.kind}-${item.id}`}
                        className="flex items-start gap-3 py-4 first:pt-1 last:pb-1"
                      >
                        <div className={`rounded-xl p-2.5 ${iconClass}`}>
                          <Icon size={17} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {item.title}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                            {item.subtitle}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">
                          {parsedDate && !Number.isNaN(parsedDate.getTime())
                            ? parsedDate.toLocaleDateString()
                            : item.kind}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-xl bg-slate-50 p-6 text-center dark:bg-slate-900">
                  <Activity size={25} className="mx-auto text-slate-400" />
                  <p className="mt-2 text-sm font-semibold">
                    No recent activity
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    When projects, certifications or messages are returned by
                    the API, they will appear here.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-sm dark:border-slate-700 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{" "}
                    Admin workspace
                  </span>
                  <h2 className="mt-4 text-xl font-bold">
                    Everything in one place.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Keep portfolio content fresh and make sure your public site
                    reflects your latest work.
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <Sparkles size={22} />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Projects</p>
                  <p className="mt-1 text-xl font-bold">
                    {display(counts.projects)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Messages</p>
                  <p className="mt-1 text-xl font-bold">
                    {display(counts.messages)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
              <PanelHeading
                title="Workspace links"
                subtitle="Your admin sections."
              />
              <nav className="mt-4 space-y-1">
                {NAV_LINKS.map(({ label, href, icon: Icon }) => (
                  <a
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${href === "/admin/dashboard" ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"}`}
                  >
                    <Icon size={17} />
                    <span className="flex-1">{label}</span>
                    <ChevronRight size={15} className="text-slate-400" />
                  </a>
                ))}
              </nav>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Session-aware dashboard</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Uses the admin token from your current login session.
                    Missing API routes are reported instead of being silently
                    counted as zero.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>

        <footer className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-600" /> Admin area ·
            Protected API requests
          </span>
          <span>
            Last successful sync:{" "}
            {lastUpdated
              ? `${lastUpdated.toLocaleDateString()} ${updatedLabel}`
              : "Not synced yet"}
          </span>
        </footer>
      </div>
    </div>
  );
}
