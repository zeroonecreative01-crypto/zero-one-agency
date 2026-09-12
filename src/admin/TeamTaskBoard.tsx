import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, Clock3, GripVertical, LogOut, Pencil, Plus, RotateCcw, Shield, UserRound, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import './EmployeeTaskBoard.css';

type Status = 'todo' | 'in_progress' | 'review' | 'changes_requested' | 'done' | 'blocked';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Profile = { id: string; name: string; email: string | null; role: 'admin' | 'employee'; job_title: string | null; status: 'pending' | 'active' | 'blocked' | 'rejected'; avatar_url: string | null };
type Task = { id: string; title: string; description: string; status: Status; priority: Priority; assignee_id: string; created_by: string; due_at: string | null; sort_order: number; blocked_reason: string | null; created_at: string; updated_at: string };
type Comment = { id: string; task_id: string; user_id: string; body: string; created_at: string; author?: Profile | null };
type Activity = { id: number; task_id: string | null; actor_id: string | null; event_type: string; metadata: Record<string, unknown>; created_at: string; actor?: Profile | null };

const columns: { id: Status; label: string; description: string }[] = [
  { id: 'todo', label: 'To Do', description: 'Queued work' },
  { id: 'in_progress', label: 'In Progress', description: 'Being worked on' },
  { id: 'review', label: 'Review', description: 'Waiting for admin' },
  { id: 'changes_requested', label: 'Changes Requested', description: 'Needs another pass' },
  { id: 'done', label: 'Done', description: 'Approved' },
  { id: 'blocked', label: 'Blocked', description: 'Needs attention' },
];
const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
const roleOptions = ['Designer', 'Developer', 'Video Editor', 'Account Manager'];

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#111111] text-[#F7F5F0] px-5 py-8 md:px-10 lg:px-14"><div className="mx-auto max-w-[1500px]">{children}</div></div>;
}

export default function TeamTaskBoard() {
  const { user, loading, configured, signIn, signOut } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [tab, setTab] = useState<'board' | 'team' | 'activity'>('board');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('Designer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const isAdmin = profile?.role === 'admin' || user?.app_metadata?.role === 'admin';

  const load = async () => {
    if (!supabase || !user) return;
    setLoadingData(true); setError('');
    const { data: me, error: meError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (meError) { setError(meError.message); setLoadingData(false); return; }
    const current = me as Profile | null;
    setProfile(current);
    if (!current && user.app_metadata?.role === 'admin') {
      await supabase.from('profiles').upsert({ id: user.id, name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin', email: user.email, role: 'admin', status: 'active' });
      const { data: adminProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(adminProfile as Profile);
    }
    const effectiveAdmin = current?.role === 'admin' || user.app_metadata?.role === 'admin';
    if (effectiveAdmin) {
      const [peopleRes, taskRes, activityRes, commentRes] = await Promise.all([
        supabase.from('profiles').select('*').order('status').order('name'),
        supabase.from('tasks').select('*').order('status').order('sort_order').order('created_at'),
        supabase.from('task_activity').select('*').order('created_at', { ascending: false }).limit(150),
        supabase.from('task_comments').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      setProfiles((peopleRes.data || []) as Profile[]); setTasks((taskRes.data || []) as Task[]); setActivity((activityRes.data || []) as Activity[]); setComments((commentRes.data || []) as Comment[]);
    } else if (current?.status === 'active') {
      const [taskRes, commentRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('assignee_id', user.id).order('status').order('sort_order'),
        supabase.from('task_comments').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      setTasks((taskRes.data || []) as Task[]); setComments((commentRes.data || []) as Comment[]);
    } else { setTasks([]); }
    setLoadingData(false);
  };

  useEffect(() => { if (user) void load(); else { setProfile(null); setProfiles([]); setTasks([]); } }, [user]);
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') setRecovery(true); }).data.subscription;
    return () => channel.unsubscribe();
  }, []);

  const orderedTasks = useMemo(() => [...tasks].sort((a, b) => a.status.localeCompare(b.status) || a.sort_order - b.sort_order), [tasks]);
  const employees = profiles.filter((p) => p.role === 'employee');
  const pending = employees.filter((p) => p.status === 'pending');
  const grouped = (status: Status) => orderedTasks.filter((t) => t.status === status);

  const authSubmit = async (e: FormEvent) => {
    e.preventDefault(); if (!supabase) return; setAuthBusy(true); setAuthError('');
    if (authMode === 'signin') {
      const result = await signIn(email.trim(), password);
      if (result.error) setAuthError(result.error.message);
    } else {
      if (name.trim().length < 2) { setAuthError('Enter your full name.'); setAuthBusy(false); return; }
      const { error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim(), job_title: jobTitle } } });
      if (signUpError) setAuthError(signUpError.message); else setAuthError('Registration submitted. Wait for the admin to approve your account.');
    }
    setAuthBusy(false);
  };

  const resetPassword = async (person: Profile) => {
    if (!supabase || !person.email) return; setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(person.email, { redirectTo: `${window.location.origin}/team` });
    setError(resetError ? resetError.message : `Password reset email sent to ${person.email}.`);
  };

  const changePassword = async () => {
    if (!supabase || newPassword.length < 8) { setError('Use a password with at least 8 characters.'); return; }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) setError(updateError.message); else { setRecovery(false); setNewPassword(''); setError('Password updated successfully.'); }
  };

  const createTask = async (form: { title: string; description: string; assignee_id: string; priority: Priority; due_at: string }) => {
    if (!supabase || !isAdmin || !user) return;
    const last = grouped('todo').at(-1)?.sort_order ?? -1;
    const { data, error: e } = await supabase.from('tasks').insert({ ...form, title: form.title.trim(), description: form.description.trim(), due_at: form.due_at ? new Date(form.due_at).toISOString() : null, status: 'todo', sort_order: last + 1, created_by: user.id }).select('*').single();
    if (e) setError(e.message); else if (data) { setTasks((v) => [...v, data as Task]); setShowTaskForm(false); }
  };

  const updateEmployee = async (id: string, patch: Partial<Profile>) => {
    if (!supabase || !isAdmin) return; const { error: e } = await supabase.from('profiles').update(patch).eq('id', id); if (e) setError(e.message); else await load();
  };

  const moveTask = async (taskId: string, target: Status, reason = '') => {
    if (!supabase) return; const source = tasks.find((t) => t.id === taskId); if (!source || source.status === target) return;
    const newIndex = grouped(target).length;
    const { data, error: e } = await supabase.rpc('move_task', { p_task_id: taskId, p_status: target, p_sort_order: newIndex, p_blocked_reason: target === 'blocked' ? reason : null });
    if (e) { setError(e.message); return; }
    if (data) await load();
  };

  const approveTask = async (task: Task) => moveTask(task.id, 'done');
  const requestChanges = async (task: Task) => moveTask(task.id, 'changes_requested');
  const startTask = async (task: Task) => moveTask(task.id, 'in_progress');
  const submitTask = async (task: Task) => moveTask(task.id, 'review');

  const addComment = async (taskId: string, body: string) => {
    if (!supabase || !user || !body.trim()) return;
    const { data, error: e } = await supabase.from('task_comments').insert({ task_id: taskId, user_id: user.id, body: body.trim() }).select('*').single();
    if (e) setError(e.message); else if (data) { setComments((v) => [data as Comment, ...v]); }
  };

  const renderCard = (task: Task) => {
    const person = profiles.find((p) => p.id === task.assignee_id);
    return <article key={task.id} draggable onDragStart={() => setDraggedTask(task.id)} onDragEnd={() => setDraggedTask(null)} onClick={() => setSelectedTask(task)} className={`group cursor-grab border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.025] p-4 transition hover:-translate-y-0.5 hover:border-[#F14A0B]/40 ${draggedTask === task.id ? 'opacity-40' : ''}`}>
      <div className="flex items-start gap-3"><GripVertical size={16} className="mt-0.5 shrink-0 text-[#F7F5F0]/25"/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold leading-5">{task.title}</h3><span className={`text-[9px] font-bold uppercase tracking-widest ${task.priority === 'urgent' ? 'text-red-300' : task.priority === 'high' ? 'text-[#F14A0B]' : 'text-[#F7F5F0]/40'}`}>{task.priority}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-[#F7F5F0]/45">{task.description || 'No description'}</p><div className="mt-4 flex items-center justify-between gap-2 text-[10px] text-[#F7F5F0]/45"><span>{person?.name || 'Unknown employee'}</span><span>{task.due_at ? new Date(task.due_at).toLocaleDateString('en-GB') : 'No deadline'}</span></div></div></div>
    </article>;
  };

  if (loading) return <Shell><div className="py-32 text-center text-sm uppercase tracking-[0.25em] text-[#F7F5F0]/45">Checking session...</div></Shell>;
  if (!configured) return <Shell><div className="mx-auto max-w-lg border border-[#F7F5F0]/10 p-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Team authentication</p><h1 className="mt-3 text-3xl font-bold">Supabase is not configured.</h1><p className="mt-3 text-sm leading-6 text-[#F7F5F0]/50">Add the production Supabase environment variables and redeploy.</p></div></Shell>;
  if (!user) return <Shell><div className="mx-auto flex min-h-[80vh] max-w-md items-center"><form onSubmit={authSubmit} className="w-full border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-8 md:p-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">ZERO ONE / TEAM</p><h1 className="mt-3 text-4xl font-bold tracking-tight">{authMode === 'signin' ? 'Team sign in.' : 'Join the team.'}</h1><p className="mt-3 text-sm leading-6 text-[#F7F5F0]/45">{authMode === 'signin' ? 'Use your approved employee account.' : 'Create an account. The admin must approve it before access is granted.'}</p>{authError && <div className="mt-6 border border-[#F14A0B]/30 bg-[#F14A0B]/5 p-4 text-sm text-[#F7F5F0]/70">{authError}</div>}<div className="mt-8 space-y-5">{authMode === 'signup' && <><label className="block text-xs uppercase tracking-widest text-[#F7F5F0]/50">Full name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full border-b border-[#F7F5F0]/20 bg-transparent py-3 outline-none focus:border-[#F14A0B]"/></label><label className="block text-xs uppercase tracking-widest text-[#F7F5F0]/50">Job title<select value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="mt-2 w-full border-b border-[#F7F5F0]/20 bg-[#111111] py-3 outline-none"><option>Designer</option><option>Developer</option><option>Video Editor</option><option>Account Manager</option><option>Other</option></select></label></>}<label className="block text-xs uppercase tracking-widest text-[#F7F5F0]/50">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full border-b border-[#F7F5F0]/20 bg-transparent py-3 outline-none focus:border-[#F14A0B]"/></label><label className="block text-xs uppercase tracking-widest text-[#F7F5F0]/50">Password<input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full border-b border-[#F7F5F0]/20 bg-transparent py-3 outline-none focus:border-[#F14A0B]"/></label><button disabled={authBusy} className="w-full rounded-full bg-[#F14A0B] px-6 py-4 font-semibold text-[#111111]">{authBusy ? 'Please wait...' : authMode === 'signin' ? 'Sign in' : 'Submit registration'}</button></div><button type="button" onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setAuthError(''); }} className="mt-5 text-sm text-[#F7F5F0]/55 underline underline-offset-4">{authMode === 'signin' ? 'New employee? Create an account' : 'Already registered? Sign in'}</button><div className="mt-8 border-t border-[#F7F5F0]/10 pt-6 text-xs text-[#F7F5F0]/40">Admin? <a className="text-[#F7F5F0] underline underline-offset-4" href="/admin">Open Admin</a></div></form></div></Shell>;
  if (!profile) return <Shell><div className="py-32 text-center">Loading profile...</div></Shell>;
  if (!isAdmin && profile.status !== 'active') return <Shell><div className="mx-auto flex min-h-[70vh] max-w-lg items-center"><div className="w-full border border-[#F7F5F0]/10 p-10 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#F14A0B]/30 bg-[#F14A0B]/5 text-[#F14A0B]"><Clock3 size={20}/></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Account status</p><h1 className="mt-3 text-3xl font-bold">{profile.status === 'pending' ? 'Waiting for approval.' : profile.status === 'blocked' ? 'Your account is blocked.' : 'Registration rejected.'}</h1><p className="mt-3 text-sm leading-6 text-[#F7F5F0]/50">{profile.status === 'pending' ? 'The admin needs to approve your registration before you can enter the Team workspace.' : profile.status === 'blocked' ? 'Contact the agency admin if you believe this was a mistake.' : 'This registration is no longer active.'}</p><button onClick={() => void signOut()} className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-5 py-3 text-sm font-semibold"><LogOut size={15}/> Sign out</button></div></div></Shell>;

  return <Shell>
    <header className="border-b border-[#F7F5F0]/10 pb-6"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">ZERO ONE / INTERNAL WORKSPACE</p><h1 className="mt-2 text-4xl font-bold tracking-tighter md:text-6xl">{isAdmin ? 'Team Control.' : 'My Tasks.'}</h1><p className="mt-3 text-sm text-[#F7F5F0]/45">{isAdmin ? 'One admin, one secure team system, one source of truth.' : 'Work your queue, submit for review, and keep the context on each task.'}</p></div><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/10 px-4 py-2 text-xs text-[#F7F5F0]/60"><UserRound size={14}/> {profile.name || user.email}</span><button onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-4 py-2 text-sm"><LogOut size={14}/> Sign out</button></div></div><div className="mt-7 flex flex-wrap gap-2"><button onClick={() => setTab('board')} className={`rounded-full px-4 py-2.5 text-sm font-semibold ${tab === 'board' ? 'bg-[#F14A0B] text-[#111111]' : 'border border-[#F7F5F0]/15 text-[#F7F5F0]/65'}`}>{isAdmin ? 'Board' : 'My Tasks'}</button>{isAdmin && <><button onClick={() => setTab('team')} className={`rounded-full px-4 py-2.5 text-sm font-semibold ${tab === 'team' ? 'bg-[#F14A0B] text-[#111111]' : 'border border-[#F7F5F0]/15 text-[#F7F5F0]/65'}`}>Team <span className="ml-1 opacity-70">({pending.length})</span></button><button onClick={() => setTab('activity')} className={`rounded-full px-4 py-2.5 text-sm font-semibold ${tab === 'activity' ? 'bg-[#F14A0B] text-[#111111]' : 'border border-[#F7F5F0]/15 text-[#F7F5F0]/65'}`}>Activity</button></>}</div></header>

    {error && <div className="mt-5 flex items-center justify-between border border-[#F14A0B]/30 bg-[#F14A0B]/5 px-4 py-3 text-sm"><span>{error}</span><button onClick={() => setError('')}><X size={16}/></button></div>}

    {tab === 'board' && <section className="mt-8"><div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-[#F7F5F0]/35">{isAdmin ? 'Drag & drop workflow' : 'Your assigned queue'}</p><p className="mt-1 text-sm text-[#F7F5F0]/45">{isAdmin ? 'Moving a card changes the real task state and preserves order.' : 'Drag only through the states you are allowed to use.'}</p></div>{isAdmin && <button onClick={() => setShowTaskForm(true)} className="inline-flex items-center gap-2 self-start rounded-full bg-[#F14A0B] px-5 py-3 text-sm font-semibold text-[#111111]"><Plus size={16}/> New Task</button>}</div><div className="grid gap-4 xl:grid-cols-6 lg:grid-cols-3 md:grid-cols-2">{columns.map((column) => <div key={column.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (draggedTask) { setDraggedTask(null); void moveTask(draggedTask, column.id); } }} className="min-h-[420px] border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.015] p-3"><div className="mb-3 flex items-center justify-between border-b border-[#F7F5F0]/10 pb-3"><div><h2 className="text-sm font-bold">{column.label}</h2><p className="mt-0.5 text-[10px] text-[#F7F5F0]/35">{column.description}</p></div><span className="grid h-6 min-w-6 place-items-center rounded-full border border-[#F7F5F0]/10 px-2 text-[10px] text-[#F7F5F0]/50">{grouped(column.id).length}</span></div><div className="space-y-2">{grouped(column.id).map(renderCard)}</div></div>)}</div></section>}

    {tab === 'team' && isAdmin && <section className="mt-8"><div className="flex flex-col gap-4 border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-5 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Access control</p><h2 className="mt-2 text-2xl font-bold">Registration requests & team</h2><p className="mt-2 text-sm text-[#F7F5F0]/45">Approve new employees before they can enter the workspace. Edit names, block access, or send password reset emails.</p></div><button onClick={() => setShowEmployeeForm(true)} className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-5 py-3 text-sm font-semibold"><Plus size={16}/> Add employee</button></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{employees.map((person) => <div key={person.id} className="border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{person.name || person.email}</h3><p className="mt-1 text-xs text-[#F7F5F0]/45">{person.email}</p><p className="mt-1 text-xs text-[#F7F5F0]/35">{person.job_title || 'Employee'}</p></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest ${person.status === 'active' ? 'bg-emerald-400/10 text-emerald-300' : person.status === 'pending' ? 'bg-amber-300/10 text-amber-200' : person.status === 'blocked' ? 'bg-red-400/10 text-red-200' : 'bg-[#F7F5F0]/10 text-[#F7F5F0]/50'}`}>{person.status}</span></div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => void updateEmployee(person.id, { name: window.prompt('Employee name', person.name) || person.name })} className="rounded-lg border border-[#F7F5F0]/10 px-3 py-2 text-xs font-semibold"><Pencil size={13} className="mr-1 inline"/> Edit name</button><button onClick={() => void resetPassword(person)} className="rounded-lg border border-[#F7F5F0]/10 px-3 py-2 text-xs font-semibold"><RotateCcw size={13} className="mr-1 inline"/> Reset password</button></div>{person.status === 'pending' && <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => void updateEmployee(person.id, { status: 'active' })} className="rounded-lg bg-[#F14A0B] px-3 py-2 text-xs font-bold text-[#111111]">Approve</button><button onClick={() => void updateEmployee(person.id, { status: 'rejected' })} className="rounded-lg border border-red-300/20 px-3 py-2 text-xs font-semibold text-red-200">Reject</button></div>}{person.status === 'active' && <button onClick={() => void updateEmployee(person.id, { status: 'blocked' })} className="mt-3 w-full rounded-lg border border-red-300/20 px-3 py-2 text-xs font-semibold text-red-200">Block access</button>}{person.status === 'blocked' && <button onClick={() => void updateEmployee(person.id, { status: 'active' })} className="mt-3 w-full rounded-lg border border-emerald-300/20 px-3 py-2 text-xs font-semibold text-emerald-200">Unblock</button>}</div>)}</div></section>}

    {tab === 'activity' && isAdmin && <section className="mt-8 space-y-2">{activity.map((item) => { const actor = profiles.find((p) => p.id === item.actor_id); const task = tasks.find((t) => t.id === item.task_id); return <div key={item.id} className="flex items-center justify-between gap-4 border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] px-5 py-4"><div className="min-w-0"><p className="text-sm font-semibold">{item.event_type.replace(/_/g, ' ')}</p><p className="mt-1 truncate text-xs text-[#F7F5F0]/45">{task?.title || 'Task'} · {actor?.name || 'System'}</p></div><time className="shrink-0 text-[10px] text-[#F7F5F0]/35">{new Date(item.created_at).toLocaleString('en-GB')}</time></div>})}</section>}

    {loadingData && <div className="py-10 text-center text-sm text-[#F7F5F0]/40">Syncing workspace...</div>}

    {selectedTask && <TaskDrawer task={selectedTask} profile={profile} profiles={profiles} comments={comments.filter((c) => c.task_id === selectedTask.id)} isAdmin={isAdmin} onClose={() => setSelectedTask(null)} onComment={addComment} onStart={() => void startTask(selectedTask)} onSubmit={() => void submitTask(selectedTask)} onApprove={() => void approveTask(selectedTask)} onChanges={() => void requestChanges(selectedTask)} onBlock={() => void moveTask(selectedTask.id, 'blocked', window.prompt('Why is this task blocked?') || 'Blocked')} />}
    {showTaskForm && isAdmin && <TaskForm employees={employees.filter((p) => p.status === 'active')} priorities={priorities} onClose={() => setShowTaskForm(false)} onSubmit={(f) => void createTask(f)} />}
    {showEmployeeForm && isAdmin && <EmployeeForm onClose={() => setShowEmployeeForm(false)} onSubmit={async (f) => { if (!supabase) return; const { error: e } = await supabase.auth.admin; void e; setShowEmployeeForm(false); setError('Employees must register themselves so their password stays private. Use Team → registration approval for new accounts.'); }} />}
    {recovery && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5"><div className="w-full max-w-md border border-[#F7F5F0]/10 bg-[#151515] p-7"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Password recovery</p><h2 className="mt-2 text-2xl font-bold">Set a new password.</h2><input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="mt-6 w-full border-b border-[#F7F5F0]/20 bg-transparent py-3 outline-none focus:border-[#F14A0B]"/><div className="mt-5 flex gap-2"><button onClick={() => void changePassword()} className="rounded-full bg-[#F14A0B] px-5 py-3 text-sm font-semibold text-[#111111]">Save password</button><button onClick={() => setRecovery(false)} className="rounded-full border border-[#F7F5F0]/15 px-5 py-3 text-sm">Cancel</button></div></div></div>}
  </Shell>;
}

function TaskForm({ employees, onClose, onSubmit, priorities }: { employees: Profile[]; priorities: Priority[]; onClose: () => void; onSubmit: (form: { title: string; description: string; assignee_id: string; priority: Priority; due_at: string }) => void }) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [assignee, setAssignee] = useState(employees[0]?.id || ''); const [priority, setPriority] = useState<Priority>('medium'); const [due, setDue] = useState('');
  return <Modal title="Create a task" onClose={onClose}><div className="space-y-4"><input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Task title" className="w-full border border-[#F7F5F0]/10 bg-transparent px-4 py-3"/><textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="What needs to be done?" className="min-h-28 w-full border border-[#F7F5F0]/10 bg-transparent px-4 py-3"/><select value={assignee} onChange={(e)=>setAssignee(e.target.value)} className="w-full border border-[#F7F5F0]/10 bg-[#151515] px-4 py-3">{employees.map((p)=><option key={p.id} value={p.id}>{p.name} · {p.job_title}</option>)}</select><select value={priority} onChange={(e)=>setPriority(e.target.value as Priority)} className="w-full border border-[#F7F5F0]/10 bg-[#151515] px-4 py-3">{priorities.map((p)=><option key={p}>{p}</option>)}</select><input type="datetime-local" value={due} onChange={(e)=>setDue(e.target.value)} className="w-full border border-[#F7F5F0]/10 bg-transparent px-4 py-3"/><button onClick={()=>title.trim()&&assignee&&onSubmit({title,description,assignee_id:assignee,priority,due_at:due})} className="w-full rounded-full bg-[#F14A0B] px-6 py-3 font-semibold text-[#111111]">Create task</button></div></Modal>;
}

function EmployeeForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (form: {name:string;email:string;job:string})=>void }) { const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [job,setJob]=useState('Designer'); return <Modal title="Add employee" onClose={onClose}><p className="text-sm leading-6 text-[#F7F5F0]/45">For security, employees create their own password. This action opens the registration flow rather than creating a password on the admin side.</p><div className="mt-5 space-y-3"><input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name" className="w-full border border-[#F7F5F0]/10 bg-transparent px-4 py-3"/><input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" type="email" className="w-full border border-[#F7F5F0]/10 bg-transparent px-4 py-3"/><select value={job} onChange={(e)=>setJob(e.target.value)} className="w-full border border-[#F7F5F0]/10 bg-[#151515] px-4 py-3">{roleOptions.map((r)=><option key={r}>{r}</option>)}</select><button onClick={()=>onSubmit({name,email,job})} className="w-full rounded-full bg-[#F14A0B] px-6 py-3 font-semibold text-[#111111]">Close</button></div></Modal>; }

function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5"><div className="w-full max-w-lg border border-[#F7F5F0]/10 bg-[#151515] p-7"><div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{title}</h2><button onClick={onClose}><X size={18}/></button></div><div className="mt-6">{children}</div></div></div>; }

function TaskDrawer({ task, profile, profiles, comments, isAdmin, onClose, onComment, onStart, onSubmit, onApprove, onChanges, onBlock }: { task:Task; profile:Profile; profiles:Profile[]; comments:Comment[]; isAdmin:boolean; onClose:()=>void; onComment:(id:string,body:string)=>Promise<void>; onStart:()=>void; onSubmit:()=>void; onApprove:()=>void; onChanges:()=>void; onBlock:()=>void }) { const [body,setBody]=useState(''); const person=profiles.find((p)=>p.id===task.assignee_id); const canStart=!isAdmin&&task.status==='todo'; const canSubmit=!isAdmin&&task.status==='in_progress'; const canBlock=!isAdmin&&task.status==='in_progress'; const canApprove=isAdmin&&task.status==='review'; const canChanges=isAdmin&&task.status==='review'; return <div className="fixed inset-0 z-40 bg-black/70"><aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-[#F7F5F0]/10 bg-[#151515] p-6 md:p-8"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Task details</p><button onClick={onClose}><X/></button></div><h2 className="mt-5 text-3xl font-bold">{task.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#F7F5F0]/55">{task.description || 'No description'}</p><div className="mt-6 grid grid-cols-2 gap-3 text-sm"><div className="border border-[#F7F5F0]/10 p-4"><span className="text-xs text-[#F7F5F0]/35">Assignee</span><div className="mt-1 font-semibold">{person?.name || 'Unknown'}</div></div><div className="border border-[#F7F5F0]/10 p-4"><span className="text-xs text-[#F7F5F0]/35">Priority</span><div className="mt-1 font-semibold">{task.priority}</div></div></div>{task.blocked_reason && <div className="mt-4 border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-100">Blocked: {task.blocked_reason}</div>}<div className="mt-6 flex flex-wrap gap-2">{canStart&&<button onClick={onStart} className="rounded-full bg-[#F14A0B] px-4 py-2 text-sm font-semibold text-[#111111]">Start task</button>}{canSubmit&&<button onClick={onSubmit} className="rounded-full bg-[#F14A0B] px-4 py-2 text-sm font-semibold text-[#111111]">Submit for review</button>}{canBlock&&<button onClick={onBlock} className="rounded-full border border-red-300/20 px-4 py-2 text-sm text-red-100">Block</button>}{canChanges&&<button onClick={onChanges} className="rounded-full border border-amber-300/20 px-4 py-2 text-sm text-amber-100">Request changes</button>}{canApprove&&<button onClick={onApprove} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#111111]"><Check size={15} className="mr-1 inline"/> Approve</button>}</div><div className="mt-9 border-t border-[#F7F5F0]/10 pt-7"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F7F5F0]/35">Comments</p><div className="mt-4 space-y-3">{comments.map((c)=><div key={c.id} className="border border-[#F7F5F0]/10 p-4"><p className="text-sm leading-6">{c.body}</p><p className="mt-2 text-[10px] text-[#F7F5F0]/35">{new Date(c.created_at).toLocaleString('en-GB')}</p></div>)}</div><div className="mt-4 flex gap-2"><textarea value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Write a comment" className="min-h-24 flex-1 border border-[#F7F5F0]/10 bg-transparent px-4 py-3 text-sm"/><button onClick={()=>{void onComment(task.id,body);setBody('')}} className="self-end rounded-full bg-[#F7F5F0] px-4 py-2 text-sm font-semibold text-[#111111]">Post</button></div></div></aside></div>; }
