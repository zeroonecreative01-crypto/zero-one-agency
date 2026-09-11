import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, Briefcase, CreditCard, MessageCircle, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminDashboardStats() {
  const [stats, setStats] = useState({ leads: 0, unreadSupport: 0, portfolio: 0, pricing: 0, content: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = supabase;
    if (!client) { setLoading(false); return; }
    let active = true;
    const load = async () => {
      const [leads, support, portfolio, pricing, content] = await Promise.all([
        client.from('leads').select('id', { count: 'exact', head: true }),
        client.from('support_messages').select('id', { count: 'exact', head: true }).eq('sender_type', 'client').is('read_at', null),
        client.from('portfolio_projects').select('id', { count: 'exact', head: true }),
        client.from('pricing_packages').select('id', { count: 'exact', head: true }),
        client.from('site_content').select('id', { count: 'exact', head: true }),
      ]);
      if (!active) return;
      setStats({
        leads: leads.count ?? 0,
        unreadSupport: support.count ?? 0,
        portfolio: portfolio.count ?? 0,
        pricing: pricing.count ?? 0,
        content: content.count ?? 0,
      });
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  const cards = [
    { label: 'Leads', value: stats.leads, icon: Users, href: '/admin', tone: 'Incoming opportunities' },
    { label: 'Unread support', value: stats.unreadSupport, icon: MessageCircle, href: '/admin', tone: 'Client messages waiting' },
    { label: 'Portfolio', value: stats.portfolio, icon: Briefcase, href: '/admin', tone: 'Published projects' },
    { label: 'Pricing', value: stats.pricing, icon: CreditCard, href: '/admin', tone: 'Configured packages' },
  ];

  return <section className="mt-10">
    <div className="mb-4 flex items-end justify-between gap-4">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F14A0B]">Live overview</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Control center.</h2></div>
      <div className="hidden items-center gap-2 text-xs text-[#F7F5F0]/35 sm:flex"><Activity size={14} /> Live Supabase data</div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone }) => <div key={label} className="border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.02] p-5 transition hover:border-[#F14A0B]/35"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F7F5F0]/45">{label}</span><Icon size={17} className="text-[#F14A0B]" /></div><div className="mt-5 text-4xl font-bold tracking-tight">{loading ? '—' : value}</div><p className="mt-2 text-xs text-[#F7F5F0]/35">{tone}</p></div>)}
    </div>
    <div className="mt-3 flex flex-col gap-3 border border-[#F7F5F0]/10 bg-[#F7F5F0]/[0.015] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F14A0B]">Site Content</p><p className="mt-1 text-sm text-[#F7F5F0]/55">{loading ? 'Checking CMS status...' : stats.content > 0 ? 'CMS configuration is connected and ready.' : 'CMS is connected; no saved content overrides yet.'}</p></div>
      <a href="/admin/content" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#F7F5F0]/15 px-4 py-2 text-xs font-semibold hover:border-[#F14A0B]/50">Manage content <ArrowUpRight size={13} /></a>
    </div>
  </section>;
}
