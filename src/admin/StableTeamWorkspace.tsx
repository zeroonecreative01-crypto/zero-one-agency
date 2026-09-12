import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, GripVertical, LogOut, Pencil, RotateCcw, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import './EmployeeTaskBoard.css';

type Status = 'todo' | 'in_progress' | 'review' | 'changes_requested' | 'done' | 'blocked';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Profile = { id: string; name: string; email: string | null; role: 'admin' | 'employee'; job_title: string | null; status: 'pending' | 'active' | 'blocked' | 'rejected'; avatar_url: string | null };
type Task = { id: string; title: string; description: string; status: Status; priority: Priority; assignee_id: string; created_by: string; due_at: string | null; sort_order: number; blocked_reason: string | null; created_at: string; updated_at: string };
type Comment = { id: string; task_id: string; user_id: string; body: string; created_at: string };
type Attachment = { id: string; task_id: string; uploaded_by: string; file_name: string; storage_path: string; mime_type: string | null; size_bytes: number | null; created_at: string };
type Activity = { id: number; task_id: string | null; actor_id: string | null; event_type: string; created_at: string };

const COLUMNS: { id: Status; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'changes_requested', label: 'Changes Requested' },
  { id: 'done', label: 'Done' },
  { id: 'blocked', label: 'Blocked' },
];

export default function StableTeamWorkspace() {
  const { user, loading, configured, signIn, signOut } = useAuth();
  const [me, setMe] = useState<Profile | null>(null);
  const [people, setPeople] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [tab, setTab] = useState<'board' | 'team' | 'activity'>('board');
  const [selected, setSelected] = useState<Task | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('Designer');
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [recovery, setRecovery] = useState(false);

  const isAdmin = me?.role === 'admin' || user?.app_metadata?.role === 'admin';
  const employees = useMemo(() => people.filter((p) => p.role === 'employee'), [people]);
  const pendingCount = employees.filter((p) => p.status === 'pending').length;

  const load = async () => {
    if (!supabase || !user) return;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    let current = profile as Profile | null;
    if (!current && user.app_metadata?.role === 'admin') {
      await supabase.from('profiles').upsert({ id: user.id, name: user.email?.split('@')[0] || 'Admin', email: user.email, role: 'admin', status: 'active' });
      const { data: adminProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      current = adminProfile as Profile;
    }
    setMe(current);
    if (current?.role === 'admin' || user.app_metadata?.role === 'admin') {
      const [p, t, c, a, log] = await Promise.all([
        supabase.from('profiles').select('*').order('status').order('name'),
        supabase.from('tasks').select('*').order('status').order('sort_order'),
        supabase.from('task_comments').select('*').order('created_at'),
        supabase.from('task_attachments').select('*').order('created_at', { ascending: false }),
        supabase.from('task_activity').select('*').order('created_at', { ascending: false }).limit(200),
      ]);
      setPeople((p.data || []) as Profile[]); setTasks((t.data || []) as Task[]); setComments((c.data || []) as Comment[]); setAttachments((a.data || []) as Attachment[]); setActivity((log.data || []) as Activity[]);
    } else if (current?.status === 'active') {
      const [t, c, a] = await Promise.all([
        supabase.from('tasks').select('*').eq('assignee_id', user.id).order('status').order('sort_order'),
        supabase.from('task_comments').select('*').order('created_at'),
        supabase.from('task_attachments').select('*').order('created_at', { ascending: false }),
      ]);
      setTasks((t.data || []) as Task[]); setComments((c.data || []) as Comment[]); setAttachments((a.data || []) as Attachment[]);
    } else {
      setTasks([]);
    }
  };

  useEffect(() => { if (user) void load(); else setMe(null); }, [user]);
  useEffect(() => {
    if (!supabase) return;
    const subscription = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') setRecovery(true); }).data.subscription;
    return () => subscription.unsubscribe();
  }, []);

  const grouped = (status: Status) => tasks.filter((task) => task.status === status).sort((a, b) => a.sort_order - b.sort_order);

  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault(); if (!supabase) return; setBusy(true); setError(''); setMessage('');
    if (!signup) {
      const result = await signIn(email.trim(), password);
      if (result.error) setError(result.error.message);
    } else {
      if (name.trim().length < 2) { setError('Enter your full name.'); setBusy(false); return; }
      const result = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim(), job_title: jobTitle } } });
      if (result.error) setError(result.error.message); else setMessage('Registration submitted. Wait for admin approval.');
    }
    setBusy(false);
  };

  const moveTask = async (task: Task, status: Status) => {
    if (!supabase || task.status === status) return;
    const result = await supabase.rpc('move_task', { p_task_id: task.id, p_status: status, p_sort_order: grouped(status).length, p_blocked_reason: status === 'blocked' ? 'Blocked by workflow' : null });
    if (result.error) setError(result.error.message); else await load();
  };

  const createTask = async (title: string, description: string, assigneeId: string, priority: Priority, dueAt: string) => {
    if (!supabase || !user) return;
    const result = await supabase.from('tasks').insert({ title: title.trim(), description: description.trim(), assignee_id: assigneeId, created_by: user.id, priority, due_at: dueAt ? new Date(dueAt).toISOString() : null, status: 'todo', sort_order: grouped('todo').length }).select('*').single();
    if (result.error) setError(result.error.message); else { setShowTask(false); await load(); }
  };

  const updatePerson = async (id: string, patch: Partial<Profile>) => {
    if (!supabase) return;
    const result = await supabase.from('profiles').update(patch).eq('id', id);
    if (result.error) setError(result.error.message); else await load();
  };

  const resetPassword = async (person: Profile) => {
    if (!supabase || !person.email) return;
    const result = await supabase.auth.resetPasswordForEmail(person.email, { redirectTo: `${window.location.origin}/team` });
    if (result.error) setError(result.error.message); else setMessage(`Password reset email sent to ${person.email}.`);
  };

  const addComment = async (taskId: string, body: string) => {
    if (!supabase || !user || !body.trim()) return;
    const result = await supabase.from('task_comments').insert({ task_id: taskId, user_id: user.id, body: body.trim() });
    if (result.error) setError(result.error.message); else await load();
  };

  const uploadAttachment = async (task: Task, file: File) => {
    if (!supabase || !user) return;
    const path = `${task.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const upload = await supabase.storage.from('task-files').upload(path, file);
    if (upload.error) { setError(upload.error.message); return; }
    const row = await supabase.from('task_attachments').insert({ task_id: task.id, uploaded_by: user.id, file_name: file.name, storage_path: path, mime_type: file.type || null, size_bytes: file.size });
    if (row.error) { await supabase.storage.from('task-files').remove([path]); setError(row.error.message); return; }
    await load();
  };

  if (loading) return <Shell><div className="py-32 text-center text-xs uppercase tracking-[0.2em] text-[#F7F5F0]/40">Checking session...</div></Shell>;
  if (!configured) return <Shell><div className="mx-auto max-w-lg py-32"><h1 className="text-3xl font-bold">Supabase is not configured.</h1></div></Shell>;
  if (!user) return <Shell><div className="mx-auto flex min-h-[80vh] max-w-md items-center"><form onSubmit={submitAuth} className="w-full border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">ZERO ONE / TEAM</p><h1 className="mt-3 text-4xl font-bold">{signup ? 'Join the team.' : 'Team sign in.'}</h1><p className="mt-3 text-sm text-[#F7F5F0]/45">{signup ? 'Your registration stays pending until the admin approves it.' : 'Use your approved employee account.'}</p>{error && <div className="mt-5 border border-red-300/20 bg-red-300/5 p-3 text-sm text-red-100">{error}</div>}{message && <div className="mt-5 border border-emerald-300/20 bg-emerald-300/5 p-3 text-sm text-emerald-100">{message}</div>}<div className="mt-7 space-y-4">{signup && <><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full border-b border-[#F7F5F0]/20 bg-transparent px-1 py-3 outline-none"/><select value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full border border-[#F7F5F0]/10 bg-[#151515] px-3 py-3"><option>Designer</option><option>Developer</option><option>Video Editor</option><option>Account Manager</option><option>Other</option></select></>}<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border-b border-[#F7F5F0]/20 bg-transparent px-1 py-3 outline-none"/><input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full border-b border-[#F7F5F0]/20 bg-transparent px-1 py-3 outline-none"/><button disabled={busy} className="w-full rounded-full bg-[#F14A0B] px-5 py-3 font-semibold text-[#111111]">{busy ? 'Please wait...' : signup ? 'Submit registration' : 'Sign in'}</button></div><button type="button" onClick={() => { setSignup(!signup); setError(''); setMessage(''); }} className="mt-5 text-sm text-[#F7F5F0]/55 underline">{signup ? 'Already registered? Sign in' : 'New employee? Create an account'}</button><div className="mt-8 border-t border-[#F7F5F0]/10 pt-5 text-xs text-[#F7F5F0]/35">Admin? <a href="/admin" className="text-[#F7F5F0] underline">Open Admin</a></div></form></div></Shell>;
  if (!me) return <Shell><div className="py-32 text-center text-sm text-[#F7F5F0]/40">Loading profile...</div></Shell>;
  if (!isAdmin && me.status !== 'active') return <Shell><div className="mx-auto flex min-h-[70vh] max-w-lg items-center"><div className="w-full border border-[#F7F5F0]/10 p-10 text-center"><Clock3 className="mx-auto text-[#F14A0B]"/><p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">{me.status}</p><h1 className="mt-2 text-3xl font-bold">{me.status === 'pending' ? 'Waiting for approval.' : me.status === 'blocked' ? 'Account blocked.' : 'Registration rejected.'}</h1><p className="mt-3 text-sm text-[#F7F5F0]/50">{me.status === 'pending' ? 'The admin must approve your registration before access is granted.' : 'Contact the admin if you believe this is incorrect.'}</p><button onClick={() => void signOut()} className="mt-6 rounded-full border border-[#F7F5F0]/15 px-5 py-3 text-sm"><LogOut size={14} className="mr-1 inline"/> Sign out</button></div></div></Shell>;

  return <Shell><header className="border-b border-[#F7F5F0]/10 pb-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">ZERO ONE / INTERNAL WORKSPACE</p><h1 className="mt-2 text-5xl font-bold tracking-tighter">{isAdmin ? 'Team Control.' : 'My Tasks.'}</h1><p className="mt-3 text-sm text-[#F7F5F0]/45">{isAdmin ? 'Manage team access, tasks and approvals.' : 'Work your assigned queue and send completed work to review.'}</p></div><div className="flex items-center gap-2"><span className="rounded-full border border-[#F7F5F0]/10 px-4 py-2 text-xs">{me.name || user.email}</span><button onClick={() => void signOut()} className="rounded-full border border-[#F7F5F0]/15 px-4 py-2 text-sm"><LogOut size={14} className="mr-1 inline"/> Sign out</button></div></div><div className="mt-7 flex gap-2"><button onClick={() => setTab('board')} className={`rounded-full px-4 py-2.5 text-sm font-semibold ${tab === 'board' ? 'bg-[#F14A0B] text-[#111111]' : 'border border-[#F7F5F0]/15 text-[#F7F5F0]/60'}`}>Board</button>{isAdmin && <><button onClick={() => setTab('team')} className={`rounded-full px-4 py-2.5 text-sm font-semibold ${tab === 'team' ? 'bg-[#F14A0B] text-[#111111]' : 'border border-[#F7F5F0]/15 text-[#F7F5F0]/60'}`}>Team ({pendingCount})</button><button onClick={() => setTab('activity')} className={`rounded-full px-4 py-2.5 text-sm font-semibold ${tab === 'activity' ? 'bg-[#F14A0B] text-[#111111]' : 'border border-[#F7F5F0]/15 text-[#F7F5F0]/60'}`}>Activity</button></>}</div></header>{error && <div className="mt-5 flex justify-between gap-3 border border-red-300/20 bg-red-300/5 px-4 py-3 text-sm text-red-100">{error}<button onClick={() => setError('')}><X size={16}/></button></div>}{message && <div className="mt-5 border border-emerald-300/20 bg-emerald-300/5 px-4 py-3 text-sm text-emerald-100">{message}</div>}
    {tab === 'board' && <section className="mt-8"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-[#F7F5F0]/35">Drag & drop workflow</p><p className="mt-1 text-sm text-[#F7F5F0]/45">The database validates every move; Done only comes from Review.</p></div>{isAdmin && <button onClick={() => setShowTask(true)} className="rounded-full bg-[#F14A0B] px-5 py-3 text-sm font-semibold text-[#111111]">+ New Task</button>}</div><div className="grid gap-4 2xl:grid-cols-6 xl:grid-cols-3 md:grid-cols-2">{COLUMNS.map((column) => <div key={column.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const task = tasks.find((t) => t.id === dragging); setDragging(null); if (task) void moveTask(task, column.id); }} className="min-h-[430px] border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.015] p-3"><div className="mb-3 flex items-center justify-between border-b border-[#F7F5F0]/10 pb-3"><h2 className="text-sm font-bold">{column.label}</h2><span className="rounded-full border border-[#F7F5F0]/10 px-2 py-1 text-[10px]">{grouped(column.id).length}</span></div><div className="space-y-2">{grouped(column.id).map((task) => <article key={task.id} draggable onDragStart={() => setDragging(task.id)} onClick={() => setSelected(task)} className="cursor-grab border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.025] p-4 hover:border-[#F14A0B]/40"><div className="flex gap-3"><GripVertical size={16} className="mt-0.5 text-[#F7F5F0]/25"/><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><h3 className="font-semibold">{task.title}</h3><span className="text-[9px] uppercase tracking-widest text-[#F7F5F0]/40">{task.priority}</span></div><p className="mt-2 line-clamp-2 text-xs text-[#F7F5F0]/45">{task.description || 'No description'}</p><p className="mt-4 text-[10px] text-[#F7F5F0]/35">{people.find((p) => p.id === task.assignee_id)?.name || 'Assigned employee'}</p></div></div></article>)}</div></div>)}</div></section>}

    {tab === 'team' && isAdmin && <section className="mt-8"><div className="border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Access control</p><h2 className="mt-2 text-2xl font-bold">Registration requests</h2><p className="mt-2 text-sm text-[#F7F5F0]/45">Employees create their own password. You decide when an account becomes active.</p></div><div className="mt-6 grid gap-4 xl:grid-cols-3 md:grid-cols-2">{employees.map((person) => <div key={person.id} className="border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-5"><div className="flex justify-between gap-3"><div><h3 className="font-semibold">{person.name}</h3><p className="mt-1 text-xs text-[#F7F5F0]/40">{person.email}</p><p className="mt-1 text-xs text-[#F7F5F0]/35">{person.job_title || 'Employee'}</p></div><span className="rounded-full border border-[#F7F5F0]/10 px-2 py-1 text-[9px] uppercase">{person.status}</span></div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => { const next = window.prompt('Employee name', person.name); if (next) void updatePerson(person.id, { name: next.trim() }); }} className="rounded-lg border border-[#F7F5F0]/10 px-3 py-2 text-xs"><Pencil size={13} className="mr-1 inline"/> Edit name</button><button onClick={() => void resetPassword(person)} className="rounded-lg border border-[#F7F5F0]/10 px-3 py-2 text-xs"><RotateCcw size={13} className="mr-1 inline"/> Reset password</button></div>{person.status === 'pending' && <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => void updatePerson(person.id, { status: 'active' })} className="rounded-lg bg-[#F14A0B] px-3 py-2 text-xs font-bold text-[#111111]">Approve</button><button onClick={() => void updatePerson(person.id, { status: 'rejected' })} className="rounded-lg border border-red-300/20 px-3 py-2 text-xs text-red-100">Reject</button></div>}{person.status === 'active' && <button onClick={() => void updatePerson(person.id, { status: 'blocked' })} className="mt-3 w-full rounded-lg border border-red-300/20 px-3 py-2 text-xs text-red-100">Block access</button>}{person.status === 'blocked' && <button onClick={() => void updatePerson(person.id, { status: 'active' })} className="mt-3 w-full rounded-lg border border-emerald-300/20 px-3 py-2 text-xs text-emerald-100">Unblock</button>}</div>)}</div></section>}

    {tab === 'activity' && isAdmin && <section className="mt-8 space-y-2">{activity.map((item) => <div key={item.id} className="flex justify-between gap-4 border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] px-5 py-4"><div><p className="text-sm font-semibold">{item.event_type.replace(/_/g, ' ')}</p><p className="mt-1 text-xs text-[#F7F5F0]/35">{item.task_id ? tasks.find((t) => t.id === item.task_id)?.title || 'Task' : 'System event'}</p></div><time className="text-[10px] text-[#F7F5F0]/35">{new Date(item.created_at).toLocaleString('en-GB')}</time></div>)}</section>}

    {selected && <TaskPanel task={selected} isAdmin={!!isAdmin} person={people.find((p) => p.id === selected.assignee_id)} comments={comments.filter((c) => c.task_id === selected.id)} attachments={attachments.filter((a) => a.task_id === selected.id)} onClose={() => setSelected(null)} onMove={(status) => void moveTask(selected, status)} onComment={addComment} onUpload={uploadAttachment} />}
    {showTask && isAdmin && <CreateTask employees={employees.filter((p) => p.status === 'active')} onClose={() => setShowTask(false)} onCreate={createTask} />}
    {recovery && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5"><div className="w-full max-w-md bg-[#151515] p-7"><h2 className="text-2xl font-bold">Set a new password</h2><input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="mt-5 w-full border-b border-[#F7F5F0]/20 bg-transparent py-3"/><button onClick={async () => { if (!supabase || newPassword.length < 8) return; const result = await supabase.auth.updateUser({ password: newPassword }); if (result.error) setError(result.error.message); else { setRecovery(false); setMessage('Password updated successfully.'); } }} className="mt-5 rounded-full bg-[#F14A0B] px-5 py-3 font-semibold text-[#111111]">Save password</button></div></div>}
  </Shell>;
}

function CreateTask({ employees, onClose, onCreate }: { employees: Profile[]; onClose: () => void; onCreate: (title: string, description: string, assignee: string, priority: Priority, due: string) => Promise<void> }) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [assignee, setAssignee] = useState(employees[0]?.id || ''); const [priority, setPriority] = useState<Priority>('medium'); const [due, setDue] = useState('');
  return <Modal title="Create task" onClose={onClose}><div className="space-y-4"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="w-full border border-[#F7F5F0]/10 bg-transparent p-3"/><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="min-h-28 w-full border border-[#F7F5F0]/10 bg-transparent p-3"/><select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full bg-[#151515] border border-[#F7F5F0]/10 p-3">{employees.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full bg-[#151515] border border-[#F7F5F0]/10 p-3">{['low','medium','high','urgent'].map((p) => <option key={p}>{p}</option>)}</select><input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="w-full border border-[#F7F5F0]/10 bg-transparent p-3"/><button onClick={() => { if (title.trim() && assignee) void onCreate(title, description, assignee, priority, due); }} className="w-full rounded-full bg-[#F14A0B] p-3 font-semibold text-[#111111]">Create task</button></div></Modal>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5"><div className="w-full max-w-lg border border-[#F7F5F0]/10 bg-[#151515] p-7"><div className="flex justify-between"><h2 className="text-2xl font-bold">{title}</h2><button onClick={onClose}><X size={18}/></button></div><div className="mt-6">{children}</div></div></div>; }

function TaskPanel({ task, isAdmin, person, comments, attachments, onClose, onMove, onComment, onUpload }: { task: Task; isAdmin: boolean; person?: Profile; comments: Comment[]; attachments: Attachment[]; onClose: () => void; onMove: (status: Status) => void; onComment: (taskId: string, body: string) => Promise<void>; onUpload: (task: Task, file: File) => Promise<void> }) {
  const [text, setText] = useState('');
  return <div className="fixed inset-0 z-40 bg-black/70"><aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-[#F7F5F0]/10 bg-[#151515] p-7"><div className="flex justify-between"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Task details</p><button onClick={onClose}><X/></button></div><h2 className="mt-5 text-3xl font-bold">{task.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#F7F5F0]/55">{task.description || 'No description'}</p><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="border border-[#F7F5F0]/10 p-4">Assignee<br/><strong>{person?.name || 'Unknown'}</strong></div><div className="border border-[#F7F5F0]/10 p-4">Status<br/><strong>{task.status.replace('_',' ')}</strong></div></div>{task.blocked_reason && <div className="mt-4 border border-red-300/20 p-4 text-sm text-red-100">Blocked: {task.blocked_reason}</div>}<div className="mt-6 flex flex-wrap gap-2">{!isAdmin && task.status === 'todo' && <button onClick={() => onMove('in_progress')} className="rounded-full bg-[#F14A0B] px-4 py-2 text-sm font-semibold text-[#111111]">Start</button>}{!isAdmin && task.status === 'in_progress' && <button onClick={() => onMove('review')} className="rounded-full bg-[#F14A0B] px-4 py-2 text-sm font-semibold text-[#111111]">Submit for review</button>}{!isAdmin && task.status === 'in_progress' && <button onClick={() => onMove('blocked')} className="rounded-full border border-red-300/20 px-4 py-2 text-sm text-red-100">Block</button>}{isAdmin && task.status === 'review' && <><button onClick={() => onMove('done')} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#111111]"><Check size={14} className="mr-1 inline"/> Approve</button><button onClick={() => onMove('changes_requested')} className="rounded-full border border-amber-300/20 px-4 py-2 text-sm text-amber-100">Request changes</button></>}</div><section className="mt-8 border-t border-[#F7F5F0]/10 pt-6"><h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F7F5F0]/35">Comments</h3><div className="mt-4 space-y-3">{comments.map((comment) => <div key={comment.id} className="border border-[#F7F5F0]/10 p-4 text-sm">{comment.body}<p className="mt-2 text-[10px] text-[#F7F5F0]/30">{new Date(comment.created_at).toLocaleString('en-GB')}</p></div>)}</div><div className="mt-4 flex gap-2"><textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-24 flex-1 border border-[#F7F5F0]/10 bg-transparent p-3" placeholder="Comment"/><button onClick={() => { void onComment(task.id, text); setText(''); }} className="self-end rounded-full bg-[#F7F5F0] px-4 py-2 text-sm font-semibold text-[#111111]">Post</button></div></section><section className="mt-8 border-t border-[#F7F5F0]/10 pt-6"><div className="flex justify-between"><h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#F7F5F0]/35">Files</h3><label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-3 py-2 text-xs"><Upload size={13}/> Upload<input type="file" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void onUpload(task, file); }}/></label></div><div className="mt-4 space-y-2">{attachments.map((file) => <div key={file.id} className="flex items-center gap-2 border border-[#F7F5F0]/10 p-3 text-sm"><FileLink path={file.storage_path} name={file.file_name}/></div>)}</div></section></aside></div>;
}

function FileLink({ path, name }: { path: string; name: string }) { const [url, setUrl] = useState(''); useEffect(() => { if (!supabase) return; void supabase.storage.from('task-files').createSignedUrl(path, 300).then(({ data }) => setUrl(data?.signedUrl || '')); }, [path]); return url ? <a href={url} target="_blank" rel="noreferrer" className="truncate underline">{name}</a> : <span className="truncate">{name}</span>; }

function Shell({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-[#111111] text-[#F7F5F0] px-5 py-8 md:px-10 lg:px-14"><div className="mx-auto max-w-[1550px]">{children}</div></div>; }
