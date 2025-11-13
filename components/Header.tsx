import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogoutIcon, MenuIcon } from './icons';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

const Header = ({ title, onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuth();

  // Display the first two names if available, otherwise fall back to the email
  const displayName = user?.full_name
    ? user.full_name.split(' ').slice(0, 2).join(' ')
    : user?.email;

  return (
    <header className="bg-brand-dark border-b border-brand-gray sticky top-0 z-20">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
             <button
              onClick={onMenuClick}
              className="text-gray-400 hover:text-white md:hidden mr-4"
              aria-label="Open sidebar"
            >
              <MenuIcon />
            </button>
            <h1 className="text-xl font-semibold text-white">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300 hidden sm:block">{displayName}</span>
            <button
              onClick={logout}
              className="flex items-center text-sm text-gray-300 hover:text-brand-gold transition-colors"
            >
              <LogoutIcon className="w-5 h-5 mr-1" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;