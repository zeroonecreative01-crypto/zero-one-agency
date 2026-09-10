import React from 'react';
import { Settings2, ShieldCheck } from 'lucide-react';

export default function AdminAccessButton() {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2">
      <button
        type="button"
        onClick={() => { window.location.href = '/admin/content'; }}
        aria-label="Open site content manager"
        title="Site Content"
        className="flex h-11 items-center gap-2 rounded-full border border-[#F7F5F0]/15 bg-[#111111]/90 px-4 text-xs font-semibold text-[#F7F5F0]/70 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-[#F14A0B] hover:bg-[#F14A0B] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F14A0B]"
      >
        <Settings2 className="h-4 w-4" strokeWidth={1.8} />
        <span>Site Content</span>
      </button>
      <button
        type="button"
        onClick={() => { window.location.href = '/admin'; }}
        aria-label="Open admin login"
        title="Admin"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#F7F5F0]/15 bg-[#111111]/90 text-[#F7F5F0]/55 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-[#F14A0B] hover:bg-[#F14A0B] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F14A0B]"
      >
        <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}
