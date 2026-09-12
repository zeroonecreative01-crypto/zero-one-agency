import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Check, Clock3, GripVertical, LogOut, Pencil, Plus, RotateCcw, Shield, UserRound, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import './EmployeeTaskBoard.css';

type Status = 'todo' | 'in_progress' | 'review' | 'changes_requested' | 'done' | 'blocked';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Profile = { id: string; name: string; email: string | null; role: 'admin' | 'employee'; job_title: string | null; status: 'pending' | 'active' | 'blocked' | 'rejected'; avatar_url: string | null };
type Task = { id: string; title: string; description: string; status: Status; priority: Priority; assignee_id: string; created_by: string; due_at: string | null; sort_order: number; blocked_reason: string | null; created_at: string; updated_at: string };
type Comment = { id: string; task_id: string; user_id: string; body: string; created_at: string };
type Activity = { id: number; task_id: string | null; actor_id: string | null; event_type: string; metadata: Record<string, unknown>; created_at: string };

const columns: { id: Status; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'changes_requested', label: 'Changes Requested' },
  { id: 'done', label: 'Done' },
  { id: 'blocked', label: 'Blocked' },
];
const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
const jobTitles = ['Designer', 'Developer', 'Video Editor', 'Account Manager', 'Other'];

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#111111] px-5 py-8 text-[#F7F5F0] md:px-10 lg:px-14"><div className="mx-auto max-w-[1500px]">{children}</div></div>;
}

export default function TeamTaskBoard() {
  const { user, loading, configured, signIn, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [tab, setTab] = useState<'board' | 'team' | 'activity'>('board');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authJob, setAuthJob] = useState('Designer');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskDue, setTaskDue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const isAdmin = profile?.role === 'admin' || user?.app_metadata?.role === 'admin';
  const employees = profiles.filter((p) => p.role === 'employee');
  const pending = employees.filter((p) => p.status === 'pending');

  const grouped = (status: Status) => tasks.filter((task) => task.status === status).sort((a, b) => a.sort_order - b.sort_order);

  const load = async () => {
    if (!supabase || !user) return;
    setLoadingData(true); setError('');
    const { data: me, error: meError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (meError) { setError(meError.message); setLoadingData(false); return; }
    let current = me as Profile | null;
    if (!current && user.app_metadata?.role === 'admin') {
      await supabase.from('profiles').upsert({ id: user.id, name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin', email: user.email, role: 'admin', status: 'active' });
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      current = data as Profile;
    }
    setProfile(current);
    const admin = current?.role === 'admin' || user.app_metadata?.role === 'admin';
    if (admin) {
      const [p, t, c, a] = await Promise.all([
        supabase.from('profiles').select('*').order('status').order('name'),
        supabase.from('tasks').select('*').order('created_at').order('sort_order'),
        supabase.from('task_comments').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('task_activity').select('*').order('created_at', { ascending: false }).limit(200),
      ]);
      setProfiles((p.data || []) as Profile[]); setTasks((t.data || []) as Task[]); setComments((c.data || []) as Comment[]); setActivity((a.data || []) as Activity[]);
    } else if (current?.status === 'active') {
      const [t, c] = await Promise.all([
        supabase.from('tasks').select('*').eq('assignee_id', user.id).order('created_at').order('sort_order'),
        supabase.from('task_comments').select('*').order('created_at', { ascending: false }).limit(200),
      ]);
      setTasks((t.data || []) as Task[]); setComments((c.data || []) as Comment[]);
    } else {
      setTasks([]); setComments([]); setActivity([]);
    }
    setLoadingData(false);
  };

  useEffect(() => { if (user) void load(); else { setProfile(null); setProfiles([]); setTasks([]); setComments([]); setActivity([]); } }, [user]);
  useEffect(() => {
    if (!supabase) return;
    const sub = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') setRecovery(true); }).data.subscription;
    return () => sub.unsubscribe();
  }, []);

  const authSubmit = async (e: FormEvent) => {
    e.preventDefault(); if (!supabase) return;
    setAuthBusy(true); setError(''); setAuthMessage('');
    if (authMode === 'signin') {
      const result = await signIn(authEmail.trim(), authPassword);
      if (result.error) setError(result.error.message);
    } else {
      if (authName.trim().length < 2) setError('Enter your full name.');
      else {
        const { error: signUpError } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword, options: { data: { full_name: authName.trim(), job_title: authJob } } });
        if (signUpError) setError(signUpError.message); else setAuthMessage('Registration submitted. Your account is waiting for admin approval.');
      }
    }
    setAuthBusy(false);
  };

  const moveTask = async (taskId: string, status: Status, blockedReason: string | null = null) => {
    if (!supabase) return;
    const targetIndex = grouped(status).length;
    const { error: moveError } = await supabase.rpc('move_task', { p_task_id: taskId, p_status: status, p_sort_order: targetIndex, p_blocked_reason: blockedReason });
    if (moveError) { setError(moveError.message); return; }
    await load();
  };

  const handleDrop = async (status: Status) => {
    if (!dragged) return;
    const task = tasks.find((item) => item.id === dragged); setDragged(null);
    if (!task || task.status === status) return;
    const allowed: Status[] = isAdmin ? columns.map((c) => c.id) : ['todo', 'in_progress', 'review', 'changes_requested', 'blocked'];
    if (!allowed.includes(status) || (!isAdmin && status === 'done')) { setError('That status change is not allowed.'); return; }
    const reason = status === 'blocked' ? window.prompt('Why is this task blocked?') || 'Blocked' : null;
    if (status === 'done' && !isAdmin) { setError('Only the admin can approve a task.'); return; }
    await moveTask(dragged, status, reason);
  };

  const createTask = async (e: FormEvent) => {
    e.preventDefault(); if (!supabase || !user || !isAdmin || !taskTitle.trim() || !taskAssignee) return;
    const { error: createError } = await supabase.from('tasks').insert({ title: taskTitle.trim(), description: taskDescription.trim(), assignee_id: taskAssignee, priority: taskPriority, due_at: taskDue ? new Date(taskDue).toISOString() : null, status: 'todo', sort_order: grouped('todo').length, created_by: user.id });
    if (createError) { setError(createError.message); return; }
    setTaskTitle(''); setTaskDescription(''); setTaskAssignee(''); setTaskPriority('medium'); setTaskDue(''); setShowTaskForm(false); await load();
  };

  const updateEmployee = async (id: string, patch: Partial<Profile>) => {
    if (!supabase || !isAdmin) return;
    const { error: updateError } = await supabase.from('profiles').update(patch).eq('id', id);
    if (updateError) setError(updateError.message); else await load();
    setEditingId(null);
  };

  const resetPassword = async (person: Profile) => {
    if (!supabase || !person.email) return;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(person.email, { redirectTo: `${window.location.origin}/team` });
    if (resetError) setError(resetError.message); else setAuthMessage(`Password reset email sent to ${person.email}.`);
  };

  const addComment = async (taskId: string, body: string) => {
    if (!supabase || !user || !body.trim()) return;
    const { error: commentError } = await supabase.from('task_comments').insert({ task_id: taskId, user_id: user.id, body: body.trim() });
    if (commentError) { setError(commentError.message); return; }
    await load();
  };

  const changePassword = async () => {
    if (!supabase || newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
    if (passwordError) setError(passwordError.message); else { setRecovery(false); setNewPassword(''); setAuthMessage('Password updated successfully.'); }
  };

  const labelFor = (status: Status) => columns.find((c) => c.id === status)?.label || status;

  if (loading) return <Shell><div className="py-32 text-center text-sm uppercase tracking-[0.25em] text-[#F7F5F0]/45">Checking session...</div></Shell>;
  if (!configured) return <Shell><div className="mx-auto max-w-lg border border-[#F7F5F0]/10 p-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Team authentication</p><h1 className="mt-3 text-3xl font-bold">Supabase is not configured.</h1><p className="mt-3 text-sm leading-6 text-[#F7F5F0]/50">Add the production Supabase environment variables and redeploy.</p></div></Shell>;

  if (!user) return <Shell><div className="mx-auto flex min-h-[80vh] max-w-md items-center"><form onSubmit={authSubmit} className="w-full border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-8 md:p-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">ZERO ONE / TEAM</p><h1 className="mt-3 text-4xl font-bold tracking-tight">{authMode === 'signin' ? 'Team sign in.' : 'Join the team.'}</h1><p className="mt-3 text-sm leading-6 text-[#F7F5F0]/45">{authMode === 'signin' ? 'Use your approved employee account.' : 'Create an account. The admin must approve it before access is granted.'}</p>{error && <div className="mt-6 border border-red-300/20 bg-red-300/5 p-4 text-sm text-red-100">{error}</div>}{authMessage && <div className="mt-6 border border-emerald-300/20 bg-emerald-300/5 p-4 text-sm text-emerald-100">{authMessage}</div>}<div className="mt-8 space-y-5">{authMode === 'signup' && <><label className="block text-xs uppercase tracking-widest text-[#F7F5F0]/50">Full name<input required value={authName} onChange={(e) => setAuthName(e.target.value)} className="mt-2 w-full border-b border-[#F7F5F0]/20 bg-transparent py-3 outline-none focus:border-[#F14A0B]"/></label><label className="block text-xs uppercase tracking-widest text-[#F7F5F0]/50">Job title<select value={authJob} onChange={(e) => setAuthJob(e.target.value)} className="mt-2 w-full border-b border-[#F7F5F0]/20 bg-[#111111] py-3 outline-none"><option>{jobTitles[0]}</option><option>{jobTitles[1]}</option><option>{jobTitles[2]}</option><option>{jobTitles[3]}</option><option>{jobTitles[4]}</option></select></label></>}<label className="block text-xs uppercase tracking-widest text-[#F7F5F0]/50">Email<input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="mt-2 w-full border-b border-[#F7F5F0]/20 bg-transparent py-3 outline-none focus:border-[#F14A0B]"/></label><label className="block text-xs uppercase tracking-widest text-[#F7F5F0]/50">Password<input required type="password" minLength={8} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="mt-2 w-full border-b border-[#F7F5F0]/20 bg-transparent py-3 outline-none focus:border-[#F14A0B]"/></label><button disabled={authBusy} className="w-full rounded-full bg-[#F14A0B] px-6 py-4 font-semibold text-[#111111]">{authBusy ? 'Please wait...' : authMode === 'signin' ? 'Sign in' : 'Submit registration'}</button></div><button type="button" onClick={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setError(''); setAuthMessage(''); }} className="mt-5 text-sm text-[#F7F5F0]/55 underline underline-offset-4">{authMode === 'signin' ? 'New employee? Create an account' : 'Already registered? Sign in'}</button><div className="mt-8 border-t border-[#F7F5F0]/10 pt-6 text-xs text-[#F7F5F0]/40">Admin? <a className="text-[#F7F5F0] underline underline-offset-4" href="/admin">Open Admin</a></div></form></div></Shell>;

  if (!profile) return <Shell><div className="py-32 text-center">Loading profile...</div></Shell>;
  if (!isAdmin && profile.status !== 'active') return <Shell><div className="mx-auto flex min-h-[70vh] max-w-lg items-center"><div className="w-full border border-[#F7F5F0]/10 p-10 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#F14A0B]/30 bg-[#F14A0B]/5 text-[#F14A0B]"><Clock3 size={20}/></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Account status</p><h1 className="mt-3 text-3xl font-bold">{profile.status === 'pending' ? 'Waiting for approval.' : profile.status === 'blocked' ? 'Your account is blocked.' : 'Registration rejected.'}</h1><p className="mt-3 text-sm leading-6 text-[#F7F5F0]/50">{profile.status === 'pending' ? 'The admin needs to approve your registration before you can enter the Team workspace.' : profile.status === 'blocked' ? 'Contact the agency admin if you believe this was a mistake.' : 'This registration is no longer active.'}</p><button onClick={() => void signOut()} className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-5 py-3 text-sm font-semibold"><LogOut size={15}/> Sign out</button></div></div></Shell>;

  return <Shell>
    <header className="border-b border-[#F7F5F0]/10 pb-6"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">ZERO ONE / INTERNAL WORKSPACE</p><h1 className="mt-2 text-4xl font-bold tracking-tighter md:text-6xl">{isAdmin ? 'Team Control.' : 'My Tasks.'}</h1><p className="mt-3 text-sm text-[#F7F5F0]/45">{isAdmin ? 'One admin, one secure team system, one source of truth.' : 'Work your queue, submit for review, and keep the context on each task.'}</p></div><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/10 px-4 py-2 text-xs text-[#F7F5F0]/60"><UserRound size={14}/> {profile.name || user.email}</span><button onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-4 py-2 text-sm"><LogOut size={14}/> Sign out</button></div></div><div className="mt-7 flex flex-wrap gap-2"><button onClick={() => setTab('board')} className={`rounded-full px-4 py-2.5 text-sm font-semibold ${tab === 'board' ? 'bg-[#F14A0B] text-[#111111]' : 'border border-[#F7F5F0]/15 text-[#F7F5F0]/65'}`}>{isAdmin ? 'Board' : 'My Tasks'}</button>{isAdmin && <><button onClick={() => setTab('team')} className={`rounded-full px-4 py-2.5 text-sm font-semibold ${tab === 'team' ? 'bg-[#F14A0B] text-[#111111]' : 'border border-[#F7F5F0]/15 text-[#F7F5F0]/65'}`}>Team <span className="ml-1 opacity-70">({pending.length})</span></button><button onClick={() => setTab('activity')} className={`rounded-full px-4 py-2.5 text-sm font-semibold ${tab === 'activity' ? 'bg-[#F14A0B] text-[#111111]' : 'border border-[#F7F5F0]/15 text-[#F7F5F0]/65'}`}>Activity</button></>}</div></header>
    {(error || authMessage) && <div className="mt-5 flex items-start justify-between gap-4 border border-[#F14A0B]/20 bg-[#F14A0B]/5 px-4 py-3 text-sm"><span>{error || authMessage}</span><button onClick={() => { setError(''); setAuthMessage(''); }}><X size={16}/></button></div>}

    {tab === 'board' && <section className="mt-8"><div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-[#F7F5F0]/35">Drag & drop workflow</p><p className="mt-1 text-sm text-[#F7F5F0]/45">Move cards between valid states. The change is persisted in Supabase.</p></div>{isAdmin && <button onClick={() => setShowTaskForm((v) => !v)} className="inline-flex items-center gap-2 self-start rounded-full bg-[#F14A0B] px-5 py-3 text-sm font-semibold text-[#111111]"><Plus size={16}/> New Task</button>}</div>
      {showTaskForm && isAdmin && <form onSubmit={createTask} className="mb-6 grid gap-4 border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-5 md:grid-cols-2"><div className="md:col-span-2"><input required placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="w-full border-b border-[#F7F5F0]/15 bg-transparent py-3 outline-none"/></div><textarea placeholder="Description" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} className="min-h-28 w-full border border-[#F7F5F0]/10 bg-transparent p-3 outline-none"/><div className="space-y-3"><select required value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} className="w-full border border-[#F7F5F0]/10 bg-[#171717] p-3"><option value="">Assign employee</option>{employees.filter((p) => p.status === 'active').map((p) => <option key={p.id} value={p.id}>{p.name || p.email} — {p.job_title || 'Employee'}</option>)}</select><select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as Priority)} className="w-full border border-[#F7F5F0]/10 bg-[#171717] p-3">{priorities.map((p) => <option key={p}>{p}</option>)}</select><input type="datetime-local" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} className="w-full border border-[#F7F5F0]/10 bg-transparent p-3"/><button className="w-full rounded-full bg-[#F14A0B] px-5 py-3 font-semibold text-[#111111]">Create task</button></div></form>}
      <div className="grid gap-3 overflow-x-auto pb-3 xl:grid-cols-6 lg:grid-cols-3 md:grid-cols-2">{columns.map((column) => <div key={column.id} onDragOver={(e) => e.preventDefault()} onDrop={() => void handleDrop(column.id)} className="min-h-[420px] min-w-[245px] border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.015] p-3"><div className="mb-3 flex items-center justify-between border-b border-[#F7F5F0]/10 pb-3"><h2 className="text-sm font-bold">{column.label}</h2><span className="grid h-6 min-w-6 place-items-center rounded-full border border-[#F7F5F0]/10 px-2 text-[10px] text-[#F7F5F0]/50">{grouped(column.id).length}</span></div><div className="space-y-2">{grouped(column.id).map((task) => { const person = profiles.find((p) => p.id === task.assignee_id) || (task.assignee_id === profile.id ? profile : null); return <article key={task.id} draggable onDragStart={() => setDragged(task.id)} onClick={() => setSelectedTask(task)} className={`cursor-grab border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.025] p-4 transition hover:-translate-y-0.5 hover:border-[#F14A0B]/40 ${dragged === task.id ? 'opacity-40' : ''}`}><div className="flex gap-2"><GripVertical size={16} className="mt-0.5 shrink-0 text-[#F7F5F0]/25"/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{task.title}</h3><span className="text-[9px] font-bold uppercase tracking-widest text-[#F14A0B]">{task.priority}</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-[#F7F5F0]/45">{task.description || 'No description'}</p><div className="mt-3 flex justify-between text-[10px] text-[#F7F5F0]/40"><span>{person?.name || 'Unassigned'}</span><span>{task.due_at ? new Date(task.due_at).toLocaleDateString('en-GB') : 'No deadline'}</span></div></div></div></article>; })}</div></div>)}</div></section>}

    {tab === 'team' && isAdmin && <section className="mt-8"><div className="border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-5"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Access control</p><h2 className="mt-2 text-2xl font-bold">Registration requests & team</h2><p className="mt-2 text-sm text-[#F7F5F0]/45">Approve new employees, edit names, block access, and send password reset emails.</p></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{employees.map((person) => <div key={person.id} className="border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1">{editingId === person.id ? <div className="flex gap-2"><input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="min-w-0 flex-1 border border-[#F7F5F0]/10 bg-transparent px-2 py-2"/><button onClick={() => void updateEmployee(person.id, { name: editingName.trim() || person.name })} className="rounded-lg border border-emerald-300/20 px-3 text-emerald-200">Save</button></div> : <><h3 className="font-semibold">{person.name || person.email}</h3><p className="mt-1 text-xs text-[#F7F5F0]/45">{person.email}</p><p className="mt-1 text-xs text-[#F7F5F0]/35">{person.job_title || 'Employee'}</p></>}</div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest ${person.status === 'active' ? 'bg-emerald-400/10 text-emerald-300' : person.status === 'pending' ? 'bg-amber-300/10 text-amber-200' : person.status === 'blocked' ? 'bg-red-400/10 text-red-200' : 'bg-[#F7F5F0]/10 text-[#F7F5F0]/50'}`}>{person.status}</span></div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => { setEditingId(person.id); setEditingName(person.name || ''); }} className="rounded-lg border border-[#F7F5F0]/10 px-3 py-2 text-xs font-semibold"><Pencil size={13} className="mr-1 inline"/> Edit name</button><button onClick={() => void resetPassword(person)} className="rounded-lg border border-[#F7F5F0]/10 px-3 py-2 text-xs font-semibold"><RotateCcw size={13} className="mr-1 inline"/> Reset password</button></div>{person.status === 'pending' && <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => void updateEmployee(person.id, { status: 'active' })} className="rounded-lg bg-[#F14A0B] px-3 py-2 text-xs font-bold text-[#111111]">Approve</button><button onClick={() => void updateEmployee(person.id, { status: 'rejected' })} className="rounded-lg border border-red-300/20 px-3 py-2 text-xs font-semibold text-red-200">Reject</button></div>}{person.status === 'active' && <button onClick={() => void updateEmployee(person.id, { status: 'blocked' })} className="mt-3 w-full rounded-lg border border-red-300/20 px-3 py-2 text-xs font-semibold text-red-200">Block access</button>}{person.status === 'blocked' && <button onClick={() => void updateEmployee(person.id, { status: 'active' })} className="mt-3 w-full rounded-lg border border-emerald-300/20 px-3 py-2 text-xs font-semibold text-emerald-200">Unblock</button>}</div>)}</div></section>}

    {tab === 'activity' && isAdmin && <section className="mt-8 space-y-2">{activity.length === 0 ? <div className="border border-[#F7F5F0]/10 p-8 text-sm text-[#F7F5F0]/40">No activity yet.</div> : activity.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] px-5 py-4"><div><p className="text-sm font-semibold">{item.event_type.replace(/_/g, ' ')}</p><p className="mt-1 text-xs text-[#F7F5F0]/40">{item.task_id ? (tasks.find((t) => t.id === item.task_id)?.title || 'Task') : 'Workspace'}</p></div><time className="text-[10px] text-[#F7F5F0]/35">{new Date(item.created_at).toLocaleString('en-GB')}</time></div>)}</section>}

    {loadingData && <div className="py-10 text-center text-sm text-[#F7F5F0]/40">Syncing workspace...</div>}
    {selectedTask && <TaskDetail task={selectedTask} isAdmin={isAdmin} currentUser={profile} comments={comments.filter((c) => c.task_id === selectedTask.id)} onClose={() => setSelectedTask(null)} onComment={addComment} onStart={() => void moveTask(selectedTask.id, 'in_progress')} onSubmit={() => void moveTask(selectedTask.id, 'review')} onApprove={() => void moveTask(selectedTask.id, 'done')} onChanges={() => void moveTask(selectedTask.id, 'changes_requested')} onBlock={() => void moveTask(selectedTask.id, 'blocked', window.prompt('Why is this task blocked?') || 'Blocked')} />}
    {recovery && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5"><div className="w-full max-w-md border border-[#F7F5F0]/10 bg-[#171717] p-7"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Password reset</p><h2 className="mt-2 text-2xl font-bold">Set a new password</h2><input type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-6 w-full border-b border-[#F7F5F0]/15 bg-transparent py-3 outline-none" placeholder="New password"/><div className="mt-5 flex gap-2"><button onClick={() => void changePassword()} className="rounded-full bg-[#F14A0B] px-5 py-3 font-semibold text-[#111111]">Save password</button><button onClick={() => setRecovery(false)} className="rounded-full border border-[#F7F5F0]/15 px-5 py-3">Cancel</button></div></div></div>}
  </Shell>;
}

function TaskDetail({ task, isAdmin, currentUser, comments, onClose, onComment, onStart, onSubmit, onApprove, onChanges, onBlock }: { task: Task; isAdmin: boolean; currentUser: Profile; comments: Comment[]; onClose: () => void; onComment: (taskId: string, body: string) => Promise<void>; onStart: () => void; onSubmit: () => void; onApprove: () => void; onChanges: () => void; onBlock: () => void }) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const submitComment = async () => { if (!body.trim()) return; setBusy(true); await onComment(task.id, body); setBody(''); setBusy(false); };
  return <div className="fixed inset-0 z-50 bg-black/70 p-5" onClick={onClose}><div className="mx-auto mt-10 max-h-[85vh] w-full max-w-2xl overflow-auto border border-[#F7F5F0]/10 bg-[#171717] p-6 md:p-8" onClick={(e) => e.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-[#F14A0B]">{labelForStatic(task.status)}</p><h2 className="mt-2 text-3xl font-bold">{task.title}</h2></div><button onClick={onClose}><X size={18}/></button></div><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#F7F5F0]/60">{task.description || 'No description.'}</p><div className="mt-5 flex flex-wrap gap-2 text-xs text-[#F7F5F0]/55"><span className="rounded-full border border-[#F7F5F0]/10 px-3 py-2">Priority: {task.priority}</span><span className="rounded-full border border-[#F7F5F0]/10 px-3 py-2">Status: {labelForStatic(task.status)}</span>{task.due_at && <span className="rounded-full border border-[#F7F5F0]/10 px-3 py-2">Due: {new Date(task.due_at).toLocaleString('en-GB')}</span>}</div><div className="mt-6 flex flex-wrap gap-2">{!isAdmin && task.status === 'todo' && <button onClick={onStart} className="rounded-full bg-[#F14A0B] px-4 py-2 text-sm font-semibold text-[#111111]">Start</button>}{!isAdmin && task.status === 'in_progress' && <button onClick={onSubmit} className="rounded-full bg-[#F14A0B] px-4 py-2 text-sm font-semibold text-[#111111]">Submit for review</button>}{isAdmin && task.status === 'review' && <><button onClick={onApprove} className="inline-flex items-center gap-2 rounded-full bg-[#F14A0B] px-4 py-2 text-sm font-semibold text-[#111111]"><Check size={15}/> Approve</button><button onClick={onChanges} className="rounded-full border border-[#F7F5F0]/15 px-4 py-2 text-sm">Request changes</button></>}{(isAdmin || task.status === 'in_progress') && <button onClick={onBlock} className="rounded-full border border-red-300/20 px-4 py-2 text-sm text-red-100">Block</button>}</div><div className="mt-8 border-t border-[#F7F5F0]/10 pt-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F7F5F0]/40">Comments</p><div className="mt-4 space-y-3">{comments.map((comment) => <div key={comment.id} className="border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-4"><p className="text-sm text-[#F7F5F0]/75">{comment.body}</p><time className="mt-2 block text-[10px] text-[#F7F5F0]/35">{new Date(comment.created_at).toLocaleString('en-GB')}</time></div>)}</div><div className="mt-4 flex gap-2"><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a comment..." className="min-h-24 flex-1 border border-[#F7F5F0]/10 bg-transparent p-3 text-sm outline-none"/><button disabled={busy} onClick={() => void submitComment()} className="self-end rounded-full bg-[#F7F5F0] px-4 py-2 text-sm font-semibold text-[#111111]">Send</button></div></div><div className="mt-6 text-xs text-[#F7F5F0]/30">Signed in as {currentUser.name || currentUser.email}</div></div></div>;
}

function labelForStatic(status: Status) { return columns.find((c) => c.id === status)?.label || status; }
