
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import { UserRole } from '../types';

interface DashboardLayoutProps {
  title: string;
}

const DashboardLayout = ({ title }: DashboardLayoutProps) => {
  const { user } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <div>Carregando...</div>; // Or redirect
  }

  return (
    <div className="flex h-screen bg-brand-dark text-brand-light">
      <Sidebar role={user.role as UserRole} isSidebarOpen={isSidebarOpen} />
       {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-50 z-20 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-gray p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
