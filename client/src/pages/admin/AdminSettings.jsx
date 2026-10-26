import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Palette,
  RefreshCw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const DEFAULT_SETTINGS = {
  siteTitle: "",
  siteDescription: "",
  siteUrl: "",
  contactEmail: "",
  maintenanceMode: false,
  showAvailability: true,
  emailNotifications: true,
  publicProfile: true,
  themePreference: "system",
};

async function apiRequest(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }

  return payload;
}

function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Icon size={19} />
        </div>
        <div>
          <h2 className="font-semibold text-slate-950 dark:text-white">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
      <div className="space-y-5 p-5 sm:p-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const token = () => sessionStorage.getItem("adminToken");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const currentToken = sessionStorage.getItem("adminToken");
      if (!currentToken)
        throw new Error("Admin session nahi mili. Please login again.");

      // This endpoint must be implemented on the backend to persist settings.
      const response = await apiRequest("/settings", { token: currentToken });
      const saved = response.settings || response.data || {};
      const merged = { ...DEFAULT_SETTINGS, ...saved };
      setSettings(merged);
      setInitialSettings(merged);
    } catch (err) {
      setError(err.message || "Settings load nahi ho sakin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetting = (key, value) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setNotice("");
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const currentToken = token();
      if (!currentToken)
        throw new Error("Admin session nahi mili. Please login again.");

      const response = await apiRequest("/settings", {
        method: "PUT",
        token: currentToken,
        body: settings,
      });

      const saved = {
        ...DEFAULT_SETTINGS,
        ...(response.settings || response.data || settings),
      };
      setSettings(saved);
      setInitialSettings(saved);
      setNotice("Settings successfully saved to the server.");
    } catch (err) {
      setError(err.message || "Settings save nahi ho sakin.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (passwordForm.newPassword.length < 8) {
      setError("New password kam se kam 8 characters ka hona chahiye.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password aur confirmation match nahi karte.");
      return;
    }

    setChangingPassword(true);
    try {
      const currentToken = token();
      if (!currentToken)
        throw new Error("Admin session nahi mili. Please login again.");

      await apiRequest("/settings/change-password", {
        method: "PUT",
        token: currentToken,
        body: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setNotice("Password changed successfully.");
    } catch (err) {
      setError(err.message || "Password change nahi ho saka.");
    } finally {
      setChangingPassword(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  return (
    <main className="min-h-full bg-slate-50 p-4 dark:bg-slate-900/40 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
              Admin workspace
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Settings
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Manage site preferences, visibility and account security.
            </p>
          </div>
          <button
            type="button"
            onClick={loadSettings}
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
            Reload
          </button>
        </header>

        {(error || notice) && (
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
            }`}
          >
            {error ? (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            )}
            <div>{error || notice}</div>
          </div>
        )}

        <form onSubmit={saveSettings} className="space-y-6">
          <SectionCard
            icon={Globe}
            title="Website settings"
            description="Basic information used by your public portfolio."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Website title">
                <input
                  className={inputClass}
                  maxLength={100}
                  value={settings.siteTitle}
                  onChange={(e) => updateSetting("siteTitle", e.target.value)}
                  placeholder="Dhiraj Kumar — Portfolio"
                />
              </Field>
              <Field
                label="Public website URL"
                hint="Use your deployed frontend URL, including https://."
              >
                <input
                  className={inputClass}
                  type="url"
                  maxLength={250}
                  value={settings.siteUrl}
                  onChange={(e) => updateSetting("siteUrl", e.target.value)}
                  placeholder="https://your-portfolio.example"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Website description">
                  <textarea
                    className={`${inputClass} min-h-24 resize-y`}
                    maxLength={300}
                    value={settings.siteDescription}
                    onChange={(e) =>
                      updateSetting("siteDescription", e.target.value)
                    }
                    placeholder="A short description of your portfolio..."
                  />
                </Field>
              </div>
              <Field
                label="Contact email"
                hint="Shown to visitors if your public site uses this setting."
              >
                <input
                  className={inputClass}
                  type="email"
                  maxLength={150}
                  value={settings.contactEmail}
                  onChange={(e) =>
                    updateSetting("contactEmail", e.target.value)
                  }
                  placeholder="you@example.com"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={SlidersHorizontal}
            title="Portfolio preferences"
            description="Control selected features of the public portfolio."
          >
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                {
                  key: "publicProfile",
                  title: "Public profile",
                  description:
                    "Allow your profile section to be shown on the portfolio.",
                },
                {
                  key: "showAvailability",
                  title: "Show availability",
                  description:
                    "Show a hiring or freelance availability indicator if your site supports it.",
                },
                {
                  key: "emailNotifications",
                  title: "Email notifications",
                  description:
                    "Preference for new contact-message notifications; email delivery needs backend integration.",
                },
                {
                  key: "maintenanceMode",
                  title: "Maintenance mode",
                  description:
                    "Setting is stored here; it only affects visitors after the public frontend checks this setting.",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                  <Toggle
                    checked={Boolean(settings[item.key])}
                    onChange={(value) => updateSetting(item.key, value)}
                    disabled={loading || saving}
                    label={item.title}
                  />
                </div>
              ))}
            </div>
            <Field
              label="Appearance preference"
              hint="Saved as a preference; connect it to your app theme provider if you want it to change the whole site."
            >
              <select
                className={inputClass}
                value={settings.themePreference}
                onChange={(e) =>
                  updateSetting("themePreference", e.target.value)
                }
              >
                <option value="system">Use system preference</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </Field>
          </SectionCard>

          <SectionCard
            icon={Save}
            title="Save changes"
            description="Settings are sent to the backend and should be persisted in MongoDB."
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isDirty
                  ? "You have unsaved changes."
                  : "Everything is up to date."}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!isDirty || saving}
                  onClick={() => {
                    setSettings(initialSettings);
                    setNotice("");
                    setError("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={loading || saving || !isDirty}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {saving ? "Saving..." : "Save settings"}
                </button>
              </div>
            </div>
          </SectionCard>
        </form>

        <SectionCard
          icon={LockKeyhole}
          title="Change admin password"
          description="Update the password for your admin account."
        >
          <form onSubmit={changePassword} className="space-y-4">
            <Field label="Current password">
              <input
                className={inputClass}
                type="password"
                autoComplete="current-password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({
                    ...p,
                    currentPassword: e.target.value,
                  }))
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="New password" hint="Use at least 8 characters.">
                <div className="relative">
                  <input
                    className={`${inputClass} pr-11`}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        newPassword: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm new password">
                <input
                  className={inputClass}
                  type="password"
                  autoComplete="new-password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({
                      ...p,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <ShieldCheck size={16} className="mt-0.5 shrink-0" />
              Password changes are handled by a separate protected backend
              endpoint. Do not store passwords in frontend settings or local
              storage.
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {changingPassword ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <KeyRound size={16} />
                )}
                {changingPassword ? "Updating..." : "Change password"}
              </button>
            </div>
          </form>
        </SectionCard>

        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          Security note: the UI expects protected API routes at{" "}
          <code>/api/settings</code> and{" "}
          <code>/api/settings/change-password</code>. If these routes are not
          implemented yet, the page will report the API error rather than
          pretending the changes were saved.
        </p>
      </div>
    </main>
  );
}
