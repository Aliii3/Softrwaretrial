"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  Clock,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Trash2,
  UserRound,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { graphQL } from "@/lib/graphql";
import { formatDay, formatTimeRange, scorePercent } from "@/lib/format";
import type { AvailabilitySlot, Match, NotificationItem, Profile, StudySession, User } from "@/types/domain";

type View = "dashboard" | "matches" | "sessions" | "profile" | "availability" | "notifications" | "settings";
type AuthMode = "login" | "register";

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type AppState = {
  user: User | null;
  profile: Profile;
  sessions: StudySession[];
  matches: Match[];
  availability: AvailabilitySlot[];
  notifications: NotificationItem[];
};

const emptyProfile: Profile = {
  userId: "",
  courses: [],
  topics: [],
  studyPace: "Balanced",
  studyMode: "Hybrid",
  groupSize: 3,
  studyStyle: "Quiet deep work"
};

const views: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "matches", label: "Matches", icon: Users },
  { id: "sessions", label: "Sessions", icon: CalendarDays },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings }
];

const initialState: AppState = {
  user: null,
  profile: emptyProfile,
  sessions: [],
  matches: [],
  availability: [],
  notifications: []
};

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<AppState>(initialState);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Connect the backend services, then sign in.");
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("studyBuddyToken");
    if (savedToken) {
      setToken(savedToken);
      void loadAppData(savedToken);
    }
  }, []);

  async function loadAppData(authToken = token, fallbackUser = state.user) {
    if (!authToken) return;
    setLoading(true);
    try {
      const me = await graphQL<{ getMe: User }>(
        "user",
        `query GetMe { getMe { id name email university academicYear phone } }`,
        undefined,
        authToken
      );

      const [profilePayload, sessionsPayload, availabilityPayload] = await Promise.all([
        graphQL<{ getProfile: Profile | null }>(
          "profile",
          `query GetProfile {
            getProfile { userId courses topics studyPace studyMode groupSize studyStyle }
          }`,
          undefined,
          authToken
        ).catch(() => ({ getProfile: null })),
        graphQL<{ getStudySessions: StudySession[] }>(
          "session",
          `query GetStudySessions {
            getStudySessions {
              id title description topic startTime endTime durationMinutes sessionType status creatorId receiverId creatorContact receiverContact userId subject createdAt updatedAt
              participants { id sessionId userId contactInfo joinedAt }
            }
          }`,
          undefined,
          authToken
        ).catch(() => ({ getStudySessions: [] })),
        graphQL<{ getAvailability: AvailabilitySlot[] }>(
          "availability",
          `query GetAvailability {
            getAvailability { id userId dayOfWeek startTime endTime }
          }`,
          undefined,
          authToken
        ).catch(() => ({ getAvailability: [] }))
      ]);

      const user = me.getMe || fallbackUser;
      const [matchesPayload, notificationsPayload] = await Promise.all([
        graphQL<{ getRecommendedMatches: Match[] }>(
          "matching",
          `query GetRecommendedMatches($userId: String!) {
            getRecommendedMatches(userId: $userId) { id userId matchedUserId score reasons status createdAt updatedAt }
          }`,
          { userId: user.id },
          authToken
        ).catch(() => ({ getRecommendedMatches: [] })),
        graphQL<{ getNotifications: NotificationItem[] }>(
          "notification",
          `query GetNotifications($userId: String!) {
            getNotifications(userId: $userId) { id userId type message isRead metadata createdAt }
          }`,
          { userId: user.id },
          authToken
        ).catch(() => ({ getNotifications: [] }))
      ]);

      setState({
        user,
        profile: normalizeProfile(profilePayload.getProfile, user.id),
        sessions: sessionsPayload.getStudySessions,
        availability: availabilityPayload.getAvailability,
        matches: matchesPayload.getRecommendedMatches,
        notifications: notificationsPayload.getNotifications
      });
      setApiOnline(true);
      setStatus("Connected to the backend services.");
    } catch (error) {
      setApiOnline(false);
      setStatus(getErrorMessage(error, "Could not load backend data."));
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    window.localStorage.removeItem("studyBuddyToken");
    setToken(null);
    setState(initialState);
    setStatus("Signed out.");
  }

  if (!token || !state.user) {
    return <AuthScreen onAuthenticated={loadAppData} onToken={setToken} status={status} />;
  }

  return (
    <div className="app">
      <SideNav activeView={activeView} onView={setActiveView} onLogout={logout} />
      <div className="main-wrap">
        <TopBar user={state.user} loading={loading} onRefresh={() => loadAppData()} status={apiOnline ? "Live" : "Local"} />
        <main className="content">
          {activeView === "dashboard" && (
            <Dashboard state={state} onView={setActiveView} onCompute={() => computeMatches(token, state, setState, setStatus)} />
          )}
          {activeView === "matches" && (
            <MatchesView matches={state.matches} user={state.user} onCompute={() => computeMatches(token, state, setState, setStatus)} />
          )}
          {activeView === "sessions" && (
            <SessionsView token={token} user={state.user} sessions={state.sessions} setState={setState} setStatus={setStatus} />
          )}
          {activeView === "profile" && (
            <ProfileView token={token} profile={state.profile} setState={setState} setStatus={setStatus} />
          )}
          {activeView === "availability" && (
            <AvailabilityView token={token} slots={state.availability} setState={setState} setStatus={setStatus} />
          )}
          {activeView === "notifications" && (
            <NotificationsView token={token} user={state.user} notifications={state.notifications} setState={setState} setStatus={setStatus} />
          )}
          {activeView === "settings" && <SettingsView status={status} apiOnline={apiOnline} />}
        </main>
      </div>
      <MobileNav activeView={activeView} onView={setActiveView} />
    </div>
  );
}

function AuthScreen({
  onAuthenticated,
  onToken,
  status
}: {
  onAuthenticated: (token: string) => Promise<void>;
  onToken: (token: string) => void;
  status: string;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    university: "",
    academicYear: 3,
    phone: ""
  });
  const [message, setMessage] = useState(status);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("Contacting user service...");
    try {
      if (mode === "register") {
        await graphQL<{ register: User }>(
          "user",
          `mutation Register($name: String!, $email: String!, $password: String!, $university: String!, $academicYear: Int!, $phone: String) {
            register(name: $name, email: $email, password: $password, university: $university, academicYear: $academicYear, phone: $phone) {
              id name email university academicYear phone
            }
          }`,
          form
        );
      }

      const login = await graphQL<{ login: { token: string; user: User } }>(
        "user",
        `mutation Login($email: String!, $password: String!) {
          login(email: $email, password: $password) {
            token
            user { id name email university academicYear phone }
          }
        }`,
        { email: form.email, password: form.password }
      );
      window.localStorage.setItem("studyBuddyToken", login.login.token);
      onToken(login.login.token);
      await onAuthenticated(login.login.token);
    } catch (error) {
      setMessage(getErrorMessage(error, "Authentication failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card stack">
        <div className="brand" style={{ justifyContent: "center" }}>
          <div className="brand-mark">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="brand-title">Study Buddy</h1>
            <p className="brand-subtitle">Academic Collaboration</p>
          </div>
        </div>
        <div className="card">
          <div className="tabs">
            <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")} type="button">
              Sign In
            </button>
            <button className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")} type="button">
              Sign Up
            </button>
          </div>
          <form className="stack" onSubmit={submit}>
            {mode === "register" && (
              <>
                <Field label="Full name" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
                <Field label="University" value={form.university} onChange={(university) => setForm({ ...form, university })} required />
                <div className="two-col grid">
                  <Field
                    label="Academic year"
                    type="number"
                    value={String(form.academicYear)}
                    onChange={(academicYear) => setForm({ ...form, academicYear: Number(academicYear) })}
                    required
                  />
                  <Field label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
                </div>
              </>
            )}
            <Field label="Student email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} required />
            <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} required />
            <button className="button" disabled={busy} type="submit">
              {busy ? <RefreshCw className="spin" size={18} /> : <Check size={18} />}
              {busy ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
          <p className={`status ${isErrorMessage(message) ? "error" : ""}`} style={{ marginTop: 16 }}>
            {message}
          </p>
        </div>
      </section>
    </main>
  );
}

function SideNav({ activeView, onView, onLogout }: { activeView: View; onView: (view: View) => void; onLogout: () => void }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <GraduationCap size={24} />
        </div>
        <div>
          <h1 className="brand-title">Buddy Sync</h1>
          <p className="brand-subtitle">Academic Excellence</p>
        </div>
      </div>
      <nav className="nav-list">
        {views.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`nav-item ${activeView === id ? "active" : ""}`} onClick={() => onView(id)}>
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
        <button className={`nav-item ${activeView === "availability" ? "active" : ""}`} onClick={() => onView("availability")}>
          <Clock size={19} />
          <span>Availability</span>
        </button>
      </nav>
      <div className="sidebar-footer">
        <button className="button" onClick={() => onView("sessions")}>
          <Plus size={18} />
          Start Session
        </button>
        <button className="button ghost" onClick={onLogout}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function MobileNav({ activeView, onView }: { activeView: View; onView: (view: View) => void }) {
  return (
    <nav className="mobile-nav">
      {views.slice(0, 5).map(({ id, label, icon: Icon }) => (
        <button key={id} className={`nav-item ${activeView === id ? "active" : ""}`} onClick={() => onView(id)}>
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function TopBar({ user, loading, onRefresh, status }: { user: User; loading: boolean; onRefresh: () => void; status: string }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{status} Backend</p>
        <strong>{user.university}</strong>
      </div>
      <div className="row">
        <button className="icon-button" onClick={onRefresh} aria-label="Refresh data">
          <RefreshCw size={18} className={loading ? "spin" : ""} />
        </button>
        <div className="score" title={user.email}>
          {user.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)}
        </div>
      </div>
    </header>
  );
}

function Dashboard({ state, onView, onCompute }: { state: AppState; onView: (view: View) => void; onCompute: () => Promise<void> }) {
  const unread = state.notifications.filter((notification) => !notification.isRead).length;
  const [computing, setComputing] = useState(false);

  async function runCompute() {
    setComputing(true);
    try {
      await onCompute();
    } finally {
      setComputing(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Welcome back, {state.user?.name.split(" ")[0]}.</h1>
          <p className="muted">You have {state.sessions.length} sessions, {state.matches.length} matches, and {unread} unread alerts.</p>
        </div>
        <button className="button" onClick={() => onView("sessions")}>
          <Plus size={18} />
          Create Session
        </button>
      </div>
      <div className="dashboard-grid grid">
        <section className="stack">
          <SectionHeader title="Upcoming Sessions" action="View all" onAction={() => onView("sessions")} />
          <div className="cards">
            {state.sessions.slice(0, 3).map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
            {!state.sessions.length && <EmptyCard text="No sessions yet. Create one when your study plan is ready." />}
          </div>
          <SectionHeader title="Recommended Matches" action={computing ? "Computing..." : "Compute matches"} busy={computing} onAction={runCompute} />
          <div className="two-col grid">
            {state.matches.slice(0, 2).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
        <aside className="stack">
          <ProfileSummary profile={state.profile} />
          <AvailabilitySummary slots={state.availability} />
          <NotificationsList notifications={state.notifications.slice(0, 3)} />
        </aside>
      </div>
    </>
  );
}

function MatchesView({ matches, user, onCompute }: { matches: Match[]; user: User; onCompute: () => Promise<void> }) {
  const [computing, setComputing] = useState(false);

  async function runCompute() {
    setComputing(true);
    try {
      await onCompute();
    } finally {
      setComputing(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Match Discovery</h1>
          <p className="muted">Compatibility recommendations for {user.name} based on preferences and availability.</p>
        </div>
        <button className="button" disabled={computing} onClick={runCompute}>
          {computing ? <RefreshCw className="spin" size={18} /> : <Search size={18} />}
          {computing ? "Computing..." : "Compute Matches"}
        </button>
      </div>
      <div className="three-col grid">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
        {!matches.length && <EmptyCard text="No computed matches yet. Run the matching service to generate recommendations." />}
      </div>
    </>
  );
}

function SessionsView({
  token,
  user,
  sessions,
  setState,
  setStatus
}: {
  token: string | null;
  user: User;
  sessions: StudySession[];
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  setStatus: (status: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    topic: "",
    description: "",
    startTime: "",
    endTime: "",
    sessionType: "ONLINE",
    creatorContact: user.email
  });

  async function createSession(event: React.FormEvent) {
    event.preventDefault();
    const conflict = getSessionConflict(form, sessions);
    if (conflict) {
      setStatus(conflict);
      return;
    }
    setSaving(true);
    try {
      const payload = await graphQL<{ createStudySession: StudySession }>(
        "session",
        `mutation CreateStudySession(
          $title: String!
          $description: String!
          $topic: String!
          $startTime: String!
          $endTime: String!
          $userId: String!
          $subject: String!
          $sessionType: String!
          $creatorContact: String!
        ) {
          createStudySession(
            title: $title
            description: $description
            topic: $topic
            startTime: $startTime
            endTime: $endTime
            userId: $userId
            subject: $subject
            sessionType: $sessionType
            creatorContact: $creatorContact
          ) {
            id title description topic startTime endTime durationMinutes sessionType status creatorId receiverId creatorContact receiverContact userId subject createdAt updatedAt
            participants { id sessionId userId contactInfo joinedAt }
          }
        }`,
        { ...form, startTime: new Date(form.startTime).toISOString(), endTime: new Date(form.endTime).toISOString(), userId: user.id },
        token
      );
      setState((current) => ({ ...current, sessions: [payload.createStudySession, ...current.sessions] }));
      setForm({ title: "", subject: "", topic: "", description: "", startTime: "", endTime: "", sessionType: "ONLINE", creatorContact: user.email });
      setStatus("Study session created.");
    } catch (error) {
      setStatus(getErrorMessage(error, "Could not create session."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Study Sessions</h1>
          <p className="muted">Create and review the sessions managed by the study-session service.</p>
        </div>
      </div>
      <div className="dashboard-grid grid">
        <form className="card stack bounded-form" onSubmit={createSession}>
          <h2>New Session</h2>
          <Field label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} required />
          <Field label="Subject" value={form.subject} onChange={(subject) => setForm({ ...form, subject })} required />
          <Field label="Topic" value={form.topic} onChange={(topic) => setForm({ ...form, topic })} required />
          <label className="field">
            <span className="label">Session type</span>
            <select className="select" value={form.sessionType} onChange={(event) => setForm({ ...form, sessionType: event.target.value })}>
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">In person</option>
            </select>
          </label>
          <Field label="Creator contact" value={form.creatorContact} onChange={(creatorContact) => setForm({ ...form, creatorContact })} required />
          <label className="field">
            <span className="label">Description</span>
            <textarea className="textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <div className="two-col grid">
            <Field label="Start" type="datetime-local" value={form.startTime} onChange={(startTime) => setForm({ ...form, startTime })} required />
            <Field label="End" type="datetime-local" value={form.endTime} onChange={(endTime) => setForm({ ...form, endTime })} required />
          </div>
          <button className="button" disabled={saving} type="submit">
            {saving ? <RefreshCw className="spin" size={18} /> : <CalendarDays size={18} />}
            {saving ? "Creating..." : "Create Session"}
          </button>
        </form>
        <section className="stack">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
          {!sessions.length && <EmptyCard text="No study sessions returned yet." />}
        </section>
      </div>
    </>
  );
}

function ProfileView({
  token,
  profile,
  setState,
  setStatus
}: {
  token: string | null;
  profile: Profile;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  setStatus: (status: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(profileToDraft(profile));

  useEffect(() => setDraft(profileToDraft(profile)), [profile]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    const variables = {
      courses: splitTags(draft.courses),
      topics: splitTags(draft.topics),
      studyPace: draft.studyPace,
      studyMode: draft.studyMode,
      groupSize: Number(draft.groupSize),
      studyStyle: draft.studyStyle
    };
    setSaving(true);
    try {
      const payload = await graphQL<{ updateProfile: Profile }>(
        "profile",
        `mutation UpdateProfile($courses: [String], $topics: [String], $studyPace: String, $studyMode: String, $groupSize: Int, $studyStyle: String) {
          updateProfile(courses: $courses, topics: $topics, studyPace: $studyPace, studyMode: $studyMode, groupSize: $groupSize, studyStyle: $studyStyle) {
            userId courses topics studyPace studyMode groupSize studyStyle
          }
        }`,
        variables,
        token
      );
      setState((current) => ({ ...current, profile: normalizeProfile(payload.updateProfile, current.user?.id || "") }));
      setStatus("Profile preferences saved.");
    } catch (error) {
      setStatus(getErrorMessage(error, "Could not save profile."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Profile Setup</h1>
          <p className="muted">Courses, topics, study style, pace, and group-size preferences feed the matching service.</p>
        </div>
      </div>
      <form className="card stack" onSubmit={saveProfile}>
        <div className="two-col grid">
          <Field label="Courses" value={draft.courses} onChange={(courses) => setDraft({ ...draft, courses })} placeholder="CS 301, MATH 230" />
          <Field label="Topics" value={draft.topics} onChange={(topics) => setDraft({ ...draft, topics })} placeholder="Graphs, proofs, recursion" />
          <Field label="Study pace" value={draft.studyPace} onChange={(studyPace) => setDraft({ ...draft, studyPace })} />
          <Field label="Study mode" value={draft.studyMode} onChange={(studyMode) => setDraft({ ...draft, studyMode })} />
          <Field label="Group size" type="number" value={String(draft.groupSize)} onChange={(groupSize) => setDraft({ ...draft, groupSize })} />
          <Field label="Study style" value={draft.studyStyle} onChange={(studyStyle) => setDraft({ ...draft, studyStyle })} />
        </div>
        <button className="button" disabled={saving} type="submit">
          {saving ? <RefreshCw className="spin" size={18} /> : <Save size={18} />}
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </>
  );
}

function AvailabilityView({
  token,
  slots,
  setState,
  setStatus
}: {
  token: string | null;
  slots: AvailabilitySlot[];
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  setStatus: (status: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ dayOfWeek: "Monday", startTime: "", endTime: "" });
  const [message, setMessage] = useState("Availability changes are checked against your existing time blocks.");

  async function saveSlot(event: React.FormEvent) {
    event.preventDefault();
    const conflict = getAvailabilityConflict(form, slots, editingId);
    if (conflict) {
      setStatus(conflict);
      setMessage(conflict);
      return;
    }
    setSaving(true);
    setMessage("Checking availability and saving the time block...");
    try {
      if (editingId) {
        const payload = await graphQL<{ updateSlot: AvailabilitySlot }>(
          "availability",
          `mutation UpdateSlot($id: ID!, $dayOfWeek: String, $startTime: String, $endTime: String) {
            updateSlot(id: $id, dayOfWeek: $dayOfWeek, startTime: $startTime, endTime: $endTime) { id userId dayOfWeek startTime endTime }
          }`,
          {
            id: editingId,
            dayOfWeek: form.dayOfWeek,
            startTime: form.startTime,
            endTime: form.endTime
          },
          token
        );
        setState((current) => ({
          ...current,
          availability: current.availability.map((slot) => (slot.id === editingId ? payload.updateSlot : slot))
        }));
        setEditingId(null);
        setStatus("Availability slot updated.");
        setMessage("Availability slot updated.");
      } else {
        const payload = await graphQL<{ createSlot: AvailabilitySlot }>(
          "availability",
          `mutation CreateSlot($dayOfWeek: String!, $startTime: String!, $endTime: String!) {
            createSlot(dayOfWeek: $dayOfWeek, startTime: $startTime, endTime: $endTime) { id userId dayOfWeek startTime endTime }
          }`,
          {
            dayOfWeek: form.dayOfWeek,
            startTime: form.startTime,
            endTime: form.endTime
          },
          token
        );
        setState((current) => ({ ...current, availability: [payload.createSlot, ...current.availability] }));
        setStatus("Availability slot created.");
        setMessage("Availability slot created.");
      }
      setForm({ dayOfWeek: form.dayOfWeek, startTime: "", endTime: "" });
    } catch (error) {
      const errorMessage = getAvailabilityErrorMessage(error);
      setStatus(errorMessage);
      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSlot(slotId: string) {
    setDeletingId(slotId);
    setMessage("Removing availability slot...");
    try {
      await graphQL<{ deleteSlot: AvailabilitySlot }>(
        "availability",
        `mutation DeleteSlot($id: ID!) {
          deleteSlot(id: $id) { id userId dayOfWeek startTime endTime }
        }`,
        { id: slotId },
        token
      );
      setState((current) => ({ ...current, availability: current.availability.filter((slot) => slot.id !== slotId) }));
      if (editingId === slotId) {
        setEditingId(null);
        setForm({ dayOfWeek: "Monday", startTime: "", endTime: "" });
      }
      setStatus("Availability slot removed.");
      setMessage("Availability slot removed.");
    } catch (error) {
      const errorMessage = getAvailabilityErrorMessage(error);
      setStatus(errorMessage);
      setMessage(errorMessage);
    } finally {
      setDeletingId(null);
    }
  }

  function editSlot(slot: AvailabilitySlot) {
    setEditingId(slot.id);
    setForm({ dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime });
    setMessage("Editing weekly availability. Save changes when ready.");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ dayOfWeek: "Monday", startTime: "", endTime: "" });
    setMessage("Availability changes are checked against your existing time blocks.");
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Availability</h1>
          <p className="muted">Recurring weekly time blocks used for scheduling confidence and matching overlap.</p>
        </div>
      </div>
      <div className="dashboard-grid grid">
        <form className="card stack" onSubmit={saveSlot}>
          <div className="between">
            <h2 style={{ marginBottom: 0 }}>{editingId ? "Edit Weekly Time Block" : "Add Weekly Time Block"}</h2>
            {editingId && (
              <button className="button ghost" type="button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
          <InlineMessage message={message} />
          <label className="field">
            <span className="label">Day</span>
            <select className="select" value={form.dayOfWeek} onChange={(event) => setForm({ ...form, dayOfWeek: event.target.value })}>
              {weekDays.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>
          <div className="two-col grid">
            <Field label="Start" type="time" value={form.startTime} onChange={(startTime) => setForm({ ...form, startTime })} required />
            <Field label="End" type="time" value={form.endTime} onChange={(endTime) => setForm({ ...form, endTime })} required />
          </div>
          <button className="button secondary" disabled={saving} type="submit">
            {saving ? <RefreshCw className="spin" size={18} /> : <Clock size={18} />}
            {saving ? "Saving..." : editingId ? "Save Changes" : "Add Availability"}
          </button>
        </form>
        <AvailabilitySummary slots={slots} expanded onEdit={editSlot} onDelete={deleteSlot} deletingId={deletingId} />
      </div>
    </>
  );
}

function InlineMessage({ message }: { message: string }) {
  return <p className={`status ${isErrorMessage(message) ? "error" : ""}`}>{message}</p>;
}

function NotificationsView({
  token,
  user,
  notifications,
  setState,
  setStatus
}: {
  token: string | null;
  user: User;
  notifications: NotificationItem[];
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  setStatus: (status: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function markAllRead() {
    setSaving(true);
    try {
      await graphQL<{ markAllNotificationsAsRead: boolean }>(
        "notification",
        `mutation MarkAll($userId: String!) { markAllNotificationsAsRead(userId: $userId) }`,
        { userId: user.id },
        token
      );
      setState((current) => ({
        ...current,
        notifications: current.notifications.map((notification) => ({ ...notification, isRead: true }))
      }));
      setStatus("Notifications marked as read.");
    } catch (error) {
      setStatus(getErrorMessage(error, "Could not update notifications."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Notifications</h1>
          <p className="muted">Unread state, session reminders, and match events from the notification service.</p>
        </div>
        <button className="button ghost" disabled={saving} onClick={markAllRead}>
          {saving ? <RefreshCw className="spin" size={18} /> : <Check size={18} />}
          {saving ? "Updating..." : "Mark All Read"}
        </button>
      </div>
      <NotificationsList notifications={notifications} expanded />
    </>
  );
}

function SettingsView({ status, apiOnline }: { status: string; apiOnline: boolean }) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="muted">Frontend runtime and backend connection details.</p>
        </div>
      </div>
      <section className="card stack">
        <div className="between">
          <div>
            <h2>Backend Status</h2>
            <p className="muted">{status}</p>
          </div>
          <span className={`badge ${apiOnline ? "teal" : "amber"}`}>{apiOnline ? "Live APIs" : "Backend unavailable"}</span>
        </div>
        <p className="muted">
          Configure service URLs with `NEXT_PUBLIC_USER_API`, `NEXT_PUBLIC_AVAILABILITY_API`, `NEXT_PUBLIC_SESSION_API`,
          `NEXT_PUBLIC_NOTIFICATION_API`, `NEXT_PUBLIC_MATCHING_API`, and `NEXT_PUBLIC_PROFILE_API`.
        </p>
      </section>
    </>
  );
}

function SessionCard({ session }: { session: StudySession }) {
  return (
    <article className="card compact">
      <div className="between">
        <div>
          <div className="cluster">
            <span className="badge">{session.subject}</span>
            <span className="badge teal">{session.sessionType === "IN_PERSON" ? "In person" : "Online"}</span>
            <span className="badge">{session.status}</span>
            <span className="badge amber">{formatDay(session.startTime)}</span>
          </div>
          <h3 style={{ marginTop: 12 }}>{session.title}</h3>
          <p className="muted">{session.topic} • {session.durationMinutes} min • {session.description || "Study plan details can be added later."}</p>
        </div>
        <div className="score">{formatTimeRange(session.startTime, session.endTime)}</div>
      </div>
    </article>
  );
}

function MatchCard({ match }: { match: Match }) {
  const displayName = match.matchedUserId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return (
    <article className="card stack">
      <div className="between">
        <div className="row">
          <div className="brand-mark" style={{ background: "var(--secondary)" }}>
            <Users size={22} />
          </div>
          <div>
            <h3>{displayName}</h3>
            <p className="muted">{match.status}</p>
          </div>
        </div>
        <div className="score">{scorePercent(match.score)}%</div>
      </div>
      <div className="stack">
        {match.reasons.map((reason) => (
          <div key={reason} className="row">
            <Check size={16} color="var(--secondary)" />
            <span>{reason}</span>
          </div>
        ))}
      </div>
      <button className="button secondary">
        <MessageSquare size={18} />
        Request Study Time
      </button>
    </article>
  );
}

function ProfileSummary({ profile }: { profile: Profile }) {
  return (
    <section className="card stack">
      <h2>Your Profile</h2>
      <div className="cluster">
        {profile.courses.map((course) => (
          <span key={course} className="badge">
            <BookOpen size={14} />
            {course}
          </span>
        ))}
        {!profile.courses.length && <span className="badge amber">No courses yet</span>}
      </div>
      <div className="cluster">
        {profile.topics.map((topic) => (
          <span key={topic} className="badge teal">
            {topic}
          </span>
        ))}
      </div>
      <p className="muted">
        {profile.studyMode || "Study mode"} • {profile.studyPace || "Pace"} • Group size {profile.groupSize || 1}
      </p>
    </section>
  );
}

function AvailabilitySummary({
  slots,
  expanded = false,
  onEdit,
  onDelete,
  deletingId
}: {
  slots: AvailabilitySlot[];
  expanded?: boolean;
  onEdit?: (slot: AvailabilitySlot) => void;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}) {
  const sortedSlots = [...slots].sort((a, b) => {
    const dayDelta = weekDays.indexOf(a.dayOfWeek) - weekDays.indexOf(b.dayOfWeek);
    return dayDelta || a.startTime.localeCompare(b.startTime);
  });
  const shown = expanded ? sortedSlots : sortedSlots.slice(0, 4);
  return (
    <section className="card stack">
      <h2>Availability</h2>
      {shown.map((slot) => (
        <div key={slot.id} className="between notification unread">
          <div className="row">
            <Clock size={18} color="var(--secondary)" />
            <div>
              <strong>{slot.dayOfWeek}</strong>
              <p className="muted" style={{ margin: 0 }}>
                {formatTimeRange(slot.startTime, slot.endTime)}
              </p>
            </div>
          </div>
          {onEdit && onDelete ? (
            <div className="row">
              <button className="button ghost" type="button" onClick={() => onEdit(slot)}>
                Edit
              </button>
              <button className="icon-button" disabled={deletingId === slot.id} type="button" onClick={() => onDelete(slot.id)} aria-label="Remove availability">
                {deletingId === slot.id ? <RefreshCw className="spin" size={16} /> : <Trash2 size={16} />}
              </button>
            </div>
          ) : (
            <MapPin size={18} color="var(--muted)" />
          )}
        </div>
      ))}
      {!slots.length && <EmptyCard text="No available time blocks yet." />}
    </section>
  );
}

function NotificationsList({ notifications, expanded = false }: { notifications: NotificationItem[]; expanded?: boolean }) {
  const list = expanded ? notifications : notifications.slice(0, 3);
  return (
    <section className="card stack">
      <h2>Notifications</h2>
      {list.map((notification) => (
        <article key={notification.id} className={`notification ${notification.isRead ? "" : "unread"}`}>
          <div className="between">
            <div>
              <span className={`badge ${notification.isRead ? "" : "teal"}`}>{notification.type}</span>
              <p style={{ margin: "10px 0 0" }}>{notification.message}</p>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
            {!notification.isRead && <span className="badge amber">Unread</span>}
          </div>
        </article>
      ))}
      {!notifications.length && <EmptyCard text="No notifications returned yet." />}
    </section>
  );
}

function SectionHeader({ title, action, busy, onAction }: { title: string; action: string; busy?: boolean; onAction: () => void }) {
  return (
    <div className="between">
      <h2 style={{ marginBottom: 0 }}>{title}</h2>
      <button className="button ghost" disabled={busy} onClick={onAction}>
        {busy && <RefreshCw className="spin" size={16} />}
        {action}
      </button>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return <div className="card compact muted">{text}</div>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      <input className="input" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} />
    </label>
  );
}

async function computeMatches(
  token: string | null,
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>,
  setStatus: (status: string) => void
) {
  if (!state.user) return;
  try {
    const payload = await graphQL<{ computeMatches: Match[] }>(
      "matching",
      `mutation ComputeMatches($userId: String!) {
        computeMatches(userId: $userId) { id userId matchedUserId score reasons status createdAt updatedAt }
      }`,
      { userId: state.user.id },
      token
    );
    setState((current) => ({ ...current, matches: payload.computeMatches }));
    setStatus("Matches computed.");
  } catch (error) {
    setStatus(getErrorMessage(error, "Could not compute matches."));
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  const raw = error instanceof Error ? error.message : fallback;
  const message = raw.toLowerCase();

  if (message.includes("failed to fetch") || message.includes("networkerror") || message.includes("fetch")) {
    return "The backend service is not reachable. Check that the relevant API is running and the URL is correct.";
  }
  if (message.includes("not authenticated") || message.includes("unauthorized") || message.includes("jwt")) {
    return "Your session has expired or is invalid. Please sign in again.";
  }
  if (message.includes("forbidden")) {
    return "You do not have permission to change that item.";
  }
  if (message.includes("unique") || message.includes("already") || message.includes("exists") || message.includes("duplicate")) {
    return "That record already exists. Use different details or update the existing item.";
  }
  if (message.includes("conflict") || message.includes("overlap")) {
    return "This time conflicts with an existing study block. Choose another time range.";
  }
  if (message.includes("invalid credentials") || message.includes("password")) {
    return "The email or password is incorrect.";
  }

  return raw || fallback;
}

function getAvailabilityErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : "";
  const message = raw.toLowerCase();

  if (message.includes("cannot create a slot for a past date")) {
    return "Availability is weekly now. Choose a day of the week and a valid time range.";
  }
  if (message.includes("start time must be before end time")) {
    return "Start time must be before end time.";
  }
  if (message.includes("hh:mm format")) {
    return "Use a valid time in HH:mm format.";
  }
  if (message.includes("invalid day of week")) {
    return "Choose a valid day of the week.";
  }
  if (message.includes("overlaps with an existinsg slot") || message.includes("overlaps with an existing slot")) {
    return "This weekly availability block overlaps an existing block. Adjust the day or time range before saving.";
  }
  if (message.includes("updated slot overlaps with another slot")) {
    return "This update would overlap another weekly availability block. Choose a different day or time range.";
  }
  if (message.includes("slot not found")) {
    return "That availability slot no longer exists. Refresh and try again.";
  }

  return getErrorMessage(error, "Could not create availability slot.");
}

function isErrorMessage(message: string) {
  const lower = message.toLowerCase();
  return [
    "could not",
    "failed",
    "incorrect",
    "expired",
    "invalid",
    "not reachable",
    "permission",
    "already exists",
    "conflict",
    "overlap",
    "cannot",
    "must be"
  ].some((token) => lower.includes(token));
}

function getSessionConflict(form: { startTime: string; endTime: string }, sessions: StudySession[]) {
  const start = new Date(form.startTime);
  const end = new Date(form.endTime);

  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    return "Enter a valid start and end time.";
  }
  if (end <= start) {
    return "The session end time must be after the start time.";
  }

  const overlaps = sessions.some((session) => {
    const existingStart = new Date(session.startTime);
    const existingEnd = session.endTime ? new Date(session.endTime) : existingStart;
    return start < existingEnd && end > existingStart;
  });

  return overlaps ? "This session overlaps an existing study session. Pick another time before creating it." : null;
}

function getAvailabilityConflict(form: { dayOfWeek: string; startTime: string; endTime: string }, slots: AvailabilitySlot[], ignoredSlotId?: string | null) {
  if (!weekDays.includes(form.dayOfWeek)) {
    return "Choose a valid day of the week.";
  }

  if (!isClockTime(form.startTime) || !isClockTime(form.endTime)) {
    return "Enter a valid weekly availability time range.";
  }

  if (form.endTime <= form.startTime) {
    return "Availability end time must be after the start time.";
  }

  const overlaps = slots.some((slot) => {
    if (slot.id === ignoredSlotId) return false;
    return slot.dayOfWeek === form.dayOfWeek && form.startTime < slot.endTime && form.endTime > slot.startTime;
  });

  return overlaps ? "This weekly availability block overlaps an existing block. Adjust the day or time range before saving." : null;
}

function isClockTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizeProfile(profile: Profile | null | undefined, userId: string): Profile {
  return {
    ...emptyProfile,
    ...profile,
    userId: profile?.userId || userId,
    courses: profile?.courses || [],
    topics: profile?.topics || []
  };
}

function profileToDraft(profile: Profile) {
  return {
    courses: profile.courses.join(", "),
    topics: profile.topics.join(", "),
    studyPace: profile.studyPace || "Balanced",
    studyMode: profile.studyMode || "Hybrid",
    groupSize: String(profile.groupSize || 3),
    studyStyle: profile.studyStyle || "Quiet deep work"
  };
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
