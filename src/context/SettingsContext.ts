import { createContext } from 'react';

export interface SystemSettings {
  system_name: string;
  logo_url: string;
  support_email: string;
  contact_email?: string;
  tos_link?: string;
}

export interface SettingsContextType {
  settings: SystemSettings | null;
  loading: boolean;
  updateSettings: (updates: Partial<SystemSettings>, logoFile?: File) => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);