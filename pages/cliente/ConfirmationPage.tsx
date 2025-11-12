
import React from 'react';
import { Link } from 'react-router-dom';

const ConfirmationPage = () => {
    return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-center p-4">
            <div className="w-full max-w-md bg-brand-gray rounded-xl shadow-lg p-8 border border-gray-700">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Agendamento Confirmado!</h1>
                <p className="text-gray-400 mb-8">Seu horário foi agendado com sucesso. Você receberá os detalhes por e-mail.</p>
                <Link
                    to="/"
                    className="px-6 py-3 bg-brand-gold text-brand-dark font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                >
                    Fazer Novo Agendamento
                </Link>
            </div>
        </div>
    );
};

export default ConfirmationPage;
