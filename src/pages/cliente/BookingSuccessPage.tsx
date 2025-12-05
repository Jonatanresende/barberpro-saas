import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Agendamento, Barbearia } from '@/types';

type LocationState = {
  agendamento?: Agendamento;
  barbearia?: Barbearia;
};

const BookingSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};

  const agendamento = state.agendamento;
  const barbearia = state.barbearia;

  useEffect(() => {
    if (!agendamento || !barbearia) {
      navigate('/', { replace: true });
    }
  }, [agendamento, barbearia, navigate]);

  if (!agendamento || !barbearia) return null;

  // Usamos o formato YYYY-MM-DDTHH:MM:SS, mas adicionamos 'Z' (UTC) para garantir que o JS
  // não tente adivinhar o fuso horário, e depois ajustamos a exibição.
  // No entanto, para evitar problemas de fuso horário que mudam o dia, vamos criar a data
  // manualmente a partir dos componentes.
  
  const [year, month, day] = agendamento.data.split('-').map(Number);
  const [hour, minute] = agendamento.hora.split(':').map(Number);

  // Cria a data usando o construtor de data local (sem conversão de fuso horário)
  const bookingDate = new Date(year, month - 1, day, hour, minute);
  
  const formattedDate = bookingDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const formattedTime = bookingDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const backToProfilePath = `/${barbearia.link_personalizado || ''}`;

  return (
    <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-brand-gray rounded-2xl border border-gray-700 p-8 text-center shadow-2xl">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-brand-gold mb-2">Agendamento Confirmado!</h1>
        <p className="text-gray-300 mb-8">
          Seu horário com <span className="font-semibold">{agendamento.barbeiro_nome}</span> na{' '}
          <span className="font-semibold">{barbearia.nome}</span> está reservado.
        </p>

        <div className="bg-brand-dark/60 rounded-xl border border-gray-700 p-6 text-left space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm uppercase text-gray-400">Data</p>
              <p className="text-lg font-semibold capitalize">{formattedDate}</p>
            </div>
            <div>
              <p className="text-sm uppercase text-gray-400">Horário</p>
              <p className="text-lg font-semibold">{formattedTime}</p>
            </div>
          </div>
          <div>
            <p className="text-sm uppercase text-gray-400">Endereço</p>
            <p className="text-lg font-semibold">{barbearia.endereco}</p>
          </div>
          {barbearia.telefone && (
            <div>
              <p className="text-sm uppercase text-gray-400">Contato</p>
              <p className="text-lg font-semibold">{barbearia.telefone}</p>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full px-6 py-3 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-700 transition"
          >
            Fazer outro agendamento
          </button>
          <Link
            to={backToProfilePath}
            className="w-full px-6 py-3 rounded-lg bg-brand-gold text-brand-dark font-bold hover:bg-yellow-400 transition text-center"
          >
            Ver página da barbearia
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;