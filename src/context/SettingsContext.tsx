import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

interface SystemSettings {
  system_name: string;
  logo_url: string;
  support_email: string;
  contact_email?: string;
  tos_link?: string;
}

interface SettingsContextType {
  settings: SystemSettings | null;
  loading: boolean;
  updateSettings: (updates: Partial<SystemSettings>, logoFile?: File) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSystemSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch system settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<SystemSettings>, logoFile?: File) => {
    try {
      const updatedSettings = await api.updateSystemSettings(updates, logoFile);
      setSettings(updatedSettings);
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw error; // Re-throw to be caught by the calling component for toast notifications
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsProvider;