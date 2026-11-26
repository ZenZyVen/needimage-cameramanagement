import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, updateSettings as apiUpdateSettings } from '../services/settingsService';

const defaultSettings = {
  companyName: 'Need Image Studio',
  companyTagline: 'Professional Camera Equipment & Stock Vault',
  logoUrl: '/Need-Image_StudioLogo_White.png',
  address: 'Studio Lot 4B, 742 Sunset Boulevard, Media Arts District, CA 90028',
  phone: '+1 (555) 019-2831',
  email: 'operations@cinevault-studios.com',
  website: 'www.cinevault-studios.com',
  brandColor: '#0f172a',
  accentColor: '#2563eb',
  currency: 'USD',
  maxLoanDurationDays: 14,
  requireApproval: true,
  autoOverdueCheck: true,
  allowMultipleItemsPerRequest: true,
  lowStockThreshold: 2,
  autoOutOfStockStatus: true,
  enableStockMovementLogging: true,
  defaultInspectorTitle: 'Lead Vault Inspector',
  requireInspectionSignature: true,
  autoCreateTicketOnDamagedCheckin: true,
  notifyOnBorrowRequest: true,
  notifyOnOverdue: true,
  notifyOnLowStock: true
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await getSettings();
      if (res.data?.success && res.data.data) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {
      console.warn('Could not load system settings from server, using defaults.', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings) => {
    const res = await apiUpdateSettings(newSettings);
    if (res.data?.success) {
      setSettings(prev => ({ ...prev, ...(res.data.data || newSettings) }));
    }
    return res.data;
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    return {
      settings: defaultSettings,
      loading: false,
      refreshSettings: () => {},
      updateSettings: async () => {}
    };
  }
  return context;
};

export default SettingsContext;
