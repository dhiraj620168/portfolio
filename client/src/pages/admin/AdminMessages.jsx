import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Mail,
  MailOpen,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  LoaderCircle,
  Inbox,
  CalendarDays,
  UserRound,
  AtSign,
  MessageSquareText,
  AlertCircle,
  CheckCircle2,
  Eye,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const PAGE_SIZE = 10;
const STATUSES = [
  { value: "", label: "All messages" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

const STATUS_STYLES = {
  unread:
    "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900",
  read: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  replied:
    "bg-green-50 text-green-700 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-900",
  archived:
    "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
};

function formatDate(dateValue) {
  if (!dateValue) return "Date unavailable";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getMessageId(message) {
  return message?._id || message?.id;
}

function getErrorMessage(data, fallback) {
  return typeof data?.message === "string" ? data.message : fallback;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  const apiRequest = useCallback(async (path, options = {}) => {
    const token = sessionStorage.getItem("adminToken");

    if (!token) {
      throw new Error("Admin session nahi mili. Please sign in again.");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        response.status === 401
          ? "Session expired or invalid. Please sign in again."
          : "You do not have permission to manage contact messages.",
      );
    }

    if (!response.ok || data.success === false) {
      throw new Error(
        getErrorMessage(data, "Request failed. Please try again."),
      );
    }

    return data;
  }, []);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const data = await apiRequest(`/contact/admin?${params.toString()}`);
      setMessages(Array.isArray(data.data) ? data.data : []);
      setPagination(
        data.pagination || {
          page,
          limit: PAGE_SIZE,
          total: 0,
          totalPages: 0,
        },
      );
    } catch (requestError) {
      setError(requestError.message || "Failed to load contact messages.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [apiRequest, page, statusFilter, search]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const showNotice = (type, message) => {
    setNotice({ type, message });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const openMessage = async (message) => {
    const id = getMessageId(message);
    if (!id) {
      showNotice("error", "This message has no valid ID.");
      return;
    }

    setSelectedMessage(message);
    setDetailLoading(true);
    setError("");

    try {
      const data = await apiRequest(`/contact/admin/${encodeURIComponent(id)}`);
      const fullMessage = data.data || message;
      setSelectedMessage(fullMessage);

      if (fullMessage.status === "unread") {
        await updateMessageStatus(id, "read", { silent: true });
      }
    } catch (requestError) {
      showNotice(
        "error",
        requestError.message || "Could not load message details.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const updateMessageStatus = async (id, status, options = {}) => {
    setActionLoading(`${id}:${status}`);

    try {
      const data = await apiRequest(
        `/contact/admin/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );

      setMessages((current) =>
        current.map((item) =>
          getMessageId(item) === id ? { ...item, status } : item,
        ),
      );

      setSelectedMessage((current) =>
        current && getMessageId(current) === id
          ? { ...current, ...(data.data || {}), status }
          : current,
      );

      if (!options.silent) {
        showNotice("success", data.message || "Message status updated.");
      }

      // Refresh list so active filters and counts stay correct.
      await fetchMessages();
    } catch (requestError) {
      showNotice("error", requestError.message || "Could not update status.");
    } finally {
      setActionLoading("");
    }
  };

  const deleteMessage = async (message) => {
    const id = getMessageId(message);
    if (!id) return;

    const confirmed = window.confirm(
      "Delete this contact message permanently? This action cannot be undone.",
    );
    if (!confirmed) return;

    setActionLoading(`${id}:delete`);

    try {
      const data = await apiRequest(
        `/contact/admin/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );

      setSelectedMessage((current) =>
        current && getMessageId(current) === id ? null : current,
      );
      showNotice("success", data.message || "Message deleted.");

      // If the last item on a page was deleted, move back one page.
      if (messages.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await fetchMessages();
      }
    } catch (requestError) {
      showNotice("error", requestError.message || "Could not delete message.");
    } finally {
      setActionLoading("");
    }
  };

  const deleteAllMessages = async () => {
    if (pagination.total < 1) return;

    const confirmed = window.confirm(
      `Permanently delete all ${pagination.total} contact message(s)? This affects every message, not just the current page or filter. This action cannot be undone.`,
    );
    if (!confirmed) return;

    setActionLoading("bulk-delete");

    try {
      const data = await apiRequest("/contact/admin/bulk", {
        method: "DELETE",
      });

      setSelectedMessage(null);
      setPage(1);
      setSearch("");
      setSearchInput("");
      setStatusFilter("");
      showNotice(
        "success",
        data.message ||
          `Deleted ${data.deletedCount ?? pagination.total} contact message(s).`,
      );
      await fetchMessages();
    } catch (requestError) {
      showNotice(
        "error",
        requestError.message ||
          "Could not clear messages. Make sure the bulk-delete backend route is added.",
      );
    } finally {
      setActionLoading("");
    }
  };

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950";
  const secondaryText = "text-slate-500 dark:text-slate-400";
  const smallButtonClass =
    "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900";

  return (
    <section className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Inbox size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Contact Messages
              </h1>
              <p className={`mt-1 text-sm ${secondaryText}`}>
                Manage inquiries sent from your portfolio.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={deleteAllMessages}
            disabled={loading || pagination.total < 1 || Boolean(actionLoading)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
            title="Permanently delete every contact message"
          >
            {actionLoading === "bulk-delete" ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Clear All Messages
          </button>

          <button
            type="button"
            onClick={() => {
              setNotice(null);
              fetchMessages();
            }}
            disabled={loading || Boolean(actionLoading)}
            className={smallButtonClass}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {notice && (
        <div
          role={notice.type === "error" ? "alert" : "status"}
          className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${
            notice.type === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          <div className="flex items-start gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setNotice(null)}
            className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load messages</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={fetchMessages}
              className="mt-3 font-semibold underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total messages",
            value: pagination.total,
            icon: Mail,
            style:
              "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
          },
          {
            label: "Unread on this page",
            value: messages.filter((item) => item.status === "unread").length,
            icon: MailOpen,
            style:
              "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
          },
          {
            label: "Replied on this page",
            value: messages.filter((item) => item.status === "replied").length,
            icon: CheckCircle2,
            style:
              "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
          },
          {
            label: "Archived on this page",
            value: messages.filter((item) => item.status === "archived").length,
            icon: Archive,
            style:
              "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${cardClass} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <p className={`text-sm ${secondaryText}`}>{stat.label}</p>
                <span className={`rounded-xl p-2 ${stat.style}`}>
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className={`${cardClass} p-4 sm:p-5`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full gap-2 lg:max-w-xl"
          >
            <label htmlFor="contact-search" className="sr-only">
              Search messages
            </label>
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="contact-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search name, email, or subject..."
                maxLength={100}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="contact-status-filter"
              className={`text-sm ${secondaryText}`}
            >
              Status
            </label>
            <select
              id="contact-status-filter"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Inbox
          </h2>
          <p className={`text-sm ${secondaryText}`}>
            {pagination.total} message{pagination.total === 1 ? "" : "s"} found
          </p>
        </div>

        {loading ? (
          <div
            className={`flex min-h-56 flex-col items-center justify-center gap-3 ${secondaryText}`}
          >
            <LoaderCircle size={28} className="animate-spin text-blue-600" />
            <p className="text-sm">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <Inbox size={30} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
              No messages found
            </h3>
            <p className={`mt-2 max-w-md text-sm ${secondaryText}`}>
              {search || statusFilter
                ? "Try a different search term or status filter."
                : "Messages submitted through your portfolio contact form will appear here."}
            </p>
            {(search || statusFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setStatusFilter("");
                  setPage(1);
                }}
                className="mt-4 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {messages.map((message) => {
                const id = getMessageId(message);
                const isUnread = message.status === "unread";
                const busy = actionLoading.startsWith(`${id}:`);

                return (
                  <article
                    key={id}
                    className={`px-4 py-5 transition hover:bg-slate-50/80 dark:hover:bg-slate-900/50 sm:px-5 ${
                      isUnread ? "bg-blue-50/30 dark:bg-blue-950/10" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div
                        className={`mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-full sm:flex ${
                          isUnread
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <UserRound size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`font-semibold text-slate-900 dark:text-white ${isUnread ? "font-bold" : ""}`}
                          >
                            {message.name || "Unknown sender"}
                          </h3>
                          {isUnread && (
                            <span
                              className="h-2 w-2 rounded-full bg-blue-600"
                              title="Unread"
                            />
                          )}
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
                              STATUS_STYLES[message.status] ||
                              STATUS_STYLES.read
                            }`}
                          >
                            {message.status || "unknown"}
                          </span>
                        </div>

                        <p
                          className={`mt-1 break-all text-sm ${secondaryText}`}
                        >
                          {message.email}
                        </p>
                        <p className="mt-3 font-medium text-slate-800 dark:text-slate-200">
                          {message.subject}
                        </p>
                        <p
                          className={`mt-1 line-clamp-2 whitespace-pre-wrap text-sm leading-6 ${secondaryText}`}
                        >
                          {message.message || "Open to view message details."}
                        </p>

                        <div
                          className={`mt-3 flex items-center gap-2 text-xs ${secondaryText}`}
                        >
                          <CalendarDays size={14} />
                          {formatDate(message.createdAt)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => openMessage(message)}
                          className={smallButtonClass}
                          title="View message"
                        >
                          <Eye size={16} />
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateMessageStatus(
                              id,
                              isUnread ? "read" : "unread",
                            )
                          }
                          disabled={busy}
                          className={smallButtonClass}
                          title={isUnread ? "Mark as read" : "Mark as unread"}
                        >
                          {busy ? (
                            <LoaderCircle size={16} className="animate-spin" />
                          ) : isUnread ? (
                            <MailOpen size={16} />
                          ) : (
                            <Mail size={16} />
                          )}
                          {isUnread ? "Mark read" : "Mark unread"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteMessage(message)}
                          disabled={busy}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                          title="Delete message"
                        >
                          <Trash2 size={16} />
                          <span className="sr-only sm:not-sr-only">Delete</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <p className={`text-sm ${secondaryText}`}>
                Page {pagination.page || page} of{" "}
                {Math.max(1, pagination.totalPages || 1)}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1 || loading}
                  className={smallButtonClass}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(pagination.totalPages || 1, current + 1),
                    )
                  }
                  disabled={loading || page >= (pagination.totalPages || 1)}
                  className={smallButtonClass}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Message details modal */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedMessage(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-message-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-950 sm:rounded-3xl"
          >
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-7">
              <div>
                <p className={`text-sm ${secondaryText}`}>Contact message</p>
                <h2
                  id="contact-message-title"
                  className="mt-1 text-xl font-bold text-slate-900 dark:text-white"
                >
                  Message details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                aria-label="Close message details"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              {detailLoading ? (
                <div
                  className={`flex items-center justify-center gap-3 py-12 ${secondaryText}`}
                >
                  <LoaderCircle
                    size={22}
                    className="animate-spin text-blue-600"
                  />
                  Loading details...
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                      <p
                        className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wide ${secondaryText}`}
                      >
                        <UserRound size={14} /> Sender
                      </p>
                      <p className="mt-2 break-words font-semibold text-slate-900 dark:text-white">
                        {selectedMessage.name}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                      <p
                        className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wide ${secondaryText}`}
                      >
                        <AtSign size={14} /> Email
                      </p>
                      <p className="mt-2 break-all font-semibold text-slate-900 dark:text-white">
                        {selectedMessage.email}
                      </p>
                      {selectedMessage.email && (
                        <a
                          href={`mailto:${encodeURIComponent(selectedMessage.email)}`}
                          className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Reply by email
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <p
                      className={`text-xs font-medium uppercase tracking-wide ${secondaryText}`}
                    >
                      Subject
                    </p>
                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                      {selectedMessage.subject}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-xs font-medium uppercase tracking-wide ${secondaryText}`}
                    >
                      Message
                    </p>
                    <div className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                      {selectedMessage.message}
                    </div>
                  </div>

                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className={secondaryText}>Received</p>
                      <p className="mt-1 font-medium text-slate-900 dark:text-white">
                        {formatDate(selectedMessage.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className={secondaryText}>Last updated</p>
                      <p className="mt-1 font-medium text-slate-900 dark:text-white">
                        {formatDate(selectedMessage.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message-status"
                      className={`mb-2 block text-sm font-medium ${secondaryText}`}
                    >
                      Update status
                    </label>
                    <select
                      id="message-status"
                      value={selectedMessage.status || "unread"}
                      onChange={(event) =>
                        updateMessageStatus(
                          getMessageId(selectedMessage),
                          event.target.value,
                        )
                      }
                      disabled={Boolean(actionLoading)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      {STATUSES.filter((item) => item.value).map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={() => deleteMessage(selectedMessage)}
                      disabled={Boolean(actionLoading)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                    >
                      <Trash2 size={17} />
                      Delete message
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMessage(null)}
                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
