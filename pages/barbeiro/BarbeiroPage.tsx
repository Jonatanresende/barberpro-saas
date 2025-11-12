
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Agendamento, AppointmentStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const BarbeiroPage = () => {
    const { user } = useAuth();
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

    useEffect(() => {
        if (user?.barbeiroId) {
            api.getAgendamentosByBarbeiro(user.barbeiroId).then(setAgendamentos);
        }
    }, [user]);

    const getStatusClass = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.CONFIRMADO: return 'bg-blue-500/20 text-blue-400';
            case AppointmentStatus.CONCLUIDO: return 'bg-green-500/20 text-green-400';
            case AppointmentStatus.CANCELADO: return 'bg-red-500/20 text-red-400';
            case AppointmentStatus.PENDENTE:
            default: return 'bg-yellow-500/20 text-yellow-400';
        }
    };
    
    return (
        <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
            <h2 className="text-xl font-semibold mb-4 text-white">Meus Agendamentos</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-brand-gray text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Cliente</th>
                            <th className="px-6 py-3">Serviço</th>
                            <th className="px-6 py-3">Data & Hora</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agendamentos.map(ag => (
                            <tr key={ag.id} className="border-b border-brand-gray hover:bg-brand-gray">
                                <td className="px-6 py-4 font-medium text-white">{ag.cliente_nome}</td>
                                <td className="px-6 py-4">{ag.servico_nome}</td>
                                <td className="px-6 py-4">{new Date(ag.data).toLocaleDateString()} - {ag.hora}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(ag.status)}`}>
                                        {ag.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex space-x-2">
                                    {ag.status === AppointmentStatus.CONFIRMADO && (
                                        <button className="text-green-400 hover:text-green-300 text-xs">Corte Realizado</button>
                                    )}
                                    {ag.status !== AppointmentStatus.CONCLUIDO && ag.status !== AppointmentStatus.CANCELADO && (
                                        <button className="text-red-400 hover:text-red-300 text-xs">Cancelar</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
