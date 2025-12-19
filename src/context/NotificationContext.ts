import { createContext } from 'react';

export interface NotificationContextType {
  newAppointmentCount: number;
  incrementAppointmentCount: () => void;
  resetAppointmentCount: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);