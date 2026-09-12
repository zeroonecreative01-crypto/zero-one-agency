import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Clock3, GripVertical, LogOut, MessageSquare, Plus, RotateCcw, Send, UserRound, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import './EmployeeTaskBoard.css';

type TaskStatus = 'client_requests' | 'in_progress' | 'review' | 'completed';
type Priority = 'low' | 'normal' | 'high' | 'urgent';
type Profile = { id: string; name: string; role: 'employee' | 'admin' };
type Task = { id: string; title: string; description: string; assignee_id: string; status: TaskStatus; priority: Priority; due_date: string | null; review_note: string; sort_order: number; updated_at: string };
type Comment = { id: string; task_id: string; author_id: string; body: string; created_at: string };

const COLUMNS: { id: TaskStatus; label: string; sub: string }[] = [
  { id: 'client_requests', label: 'Client Requests', sub: 'New work to pick up' },
  { id: 'in_progress', label: 'In Progress', sub: 'Currently being worked on' },
  { id: 'review', label: 'Review', sub: 'Waiting for approval' },
  { id: 'completed', label: 'Completed', sub: 'Approved work' },
];
const PRIORITIES: Priority[] = ['low', 'normal', 'high', 'urgent'];

export default function EmployeeTaskBoard() {
  const { user, loading, configured, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [dragTask, setDragTask] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const isAdmin = profile?.role === 'admin' || user?.app_metadata?.role === 'admin';

  const loadBoard = async (activeUser: User) => {
    if (!supabase) return;
    setLoadingBoard(true);
    const profileResult = await supabase.from('employee_profiles').select('id,name,role').eq('id', activeUser.id).maybeSingle();
    const currentProfile = profileResult.data as Profile | null;
    setProfile(currentProfile ?? { id: activeUser.id, name: activeUser.email?.split('@')[0] ?? 'Employee', role: activeUser.app_metadata?.role === 'admin' ? 'admin' : 'employee' });
    const admin = currentProfile?.role === 'admin' || activeUser.app_metadata?.role === 'admin';
    if (admin) {
      const [{ data: people }, { data: allTasks }, { data: allComments }] = await Promise.all([
        supabase.from('employee_profiles').select('id,name,role').eq('role', 'employee').order('name'),
        supabase.from('employee_tasks').select('*').order('sort_order').order('created_at'),
        supabase.from('employee_task_comments').select('*').order('created_at'),
      ]);
      setProfiles((people ?? []) as Profile[]);
      setTasks((allTasks ?? []) as Task[]);
      setComments((allComments ?? []) as Comment[]);
    } else {
      const [{ data: ownTasks }, { data: ownComments }] = await Promise.all([
        supabase.from('employee_tasks').select('*').eq('assignee_id', activeUser.id).order('sort_order').order('created_at'),
        supabase.from('employee_task_comments').select('*').order('created_at'),
      ]);
      setProfiles([]);
      setTasks((ownTasks ?? []) as Task[]);
      setComments((ownComments ?? []) as Comment[]);
    }
    setLoadingBoard(false);
  };

  useEffect(() => { if (user) void loadBoard(user); else { setProfile(null); setTasks([]); setComments([]); } }, [user]);

  const visibleTasks = useMemo(() => filter === 'mine' && isAdmin && user ? tasks.filter((task) => task.assignee_id === user.id) : tasks, [filter, isAdmin, tasks, user]);
  const selectedComments = selectedTask ? comments.filter((comment) => comment.task_id === selectedTask.id) : [];

  if (loading) return <BoardShell><div className="employee-board__loading">Checking session...</div></BoardShell>;
  if (!configured) return <BoardShell><div className="employee-board__empty"><span>SETUP REQUIRED</span><h1>Supabase is not configured.</h1><p>Add the production Supabase environment variables before using the employee board.</p></div></BoardShell>;
  if (!user) return <BoardShell><form className="employee-login" onSubmit={async (event) => { event.preventDefault(); setSubmitting(true); setLoginError(''); const result = await signIn(email.trim(), password); setSubmitting(false); if (result.error) setLoginError(result.error.message); }}><div className="employee-login__mark">ZERO ONE / TEAM</div><h1>Team Board.</h1><p>Sign in with your employee account to see your assigned work.</p>{loginError && <div className="employee-login__error">{loginError}</div>}<label>Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in to the board'}</button><a href="/admin">Admin sign in</a></form></BoardShell>;

  const moveTask = async (taskId: string, status: TaskStatus) => {
    if (!supabase) return;
    const previous = tasks;
    setTasks((items) => items.map((task) => task.id === taskId ? { ...task, status } : task));
    const { error } = await supabase.from('employee_tasks').update({ status }).eq('id', taskId);
    if (error) setTasks(previous);
  };

  const createTask = async (payload: { title: string; description: string; assignee_id: string; priority: Priority; due_date: string }) => {
    if (!supabase || !payload.title.trim()) return;
    const { data, error } = await supabase.from('employee_tasks').insert({ ...payload, status: 'client_requests', sort_order: Date.now() }).select('*').single();
    if (!error && data) { setTasks((items) => [...items, data as Task]); setShowCreate(false); }
  };

  const addComment = async () => {
    if (!supabase || !user || !selectedTask || !commentText.trim()) return;
    const { data, error } = await supabase.from('employee_task_comments').insert({ task_id: selectedTask.id, author_id: user.id, body: commentText.trim() }).select('*').single();
    if (!error && data) { setComments((items) => [...items, data as Comment]); setCommentText(''); }
  };

  const reviewAction = async (task: Task, approved: boolean) => {
    if (!isAdmin || !supabase) return;
    const review_note = approved ? 'Approved by admin.' : 'Sent back for changes.';
    await supabase.from('employee_tasks').update({ status: approved ? 'completed' : 'in_progress', review_note }).eq('id', task.id);
    setTasks((items) => items.map((item) => item.id === task.id ? { ...item, status: approved ? 'completed' : 'in_progress', review_note } : item));
    setSelectedTask((item) => item?.id === task.id ? { ...item, status: approved ? 'completed' : 'in_progress', review_note } : item);
  };

  const handleDrop = (status: TaskStatus) => { if (dragTask) { void moveTask(dragTask, status); setDragTask(null); } };

  return <BoardShell>
    <header className="employee-board__header">
      <div><div className="employee-board__eyebrow">ZERO ONE / TEAM WORKSPACE</div><h1>Task Board.</h1><p>{isAdmin ? 'Create, assign, review and approve the team\'s work.' : `Welcome, ${profile?.name || user.email}. Your assigned work lives here.`}</p></div>
      <div className="employee-board__actions"><span className="employee-board__user"><UserRound size={15} /> {profile?.name || user.email}</span>{isAdmin && <button onClick={() => setShowCreate(true)} className="employee-board__primary"><Plus size={16} /> New Task</button>}<button onClick={() => void signOut()} className="employee-board__ghost"><LogOut size={15} /> Sign out</button></div>
    </header>
    <div className="employee-board__toolbar"><div className="employee-board__legend"><span><i className="dot dot--orange" /> {tasks.length} tasks</span><span><i className="dot dot--green" /> {tasks.filter((task) => task.status === 'review').length} in review</span></div>{isAdmin && <div className="employee-board__filter"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All team</button><button className={filter === 'mine' ? 'active' : ''} onClick={() => setFilter('mine')}>My tasks</button></div>}</div>
    {loadingBoard ? <div className="employee-board__loading">Loading board...</div> : <div className="employee-board__scroll"><div className="employee-board__columns">{COLUMNS.map((column) => { const columnTasks = visibleTasks.filter((task) => task.status === column.id); return <section key={column.id} className="employee-column" onDragOver={(event) => event.preventDefault()} onDrop={() => handleDrop(column.id)}><div className="employee-column__head"><div><h2>{column.label}</h2><p>{column.sub}</p></div><span>{columnTasks.length}</span></div><div className="employee-column__cards">{columnTasks.map((task) => <article key={task.id} draggable onDragStart={() => setDragTask(task.id)} onDragEnd={() => setDragTask(null)} onClick={() => setSelectedTask(task)} className="employee-task"><div className="employee-task__top"><span className={`priority priority--${task.priority}`}>{task.priority}</span><GripVertical size={16} /></div><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}<div className="employee-task__meta">{isAdmin && <span><UserRound size={12} /> {profiles.find((person) => person.id === task.assignee_id)?.name || 'Employee'}</span>}{task.due_date && <span><Clock3 size={12} /> {new Date(`${task.due_date}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>}</div>{task.review_note && task.status !== 'completed' && <div className="employee-task__note">{task.review_note}</div>}</article>)}</div>{isAdmin && column.id === 'client_requests' && <button className="employee-column__add" onClick={() => setShowCreate(true)}><Plus size={16} /> Add task</button>}</section>; })}</div></div>}
    {selectedTask && <div className="employee-modal__backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedTask(null); }}><div className="employee-modal"><button className="employee-modal__close" onClick={() => setSelectedTask(null)}><X size={18} /></button><div className="employee-modal__eyebrow">TASK / {selectedTask.status.replace('_', ' ')}</div><h2>{selectedTask.title}</h2>{selectedTask.description && <p className="employee-modal__description">{selectedTask.description}</p>}<div className="employee-modal__facts"><span>Priority <strong>{selectedTask.priority}</strong></span><span>Status <strong>{COLUMNS.find((column) => column.id === selectedTask.status)?.label}</strong></span>{selectedTask.due_date && <span>Due <strong>{selectedTask.due_date}</strong></span>}</div>{selectedTask.status === 'review' && isAdmin && <div className="employee-modal__review"><button onClick={() => void reviewAction(selectedTask, true)}><Check size={16} /> Approve & complete</button><button onClick={() => void reviewAction(selectedTask, false)}><RotateCcw size={16} /> Send back</button></div>}{!isAdmin && selectedTask.status !== 'completed' && <div className="employee-modal__move"><button onClick={() => void moveTask(selectedTask.id, selectedTask.status === 'client_requests' ? 'in_progress' : 'review')}>{selectedTask.status === 'client_requests' ? <><Send size={16} /> Start task</> : <><Send size={16} /> Send to review</>}</button></div>}<div className="employee-comments"><div className="employee-comments__title"><MessageSquare size={16} /> Comments</div>{selectedComments.length === 0 ? <p className="employee-comments__empty">No comments yet.</p> : selectedComments.map((comment) => <div className="employee-comment" key={comment.id}><div>{comment.body}</div><small>{new Date(comment.created_at).toLocaleString()}</small></div>)}<div className="employee-comment__composer"><textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add a comment..." rows={3} /><button onClick={() => void addComment()}>Comment</button></div></div></div></div>}
    {showCreate && isAdmin && <CreateTaskModal profiles={profiles} onClose={() => setShowCreate(false)} onCreate={createTask} />}
  </BoardShell>;
}

function CreateTaskModal({ profiles, onClose, onCreate }: { profiles: Profile[]; onClose: () => void; onCreate: (payload: { title: string; description: string; assignee_id: string; priority: Priority; due_date: string }) => Promise<void> | void }) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [assignee, setAssignee] = useState(profiles[0]?.id ?? ''); const [priority, setPriority] = useState<Priority>('normal'); const [dueDate, setDueDate] = useState('');
  return <div className="employee-modal__backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><form className="employee-modal employee-create" onSubmit={(event) => { event.preventDefault(); if (assignee) void onCreate({ title, description, assignee_id: assignee, priority, due_date: dueDate }); }}><button type="button" className="employee-modal__close" onClick={onClose}><X size={18} /></button><div className="employee-modal__eyebrow">NEW TASK</div><h2>Create task.</h2><label>Task title<input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Design 3 Instagram posts" /></label><label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Brief, deliverables, links, notes..." /></label><div className="employee-create__grid"><label>Assign to<select value={assignee} onChange={(event) => setAssignee(event.target.value)}>{profiles.length === 0 ? <option value="">No employees yet</option> : profiles.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>{PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></div><button className="employee-create__submit" disabled={!assignee}><Plus size={16} /> Create task</button></form></div>;
}

function BoardShell({ children }: { children: React.ReactNode }) { return <main className="employee-board-page">{children}</main>; }
