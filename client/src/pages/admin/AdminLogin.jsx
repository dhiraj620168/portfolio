// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { LockKeyhole, ArrowLeft } from "lucide-react";
// import api from "../../services/api";

// export default function AdminLogin() {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   async function handleSubmit(event) {
//     event.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const data = await api.post("/auth/login", { email, password });

//       if (!data.token) {
//         throw new Error("Login response did not contain a token.");
//       }

//       sessionStorage.setItem("adminToken", data.token);
//       setPassword("");
//       navigate("/admin/dashboard", { replace: true });
//     } catch (err) {
//       setError(err.message || "Login failed. Check your credentials.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
//       <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
//         <Link
//           to="/"
//           className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
//         >
//           <ArrowLeft size={16} />
//           Back to portfolio
//         </Link>

//         <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
//           <LockKeyhole size={24} />
//         </div>

//         <h1 className="text-3xl font-bold">Admin Login</h1>
//         <p className="mt-2 text-sm text-slate-400">
//           Sign in to manage your portfolio.
//         </p>

//         <form onSubmit={handleSubmit} className="mt-8 space-y-5">
//           <div>
//             <label htmlFor="email" className="mb-2 block text-sm font-medium">
//               Email address
//             </label>
//             <input
//               id="email"
//               type="email"
//               autoComplete="username"
//               required
//               value={email}
//               onChange={(event) => setEmail(event.target.value)}
//               className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
//               placeholder="Enter admin email"
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="password"
//               className="mb-2 block text-sm font-medium"
//             >
//               Password
//             </label>
//             <input
//               id="password"
//               type="password"
//               autoComplete="current-password"
//               required
//               value={password}
//               onChange={(event) => setPassword(event.target.value)}
//               className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
//               placeholder="Enter password"
//             />
//           </div>

//           {error && (
//             <p
//               role="alert"
//               className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300"
//             >
//               {error}
//             </p>
//           )}

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:opacity-60"
//           >
//             {loading ? "Signing in..." : "Sign in"}
//           </button>
//         </form>
//       </div>
//     </main>
//   );
// }

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LockKeyhole,
  ArrowLeft,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  LoaderCircle,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import api from "../../services/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const data = await api.post("/auth/login", {
        email: normalizedEmail,
        password,
      });

      if (!data?.token) {
        throw new Error(
          data?.message ||
            "Login response did not contain a token. Please check the server response.",
        );
      }

      sessionStorage.setItem("adminToken", data.token);
      setPassword("");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Login failed. Check your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const entrance = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18, rotateX: 3 },
        animate: { opacity: 1, y: 0, rotateX: 0 },
        transition: { duration: 0.65, ease: "easeOut" },
      };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#050914] px-4 py-10 text-white sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 -top-20 h-80 w-80 rounded-full bg-blue-600/20 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-cyan-500/15 blur-[110px]"
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[12%] top-[22%] h-3 w-3 rounded-full bg-cyan-300/70 shadow-[0_0_30px_8px_rgba(34,211,238,0.18)]"
        animate={reduceMotion ? undefined : { y: [0, -18, 0], x: [0, 10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[20%] right-[12%] h-2.5 w-2.5 rounded-full bg-blue-300/70 shadow-[0_0_28px_7px_rgba(96,165,250,0.2)]"
        animate={reduceMotion ? undefined : { y: [0, 16, 0], x: [0, -12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-5xl items-center gap-8 md:grid-cols-[1fr_0.9fr] md:gap-12">
        <motion.section
          {...entrance}
          className="hidden md:block"
          style={{ transformStyle: "preserve-3d" }}
        >
          <Link
            to="/"
            className="mb-12 inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to portfolio
          </Link>

          <div className="mb-7 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-blue-500/20 to-cyan-400/10 shadow-[0_12px_50px_rgba(37,99,235,0.2)]">
            <img
              src="/Mylogo.png"
              alt="Dhiraj Logo"
              className="h-full w-full object-contain p-1.5"
            />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">
            DHIRAJ.DEV / ADMIN
          </p>
          <h1 className="mt-5 max-w-lg text-4xl font-black leading-tight tracking-tight lg:text-5xl">
            Your work.
            <br />
            Your space.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-sky-200 bg-clip-text text-transparent">
              Your control.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-400">
            Sign in to manage your portfolio content, projects, skills, and
            professional presence from one secure dashboard.
          </p>

          <div className="mt-9 flex items-center gap-3 text-sm text-slate-400">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-300">
              <ShieldCheck size={18} />
            </span>
            Protected admin access
          </div>
        </motion.section>

        <motion.section
          {...entrance}
          className="relative mx-auto w-full max-w-md"
          style={{ perspective: 1200, transformStyle: "preserve-3d" }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px rounded-[2rem] bg-gradient-to-br from-blue-400/35 via-transparent to-cyan-300/25 blur-sm"
          />

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl"
            />

            <div className="relative">
              <Link
                to="/"
                className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white md:hidden"
              >
                <ArrowLeft size={16} />
                Back to portfolio
              </Link>

              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/20 to-cyan-400/10 text-cyan-300 shadow-lg shadow-blue-950/30">
                <LockKeyhole size={23} />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
                Welcome back
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Admin Login
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Sign in to manage your portfolio.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Email address
                  </label>
                  <div className="group relative">
                    <Mail
                      size={17}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-cyan-300"
                    />
                    <input
                      id="admin-email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      disabled={loading}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-password"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Password
                  </label>
                  <div className="group relative">
                    <LockKeyhole
                      size={17}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition group-focus-within:text-cyan-300"
                    />
                    <input
                      id="admin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      disabled={loading}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 py-3.5 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p
                    role="alert"
                    initial={reduceMotion ? false : { opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-950/50 focus:outline-none focus:ring-4 focus:ring-cyan-400/25 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {loading ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in securely
                      <ArrowLeft
                        size={16}
                        className="rotate-180 transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={14} className="text-cyan-400/80" />
                Your admin session is stored for this browser tab.
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
