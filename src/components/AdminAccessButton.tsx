import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AdminAccessButton() {
  return (
    <button
      type="button"
      onClick={() => { window.location.href = '/admin'; }}
      aria-label="Open admin login"
      title="Admin"
      className="fixed bottom-5 right-5 z-[9999] flex h-11 w-11 items-center justify-center rounded-full border border-[#F7F5F0]/15 bg-[#111111]/90 text-[#F7F5F0]/55 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-[#F14A0B] hover:bg-[#F14A0B] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F14A0B]"
    >
      <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
    </button>
  );
}
