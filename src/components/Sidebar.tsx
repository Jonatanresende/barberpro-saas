import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserRole } from '@/types';
import { StoreIcon, ScissorsIcon, UsersIcon, SettingsIcon, CalendarIcon, ClipboardListIcon, ActivityIcon } from '@/components/icons';
import { useSettings } from '@/context/SettingsContext';
import logo from '../assets/logo-Barbeironahora.png';

interface SidebarProps {
  role: UserRole;
  slug?: string;
  isSidebarOpen: boolean;
}

const commonLinkClasses = "flex items-center px-4 py-3 text-gray-300 hover:bg-brand-gray hover:text-white rounded-lg transition-colors";
const activeLinkClasses = "bg-brand-gold text-brand-dark";

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : ''}`}
  >
    {icon}
    <span className="ml-3 font-medium">{label}</span>
  </NavLink>
);

const getNavItems = (role: UserRole, slug?: string) => {
  switch (role) {
    case UserRole.ADMIN:
      return [
        { to: "/admin/dashboard", icon: <UsersIcon className="w-5 h-5" />, label: "Dashboard" },
        { to: "/admin/barbershops", icon: <StoreIcon className="w-5 h-5" />, label: "Barbearias" },
        { to: "/admin/plans", icon: <ClipboardListIcon className="w-5 h-5" />, label: "Planos" },
        { to: "/admin/settings", icon: <SettingsIcon className="w-5 h-5" />, label: "Configurações" },
      ];
    case UserRole.BARBEARIA:
      if (!slug) return [];
      return [
        { to: `/${slug}/dashboard`, icon: <ActivityIcon className="w-5 h-5" />, label: "Dashboard" },
        { to: `/${slug}/appointments`, icon: <CalendarIcon className="w-5 h-5" />, label: "Agendamentos" },
        { to: `/${slug}/barbers`, icon: <ScissorsIcon className="w-5 h-5" />, label: "Barbeiros" },
        { to: `/${slug}/services`, icon: <ClipboardListIcon className="w-5 h-5" />, label: "Serviços" },
        { to: `/${slug}/settings`, icon: <SettingsIcon className="w-5 h-5" />, label: "Configurações" },
      ];
    case UserRole.BARBEIRO:
      return [
        { to: "/barbeiro/dashboard", icon: <CalendarIcon className="w-5 h-5" />, label: "Meus Agendamentos" },
      ];
    default:
      return [];
  }
};

const Sidebar = ({ role, slug, isSidebarOpen }: SidebarProps) => {
  const navItems = getNavItems(role, slug);
  const { settings } = useSettings();

  return (
    <aside className={`bg-brand-dark text-white fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-30 w-64 border-r border-brand-gray flex flex-col`}>
      <div className="flex items-center justify-center border-b border-brand-gray px-4 py-6">
        <img src={logo} alt="Logo Barbeiro na Hora" className="w-40 h-auto" />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(item => <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />)}
      </nav>
    </aside>
  );
};

export default Sidebar;