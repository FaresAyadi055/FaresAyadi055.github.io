import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { fetchAdminAnalytics, fetchAdminChatSessions, fetchAdminChatSession, deleteAdminChatSession, fetchSetting, updateSetting } from '../lib/api.js';
import AdminAnalytics from './AdminAnalytics.jsx';

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-sm bg-ink-line/40 ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <section>
        <Skeleton className="mb-4 h-5 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="mt-4 h-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </section>
      <section>
        <Skeleton className="mb-4 h-5 w-56" />
        <div className="space-y-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      </section>
    </div>
  );
}

function ChatSession({ session, onLoad, onDelete }) {
  return (
    <div className="flex items-center justify-between rounded-sm border border-ink-line bg-ink-panel/40 px-4 py-3 text-sm">
      <button
        onClick={() => onLoad(session)}
        className="cursor-pointer text-left font-mono text-blue-bright hover:underline outline-none"
      >
        Session: {session.id.slice(0, 8)}…
      </button>
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-paper-dim">
          {new Date(session.createdAt).toLocaleString()}
        </span>
        <button
          onClick={() => onDelete(session.id)}
          className="rounded-sm border border-copper px-3 py-1 font-mono text-xs text-copper outline-none transition-colors hover:bg-copper hover:text-ink-deep"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="rounded-sm border border-ink-line px-3 py-1 font-mono text-xs text-paper-dim outline-none transition-colors hover:border-blue-bright hover:text-blue-bright disabled:opacity-30 disabled:pointer-events-none"
      >
        ← Prev
      </button>
      <span className="font-mono text-xs text-paper-dim">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-sm border border-ink-line px-3 py-1 font-mono text-xs text-paper-dim outline-none transition-colors hover:border-blue-bright hover:text-blue-bright disabled:opacity-30 disabled:pointer-events-none"
      >
        Next →
      </button>
    </div>
  );
}

export default function Admin({ onClose }) {
  const [authed, setAuthed] = useState(!!localStorage.getItem('ADMIN_ACCESS_TOKEN'));
  const [checking, setChecking] = useState(false);
  const [token, setToken] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [view, setView] = useState('dashboard');
  const [analytics, setAnalytics] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [sessionPage, setSessionPage] = useState(1);
  const [notifyVisitors, setNotifyVisitors] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const SESSIONS_PER_PAGE = 10;

  useEffect(() => {
    if (authed) {
      loadDashboard();
    }
  }, [authed]);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [a, s] = await Promise.all([fetchAdminAnalytics(), fetchAdminChatSessions()]);
      setAnalytics(a.analytics || []);
      setSessions(s.sessions || []);
      fetchSetting('NOTIFY_NEW_VISITORS')
        .then((r) => setNotifyVisitors(r.value === 'true'))
        .catch(() => {});
    } catch (err) {
      if (err.isNetworkError) {
        // Couldn't reach the server at all (offline, CORS, backend down, etc).
        // Don't blame the token or log the admin out for this.
        setTokenError('Could not reach the server — check your connection and try again.');
      } else if (err.isUnauthorized) {
        setTokenError('Invalid token — please try again.');
        localStorage.removeItem('ADMIN_ACCESS_TOKEN');
        setAuthed(false);
      } else {
        setTokenError('Something went wrong loading the dashboard — please try again.');
      }
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setTokenError('');
    setChecking(true);
    localStorage.setItem('ADMIN_ACCESS_TOKEN', token.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, ''));
    setAuthed(true);
  }

  async function handleLogout() {
    localStorage.removeItem('ADMIN_ACCESS_TOKEN');
    setAuthed(false);
    setChecking(false);
    setSelectedSession(null);
    setMessages([]);
    onClose?.();
  }

  async function handleLoadSession(session) {
    setSelectedSession(session);
    setView('chat');
    try {
      const data = await fetchAdminChatSession(session.id);
      setMessages(data.messages || []);
    } catch {
      setActionMsg('Failed to load session.');
    }
  }

  async function handleDeleteSession(sessionId) {
    if (!confirm('Delete this session and all its messages?')) return;
    try {
      await deleteAdminChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        setMessages([]);
        setView('dashboard');
      }
      setActionMsg('Session deleted.');
    } catch {
      setActionMsg('Failed to delete session.');
    }
  }

  async function handleToggleNotify() {
    const next = !notifyVisitors;
    setSettingsLoading(true);
    try {
      await updateSetting('NOTIFY_NEW_VISITORS', String(next));
      setNotifyVisitors(next);
      setActionMsg(next ? 'Visitor notifications enabled.' : 'Visitor notifications disabled.');
    } catch {
      setActionMsg('Failed to update setting.');
    } finally {
      setSettingsLoading(false);
    }
  }

  // Auth gate
  if (!authed || checking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep">
        <div className="max-w-md w-full rounded-sm border border-ink-line bg-ink-panel p-8">
          <h2 className="font-mono text-xl font-semibold text-paper">Admin Access</h2>
          {checking ? (
            <p className="mt-2 text-sm text-paper-dim">Validating token&hellip;</p>
          ) : (
            <p className="mt-2 text-sm text-paper-dim">Enter the admin access token to open the dashboard.</p>
          )}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="font-mono text-xs uppercase tracking-wider text-paper-dim">Token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={checking}
                className="mt-1 w-full rounded-sm border border-ink-line bg-ink-deep px-3 py-2 text-sm text-paper outline-none focus:border-blue-bright disabled:opacity-50"
                placeholder="ADMIN_ACCESS_TOKEN"
              />
            </div>
            {tokenError && <p className="font-mono text-xs text-copper">{tokenError}</p>}
            <button
              type="submit"
              disabled={checking}
              className="w-full rounded-sm bg-copper px-4 py-2 font-mono text-sm text-ink-deep outline-none transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {checking ? <span>Validating&hellip;</span> : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-deep">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-ink-line bg-ink-panel px-6 py-3">
        <h2 className="font-mono text-sm uppercase tracking-widest text-blue-bright">Admin Dashboard</h2>
        <div className="flex items-center gap-4">
          {actionMsg && <p className="font-mono text-xs text-copper">{actionMsg}</p>}
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="rounded-sm border border-ink-line px-3 py-1 font-mono text-xs text-paper-dim outline-none transition-colors hover:border-blue-bright hover:text-blue-bright disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="rounded-sm border border-blue-bright px-3 py-1 font-mono text-xs text-blue-bright outline-none transition-colors hover:bg-blue-bright hover:text-ink-deep"
          >
            Back to home page
          </button>
          <button
            onClick={handleLogout}
            className="rounded-sm border border-copper px-3 py-1 font-mono text-xs text-copper outline-none transition-colors hover:bg-copper hover:text-ink-deep"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {view === 'dashboard' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            {loading ? (
              <DashboardSkeleton />
            ) : (
              <>
                {/* Settings */}
                <section>
                  <h3 className="font-mono text-lg font-semibold text-paper mb-4">Settings</h3>
                  <div className="flex items-center justify-between rounded-sm border border-ink-line bg-ink-panel/40 px-5 py-4">
                    <div>
                      <p className="font-mono text-sm text-paper">New visitor notifications</p>
                      <p className="mt-1 text-xs text-paper-dim">Send a Telegram message when a new unique visitor arrives.</p>
                    </div>
                    <button
                      onClick={handleToggleNotify}
                      disabled={settingsLoading}
                      className={`relative h-6 w-11 rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-bright ${
                        notifyVisitors ? 'bg-blue-bright' : 'bg-ink-line'
                      } ${settingsLoading ? 'opacity-50' : ''}`}
                      role="switch"
                      aria-checked={notifyVisitors}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-paper transition-transform duration-200 ${
                          notifyVisitors ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                </section>

                {/* Analytics */}
                <section>
                  <h3 className="font-mono text-lg font-semibold text-paper mb-4">Page Visitors — Analytics</h3>
                  <AdminAnalytics analytics={analytics} />
                </section>

                {/* Chat Sessions */}
                <section>
                  <h3 className="font-mono text-lg font-semibold text-paper mb-4">AI Chat Sessions</h3>
                  {sessions.length === 0 ? (
                    <p className="text-paper-dim">No chat sessions yet.</p>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {sessions
                          .slice((sessionPage - 1) * SESSIONS_PER_PAGE, sessionPage * SESSIONS_PER_PAGE)
                          .map((session) => (
                            <ChatSession
                              key={session.id}
                              session={session}
                              onLoad={handleLoadSession}
                              onDelete={handleDeleteSession}
                            />
                          ))}
                      </div>
                      <Pagination
                        page={sessionPage}
                        total={sessions.length}
                        perPage={SESSIONS_PER_PAGE}
                        onChange={setSessionPage}
                      />
                    </>
                  )}
                </section>
              </>
            )}
          </div>
        )}

        {view === 'chat' && selectedSession && (
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => { setView('dashboard'); setSelectedSession(null); setMessages([]); }}
              className="font-mono text-xs uppercase tracking-wider text-blue-bright hover:underline mb-4 outline-none"
            >
              ← Back to dashboard
            </button>
            <h3 className="font-mono text-sm text-paper-dim mb-4">
              Session: {selectedSession.id.slice(0, 8)}… ({messages.length} messages)
            </h3>
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-sm px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-line/20 text-paper ml-auto max-w-[80%]'
                      : 'border border-ink-line bg-ink-panel/40 text-paper-dim max-w-[80%]'
                  }`}
                >
                  <div className="flex justify-between mb-1">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-paper-dim">
                      {m.role}
                    </p>
                    <p className="font-mono text-[10px] text-paper-dim/60">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}