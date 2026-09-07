import { supabase } from './supabase';

export type LeadInput = {
  name: string;
  email: string;
  company?: string;
  service?: string;
  message: string;
};

export const createLead = async (lead: LeadInput) => {
  if (!supabase) {
    return { error: null };
  }

  const { error } = await supabase.from('leads').insert({
    name: lead.name.trim(),
    email: lead.email.trim(),
    company: lead.company?.trim() || null,
    service: lead.service || null,
    message: lead.message.trim(),
  });

  return { error };
};
