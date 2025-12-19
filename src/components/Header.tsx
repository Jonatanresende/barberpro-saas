import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { LogoutIcon, MenuIcon, UserIcon, BellIcon, CalendarIcon } from '@/components/icons';
import { UserRole } from '@/types';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

const Header = ({ title, onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuth();
  const { newAppointmentCount, resetAppointmentCount } = useNotifications();
  const navigate = useNavigate();

  const getDisplayName = () => {
    if (!user) return '';
    if (user.role === UserRole.BARBEARIA) {
      return user.barbeariaNome || user.email;
    }
    if (user.full_name) {
      return user.full_name.split(' ').slice(0, 2).join(' ');
    }
    return user.email;
  };

  const displayName = getDisplayName();

  const handleNotificationClick = () => {
    let path = '';
    if (user?.role === UserRole.BARBEARIA && user.link_personalizado) {
        path = `/${user.link_personalizado}/appointments`;
    } else if (user?.role === UserRole.BARBEIRO) {
        path = '/barbeiro/appointments';
    }
    
    if (path) {
        navigate(path);
        // O reset será feito na página de agendamentos ao carregar
    }
  };

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
            
            {/* Botão de Notificação de Agendamentos */}
            {(user?.role === UserRole.BARBEARIA || user?.role === UserRole.BARBEIRO) && (
                <button
                    onClick={handleNotificationClick}
                    className="relative p-2 rounded-full text-gray-300 hover:text-brand-gold transition-colors"
                    aria-label="Notificações de Agendamento"
                >
                    <BellIcon className="w-6 h-6" />
                    {newAppointmentCount > 0 && (
                        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-brand-dark bg-red-500">
                            <span className="sr-only">{newAppointmentCount} novas notificações</span>
                        </span>
                    )}
                </button>
            )}

            {user?.role === UserRole.BARBEARIA && user.link_personalizado && (
              <Link
                to={`/${user.link_personalizado}/profile`}
                className="flex items-center text-sm text-gray-300 hover:text-brand-gold transition-colors hidden lg:flex"
              >
                <UserIcon className="w-5 h-5 mr-1" />
                Perfil
              </Link>
            )}
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