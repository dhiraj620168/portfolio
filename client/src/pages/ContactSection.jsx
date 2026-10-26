import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { SiGithub, SiInstagram } from "@icons-pack/react-simple-icons";
import { motion, useReducedMotion } from "motion/react";
import api from "../services/api";

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

const CONTACT_EMAIL = "dk3152544@gmail.com"; // Replace with your actual email address.

const SUBJECT_OPTIONS = [
  "Job Opportunity",
  "Freelance Project",
  "Collaboration",
  "General Inquiry",
  "Other",
];

const INITIAL_FORM = {
  name: "",
  email: "",
  subject: "Job Opportunity",
  message: "",
  consent: false,
  website: "",
};

function validateForm(form) {
  const name = form.name.trim();
  const email = form.email.trim();
  const message = form.message.trim();

  if (name.length < 2 || name.length > 100) {
    return "Name must be between 2 and 100 characters.";
  }

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address.";
  }

  if (!SUBJECT_OPTIONS.includes(form.subject)) {
    return "Please select a valid subject.";
  }

  if (message.length < 10 || message.length > 5000) {
    return "Message must be between 10 and 5000 characters.";
  }

  if (form.consent !== true) {
    return "Please accept the consent checkbox before sending your message.";
  }

  return "";
}

function getRequestError(error) {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  if (status === 429) {
    return (
      serverMessage ||
      "Too many messages have been submitted. Please try again after 15 minutes."
    );
  }

  if (status === 400 && serverMessage) return serverMessage;
  if (status >= 500) {
    return (
      serverMessage ||
      "The server could not send your message. Please try again later."
    );
  }

  if (!error?.response) {
    return "Could not connect to the server. Check your connection and try again.";
  }

  return serverMessage || "Something went wrong. Please try again.";
}

function ContactInfoCard({ icon: Icon, label, value, href, reduceMotion }) {
  const content = (
    <div className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/75 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/5 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-violet-500/50 sm:p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 transition group-hover:bg-violet-600 group-hover:text-white dark:bg-violet-500/15 dark:text-violet-300">
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className="mt-1 block break-words text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
          {value}
        </span>
      </span>
      {href && (
        <ArrowUpRight
          size={17}
          className="mt-1 shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-600 dark:group-hover:text-violet-300"
        />
      )}
    </div>
  );

  if (!href) return content;

  return (
    <motion.a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
      className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
    >
      {content}
    </motion.a>
  );
}

export default function ContactSection() {
  const reduceMotion = useReducedMotion();
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (feedback) setFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    // Honeypot filled? Let the backend return its generic success response.
    const validationError = form.website.trim() ? "" : validateForm(form);
    if (validationError) {
      setFeedback({ type: "error", message: validationError });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        subject: form.subject,
        message: form.message.trim(),
        consent: form.consent,
        website: form.website,
      };

      const response = await api.post("/contact", payload);
      const data = response?.data;

      if (data?.success === false) {
        throw new Error(data.message || "Unable to submit your message.");
      }

      setFeedback({
        type: "success",
        message:
          data?.message ||
          "Your message has been submitted successfully. Thanks for reaching out!",
      });
      setForm(INITIAL_FORM);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error?.response
          ? getRequestError(error)
          : error?.message || getRequestError(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-violet-400";

  return (
    <motion.section
      id="contact"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
      className="relative isolate scroll-mt-20 overflow-hidden !mt-0 !pt-0 pb-6 sm:pb-8 lg:pb-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : { x: [0, 24, -12, 0], y: [0, -18, 12, 0] }
          }
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-32 top-12 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/10"
        />
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : { x: [0, -18, 15, 0], y: [0, 16, -10, 0] }
          }
          transition={{ duration: 21, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-500/10"
        />
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mb-4 max-w-3xl sm:mb-6">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: reduceMotion ? 0 : 0.4 }}
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-800 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200"
          >
            <Sparkles size={14} />
            Contact
          </motion.div>

          <h2 className="text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            Let&apos;s start a{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-cyan-300">
              conversation
            </span>
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
            Have a role, project, or idea in mind? Share a few details and
            I&apos;ll get back to you.
          </p>
        </div>

        <div className="grid items-stretch gap-3 lg:grid-cols-[0.85fr_1.15fr] lg:gap-4">
          <motion.aside
            initial={reduceMotion ? false : { opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: reduceMotion ? 0 : 0.45 }}
            className="flex h-full flex-col gap-3"
          >
            <div className="flex-1 rounded-3xl border border-slate-200/80 bg-white/70 p-4 shadow-sm shadow-slate-200/40 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/10 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                    Get in touch
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    I&apos;m open to meaningful opportunities.
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Whether you&apos;re hiring, planning a collaboration, or
                exploring a project, use the form and tell me what you have in
                mind.
              </p>
              <div className="mt-4 space-y-2">
                <ContactInfoCard
                  icon={Mail}
                  label="Email"
                  value={CONTACT_EMAIL}
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT_EMAIL)}`}
                  reduceMotion={reduceMotion}
                />
                <ContactInfoCard
                  icon={MapPin}
                  label="Location"
                  value="Patna, Bihar, India"
                  href="https://www.google.com/maps/search/?api=1&query=Patna%2C%20Bihar%2C%20India"
                  reduceMotion={reduceMotion}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 sm:p-5">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Find me online
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Connect with me and explore what I&apos;m building.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  {
                    label: "GitHub",
                    Icon: SiGithub,
                    color: "#64748b",
                    href: "https://github.com/dhiraj620168",
                  },
                  {
                    label: "LinkedIn",
                    Icon: LinkedInIcon,
                    color: "#0A66C2",
                    href: "https://www.linkedin.com/in/dhirajkumarpatel/",
                  },
                  {
                    label: "Instagram",
                    Icon: SiInstagram,
                    color: "#E4405F",
                    href: "https://www.instagram.com/dhiraj_kumar_05052003/",
                  },
                ].map(({ label, Icon, color, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="group flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-4 text-center transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:bg-indigo-50/70 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
                  >
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 transition group-hover:scale-105 dark:bg-slate-800"
                      style={{ color }}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 sm:text-sm">
                      {label}
                    </span>
                    <ExternalLink size={13} className="text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          </motion.aside>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{
              duration: reduceMotion ? 0 : 0.45,
              delay: reduceMotion ? 0 : 0.05,
            }}
            className="h-full rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-xl shadow-slate-300/30 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85 dark:shadow-black/20 sm:p-5 lg:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
                  Send a message
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Fields marked with * are required.
                </p>
              </div>
              <span className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300 sm:flex">
                <Send size={19} />
              </span>
            </div>

            {feedback && (
              <div
                role={feedback.type === "error" ? "alert" : "status"}
                aria-live="polite"
                className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${
                  feedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
                    : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle size={19} className="mt-0.5 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              {/* Honeypot field: hidden from people, but bots may fill it. */}
              <div
                aria-hidden="true"
                className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
              >
                <label htmlFor="contact-website">Leave this field empty</label>
                <input
                  id="contact-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={updateField}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Full name <span className="text-violet-600">*</span>
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.name}
                    onChange={updateField}
                    placeholder="Your name"
                    disabled={submitting}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-email"
                    className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Email address <span className="text-violet-600">*</span>
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={form.email}
                    onChange={updateField}
                    placeholder="you@example.com"
                    disabled={submitting}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                >
                  What would you like to discuss?{" "}
                  <span className="text-violet-600">*</span>
                </label>
                <select
                  id="contact-subject"
                  name="subject"
                  required
                  value={form.subject}
                  onChange={updateField}
                  disabled={submitting}
                  className={inputClass}
                >
                  {SUBJECT_OPTIONS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="contact-message"
                    className="text-sm font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Your message <span className="text-violet-600">*</span>
                  </label>
                  <span
                    className={`text-xs tabular-nums ${form.message.length > 5000 ? "text-rose-600" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    {form.message.length}/5000
                  </span>
                </div>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={5}
                  value={form.message}
                  onChange={updateField}
                  placeholder="Tell me a little about the opportunity or project..."
                  disabled={submitting}
                  className={`${inputClass} min-h-36 resize-y leading-6`}
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Please include at least 10 characters.
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <input
                  name="consent"
                  type="checkbox"
                  required
                  checked={form.consent}
                  onChange={updateField}
                  disabled={submitting}
                  className="mt-1 h-4 w-4 shrink-0 accent-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                  I consent to the storage and processing of my message so that
                  I can receive a response.{" "}
                  <span className="font-semibold text-violet-700 dark:text-violet-300">
                    *
                  </span>
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:w-auto sm:min-w-48"
              >
                {submitting ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Sending message...
                  </>
                ) : (
                  <>
                    <Send
                      size={17}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                    Send message
                    <ArrowUpRight size={16} />
                  </>
                )}
              </button>

              <p className="flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                <ShieldCheck
                  size={15}
                  className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                />
                Your details are used to respond to your inquiry. Please
                don&apos;t include passwords or other sensitive information.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
