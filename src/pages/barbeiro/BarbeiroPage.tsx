import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import { Agendamento, AppointmentStatus, BarbeiroDisponibilidade } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications'; // Importado
import { DollarSignIcon, XCircleIcon, ClockIcon, ScissorsIcon } from '@/components/icons';
import Calendar from '@/components/booking/Calendar';
import BarberPerformanceModal from '@/pages/barbearia/BarberPerformanceModal'; // Importando o modal

// Componente para o Dashboard de Estatísticas
const BarberStatsDashboard = () => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        if (user?.barbeiroId) {
            try {
                const data = await api.getBarberDashboardData(user.barbeiroId);
                setDashboardData(data);
            } catch (error) {
                toast.error("Falha ao carregar dados do dashboard.");
            }
        }
    }, [user]);

    useEffect(() => {
        setLoading(true);
        fetchDashboardData().finally(() => setLoading(false));
    }, [fetchDashboardData]);

    const StatCard = ({ title, value, icon, colorClass }: { title: string, value: string | number, icon: React.ReactNode, colorClass: string }) => (
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

    const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

    if (loading) {
        return <div className="text-center py-10 text-gray-400">Carregando...</div>;
    }

    // Criando um objeto Barbeiro simulado para o modal de desempenho
    const selfBarberProfile = user?.barbeiroId ? {
        id: user.barbeiroId,
        nome: user.full_name || user.email,
        foto_url: '', // Não precisamos da foto aqui
        especialidade: '',
        ativo: true,
    } : null;

    return (
        <div className="space-y-6">
            <div className="bg-brand-dark p-4 rounded-lg border border-brand-gray flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Seu Perfil</h3>
                    <p className="text-sm text-gray-300">
                        Tipo de Profissional: <span className="font-semibold text-brand-gold">{dashboardData?.professionalTypeName || 'Não Definido'}</span>
                    </p>
                    <p className="text-sm text-gray-300">
                        Comissão: <span className="font-semibold text-brand-gold">{dashboardData?.commissionRate}%</span>
                    </p>
                </div>
                {selfBarberProfile && (
                    <button 
                        onClick={() => setIsPerformanceModalOpen(true)}
                        className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90 text-sm"
                    >
                        Ver Desempenho (30 dias)
                    </button>
                )}
            </div>
            {/* Ajuste de responsividade: grid de 1 coluna em mobile, 3 em md+ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Sua Comissão (Mês)" value={formatCurrency(dashboardData?.comissaoDoMes || 0)} icon={<DollarSignIcon className="w-5 h-5 text-white"/>} colorClass="bg-green-500" />
                <StatCard title="Total Gerado (Mês)" value={formatCurrency(dashboardData?.totalGeradoNoMes || 0)} icon={<DollarSignIcon className="w-5 h-5 text-white"/>} colorClass="bg-yellow-500" />
                <StatCard title="Serviços Concluídos (Mês)" value={dashboardData?.agendamentosConcluidos || 0} icon={<ScissorsIcon className="w-5 h-5 text-white"/>} colorClass="bg-blue-500" />
            </div>
            
            {/* Modal de Desempenho Pessoal */}
            <BarberPerformanceModal
                isOpen={isPerformanceModalOpen}
                onClose={() => setIsPerformanceModalOpen(false)}
                barber={selfBarberProfile}
                isProfessionalPlan={true} // O barbeiro só tem acesso ao painel se o plano for profissional (ou equivalente)
            />
        </div>
    );
};

// Componente para a Agenda de Agendamentos
const BarberAppointments = () => {
// ... (restante do código BarberAppointments permanece inalterado)
    const { user } = useAuth();
    const { resetAppointmentCount } = useNotifications(); // Usando o hook de notificação
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeFilter, setActiveFilter] = useState<'pending' | 'completed' | 'canceled'>('pending');

    const fetchAgendamentos = useCallback(async () => {
        if (user?.barbeiroId) {
            setLoadingAppointments(true);
            try {
                const data = await api.getAgendamentosByBarbeiro(user.barbeiroId);
                setAgendamentos(data);
            } catch (error) {
                toast.error("Falha ao carregar agendamentos.");
            } finally {
                setLoadingAppointments(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchAgendamentos();
        resetAppointmentCount(); // Zera a contagem ao carregar a página
    }, [fetchAgendamentos, resetAppointmentCount]);

    const filteredAppointments = useMemo(() => {
        return agendamentos.filter(ag => {
            if (ag.data !== selectedDate) return false;
            switch (activeFilter) {
                case 'pending': return ag.status === AppointmentStatus.PENDENTE || ag.status === AppointmentStatus.CONFIRMADO;
                case 'completed': return ag.status === AppointmentStatus.CONCLUIDO;
                case 'canceled': return ag.status === AppointmentStatus.CANCELADO;
                default: return true;
            }
        });
    }, [agendamentos, selectedDate, activeFilter]);

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
            case AppointmentStatus.PENDENTE: default: return 'bg-yellow-500/20 text-yellow-400';
        }
    };

    return (
        <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-brand-gray pb-4">
                <h3 className="text-lg font-semibold text-white">Agenda do Dia</h3>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-brand-gray px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white w-full sm:w-auto" />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => setActiveFilter('pending')} className={`px-3 py-1 text-sm rounded-md ${activeFilter === 'pending' ? 'bg-brand-gold text-brand-dark font-bold' : 'bg-brand-gray text-white'}`}>Pendentes</button>
                <button onClick={() => setActiveFilter('completed')} className={`px-3 py-1 text-sm rounded-md ${activeFilter === 'completed' ? 'bg-brand-gold text-brand-dark font-bold' : 'bg-brand-gray text-white'}`}>Finalizados</button>
                <button onClick={() => setActiveFilter('canceled')} className={`px-3 py-1 text-sm rounded-md ${activeFilter === 'canceled' ? 'bg-brand-gold text-brand-dark font-bold' : 'bg-brand-gray text-white'}`}>Cancelados</button>
            </div>
            <div className="overflow-x-auto">
                {loadingAppointments ? <p className="text-center py-8 text-gray-400">Carregando...</p> : (
                    <table className="w-full text-left text-sm text-gray-300 min-w-[600px]">
                        <thead className="bg-brand-gray text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">Horário</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3 hidden sm:table-cell">Serviço</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhum agendamento.</td></tr>
                            ) : (
                                filteredAppointments.sort((a, b) => a.hora.localeCompare(b.hora)).map(ag => (
                                    <tr key={ag.id} className="border-b border-brand-gray hover:bg-brand-gray">
                                        <td className="px-6 py-4 font-bold text-white">{ag.hora}</td>
                                        <td className="px-6 py-4 font-medium text-white">{ag.cliente_nome}</td>
                                        <td className="px-6 py-4 hidden sm:table-cell">{ag.servico_nome}</td>
                                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(ag.status)}`}>{ag.status}</span></td>
                                        <td className="px-6 py-4 flex flex-col space-y-1 sm:flex-row sm:space-x-2 sm:space-y-0 text-xs">
                                            {ag.status === AppointmentStatus.PENDENTE && <button onClick={() => handleUpdateStatus(ag.id, AppointmentStatus.CONFIRMADO)} className="text-blue-400 hover:text-blue-300 font-semibold">Confirmar</button>}
                                            {ag.status === AppointmentStatus.CONFIRMADO && <button onClick={() => handleUpdateStatus(ag.id, AppointmentStatus.CONCLUIDO)} className="text-green-400 hover:text-green-300 font-semibold">Finalizar</button>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

// Componente para Gerenciar Disponibilidade
const BarberAvailability = () => {
// ... (restante do código BarberAvailability permanece inalterado)
    const { user } = useAuth();
    const [disponibilidades, setDisponibilidades] = useState<Record<string, BarbeiroDisponibilidade>>({});
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [horaInicio, setHoraInicio] = useState('');
    const [horaFim, setHoraFim] = useState('');
    const [disponivel, setDisponivel] = useState(true);

    const fetchDisponibilidade = useCallback(async (date: Date) => {
        if (!user?.barbeiroId) return;
        try {
            const data = await api.getBarbeiroDisponibilidade(user.barbeiroId, date.getFullYear(), date.getMonth());
            const mappedData = data.reduce((acc, item) => {
                acc[item.data] = item;
                return acc;
            }, {} as Record<string, BarbeiroDisponibilidade>);
            setDisponibilidades(mappedData);
        } catch (error) {
            toast.error("Falha ao carregar disponibilidade.");
        }
    }, [user]);

    useEffect(() => {
        fetchDisponibilidade(currentMonth);
    }, [currentMonth, fetchDisponibilidade]);

    useEffect(() => {
        if (selectedDate) {
            const dateString = selectedDate.toISOString().split('T')[0];
            const diaInfo = disponibilidades[dateString];
            if (diaInfo) {
                setHoraInicio(diaInfo.hora_inicio || '');
                setHoraFim(diaInfo.hora_fim || '');
                setDisponivel(diaInfo.disponivel);
            } else {
                setHoraInicio('');
                setHoraFim('');
                setDisponivel(true);
            }
        }
    }, [selectedDate, disponibilidades]);

    const handleSave = async () => {
        if (!user?.barbeiroId || !selectedDate) return;
        const data = selectedDate.toISOString().split('T')[0];
        const payload: BarbeiroDisponibilidade = {
            barbeiro_id: user.barbeiroId,
            data,
            hora_inicio: disponivel ? horaInicio : null,
            hora_fim: disponivel ? horaFim : null,
            disponivel,
        };
        
        toast.promise(api.setBarbeiroDisponibilidade(payload), {
            loading: 'Salvando...',
            success: (savedData) => {
                setDisponibilidades(prev => ({ ...prev, [data]: savedData }));
                return 'Disponibilidade salva com sucesso!';
            },
            error: 'Falha ao salvar.',
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <Calendar 
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    operatingDays={[0,1,2,3,4,5,6]} // Barbeiro pode configurar qualquer dia
                    fullyBookedDays={[]}
                    onMonthChange={setCurrentMonth}
                    currentMonth={currentMonth}
                />
            </div>
            <div className="md:col-span-2 bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <h3 className="text-lg font-semibold text-white mb-4">
                    Configurar Horário para {selectedDate?.toLocaleDateString('pt-BR') || '...'}
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center">
                        <input id="disponivel" type="checkbox" checked={disponivel} onChange={e => setDisponivel(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-brand-gray text-brand-gold focus:ring-brand-gold" />
                        <label htmlFor="disponivel" className="ml-2 block text-sm text-gray-300">Disponível para trabalhar neste dia</label>
                    </div>
                    {disponivel && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="hora_inicio" className="block text-sm font-medium text-gray-300 mb-1">Início do Expediente</label>
                                <input type="time" id="hora_inicio" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600"/>
                            </div>
                            <div>
                                <label htmlFor="hora_fim" className="block text-sm font-medium text-gray-300 mb-1">Fim do Expediente</label>
                                <input type="time" id="hora_fim" value={horaFim} onChange={e => setHoraFim(e.target.value)} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600"/>
                            </div>
                        </div>
                    )}
                    {!disponivel && <p className="text-yellow-400 bg-yellow-500/10 p-3 rounded-md text-sm">Você marcou este dia como folga.</p>}
                    <div className="pt-4">
                        <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-brand-gold hover:opacity-90 text-brand-dark font-bold w-full sm:w-auto">Salvar Horário do Dia</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente Principal da Página do Barbeiro
export const BarbeiroPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const determineActiveTab = () => {
        const pathEnd = location.pathname.split('/').pop();
        return pathEnd === 'availability' ? 'availability' : 'appointments';
    };

    const [activeTab, setActiveTab] = useState(determineActiveTab());

    useEffect(() => {
        setActiveTab(determineActiveTab());
    }, [location.pathname]);

    const handleTabChange = (tab: string) => {
        navigate(`/barbeiro/${tab}`);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'appointments': return <BarberAppointments />;
            case 'availability': return <BarberAvailability />;
            default: return <BarberAppointments />;
        }
    };

    return (
        <div className="space-y-6">
            <BarberStatsDashboard />
            {/* Adicionando 'hidden sm:flex' para ocultar em mobile */}
            <div className="hidden sm:flex flex-col sm:flex-row border-b border-brand-gray sm:flex-wrap gap-2 overflow-x-auto pb-2">
                <button onClick={() => handleTabChange('appointments')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeTab === 'appointments' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Meus Agendamentos</button>
                <button onClick={() => handleTabChange('availability')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeTab === 'availability' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Minha Disponibilidade</button>
            </div>
            {renderContent()}
        </div>
    );
};