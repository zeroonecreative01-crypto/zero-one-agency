import { ArrowRight, Check } from 'lucide-react';

const PROCESS = [
  ['01', 'Discover', 'We clarify the business, audience, positioning and the outcome that actually matters.'],
  ['02', 'Strategize', 'We turn the brief into a focused creative direction, content system and execution plan.'],
  ['03', 'Create', 'We design, write and build with one connected visual and digital language across every touchpoint.'],
  ['04', 'Launch', 'We deliver, measure, learn and refine so the work keeps performing after launch.'],
];

const TESTIMONIALS = [
  ['“They brought clarity to the brand and made every touchpoint feel like the same company.”', 'Brand Partner'],
  ['“Fast, sharp and seriously consistent. The creative direction elevated the whole launch.”', 'Marketing Lead'],
  ['“The difference was strategy first, not just beautiful design.”', 'Founder'],
];

export default function ConversionSections() {
  if (window.location.pathname !== '/') return null;
  return <>
    <section className="zo-process" aria-label="Our process"><div className="zo-process__inner"><div className="zo-kicker"><span /> THE PROCESS</div><div className="zo-process__intro"><h2>From brief<br /><em>to impact.</em></h2><p>One connected process. Clear decisions, fewer handoffs, and creative that stays aligned with the business from first conversation to final delivery.</p></div><div className="zo-process__grid">{PROCESS.map(([num, title, copy]) => <article className="zo-process__item" key={num}><span className="zo-process__num">{num}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></div></section>
    <section className="zo-testimonials" aria-label="Client testimonials"><div className="zo-testimonials__inner"><div className="zo-kicker"><span /> CLIENT VOICE</div><div className="zo-testimonials__head"><h2>Good work gets<br /><em>remembered.</em></h2><span>Client perspective</span></div><div className="zo-testimonials__grid">{TESTIMONIALS.map(([quote, role]) => <article className="zo-testimonial" key={quote}><div className="zo-testimonial__mark">“</div><p>{quote}</p><div className="zo-testimonial__person"><span>{role}</span><small>ZERO ONE client</small></div></article>)}</div><div className="zo-testimonials__proof"><Check size={15} /> Strategy + Creative + Digital, working as one system.</div></div></section>
    <section className="zo-final-cta" aria-label="Start a project"><div className="zo-final-cta__inner"><div><div className="zo-kicker"><span /> READY WHEN YOU ARE</div><h2>Let's make the<br /><em>next move.</em></h2></div><a href="/contact" className="zo-final-cta__button">Start a project <ArrowRight size={16} /></a></div></section>
  </>;
}
