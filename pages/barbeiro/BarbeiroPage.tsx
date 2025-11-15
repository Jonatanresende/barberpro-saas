import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Agendamento, AppointmentStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { DollarSignIcon, XCircleIcon, ClockIcon } from '../../components/icons';

const StatCard = ({ title, value, icon, colorClass }: { title: string, value: string, icon: React.ReactNode, colorClass: string }) => (
    <div className="bg-brand-gray p-4 rounded-lg border border-gray-700 flex items-center">
        <div className={`p-3 rounded-full mr-4 ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    </div>
);

export const BarbeiroPage = () => {
    const { user } = useAuth();
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeFilter, setActiveFilter] = useState<'pending' | 'completed' | 'canceled'>('pending');

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
        }
    }, [user]);

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos]);

    const filteredAppointments = useMemo(() => {
        return agendamentos.filter(ag => {
            if (ag.data !== selectedDate) return false;

            switch (activeFilter) {
                case 'pending':
                    return ag.status === AppointmentStatus.PENDENTE || ag.status === AppointmentStatus.CONFIRMADO;
                case 'completed':
                    return ag.status === AppointmentStatus.CONCLUIDO;
                case 'canceled':
                    return ag.status === AppointmentStatus.CANCELADO;
                default:
                    return true;
            }
        });
    }, [agendamentos, selectedDate, activeFilter]);

    const dailyMetrics = useMemo(() => {
        const appointmentsForDay = agendamentos.filter(ag => ag.data === selectedDate);
        
        return appointmentsForDay.reduce((acc, ag) => {
            const price = ag.servicos?.preco || 0;
            if (ag.status === AppointmentStatus.CONCLUIDO) {
                acc.received += price;
            } else if (ag.status === AppointmentStatus.PENDENTE || ag.status === AppointmentStatus.CONFIRMADO) {
                acc.toReceive += price;
            } else if (ag.status === AppointmentStatus.CANCELADO) {
                acc.canceled += price;
            }
            return acc;
        }, { received: 0, toReceive: 0, canceled: 0 });
    }, [agendamentos, selectedDate]);

    const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
        const promise = api.updateAgendamento(id, { status });
        toast.promise(promise, {
            loading: 'Atualizando status...',
            success: (updatedAgendamento) => {
                setAgendamentos(prev => prev.map(ag => ag.id === id ? updatedAgendamento : ag));
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

    const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Agenda do Dia</h2>
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="bg-brand-gray px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Recebido" value={formatCurrency(dailyMetrics.received)} icon={<DollarSignIcon className="w-5 h-5 text-white"/>} colorClass="bg-green-500" />
                <StatCard title="A Receber" value={formatCurrency(dailyMetrics.toReceive)} icon={<ClockIcon className="w-5 h-5 text-white"/>} colorClass="bg-yellow-500" />
                <StatCard title="Cancelado" value={formatCurrency(dailyMetrics.canceled)} icon={<XCircleIcon className="w-5 h-5 text-white"/>} colorClass="bg-red-500" />
            </div>

            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <div className="flex flex-wrap items-center gap-4 mb-4 border-b border-brand-gray pb-4">
                    <h3 className="text-lg font-semibold text-white">Agendamentos</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setActiveFilter('pending')} className={`px-3 py-1 text-sm rounded-md ${activeFilter === 'pending' ? 'bg-brand-gold text-brand-dark font-bold' : 'bg-brand-gray text-white'}`}>Pendentes/Confirmados</button>
                        <button onClick={() => setActiveFilter('completed')} className={`px-3 py-1 text-sm rounded-md ${activeFilter === 'completed' ? 'bg-brand-gold text-brand-dark font-bold' : 'bg-brand-gray text-white'}`}>Finalizados</button>
                        <button onClick={() => setActiveFilter('canceled')} className={`px-3 py-1 text-sm rounded-md ${activeFilter === 'canceled' ? 'bg-brand-gold text-brand-dark font-bold' : 'bg-brand-gray text-white'}`}>Cancelados</button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    {loading ? (
                        <p className="text-center py-8 text-gray-400">Carregando agendamentos...</p>
                    ) : (
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-brand-gray text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3">Horário</th>
                                    <th className="px-6 py-3">Cliente</th>
                                    <th className="px-6 py-3">Serviço</th>
                                    <th className="px-6 py-3">Valor</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-400">Nenhum agendamento encontrado para este filtro.</td>
                                    </tr>
                                ) : (
                                    filteredAppointments.sort((a, b) => a.hora.localeCompare(b.hora)).map(ag => (
                                        <tr key={ag.id} className="border-b border-brand-gray hover:bg-brand-gray">
                                            <td className="px-6 py-4 font-bold text-white">{ag.hora}</td>
                                            <td className="px-6 py-4 font-medium text-white">{ag.cliente_nome}</td>
                                            <td className="px-6 py-4">{ag.servico_nome}</td>
                                            <td className="px-6 py-4 font-semibold text-brand-gold">{formatCurrency(ag.servicos?.preco || 0)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(ag.status)}`}>
                                                    {ag.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex items-center space-x-2">
                                                {ag.status === AppointmentStatus.PENDENTE && (
                                                    <>
                                                        <button onClick={() => handleUpdateStatus(ag.id, AppointmentStatus.CONFIRMADO)} className="text-blue-400 hover:text-blue-300 text-xs font-semibold px-2 py-1 rounded bg-blue-500/10">Confirmar</button>
                                                        <button onClick={() => handleUpdateStatus(ag.id, AppointmentStatus.CANCELADO)} className="text-red-400 hover:text-red-300 text-xs font-semibold px-2 py-1 rounded bg-red-500/10">Cancelar</button>
                                                    </>
                                                )}
                                                {ag.status === AppointmentStatus.CONFIRMADO && (
                                                    <>
                                                        <button onClick={() => handleUpdateStatus(ag.id, AppointmentStatus.CONCLUIDO)} className="text-green-400 hover:text-green-300 text-xs font-semibold px-2 py-1 rounded bg-green-500/10">Finalizar</button>
                                                        <button onClick={() => handleUpdateStatus(ag.id, AppointmentStatus.CANCELADO)} className="text-yellow-400 hover:text-yellow-300 text-xs font-semibold px-2 py-1 rounded bg-yellow-500/10">Cliente Faltou</button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};