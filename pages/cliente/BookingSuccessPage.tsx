import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BookingSuccessPage = () => {
    const location = useLocation();
    const { agendamento, barbearia } = location.state || {};

    if (!agendamento || !barbearia) {
        return (
            <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-center p-4">
                <div className="w-full max-w-md bg-brand-gray rounded-xl shadow-lg p-8 border border-gray-700">
                    <h1 className="text-2xl font-bold text-white mb-2">Oops!</h1>
                    <p className="text-gray-400 mb-8">Não encontramos os detalhes do seu agendamento. Por favor, tente novamente.</p>
                    <Link
                        to="/"
                        className="px-6 py-3 bg-brand-gold text-brand-dark font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                    >
                        Voltar ao Início
                    </Link>
                </div>
            </div>
        );
    }

    const formattedDate = new Date(`${agendamento.data}T00:00:00`).toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-center p-4">
            <div className="w-full max-w-md bg-brand-gray rounded-xl shadow-lg p-8 border border-gray-700">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Agendamento Confirmado!</h1>
                <p className="text-gray-400 mb-8">Seu horário foi agendado com sucesso. Anote os detalhes:</p>
                
                <div className="text-left space-y-4 bg-brand-dark p-4 rounded-lg mb-8">
                    <p><strong className="text-brand-gold">Serviço:</strong> {agendamento.servico_nome}</p>
                    <p><strong className="text-brand-gold">Barbeiro:</strong> {agendamento.barbeiro_nome}</p>
                    <p><strong className="text-brand-gold">Data:</strong> {formattedDate} às {agendamento.hora}</p>
                    <p><strong className="text-brand-gold">Local:</strong> {barbearia.endereco}</p>
                </div>

                <a
                    href={barbearia.whatsapp_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block mb-4 px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors"
                >
                    Entrar em Contato via WhatsApp
                </a>
                <Link
                    to={`/${barbearia.link_personalizado}`}
                    className="w-full block px-6 py-3 bg-brand-gold text-brand-dark font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                >
                    Voltar para a Barbearia
                </Link>
            </div>
        </div>
    );
};

export default BookingSuccessPage;