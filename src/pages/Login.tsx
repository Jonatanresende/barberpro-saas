import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { UserRole } from '@/types';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import defaultLogo from '@/assets/logo-Barbeironahora.png';

const Login = () => {
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      let redirectPath = '/';
      switch (user.role) {
        case UserRole.ADMIN:
          redirectPath = '/admin/dashboard';
          break;
        case UserRole.BARBEARIA:
          redirectPath = `/${user.link_personalizado}/dashboard`;
          break;
        case UserRole.BARBEIRO:
          redirectPath = '/barbeiro/appointments';
          break;
        case UserRole.CLIENTE:
          redirectPath = '/';
          break;
      }
      navigate(redirectPath);
    }
  }, [user, navigate]);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-brand-dark">
            <div className="text-brand-gold text-xl">Carregando...</div>
        </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-gray rounded-xl shadow-lg p-8 border border-gray-700">
        <div className="text-center mb-8">
          <img src={settings?.logo_url || defaultLogo} alt="Logo Barbeiro na Hora" className="w-64 h-auto mx-auto mb-4" />
          <p className="text-gray-400 mt-2">Acesse seu painel</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#D4AF37',
                  brandAccent: '#b89a30',
                  defaultButtonBackground: '#111111',
                  defaultButtonBackgroundHover: '#222222',
                  inputText: '#FFFFFF',
                  inputBackground: '#111111',
                  inputBorder: '#4b5563',
                  inputPlaceholder: '#9ca3af',
                },
                radii: {
                  borderRadiusButton: '0.5rem',
                  inputBorderRadius: '0.5rem',
                }
              }
            }
          }}
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Seu e-mail',
                password_label: 'Sua senha',
                email_input_placeholder: 'seu@email.com',
                password_input_placeholder: 'Sua senha',
                button_label: 'Entrar',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Entre',
              },
              sign_up: {
                email_label: 'Seu e-mail',
                password_label: 'Sua senha',
                button_label: 'Cadastrar',
                link_text: 'Não tem uma conta? Cadastre-se',
              },
              forgotten_password: {
                email_label: 'Seu e-mail',
                button_label: 'Enviar instruções',
                link_text: 'Esqueceu sua senha?',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;