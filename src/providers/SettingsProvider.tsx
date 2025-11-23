import React, { useState, ReactNode, useEffect, useCallback } from 'react';
import { SettingsContext, SystemSettings } from '@/context/SettingsContext';
import { api } from '@/services/api';

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
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
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};