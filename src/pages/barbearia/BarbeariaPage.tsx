import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import { Barbeiro, Servico, Agendamento, AppointmentStatus, Barbearia, Plano, Cliente, ProfessionalType } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications'; // Importado
import { CalendarIcon, ScissorsIcon, UsersIcon, DollarSignIcon, SettingsIcon } from '@/components/icons';
import BarberModal from '@/pages/barbearia/BarberModal';
import ServiceModal from '@/pages/barbearia/ServiceModal';
import ProfilePage from './ProfilePage';
import ClientEditModal from './ClientEditModal';
import ClientHistoryModal from './ClientHistoryModal';
import ManageProfessionalTypes from './ManageProfessionalTypes';
import Modal from '@/components/Modal';

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray flex items-center shadow-lg">
    <div className="p-3 rounded-full bg-brand-gray mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

interface DashboardProps {
    barbeariaData: Barbearia | null;
    barbeariaPlan: Plano | null;
}

const BarbeariaDashboard = ({ barbeariaData, barbeariaPlan }: DashboardProps) => {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(user?.barbeariaId) {
            setLoading(true);
            api.getBarbeariaDashboardData(user.barbeariaId)
                .then(setStats)
                .catch(() => toast.error("Falha ao carregar estatísticas."))
                .finally(() => setLoading(false));
        }
    }, [user]);
    
    if (loading) return <p className="text-center text-gray-400">Carregando...</p>;
    if (!stats) return <p className="text-center text-gray-400">Não foi possível carregar os dados.</p>;

    const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;
    const hasProfessionalPlan = barbeariaPlan?.nome.toLowerCase() === 'profissional';

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Renda de Hoje" value={formatCurrency(stats.rendaDiaria)} icon={<DollarSignIcon className="w-6 h-6 text-brand-gold" />} />
                <StatCard title="Renda da Semana" value={formatCurrency(stats.rendaSemanal)} icon={<DollarSignIcon className="w-6 h-6 text-brand-gold" />} />
                <StatCard title="Renda do Mês" value={formatCurrency(stats.rendaMensal)} icon={<DollarSignIcon className="w-6 h-6 text-brand-gold" />} />
                <StatCard title="Agendamentos Hoje" value={stats.totalAgendamentosHoje} icon={<CalendarIcon className="w-6 h-6 text-brand-gold" />} />
                <StatCard title="Total de Barbeiros" value={stats.totalBarbeiros} icon={<ScissorsIcon className="w-6 h-6 text-brand-gold" />} />
                <StatCard title="Total de Clientes" value={stats.totalClientes} icon={<UsersIcon className="w-6 h-6 text-brand-gold" />} />
            </div>

            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <h3 className="text-lg font-semibold text-white mb-4">Status dos Barbeiros (Hoje)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.barberStatusList && stats.barberStatusList.map((barber: any) => (
                        <div key={barber.id} className="bg-brand-gray p-4 rounded-lg flex items-center space-x-4">
                            <img 
                                src={barber.foto_url || 'https://via.placeholder.com/48'} 
                                alt={barber.nome} 
                                className="w-12 h-12 rounded-full mx-auto mb-4 border-2 border-brand-gold object-cover" 
                            />
                            <div>
                                <p className="font-semibold text-white">{barber.nome}</p>
                                <div className="flex items-center text-xs mt-1">
                                    <span className={`w-2 h-2 rounded-full mr-2 ${barber.isAvailableToday ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span className={barber.isAvailableToday ? 'text-green-400' : 'text-red-400'}>
                                        {barber.isAvailableToday ? 'Disponível' : 'Folga'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <h3 className="text-lg font-semibold text-white mb-4">Comissões do Mês (A Pagar)</h3>
                {!hasProfessionalPlan ? (
                    <div className="bg-yellow-500/10 p-4 rounded-md border border-yellow-500/30 text-yellow-400">
                        <p className="font-semibold">Recurso Exclusivo do Plano Profissional.</p>
                        <p className="text-sm mt-1">Faça upgrade para gerenciar comissões individuais e ter relatórios detalhados por barbeiro.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-brand-gray text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3">Barbeiro</th>
                                    <th className="px-6 py-3">Valor da Comissão</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.comissoes && stats.comissoes.map((c: any, index: number) => (
                                    <tr key={index} className="border-b border-brand-gray hover:bg-brand-gray">
                                        <td className="px-6 py-4 font-medium text-white">{c.nome}</td>
                                        <td className="px-6 py-4 font-semibold text-brand-gold">{formatCurrency(c.valor)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

interface ManageBarbersProps {
    barbeariaPlan: Plano | null;
}

const ManageBarbers = ({ barbeariaPlan }: ManageBarbersProps) => {
    const { user } = useAuth();
    const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
    const [types, setTypes] = useState<ProfessionalType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [barberToEdit, setBarberToEdit] = useState<Barbeiro | null>(null);

    const fetchBarbersAndPlan = useCallback(async () => {
        if (user?.barbeariaId) {
            try {
                setLoading(true);
                const [barbersData] = await Promise.all([
                    api.getBarbeirosByBarbearia(user.barbeariaId),
                ]);
                setBarbeiros(barbersData);
                
                if (barbeariaPlan?.nome.toLowerCase() === 'profissional') {
                    const typesData = await api.getProfessionalTypes(user.barbeariaId);
                    setTypes(typesData);
                } else {
                    setTypes([]);
                }
            } catch (error) {
                toast.error("Falha ao carregar dados dos barbeiros e do plano.");
            } finally {
                setLoading(false);
            }
        }
    }, [user, barbeariaPlan]);

    useEffect(() => {
        fetchBarbersAndPlan();
    }, [fetchBarbersAndPlan]);

    const hasProfessionalPlan = useMemo(() => 
        barbeariaPlan?.nome.toLowerCase() === 'profissional', 
    [barbeariaPlan]);

    const handleOpenModal = (barber: Barbeiro | null = null) => {
        if (!barber && barbeariaPlan?.limite_barbeiros && barbeiros.filter(b => b.ativo).length >= barbeariaPlan.limite_barbeiros) {
            toast.error('Você atingiu o limite de barbeiros do seu plano. Faça um upgrade para adicionar mais.');
            return;
        }
        setBarberToEdit(barber);
        setIsModalOpen(true);
    };

    const handleSave = async (barberData: any, password?: string, photoFile?: File) => {
        if (!user?.barbeariaId) return;
        
        let promise;
        if (barberToEdit) {
            promise = api.updateBarbeiro(barberToEdit.id, barberToEdit.user_id, barberData, photoFile);
        } else {
            if (hasProfessionalPlan) {
                promise = api.createBarbeiro(barberData, user.barbeariaId, password!, photoFile);
            } else {
                promise = api.createBarbeiroWithoutAuth(barberData, user.barbeariaId, photoFile);
            }
        }

        toast.promise(promise, {
            loading: 'Salvando barbeiro...',
            success: () => {
                fetchBarbersAndPlan();
                setIsModalOpen(false);
                return `Barbeiro ${barberToEdit ? 'atualizado' : 'adicionado'} com sucesso!`;
            },
            error: (err) => `Falha ao salvar: ${err.message}`,
        });
    };

    const handleDelete = (barbeiro: Barbeiro) => {
        if (window.confirm("Tem certeza que deseja remover este barbeiro? A conta de acesso dele também será excluída.")) {
            toast.promise(api.deleteBarbeiro(barbeiro.id, barbeiro.user_id), {
                loading: 'Removendo...',
                success: () => {
                    fetchBarbersAndPlan();
                    return 'Barbeiro removido com sucesso!';
                },
                error: (err) => `Falha ao remover: ${err.message}`,
            });
        }
    };

    return (
        <>
            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Gerenciar Barbeiros</h2>
                        {!loading && (
                            hasProfessionalPlan ? (
                                <p className="text-xs text-green-400 mt-1">Seu plano permite criar acessos individuais para barbeiros.</p>
                            ) : (
                                <p className="text-xs text-yellow-400 mt-1">Seu plano não inclui acesso individual para barbeiros.</p>
                            )
                        )}
                    </div>
                    <button onClick={() => handleOpenModal()} className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90 w-full sm:w-auto">Adicionar Barbeiro</button>
                </div>
                {loading ? <p className="text-center text-gray-400">Carregando...</p> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {barbeiros.map(barbeiro => (
                            <div key={barbeiro.id} className="bg-brand-gray p-4 rounded-lg text-center relative group">
                                <img src={barbeiro.foto_url} alt={barbeiro.nome} className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-brand-gold object-cover"/>
                                <h3 className="font-semibold text-white">{barbeiro.nome}</h3>
                                <p className="text-sm text-gray-400">{barbeiro.especialidade}</p>
                                {hasProfessionalPlan && barbeiro.professional_types && (
                                    <p className="text-xs text-brand-gold mt-1">{barbeiro.professional_types.name} ({barbeiro.professional_types.commission_percent}%)</p>
                                )}
                                <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-semibold ${barbeiro.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {barbeiro.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1">
                                    <button onClick={() => handleOpenModal(barbeiro)} className="text-xs bg-blue-500/50 text-white p-1 rounded">Editar</button>
                                    <button onClick={() => handleDelete(barbeiro)} className="text-xs bg-red-500/50 text-white p-1 rounded">Excluir</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={barberToEdit ? 'Editar Barbeiro' : 'Adicionar Barbeiro'}>
                <BarberModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave} 
                    barberToEdit={barberToEdit} 
                    hasBarberPanelFeature={hasProfessionalPlan} 
                    professionalTypes={types} 
                />
            </Modal>
        </>
    );
};

const ManageServices = () => {
    const { user } = useAuth();
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<Servico | null>(null);

    const fetchServices = useCallback(async () => {
        if (user?.barbeariaId) {
            try {
                setLoading(true);
                const data = await api.getServicosByBarbearia(user.barbeariaId);
                setServicos(data);
            } catch (error) {
                toast.error("Falha ao carregar serviços.");
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const handleOpenModal = (service: Servico | null = null) => {
        setServiceToEdit(service);
        setIsModalOpen(true);
    };

    const handleSave = async (serviceData: any) => {
        if (!user?.barbeariaId) return;
        const promise = serviceToEdit
            ? api.updateServico(serviceToEdit.id, serviceData)
            : api.createServico(serviceData, user.barbeariaId);

        toast.promise(promise, {
            loading: 'Salvando serviço...',
            success: () => {
                fetchServices();
                setIsModalOpen(false);
                return `Serviço ${serviceToEdit ? 'atualizado' : 'adicionado'} com sucesso!`;
            },
            error: (err) => `Falha ao salvar: ${err.message}`,
        });
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja remover este serviço?")) {
            toast.promise(api.deleteServico(id), {
                loading: 'Removendo...',
                success: () => {
                    fetchServices();
                    return 'Serviço removido com sucesso!';
                },
                error: (err) => `Falha ao remover: ${err.message}`,
            });
        }
    };
    
    return (
        <>
            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-xl font-semibold text-white">Gerenciar Serviços</h2>
                    <button onClick={() => handleOpenModal()} className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90 w-full sm:w-auto">Adicionar Serviço</button>
                </div>
                {loading ? <p className="text-center text-gray-400">Carregando...</p> : (
                    <ul className="space-y-3">
                        {servicos.map(servico => (
                            <li key={servico.id} className="bg-brand-gray p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                <div>
                                    <p className="font-semibold text-white">{servico.nome}</p>
                                    <p className="text-sm text-gray-400">{servico.duracao} min</p>
                                </div>
                                <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                                    <p className="text-lg font-bold text-brand-gold">R$ {servico.preco.toFixed(2)}</p>
                                    <button onClick={() => handleOpenModal(servico)} className="text-blue-400 hover:text-blue-300 text-sm">Editar</button>
                                    <button onClick={() => handleDelete(servico.id)} className="text-red-400 hover:text-red-300 text-sm">Excluir</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <ServiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} serviceToEdit={serviceToEdit} />
        </>
    );
};

const ManageAppointments = () => {
    const { user } = useAuth();
    const { resetAppointmentCount } = useNotifications(); // Usando o hook de notificação
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterStatus, setFilterStatus] = useState<'todos' | AppointmentStatus>('todos');
    const [filterBarber, setFilterBarber] = useState('todos');

    const fetchData = useCallback(async () => {
        if (user?.barbeariaId) {
            try {
                setLoading(true);
                const [appointmentsData, barbersData] = await Promise.all([
                    api.getAgendamentosByBarbearia(user.barbeariaId),
                    api.getBarbeirosByBarbearia(user.barbeariaId)
                ]);
                setAgendamentos(appointmentsData);
                setBarbeiros(barbersData);
            } catch (error) {
                toast.error("Falha ao carregar dados de agendamentos e barbeiros.");
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchData();
        resetAppointmentCount(); // Zera a contagem ao carregar a página
    }, [fetchData, resetAppointmentCount]);

    const filteredAgendamentos = useMemo(() => {
        return agendamentos.filter(ag => {
            const dateMatch = !filterDate || ag.data === filterDate;
            const statusMatch = filterStatus === 'todos' || ag.status === filterStatus;
            const barberMatch = filterBarber === 'todos' || ag.barbeiro_id === filterBarber;
            return dateMatch && statusMatch && barberMatch;
        });
    }, [agendamentos, filterDate, filterStatus, filterBarber]);

    const handleStatusUpdate = (id: string, status: AppointmentStatus) => {
        toast.promise(api.updateAgendamento(id, { status }), {
            loading: 'Atualizando status...',
            success: () => {
                fetchData();
                return 'Status atualizado!';
            },
            error: 'Falha ao atualizar.',
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
    
    return (
        <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray space-y-6">
            <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-xl font-semibold text-white w-full sm:w-auto">Filtros</h2>
                <div className="w-full sm:w-auto">
                    <label htmlFor="date-filter" className="sr-only">Data</label>
                    <input 
                        type="date" 
                        id="date-filter"
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                        className="bg-brand-gray px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white w-full"
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <label htmlFor="status-filter" className="sr-only">Status</label>
                    <select 
                        id="status-filter"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value as any)}
                        className="bg-brand-gray px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white w-full"
                    >
                        <option value="todos">Todos os Status</option>
                        <option value={AppointmentStatus.PENDENTE}>Pendente</option>
                        <option value={AppointmentStatus.CONFIRMADO}>Confirmado</option>
                        <option value={AppointmentStatus.CONCLUIDO}>Concluído</option>
                        <option value={AppointmentStatus.CANCELADO}>Cancelado</option>
                    </select>
                </div>
                <div className="w-full sm:w-auto">
                    <label htmlFor="barber-filter" className="sr-only">Barbeiro</label>
                    <select 
                        id="barber-filter"
                        value={filterBarber}
                        onChange={e => setFilterBarber(e.target.value)}
                        className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white"
                    >
                        <option value="todos">Todos os Barbeiros</option>
                        {barbeiros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                    </select>
                </div>
                 <button onClick={() => setFilterDate('')} className="text-sm text-gray-400 hover:text-white w-full sm:w-auto">Limpar Data</button>
            </div>

            <div className="overflow-x-auto">
                {loading ? <p className="text-center text-gray-400 py-8">Carregando...</p> : (
                    <table className="w-full text-left text-sm text-gray-300 min-w-[800px]">
                        <thead className="bg-brand-gray text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3 hidden sm:table-cell">Serviço</th>
                                <th className="px-6 py-3 hidden md:table-cell">Barbeiro</th>
                                <th className="px-6 py-3">Data & Hora</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAgendamentos.length > 0 ? filteredAgendamentos.map(ag => (
                                <tr key={ag.id} className="border-b border-brand-gray hover:bg-brand-gray">
                                    <td className="px-6 py-4 font-medium text-white">{ag.cliente_nome}</td>
                                    <td className="px-6 py-4 hidden sm:table-cell">{ag.servico_nome}</td>
                                    <td className="px-6 py-4 hidden md:table-cell">{ag.barbeiro_nome}</td>
                                    <td className="px-6 py-4">{new Date(ag.data + 'T00:00:00').toLocaleDateString('pt-BR')} - {ag.hora}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(ag.status)}`}>
                                            {ag.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 space-x-2 text-xs flex flex-col space-y-1 sm:flex-row sm:space-x-2 sm:space-y-0">
                                        {ag.status === AppointmentStatus.PENDENTE && (
                                            <button onClick={() => handleStatusUpdate(ag.id, AppointmentStatus.CONFIRMADO)} className="text-blue-400 hover:text-blue-300">Confirmar</button>
                                        )}
                                        {ag.status === AppointmentStatus.CONFIRMADO && (
                                            <button onClick={() => handleStatusUpdate(ag.id, AppointmentStatus.CONCLUIDO)} className="text-green-400 hover:text-green-300">Concluir</button>
                                        )}
                                        {ag.status !== AppointmentStatus.CONCLUIDO && ag.status !== AppointmentStatus.CANCELADO && (
                                            <button onClick={() => handleStatusUpdate(ag.id, AppointmentStatus.CANCELADO)} className="text-red-400 hover:text-red-300">Cancelar</button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-400">Nenhum agendamento encontrado para os filtros selecionados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const ManageClients = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    const [clientAppointments, setClientAppointments] = useState<Agendamento[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const fetchClients = useCallback(async () => {
        if (user?.barbeariaId) {
            try {
                setLoading(true);
                const data = await api.getClientsByBarbearia(user.barbeariaId);
                setClients(data);
            } catch (error) {
                toast.error("Falha ao carregar clientes.");
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const handleOpenEditModal = (client: Cliente) => {
        setSelectedClient(client);
        setIsEditModalOpen(true);
    };

    const handleOpenHistoryModal = async (client: Cliente) => {
        if (!user?.barbeariaId) return;
        setSelectedClient(client);
        try {
            const appointments = await api.getAppointmentsByClient(client.id, user.barbeariaId);
            setClientAppointments(appointments);
            setIsHistoryModalOpen(true);
        } catch (error) {
            toast.error("Falha ao buscar histórico do cliente.");
        }
    };

    const handleSaveClient = async (clientId: string, updates: { nome: string; telefone: string }) => {
        toast.promise(api.updateClient(clientId, updates), {
            loading: 'Salvando...',
            success: () => {
                fetchClients();
                setIsEditModalOpen(false);
                return 'Cliente atualizado com sucesso!';
            },
            error: 'Falha ao atualizar cliente.',
        });
    };

    return (
        <>
            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <h2 className="text-xl font-semibold text-white mb-4">Gerenciar Clientes</h2>
                <div className="overflow-x-auto">
                    {loading ? <p className="text-center text-gray-400">Carregando...</p> : (
                        <table className="w-full text-left text-sm text-gray-300 min-w-[500px]">
                            <thead className="bg-brand-gray text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3">Nome</th>
                                    <th className="px-6 py-3">Telefone</th>
                                    <th className="px-6 py-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(client => (
                                    <tr key={client.id} className="border-b border-brand-gray hover:bg-brand-gray">
                                        <td className="px-6 py-4 font-medium text-white">{client.nome}</td>
                                        <td className="px-6 py-4">{client.telefone}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0">
                                                <button onClick={() => handleOpenEditModal(client)} className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm">Editar</button>
                                                <button onClick={() => handleOpenHistoryModal(client)} className="text-green-400 hover:text-green-300 text-xs sm:text-sm">Ver Histórico</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            <ClientEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveClient} client={selectedClient} />
            <ClientHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} clientName={selectedClient?.nome || ''} appointments={clientAppointments} />
        </>
    );
};

const Settings = ({ barbeariaData }: { barbeariaData: Barbearia | null }) => {
    const { user } = useAuth();
    const [barbearia, setBarbearia] = useState<Partial<Barbearia>>({ operating_days: [] });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [heroFile, setHeroFile] = useState<File | null>(null);
    const [heroPreview, setHeroPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const logoFileInputRef = useRef<HTMLInputElement>(null);
    const heroFileInputRef = useRef<HTMLInputElement>(null);

    const daysOfWeek = [
        { label: 'Dom', value: 0 }, { label: 'Seg', value: 1 }, { label: 'Ter', value: 2 },
        { label: 'Qua', value: 3 }, { label: 'Qui', value: 4 }, { label: 'Sex', value: 5 },
        { label: 'Sáb', value: 6 }
    ];

    useEffect(() => {
        if (barbeariaData) {
            setBarbearia(barbeariaData);
            setHeroPreview(barbeariaData.hero_image_url || null);
            setLogoPreview(barbeariaData.foto_url || null);
            setLoading(false);
        }
    }, [barbeariaData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setBarbearia(prev => ({ ...prev, [name]: value }));
    };

    const handleDayToggle = (dayValue: number) => {
        setBarbearia(prev => {
            const currentDays = prev.operating_days || [];
            const newDays = currentDays.includes(dayValue)
                ? currentDays.filter(d => d !== dayValue)
                : [...currentDays, dayValue];
            return { ...prev, operating_days: newDays.sort() };
        });
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setHeroFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setHeroPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!user?.barbeariaId || !user.id) return;
        
        const updates: Partial<Barbearia> = {
            nome: barbearia.nome,
            endereco: barbearia.endereco,
            link_personalizado: barbearia.link_personalizado,
            instagram_url: barbearia.instagram_url,
            whatsapp_url: barbearia.whatsapp_url,
            hero_title: barbearia.hero_title,
            hero_subtitle: barbearia.hero_subtitle,
            services_title: barbearia.services_title,
            social_title: barbearia.social_title,
            social_subtitle: barbearia.social_subtitle,
            operating_days: barbearia.operating_days,
            start_time: barbearia.start_time,
            end_time: barbearia.end_time,
            comissao_padrao: barbearia.comissao_padrao, // Adicionado de volta
        };

        setIsSaving(true);
        toast.promise(api.updateBarbearia(user.barbeariaId, user.id, updates, logoFile || undefined, heroFile || undefined), {
            loading: 'Salvando alterações...',
            success: (updatedBarbearia) => {
                setIsSaving(false);
                setHeroFile(null);
                setLogoFile(null);
                setHeroPreview(updatedBarbearia.hero_image_url || null);
                setLogoPreview(updatedBarbearia.foto_url || null);
                return 'Configurações salvas com sucesso!';
            },
            error: (err) => {
                setIsSaving(false);
                return `Falha ao salvar: ${err.message}`;
            },
        });
    };

    const handleCopyLink = () => {
        if (barbearia.link_personalizado) {
            const fullUrl = `${window.location.origin}/#/${barbearia.link_personalizado}`;
            navigator.clipboard.writeText(fullUrl).then(() => {
                toast.success('Link copiado para a área de transferência!');
            }).catch(() => {
                toast.error('Falha ao copiar o link.');
            });
        }
    };

    if (loading) return <p className="text-center text-gray-400">Carregando...</p>;

    return (
        <div className="space-y-8">
            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray max-w-3xl space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">Configurações da Barbearia</h2>
                <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-2">Nome da Barbearia</label>
                    <input type="text" id="nome" name="nome" value={barbearia.nome || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Logo da Barbearia</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="w-20 h-20 bg-brand-gray rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-600">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-400 text-xs">Logo</span>
                            )}
                        </div>
                        <input type="file" id="logo-upload" ref={logoFileInputRef} onChange={handleLogoFileChange} accept="image/*" className="hidden" />
                        <button type="button" onClick={() => logoFileInputRef.current?.click()} className="cursor-pointer bg-brand-gray hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full sm:w-auto">
                            Fazer Upload
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="endereco" className="block text-sm font-medium text-gray-300 mb-2">Endereço</label>
                    <input type="text" id="endereco" name="endereco" value={barbearia.endereco || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                </div>
                <div>
                    <label htmlFor="link_personalizado" className="block text-sm font-medium text-gray-300 mb-2">Link Personalizado</label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
                        <span className="text-gray-400 bg-brand-gray px-3 py-2 rounded-t-md sm:rounded-l-md sm:rounded-t-none border border-b-0 sm:border-r-0 border-gray-600">barberpro.app/</span>
                        <input type="text" id="link_personalizado" name="link_personalizado" value={barbearia.link_personalizado || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-b-md sm:rounded-r-md sm:rounded-b-none border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                        <button 
                            type="button" 
                            onClick={handleCopyLink} 
                            disabled={!barbearia.link_personalizado}
                            className="mt-2 sm:mt-0 sm:ml-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm disabled:opacity-50 w-full sm:w-auto"
                        >
                            Copiar URL
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="comissao_padrao" className="block text-sm font-medium text-gray-300 mb-2">Comissão Padrão (%)</label>
                    <input type="number" id="comissao_padrao" name="comissao_padrao" value={barbearia.comissao_padrao || ''} onChange={handleInputChange} min="0" max="100" className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                    <p className="text-xs text-gray-500 mt-1">Comissão aplicada a barbeiros sem um Tipo de Profissional definido.</p>
                </div>
                <div>
                    <label htmlFor="instagram_url" className="block text-sm font-medium text-gray-300 mb-2">URL do Instagram</label>
                    <input type="url" id="instagram_url" name="instagram_url" value={barbearia.instagram_url || ''} onChange={handleInputChange} placeholder="https://instagram.com/suabarbearia" className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                </div>
                <div>
                    <label htmlFor="whatsapp_url" className="block text-sm font-medium text-gray-300 mb-2">Link do WhatsApp</label>
                    <input type="url" id="whatsapp_url" name="whatsapp_url" value={barbearia.whatsapp_url || ''} onChange={handleInputChange} placeholder="https://wa.me/5511999999999" className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                </div>
            </div>

            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray max-w-3xl space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">Horário de Funcionamento</h2>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Dias da Semana</label>
                    <div className="flex flex-wrap gap-2">
                        {daysOfWeek.map(day => (
                            <button
                                key={day.value}
                                onClick={() => handleDayToggle(day.value)}
                                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                                    barbearia.operating_days?.includes(day.value)
                                        ? 'bg-brand-gold text-brand-dark'
                                        : 'bg-brand-gray text-white hover:bg-gray-700'
                                }`}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start_time" className="block text-sm font-medium text-gray-300 mb-2">Horário de Abertura</label>
                        <input type="time" id="start_time" name="start_time" value={barbearia.start_time || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                    </div>
                    <div>
                        <label htmlFor="end_time" className="block text-sm font-medium text-gray-300 mb-2">Horário de Fechamento</label>
                        <input type="time" id="end_time" name="end_time" value={barbearia.end_time || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                    </div>
                </div>
            </div>

            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray max-w-3xl space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">Personalização da Página Pública</h2>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Imagem de Fundo (Banner)</label>
                    <p className="text-xs text-gray-500 mb-2">Recomendado: 1920x1080 pixels</p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="w-32 h-20 bg-brand-gray rounded-md flex items-center justify-center overflow-hidden border-2 border-gray-600">
                            {heroPreview ? <img src={heroPreview} alt="Banner Preview" className="w-full h-full object-cover" /> : <span className="text-gray-400 text-xs">Banner</span>}
                        </div>
                        <input type="file" id="hero-upload" ref={heroFileInputRef} onChange={handleHeroFileChange} accept="image/*" className="hidden" />
                        <button type="button" onClick={() => heroFileInputRef.current?.click()} className="cursor-pointer bg-brand-gray hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full sm:w-auto">
                            Fazer Upload
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="hero_title" className="block text-sm font-medium text-gray-300 mb-2">Título Principal</label>
                    <input type="text" id="hero_title" name="hero_title" value={barbearia.hero_title || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                </div>
                <div>
                    <label htmlFor="hero_subtitle" className="block text-sm font-medium text-gray-300 mb-2">Frase de Destaque</label>
                    <input type="text" id="hero_subtitle" name="hero_subtitle" value={barbearia.hero_subtitle || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                </div>
                <div>
                    <label htmlFor="services_title" className="block text-sm font-medium text-gray-300 mb-2">Título da Seção de Serviços</label>
                    <input type="text" id="services_title" name="services_title" value={barbearia.services_title || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                </div>
                <div>
                    <label htmlFor="social_title" className="block text-sm font-medium text-gray-300 mb-2">Título da Seção Social</label>
                    <input type="text" id="social_title" name="social_title" value={barbearia.social_title || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                </div>
                <div>
                    <label htmlFor="social_subtitle" className="block text-sm font-medium text-gray-300 mb-2">Subtítulo da Seção Social</label>
                    <input type="text" id="social_subtitle" name="social_subtitle" value={barbearia.social_subtitle || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                </div>
            </div>

            <div className="max-w-3xl">
                <button onClick={handleSave} disabled={isSaving} className="bg-brand-gold text-brand-dark font-bold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 w-full sm:w-auto">
                    {isSaving ? 'Salvando...' : 'Salvar Todas as Alterações'}
                </button>
            </div>
        </div>
    )
};

const SettingsWrapper = ({ barbeariaData, barbeariaPlan }: DashboardProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { slug } = useParams();
    
    const hasProfessionalPlan = barbeariaPlan?.nome.toLowerCase() === 'profissional';

    const determineSettingsTab = () => {
        const pathEnd = location.pathname.split('/').pop();
        if (pathEnd === 'types') return 'types';
        return 'general';
    };

    const [activeSettingsTab, setActiveSettingsTab] = useState(determineSettingsTab());

    useEffect(() => {
        setActiveSettingsTab(determineSettingsTab());
    }, [location.pathname]);

    const handleTabChange = (tab: string) => {
        navigate(`/${slug}/settings/${tab}`);
    };

    const renderContent = () => {
        switch (activeSettingsTab) {
            case 'types': 
                if (!hasProfessionalPlan) {
                    return (
                        <div className="bg-red-500/10 p-6 rounded-lg border border-red-500/30 text-red-400">
                            <p className="font-semibold">Acesso Negado.</p>
                            <p className="text-sm mt-1">O gerenciamento de Tipos de Profissional é um recurso exclusivo do Plano Profissional.</p>
                        </div>
                    );
                }
                return <ManageProfessionalTypes />;
            case 'general':
            default: return <Settings barbeariaData={barbeariaData} />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Adicionando 'hidden sm:flex' para ocultar em mobile */}
            <div className="hidden sm:flex flex-col sm:flex-row border-b border-brand-gray sm:flex-wrap gap-2 overflow-x-auto pb-2">
                <button onClick={() => handleTabChange('general')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeSettingsTab === 'general' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Geral</button>
                {/* Conditionally render the Types tab based on the fetched plan */}
                {hasProfessionalPlan && (
                    <button onClick={() => handleTabChange('types')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeSettingsTab === 'types' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Tipos de Profissional</button>
                )}
            </div>
            {renderContent()}
        </div>
    );
};


export const BarbeariaPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { slug } = useParams();
    const { user } = useAuth();

    const [barbeariaData, setBarbeariaData] = useState<Barbearia | null>(null);
    const [barbeariaPlan, setBarbeariaPlan] = useState<Plano | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    const fetchBarbeariaInfo = useCallback(async () => {
        if (user?.barbeariaId) {
            try {
                const data = await api.getBarbeariaById(user.barbeariaId);
                setBarbeariaData(data);
                const plan = await api.getPlanoByName(data.plano);
                setBarbeariaPlan(plan);
            } catch (error) {
                toast.error("Falha ao carregar dados essenciais da barbearia.");
            } finally {
                setLoadingData(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchBarbeariaInfo();
    }, [fetchBarbeariaInfo]);

    const determineActiveTab = () => {
        const pathParts = location.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        const secondLastPart = pathParts[pathParts.length - 2];

        const validTabs = ['dashboard', 'appointments', 'barbers', 'services', 'clients', 'settings', 'profile'];
        
        if (validTabs.includes(lastPart)) {
            return lastPart;
        }
        
        if (secondLastPart && validTabs.includes(secondLastPart)) {
            return secondLastPart;
        }
        
        if (lastPart === slug || lastPart === '') {
            return 'dashboard';
        }
        return 'dashboard';
    };

    const [activeTab, setActiveTab] = useState(determineActiveTab());

    useEffect(() => {
        setActiveTab(determineActiveTab());
    }, [location.pathname]);

    const handleTabChange = (tab: string) => {
        navigate(`/${slug}/${tab}`);
    };
    
    if (loadingData) {
        return <p className="text-center py-10 text-gray-400">Carregando dados da barbearia...</p>;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <BarbeariaDashboard barbeariaData={barbeariaData} barbeariaPlan={barbeariaPlan} />;
            case 'barbers': return <ManageBarbers barbeariaPlan={barbeariaPlan} />;
            case 'services': return <ManageServices />;
            case 'appointments': return <ManageAppointments />;
            case 'clients': return <ManageClients />;
            case 'settings': return <SettingsWrapper barbeariaData={barbeariaData} barbeariaPlan={barbeariaPlan} />;
            case 'profile': return <ProfilePage />;
            default: return <BarbeariaDashboard barbeariaData={barbeariaData} barbeariaPlan={barbeariaPlan} />;
        }
    };
    
    return (
        <div className="space-y-6">
            {/* Adicionando 'hidden sm:flex' para ocultar em mobile */}
            <div className="hidden sm:flex flex-col sm:flex-row border-b border-brand-gray sm:flex-wrap gap-2 overflow-x-auto pb-2">
                <button onClick={() => handleTabChange('dashboard')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeTab === 'dashboard' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Dashboard</button>
                <button onClick={() => handleTabChange('appointments')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeTab === 'appointments' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Agendamentos</button>
                <button onClick={() => handleTabChange('barbers')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeTab === 'barbers' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Barbeiros</button>
                <button onClick={() => handleTabChange('services')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeTab === 'services' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Serviços</button>
                <button onClick={() => handleTabChange('clients')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeTab === 'clients' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Clientes</button>
                <button onClick={() => handleTabChange('settings')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeTab === 'settings' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Configurações</button>
            </div>
            {renderContent()}
        </div>
    );
};