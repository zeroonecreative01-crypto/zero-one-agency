import React, { useEffect } from 'react';

const BRAND = 'ZERO ONE';
const LAST_UPDATED = 'September 11, 2026';
const WHATSAPP = 'https://wa.me/201556764804';

const SEO = ({ title, description }: { title: string; description: string }) => {
  useEffect(() => {
    document.title = `${title} | ${BRAND}`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, [title, description]);
  return null;
};

const LegalLayout = ({ title, eyebrow, intro, children, navigate }: { title: string; eyebrow: string; intro: string; children: React.ReactNode; navigate: (path: string) => void }) => (
  <div className="w-full min-h-screen bg-[#111111] text-[#F7F5F0] pt-36 pb-24 px-6 md:px-12 lg:px-24">
    <SEO title={title} description={intro} />
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigate('/')} className="text-xs font-bold uppercase tracking-[0.2em] text-[#F14A0B] hover:text-[#F7F5F0] transition-colors mb-14">ZERO ONE / Back to Home</button>
      <header className="border-b border-[#F7F5F0]/10 pb-14 mb-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F7F5F0]/45 mb-6">{eyebrow}</p>
        <h1 className="text-5xl md:text-7xl lg:text-[7rem] font-bold tracking-tighter leading-[0.9] uppercase">{title}.</h1>
        <p className="mt-8 max-w-3xl text-lg md:text-xl leading-relaxed text-[#F7F5F0]/65 font-light">{intro}</p>
        <p className="mt-6 text-xs uppercase tracking-[0.16em] text-[#F7F5F0]/35">Last updated: {LAST_UPDATED}</p>
      </header>
      <article className="max-w-4xl space-y-12 text-[#F7F5F0]/72 text-base md:text-lg leading-relaxed font-light">{children}</article>
      <div className="mt-20 pt-8 border-t border-[#F7F5F0]/10 flex flex-col md:flex-row gap-5 justify-between text-sm text-[#F7F5F0]/45">
        <button onClick={() => navigate('/')} className="text-left hover:text-[#F7F5F0] transition-colors">Home</button>
        <button onClick={() => navigate('/contact')} className="text-left hover:text-[#F14A0B] transition-colors">Contact ZERO ONE</button>
      </div>
    </div>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#F7F5F0] mb-4">{title}</h2>
    <div className="space-y-4">{children}</div>
  </section>
);

export const PrivacyPolicy = ({ navigate }: { navigate: (path: string) => void }) => (
  <LegalLayout title="Privacy Policy" eyebrow="Legal / Privacy" intro="This Privacy Policy explains how ZERO ONE collects, uses, stores, and protects information when you visit our website or contact us about our creative services." navigate={navigate}>
    <Section title="1. Information We Collect">
      <p>When you contact ZERO ONE, request a proposal, or submit an inquiry through our website, we may collect information such as your name, email address, phone number, company name, selected service, budget information, and the details you choose to include in your message.</p>
      <p>We may also receive basic technical information that your browser or hosting environment makes available when you use the website, such as device, browser, and connection information. We use this information only as reasonably necessary to operate, secure, and improve the website.</p>
    </Section>
    <Section title="2. How We Use Information">
      <p>We use submitted information to respond to inquiries, understand project requirements, communicate about potential or active work, provide requested services, maintain business records, prevent misuse, and operate the website.</p>
      <p>We do not use your inquiry information to send unrelated marketing communications unless you have separately asked to receive them or applicable law permits it.</p>
    </Section>
    <Section title="3. How Information Is Shared">
      <p>We may share information with trusted service providers that help us host, secure, maintain, or operate the website and manage business inquiries. These providers receive only the information reasonably needed for their role and are expected to handle it appropriately.</p>
      <p>We may also disclose information when required by law, legal process, or a legitimate request from a competent authority, or when necessary to protect our rights, users, or the security of our services.</p>
    </Section>
    <Section title="4. WhatsApp and External Services">
      <p>Our contact experience may direct you to WhatsApp to continue a conversation with ZERO ONE. WhatsApp is operated by a separate company and its own privacy terms apply to information processed on that service. We recommend reviewing the policies of any third-party service before using it.</p>
    </Section>
    <Section title="5. Data Retention and Security">
      <p>We retain business inquiry information for as long as reasonably necessary to respond to requests, manage client relationships, maintain records, resolve disputes, and meet legal or operational requirements.</p>
      <p>We use reasonable administrative and technical safeguards to protect information. No internet transmission or storage system can be guaranteed to be completely secure.</p>
    </Section>
    <Section title="6. Your Choices and Rights">
      <p>Depending on where you live, you may have rights to request access to, correction of, deletion of, or information about the processing of your personal data. You may also have the right to object to or restrict certain processing.</p>
      <p>To make a privacy-related request, contact us through <a href={WHATSAPP} target="_blank" rel="noreferrer" className="text-[#F14A0B] hover:text-[#F7F5F0] transition-colors">WhatsApp</a> or the contact page. We may need to verify your request before acting on it.</p>
    </Section>
    <Section title="7. Cookies and Similar Technologies">
      <p>ZERO ONE may use cookies or similar technologies that are necessary for the website to function correctly. If additional analytics or advertising technologies are introduced in the future, this policy may be updated to describe them and their purposes.</p>
    </Section>
    <Section title="8. Children’s Privacy">
      <p>Our website and services are intended for businesses and general audiences and are not directed to children. We do not knowingly request personal information from children.</p>
    </Section>
    <Section title="9. Policy Updates">
      <p>We may update this Privacy Policy when our services, technology, or legal obligations change. The updated version will be posted on this page with a revised “Last updated” date.</p>
    </Section>
    <Section title="10. Contact">
      <p>If you have questions about this Privacy Policy or how ZERO ONE handles information, please contact us through our <button onClick={() => navigate('/contact')} className="text-[#F14A0B] hover:text-[#F7F5F0] transition-colors">Contact page</button>.</p>
    </Section>
  </LegalLayout>
);

export const TermsOfService = ({ navigate }: { navigate: (path: string) => void }) => (
  <LegalLayout title="Terms of Service" eyebrow="Legal / Terms" intro="These Terms of Service govern your use of the ZERO ONE website and the relationship between you and ZERO ONE when you engage us for creative, marketing, branding, content, or digital services." navigate={navigate}>
    <Section title="1. Using This Website">
      <p>By accessing or using this website, you agree to use it lawfully and responsibly. You must not attempt to interfere with the website, bypass security controls, introduce malicious code, scrape protected areas, or use the website in a way that could harm ZERO ONE or other users.</p>
    </Section>
    <Section title="2. Our Services">
      <p>ZERO ONE provides creative and marketing services that may include brand identity, digital platforms, campaign and content work, creative strategy, design, and related services. The exact scope, deliverables, timeline, fees, revisions, ownership terms, and responsibilities for a project are determined by the applicable proposal, quotation, statement of work, or written agreement.</p>
      <p>Website descriptions and examples of services are for general information and do not constitute a binding promise to provide any specific deliverable until agreed in writing.</p>
    </Section>
    <Section title="3. Proposals, Fees, and Payment">
      <p>Where a project requires a proposal or quotation, work begins only after the required approvals, deposits, or other conditions stated in the applicable agreement have been completed.</p>
      <p>Unless a written agreement states otherwise, third-party costs, production expenses, media spend, paid software, stock assets, hosting, domains, printing, photography, talent, and similar external costs are not automatically included in creative service fees.</p>
    </Section>
    <Section title="4. Client Responsibilities">
      <p>Clients are responsible for providing accurate information, timely feedback, approvals, required materials, access, and decisions needed to keep a project moving. Delays in receiving required inputs or approvals may affect timelines and delivery dates.</p>
    </Section>
    <Section title="5. Intellectual Property">
      <p>Unless a written project agreement states otherwise, ZERO ONE retains ownership of its pre-existing materials, methods, concepts not selected by the client, internal tools, templates, know-how, and reusable production techniques.</p>
      <p>Ownership or licensing of final project deliverables transfers only to the extent and at the time specified in the applicable written agreement. Third-party assets remain subject to their own licenses and restrictions.</p>
    </Section>
    <Section title="6. Portfolio and Case Studies">
      <p>Unless the applicable agreement requires confidentiality, ZERO ONE may display completed work in its portfolio, website, presentations, and professional channels for self-promotional purposes. We will respect any confidentiality or launch restrictions agreed in writing with the client.</p>
    </Section>
    <Section title="7. Third-Party Links and Services">
      <p>The website may contain links to third-party websites or services, including social platforms and communication tools. ZERO ONE does not control those services and is not responsible for their availability, content, security, or policies.</p>
    </Section>
    <Section title="8. Website Content and Availability">
      <p>We aim to keep the website accurate and available, but we do not guarantee that every page, feature, image, or piece of information will always be complete, current, or uninterrupted. Website content may change without notice.</p>
    </Section>
    <Section title="9. Disclaimers and Limitation of Liability">
      <p>To the maximum extent permitted by applicable law, the website and its general informational content are provided on an “as available” basis. ZERO ONE is not liable for indirect, incidental, special, consequential, or loss-of-profit damages arising from use of the website, except where such limitation is not permitted by law.</p>
      <p>Nothing in these terms excludes or limits liability that cannot lawfully be excluded or limited.</p>
    </Section>
    <Section title="10. Confidentiality">
      <p>Project-specific confidentiality obligations are governed by the applicable written agreement or non-disclosure agreement. Please do not submit highly sensitive information through public website forms unless it is necessary for your inquiry.</p>
    </Section>
    <Section title="11. Termination">
      <p>Either party may end a project or engagement according to the termination provisions in the applicable written agreement. Ending an engagement does not remove obligations that are intended to survive termination, including payment obligations, confidentiality, and intellectual-property provisions.</p>
    </Section>
    <Section title="12. Changes to These Terms">
      <p>We may update these Terms of Service as the website or our services evolve. Continued use of the website after an update means you acknowledge the revised terms for website use. Existing client projects remain governed by their applicable written agreements.</p>
    </Section>
    <Section title="13. Contact">
      <p>Questions about these Terms of Service can be sent through our <button onClick={() => navigate('/contact')} className="text-[#F14A0B] hover:text-[#F7F5F0] transition-colors">Contact page</button>.</p>
    </Section>
  </LegalLayout>
);
