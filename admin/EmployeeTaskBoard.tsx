import { useEffect, useMemo, useState } from 'react';
import { Clock3, Eye, GripVertical, LogOut, Pencil, Plus, Save, UserRound, Wifi, WifiOff, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import './EmployeeTaskBoard.css';

type Status = string;
type Priority = 'low' | 'normal' | 'high' | 'urgent';
type Profile = { id: string; name: string; email: string | null; role: 'employee' | 'admin'; access_enabled: boolean };
type Task = { id: string; title: string; description: string; assignee_id: string | null; status: Status; priority: Priority; due_date: string | null; sort_order: number; assigned_at?: string | null; created_at?: string };
type TaskView = { task_id: string; employee_id: string; first_viewed_at: string; last_viewed_at: string };
type Presence = { employee_id: string; last_seen_at: string; is_online: boolean };
type Column = { id: string; label: string; sub: string };

type CreatePayload = { title: string; description: string; assignee_id: string | null; priority: Priority; due_date: string | null; status: string };
const DEFAULT_COLUMNS: Column[] = [
  { id: 'client_requests', label: 'Client Requests', sub: 'New work to pick up' },
  { id: 'in_progress', label: 'In Progress', sub: 'Currently being worked on' },
  { id: 'review', label: 'Review', sub: 'Waiting for approval' },
  { id: 'completed', label: 'Completed', sub: 'Approved work' },
];
const priorities: Priority[] = ['low', 'normal', 'high', 'urgent'];
const presenceWindowMs = 2 * 60 * 1000;
const nowIso = () => new Date().toISOString();
const isOnline = (p?: Presence) => !!p && p.is_online && Date.now() - new Date(p.last_seen_at).getTime() <= presenceWindowMs;
const formatLastSeen = (value?: string | null) => {
  if (!value) return 'Never online';
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Online now';
  if (mins < 60) return `Last seen ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  return `Last seen ${Math.floor(hours / 24)}d ago`;
};

export default function EmployeeTaskBoard() {
  const { user, loading, configured, signIn, signOut } = useAuth();
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [name, setName] = useState(''), [register, setRegister] = useState(false), [authError, setAuthError] = useState(''), [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null), [profiles, setProfiles] = useState<Profile[]>([]), [tasks, setTasks] = useState<Task[]>([]), [taskViews, setTaskViews] = useState<TaskView[]>([]), [presence, setPresence] = useState<Presence[]>([]);
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS), [loadingBoard, setLoadingBoard] = useState(false), [showCreate, setShowCreate] = useState(false), [error, setError] = useState(''), [drag, setDrag] = useState<string | null>(null);
  const isAdmin = profile?.role === 'admin' || user?.app_metadata?.role === 'admin';

  const load = async (u: typeof user) => {
    if (!supabase || !u) return;
    setLoadingBoard(true);
    const { data: p } = await supabase.from('employee_profiles').select('id,name,email,role,access_enabled').eq('id', u.id).maybeSingle();
    const cp = p as Profile | null;
    setProfile(cp ?? { id: u.id, name: u.user_metadata?.name || u.email?.split('@')[0] || 'Admin', email: u.email ?? null, role: u.app_metadata?.role === 'admin' ? 'admin' : 'employee', access_enabled: u.app_metadata?.role === 'admin' });
    const admin = cp?.role === 'admin' || u.app_metadata?.role === 'admin';
    if (admin) {
      const [{ data: people }, { data: all }, { data: views }, { data: online }] = await Promise.all([
        supabase.from('employee_profiles').select('id,name,email,role,access_enabled').eq('role', 'employee').order('access_enabled').order('name'),
        supabase.from('employee_tasks').select('*').order('sort_order').order('created_at'),
        supabase.from('employee_task_views').select('task_id,employee_id,first_viewed_at,last_viewed_at'),
        supabase.from('employee_presence').select('employee_id,last_seen_at,is_online'),
      ]);
      setProfiles((people ?? []) as Profile[]); setTasks((all ?? []) as Task[]); setTaskViews((views ?? []) as TaskView[]); setPresence((online ?? []) as Presence[]);
    } else if (cp?.access_enabled) {
      const [{ data: own }, { data: ownViews }] = await Promise.all([
        supabase.from('employee_tasks').select('*').eq('assignee_id', u.id).order('sort_order').order('created_at'),
        supabase.from('employee_task_views').select('task_id,employee_id,first_viewed_at,last_viewed_at').eq('employee_id', u.id),
      ]);
      setTasks((own ?? []) as Task[]); setTaskViews((ownViews ?? []) as TaskView[]);
    }
    setLoadingBoard(false);
  };

  useEffect(() => { if (user) void load(user); else { setProfile(null); setProfiles([]); setTasks([]); setTaskViews([]); setPresence([]); } }, [user]);

  useEffect(() => {
    if (!supabase || !user || isAdmin) return;
    let active = true;
    const heartbeat = async () => {
      const stamp = nowIso();
      const { error: e } = await supabase.from('employee_presence').upsert({ employee_id: user.id, last_seen_at: stamp, is_online: true }, { onConflict: 'employee_id' });
      if (!e && active) setPresence(x => [...x.filter(p => p.employee_id !== user.id), { employee_id: user.id, last_seen_at: stamp, is_online: true }]);
    };
    void heartbeat();
    const timer = window.setInterval(() => void heartbeat(), 30000);
    const onVisibility = () => { if (document.visibilityState === 'visible') void heartbeat(); };
    document.addEventListener('visibilitychange', onVisibility);
    const onBeforeUnload = () => { void supabase.from('employee_presence').update({ last_seen_at: nowIso(), is_online: false }).eq('employee_id', user.id); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('beforeunload', onBeforeUnload); };
  }, [user?.id, isAdmin]);

  useEffect(() => {
    if (!supabase || !isAdmin) return;
    const timer = window.setInterval(async () => {
      const { data } = await supabase.from('employee_presence').select('employee_id,last_seen_at,is_online');
      if (data) setPresence(data as Presence[]);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [isAdmin]);

  const customColumns = useMemo(() => {
    const ids = Array.from(new Set(tasks.map(t => t.status).filter(Boolean)));
    const known = DEFAULT_COLUMNS.map(c => c.id);
    return [...columns.filter(c => ids.includes(c.id) || known.includes(c.id)), ...ids.filter(id => !columns.some(c => c.id === id)).map(id => ({ id, label: id.replace(/_/g, ' '), sub: 'Custom task category' }))];
  }, [columns, tasks]);

  const create = async (p: CreatePayload) => {
    if (!supabase || !isAdmin || !p.title.trim()) return;
    setError('');
    const payload = { ...p, title: p.title.trim(), assignee_id: p.assignee_id || null, sort_order: Date.now(), assigned_at: p.assignee_id ? nowIso() : null };
    const { data, error: e } = await supabase.from('employee_tasks').insert(payload).select('*').single();
    if (e) { setError(e.message); return; }
    if (data) { setTasks(x => [...x, data as Task]); setShowCreate(false); }
  };

  const move = async (id: string, status: string) => {
    if (!supabase) return;
    const old = tasks; setTasks(x => x.map(t => t.id === id ? { ...t, status } : t));
    const { error: e } = await supabase.from('employee_tasks').update({ status }).eq('id', id);
    if (e) { setTasks(old); setError(e.message); }
  };

  const markViewed = async (task: Task) => {
    if (!supabase || isAdmin || !user) return;
    const stamp = nowIso();
    const { error: e } = await supabase.from('employee_task_views').upsert({ task_id: task.id, employee_id: user.id, last_viewed_at: stamp }, { onConflict: 'task_id,employee_id' });
    if (!e) setTaskViews(x => {
      const existing = x.find(v => v.task_id === task.id && v.employee_id === user.id);
      return existing ? x.map(v => v === existing ? { ...v, last_viewed_at: stamp } : v) : [...x, { task_id: task.id, employee_id: user.id, first_viewed_at: stamp, last_viewed_at: stamp }];
    });
  };

  const auth = async (e: React.FormEvent) => { e.preventDefault(); if (!supabase) return; setBusy(true); setAuthError(''); if (register) { if (name.trim().length < 2) { setAuthError('Enter your full name.'); setBusy(false); return; } const { data, error: er } = await supabase.functions.invoke('employee-register', { body: { name: name.trim(), email: email.trim(), password } }); if (er || data?.error) setAuthError(er?.message || data?.error || 'Registration failed.'); else setRegister(false); } else { const r = await signIn(email.trim(), password); if (r.error) setAuthError(r.error.message); } setBusy(false); };
  if (loading) return <Shell><div className="employee-board__loading">Checking session...</div></Shell>;
  if (!configured) return <Shell><div className="employee-board__empty"><span>SETUP REQUIRED</span><h1>Supabase is not configured.</h1></div></Shell>;
  if (!user) return <Shell><form className="employee-login" onSubmit={auth}><div className="employee-login__mark">ZERO ONE / TEAM</div><h1>{register ? 'Join the team.' : 'Team Board.'}</h1>{authError && <div className="employee-login__error">{authError}</div>}{register && <label>Full name<input required value={name} onChange={e => setName(e.target.value)} /></label>}<label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Password<input required type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></label><button disabled={busy}>{busy ? 'Please wait...' : register ? 'Create account' : 'Sign in'}</button><button type="button" className="employee-login__switch" onClick={() => { setRegister(!register); setAuthError(''); }}>{register ? 'Already have an account? Sign in' : 'New employee? Create an account'}</button><a href="/admin">Admin sign in</a></form></Shell>;
  if (!isAdmin && profile?.access_enabled !== true) return <Shell><div className="employee-access-pending"><div className="employee-board__eyebrow">ZERO ONE / TEAM ACCESS</div><div className="employee-access-pending__icon"><Clock3 size={22} /></div><h1>Waiting for approval.</h1><p>The admin needs to approve your access before you can enter the Team Board.</p><button className="employee-board__ghost" onClick={() => void signOut()}><LogOut size={15} /> Sign out</button></div></Shell>;
  return <Shell><header className="employee-board__header"><div><div className="employee-board__eyebrow">ZERO ONE / TEAM WORKSPACE</div><h1>Task Board.</h1><p>{isAdmin ? 'Create unlimited custom cards, assign them to any approved employee, and see who has viewed them.' : 'Your assigned work lives here.'}</p></div><div className="employee-board__actions"><span className="employee-board__user"><UserRound size={15} /> {profile?.name || user.email}</span>{isAdmin && <button className="employee-board__primary" onClick={() => { setError(''); setShowCreate(true); }}><Plus size={16} /> New Task</button>}<button className="employee-board__ghost" onClick={() => void signOut()}><LogOut size={15} /> Sign out</button></div></header>
    {isAdmin && <section className="employee-access-panel"><div className="employee-access-panel__head"><div><div className="employee-board__eyebrow">TEAM STATUS</div><h2>Employees</h2></div><span>{profiles.filter(p => !p.access_enabled).length} pending</span></div><div className="employee-access-panel__list">{profiles.length ? profiles.map(p => <EmployeeRow key={p.id} person={p} presence={presence.find(x => x.employee_id === p.id)} onAccess={async v => { if (!supabase) return; const { error: e } = await supabase.from('employee_profiles').update({ access_enabled: v }).eq('id', p.id); if (!e) setProfiles(x => x.map(i => i.id === p.id ? { ...i, access_enabled: v } : i)); }} onRename={async n => { if (!supabase || n.trim().length < 2) return; const { error: e } = await supabase.from('employee_profiles').update({ name: n.trim() }).eq('id', p.id); if (!e) setProfiles(x => x.map(i => i.id === p.id ? { ...i, name: n.trim() } : i)); }} />) : <div className="employee-access-panel__empty">No employee accounts yet.</div>}</div></section>}
    <div className="employee-board__toolbar"><div className="employee-board__legend"><span><i className="dot dot--orange" /> {tasks.length} tasks</span><span>{customColumns.length} columns</span></div>{isAdmin && <button className="employee-board__ghost" onClick={() => { const label = window.prompt('Column name'); if (label?.trim()) setColumns(c => [...c, { id: `custom_${Date.now()}`, label: label.trim(), sub: 'Custom task category' }]); }}> <Plus size={14} /> Add column</button>}</div>
    {loadingBoard ? <div className="employee-board__loading">Loading board...</div> : <div className="employee-board__scroll"><div className="employee-board__columns" style={{ gridTemplateColumns: `repeat(${Math.max(1, customColumns.length)}, minmax(285px, 1fr))`, minWidth: `${Math.max(1160, customColumns.length * 297)}px` }}>{customColumns.map(c => { const list = tasks.filter(t => t.status === c.id); return <section key={c.id} className="employee-column" onDragOver={e => e.preventDefault()} onDrop={() => { if (drag) { void move(drag, c.id); setDrag(null); } }}><div className="employee-column__head"><div><h2>{c.label}</h2><p>{c.sub}</p></div><span>{list.length}</span></div><div className="employee-column__cards">{list.map(t => { const assignee = profiles.find(p => p.id === t.assignee_id); const viewed = t.assignee_id ? taskViews.some(v => v.task_id === t.id && v.employee_id === t.assignee_id) : false; const viewerPresence = t.assignee_id ? presence.find(p => p.employee_id === t.assignee_id) : undefined; return <article key={t.id} draggable={isAdmin} onDragStart={() => setDrag(t.id)} onDragEnd={() => setDrag(null)} onClick={() => void markViewed(t)} className="employee-task"><div className="employee-task__top"><span className={`priority priority--${t.priority}`}>{t.priority}</span>{isAdmin ? <GripVertical size={16} /> : <Eye size={15} />}</div><h3>{t.title}</h3>{t.description && <p>{t.description}</p>}<div className="employee-task__meta">{isAdmin && <span><UserRound size={12} /> {assignee?.name || 'Unassigned'}</span>}{t.due_date && <span><Clock3 size={12} /> {new Date(`${t.due_date}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>}{isAdmin && t.assignee_id && <span className={viewed ? 'task-seen task-seen--yes' : 'task-seen'}><Eye size={12} /> {viewed ? `Seen ${formatLastSeen(taskViews.find(v => v.task_id === t.id && v.employee_id === t.assignee_id)?.last_viewed_at)}` : 'Not seen'}</span>}{isAdmin && assignee && <span className={isOnline(viewerPresence) ? 'task-online task-online--yes' : 'task-online'}>{isOnline(viewerPresence) ? <Wifi size={12} /> : <WifiOff size={12} />} {isOnline(viewerPresence) ? 'Online' : formatLastSeen(viewerPresence?.last_seen_at)}</span>}</div></article>; })}</div>{isAdmin && <button className="employee-column__add" onClick={() => { setError(''); setShowCreate(true); }}><Plus size={16} /> Add task</button>}</section>; })}</div></div>}
    {showCreate && isAdmin && <CreateModal profiles={profiles.filter(p => p.access_enabled)} columns={customColumns} error={error} onClose={() => { setShowCreate(false); setError(''); }} onCreate={create} />}
  </Shell>;
}

function CreateModal({ profiles, columns, error, onClose, onCreate }: { profiles: Profile[]; columns: Column[]; error: string; onClose: () => void; onCreate: (p: CreatePayload) => void }) { const [title, setTitle] = useState(''), [description, setDescription] = useState(''), [assignee, setAssignee] = useState(''), [priority, setPriority] = useState<Priority>('normal'), [due, setDue] = useState(''), [status, setStatus] = useState(columns[0]?.id || 'client_requests'), [newColumn, setNewColumn] = useState(''); return <div className="employee-modal__backdrop" onMouseDown={e => { if (e.currentTarget === e.target) onClose(); }}><form className="employee-modal employee-create" onSubmit={e => { e.preventDefault(); if (newColumn.trim()) columns = [...columns, { id: `custom_${Date.now()}`, label: newColumn.trim(), sub: 'Custom task category' }]; onCreate({ title, description, assignee_id: assignee || null, priority, due_date: due || null, status }); }}><button type="button" className="employee-modal__close" onClick={onClose}><X size={18} /></button><div className="employee-modal__eyebrow">NEW TASK / CUSTOM CARD</div><h2>Create any card you need.</h2><p className="employee-modal__description">No fixed card limit. Assign to any approved employee or leave unassigned and choose any existing column.</p>{error && <div className="employee-login__error" role="alert">{error}</div>}<div className="employee-create__grid"><label>Title<input required value={title} onChange={e => setTitle(e.target.value)} /></label><label>Assign to<select value={assignee} onChange={e => setAssignee(e.target.value)}><option value="">Unassigned — assign later</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Priority<select value={priority} onChange={e => setPriority(e.target.value as Priority)}>{priorities.map(p => <option key={p}>{p}</option>)}</select></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}>{columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label></div><label>Description<textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} /></label><label>Due date<input type="date" value={due} onChange={e => setDue(e.target.value)} /></label><button className="employee-create__submit"><Plus size={16} /> Create card</button></form></div>; }

function EmployeeRow({ person, presence, onAccess, onRename }: { person: Profile; presence?: Presence; onAccess: (v: boolean) => Promise<void>; onRename: (n: string) => Promise<void> }) { const [edit, setEdit] = useState(false), [value, setValue] = useState(person.name); const online = isOnline(presence); return <div className="employee-access-row"><div className="employee-access-row__identity">{edit ? <div className="employee-access-row__edit"><input value={value} onChange={e => setValue(e.target.value)} /><button type="button" onClick={() => { void onRename(value); setEdit(false); }}><Save size={14} /></button></div> : <><strong>{person.name}</strong><small>{person.email || ''}</small><div className={online ? 'presence presence--online' : 'presence'}>{online ? <Wifi size={12} /> : <WifiOff size={12} />} {online ? 'Online now' : formatLastSeen(presence?.last_seen_at)}</div></>}</div><div className="employee-access-row__actions">{!edit && <button className="employee-access-row__rename" type="button" onClick={() => setEdit(true)}><Pencil size={13} /> Rename</button>}<button type="button" className={person.access_enabled ? 'employee-access-row__revoke' : 'employee-access-row__approve'} onClick={() => void onAccess(!person.access_enabled)}>{person.access_enabled ? 'Revoke access' : 'Approve access'}</button></div></div>; }
function Shell({ children }: { children: React.ReactNode }) { return <main className="employee-board-page">{children}</main>; }
