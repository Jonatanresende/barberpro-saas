import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Agendamento, AppointmentStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const BarbeiroPage = () => {
    const { user } = useAuth();
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAgendamentos = useCallback(async () => {
        if (user?.barbeiroId) {
            setLoading(true);
            try {
                const data = await api.getAgendamentosByBarbeiro(user.barbeiroId);
                setAgendamentos(data);
            } catch (error) {
                toast.error("Falha ao carregar agendamentos.");
            } finally {
                setLoading(false);
            }
        } else if (user && !user.barbeiroId) {
            // Handle case where user is logged in but barbeiroId is not yet available
            setLoading(true);
        }
    }, [user]);

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos]);

    const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
        const promise = api.updateAgendamento(id, { status });
        toast.promise(promise, {
            loading: 'Atualizando status...',
            success: () => {
                fetchAgendamentos();
                return 'Status atualizado com sucesso!';
            },
            error: (err) => `Falha ao atualizar: ${err.message}`,
        });
    };

    const getStatusClass = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.CONFIRMADO: return 'bg-blue-500/20 text-blue-400';
            case AppointmentStatus.CONCLUIDO: return 'bg-green-500/20 text-green-400';
            case AppointmentStatus.CANCELADO: return 'bg-red-500/20 text-red-400';
            case AppointmentStatus.PENDENTE:
            default: return 'bg-yellow-500/20 text-yellow-400';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-brand-gold text-xl">Carregando agendamentos...</div>
            </div>
        );
    }
    
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
                        {agendamentos.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-400">Nenhum agendamento encontrado.</td>
                            </tr>
                        ) : (
                            agendamentos.map(ag => (
                                <tr key={ag.id} className="border-b border-brand-gray hover:bg-brand-gray">
                                    <td className="px-6 py-4 font-medium text-white">{ag.cliente_nome}</td>
                                    <td className="px-6 py-4">{ag.servico_nome}</td>
                                    <td className="px-6 py-4">{new Date(ag.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} - {ag.hora}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(ag.status)}`}>
                                            {ag.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex items-center space-x-4">
                                        {ag.status === AppointmentStatus.CONFIRMADO && (
                                            <button onClick={() => handleUpdateStatus(ag.id, AppointmentStatus.CONCLUIDO)} className="text-green-400 hover:text-green-300 text-xs font-semibold">Finalizar</button>
                                        )}
                                        {(ag.status === AppointmentStatus.PENDENTE || ag.status === AppointmentStatus.CONFIRMADO) && (
                                            <>
                                                <button onClick={() => handleUpdateStatus(ag.id, AppointmentStatus.CANCELADO)} className="text-yellow-400 hover:text-yellow-300 text-xs font-semibold">Cliente Faltou</button>
                                                <button onClick={() => handleUpdateStatus(ag.id, AppointmentStatus.CANCELADO)} className="text-red-400 hover:text-red-300 text-xs font-semibold">Cancelar</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};