import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import SiteContentPanel from './SiteContentPanel';
import ClientLogosPanel from './ClientLogosPanel';

export default function AdminContentRoute() {
  const { user, loading, configured } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#111111] text-[#F7F5F0] grid place-items-center">Checking session...</div>;
  if (!configured || !user || user.app_metadata?.role !== 'admin') return <div className="min-h-screen bg-[#111111] text-[#F7F5F0] grid place-items-center px-6"><div className="max-w-lg border border-[#F7F5F0]/10 p-8"><h1 className="text-3xl font-bold">Admin access required.</h1><p className="mt-3 text-sm text-[#F7F5F0]/50">Sign in through the main admin area first.</p><a href="/admin" className="mt-6 inline-flex rounded-full bg-[#F14A0B] px-5 py-3 font-semibold text-[#111111]">Open Admin</a></div></div>;
  return <div className="min-h-screen bg-[#111111] text-[#F7F5F0] px-6 py-8 md:px-12 lg:px-16"><div className="mx-auto max-w-7xl"><div className="flex items-center justify-between border-b border-[#F7F5F0]/10 pb-6"><div><p className="text-[#F14A0B] text-xs font-bold uppercase tracking-[0.2em]">ZERO ONE / Admin</p><h1 className="mt-2 text-5xl md:text-7xl font-bold tracking-tighter">Site Content.</h1></div><a href="/admin" className="inline-flex items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-4 py-2.5 text-sm font-semibold hover:border-[#F14A0B]/50"><ArrowLeft size={15}/> Back to Admin</a></div><SiteContentPanel /><ClientLogosPanel /></div></div>;
}
