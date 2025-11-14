import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Barbeiro, Servico, Agendamento, AppointmentStatus, Barbearia } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CalendarIcon, ScissorsIcon, UsersIcon, DollarSignIcon } from '../../components/icons';
import BarberModal from './BarberModal';
import ServiceModal from './ServiceModal';

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray flex items-center">
    <div className="p-3 rounded-full bg-brand-gray mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const BarbeariaDashboard = () => {
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Renda de Hoje" value={formatCurrency(stats.rendaDiaria)} icon={<DollarSignIcon className="w-6 h-6 text-brand-gold" />} />
            <StatCard title="Renda da Semana" value={formatCurrency(stats.rendaSemanal)} icon={<DollarSignIcon className="w-6 h-6 text-brand-gold" />} />
            <StatCard title="Renda do Mês" value={formatCurrency(stats.rendaMensal)} icon={<DollarSignIcon className="w-6 h-6 text-brand-gold" />} />
            <StatCard title="Agendamentos Hoje" value={stats.totalAgendamentosHoje} icon={<CalendarIcon className="w-6 h-6 text-brand-gold" />} />
            <StatCard title="Total de Barbeiros" value={stats.totalBarbeiros} icon={<ScissorsIcon className="w-6 h-6 text-brand-gold" />} />
            <StatCard title="Total de Clientes" value={stats.totalClientes} icon={<UsersIcon className="w-6 h-6 text-brand-gold" />} />
        </div>
    );
};

const ManageBarbers = () => {
    const { user } = useAuth();
    const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [barberToEdit, setBarberToEdit] = useState<Barbeiro | null>(null);

    const fetchBarbers = useCallback(async () => {
        if (user?.barbeariaId) {
            try {
                setLoading(true);
                const data = await api.getBarbeirosByBarbearia(user.barbeariaId);
                setBarbeiros(data);
            } catch (error) {
                toast.error("Falha ao carregar barbeiros.");
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchBarbers();
    }, [fetchBarbers]);

    const handleOpenModal = (barber: Barbeiro | null = null) => {
        setBarberToEdit(barber);
        setIsModalOpen(true);
    };

    const handleSave = async (barberData: any, password?: string, photoFile?: File) => {
        if (!user?.barbeariaId) return;
        
        const promise = barberToEdit
            ? api.updateBarbeiro(barberToEdit.id, barberToEdit.user_id, barberData, photoFile)
            : api.createBarbeiro(barberData, user.barbeariaId, password!, photoFile);

        toast.promise(promise, {
            loading: 'Salvando barbeiro...',
            success: () => {
                fetchBarbers();
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
                    fetchBarbers();
                    return 'Barbeiro removido com sucesso!';
                },
                error: (err) => `Falha ao remover: ${err.message}`,
            });
        }
    };

    return (
        <>
            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Gerenciar Barbeiros</h2>
                    <button onClick={() => handleOpenModal()} className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90">Adicionar Barbeiro</button>
                </div>
                {loading ? <p className="text-center text-gray-400">Carregando...</p> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {barbeiros.map(barbeiro => (
                            <div key={barbeiro.id} className="bg-brand-gray p-4 rounded-lg text-center relative group">
                                <img src={barbeiro.foto_url} alt={barbeiro.nome} className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-brand-gold object-cover"/>
                                <h3 className="font-semibold text-white">{barbeiro.nome}</h3>
                                <p className="text-sm text-gray-400">{barbeiro.especialidade}</p>
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
            <BarberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} barberToEdit={barberToEdit} />
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
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Gerenciar Serviços</h2>
                    <button onClick={() => handleOpenModal()} className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90">Adicionar Serviço</button>
                </div>
                {loading ? <p className="text-center text-gray-400">Carregando...</p> : (
                    <ul className="space-y-3">
                        {servicos.map(servico => (
                            <li key={servico.id} className="bg-brand-gray p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-white">{servico.nome}</p>
                                    <p className="text-sm text-gray-400">{servico.duracao} min</p>
                                </div>
                                <div className="flex items-center space-x-4">
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
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [loading, setLoading] = useState(true);
    
    const fetchAppointments = useCallback(async () => {
        if (user?.barbeariaId) {
            try {
                setLoading(true);
                const data = await api.getAgendamentosByBarbearia(user.barbeariaId);
                setAgendamentos(data);
            } catch (error) {
                toast.error("Falha ao carregar agendamentos.");
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleStatusUpdate = (id: string, status: AppointmentStatus) => {
        toast.promise(api.updateAgendamento(id, { status }), {
            loading: 'Atualizando status...',
            success: () => {
                fetchAppointments();
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
        <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
            <h2 className="text-xl font-semibold mb-4 text-white">Todos os Agendamentos</h2>
            <div className="overflow-x-auto">
                {loading ? <p className="text-center text-gray-400">Carregando...</p> : (
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-brand-gray text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Serviço</th>
                                <th className="px-6 py-3">Barbeiro</th>
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
                                    <td className="px-6 py-4">{ag.barbeiro_nome}</td>
                                    <td className="px-6 py-4">{new Date(ag.data).toLocaleDateString()} - {ag.hora}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(ag.status)}`}>
                                            {ag.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 space-x-2 text-xs">
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
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const Settings = () => {
    const { user } = useAuth();
    const [barbearia, setBarbearia] = useState<Partial<Barbearia>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user?.barbeariaId) {
            setLoading(true);
            api.getBarbeariaById(user.barbeariaId)
                .then(data => setBarbearia(data))
                .catch(() => toast.error("Falha ao carregar dados da barbearia."))
                .finally(() => setLoading(false));
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBarbearia(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!user?.barbeariaId || !user.id) return;
        
        const updates: Partial<Barbearia> = {
            nome: barbearia.nome,
            endereco: barbearia.endereco,
            link_personalizado: barbearia.link_personalizado,
        };

        setIsSaving(true);
        toast.promise(api.updateBarbearia(user.barbeariaId, user.id, updates), {
            loading: 'Salvando alterações...',
            success: () => {
                setIsSaving(false);
                return 'Configurações salvas com sucesso!';
            },
            error: (err) => {
                setIsSaving(false);
                return `Falha ao salvar: ${err.message}`;
            },
        });
    };

    if (loading) return <p className="text-center text-gray-400">Carregando...</p>;

    return (
        <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray max-w-2xl space-y-4">
             <h2 className="text-xl font-semibold text-white mb-4">Configurações da Barbearia</h2>
             <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-2">Nome da Barbearia</label>
                <input type="text" id="nome" name="nome" value={barbearia.nome || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
             </div>
             <div>
                <label htmlFor="endereco" className="block text-sm font-medium text-gray-300 mb-2">Endereço</label>
                <input type="text" id="endereco" name="endereco" value={barbearia.endereco || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
             </div>
             <div>
                <label htmlFor="link_personalizado" className="block text-sm font-medium text-gray-300 mb-2">Link Personalizado</label>
                <div className="flex items-center">
                    <span className="text-gray-400 bg-brand-gray px-3 py-2 rounded-l-md border border-r-0 border-gray-600">barberpro.app/agendar/</span>
                    <input type="text" id="link_personalizado" name="link_personalizado" value={barbearia.link_personalizado || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-r-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                </div>
             </div>
             <div className="pt-4">
                <button onClick={handleSave} disabled={isSaving} className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50">
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
             </div>
        </div>
    )
};


export const BarbeariaPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { slug } = useParams();

    const determineActiveTab = () => {
        const pathParts = location.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        const validTabs = ['dashboard', 'appointments', 'barbers', 'services', 'settings'];
        
        if (validTabs.includes(lastPart)) {
            return lastPart;
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
    
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <BarbeariaDashboard />;
            case 'barbers': return <ManageBarbers />;
            case 'services': return <ManageServices />;
            case 'appointments': return <ManageAppointments />;
            case 'settings': return <Settings />;
            default: return <BarbeariaDashboard />;
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex border-b border-brand-gray flex-wrap">
                <button onClick={() => handleTabChange('dashboard')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'dashboard' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Dashboard</button>
                <button onClick={() => handleTabChange('appointments')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'appointments' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Agendamentos</button>
                <button onClick={() => handleTabChange('barbers')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'barbers' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Barbeiros</button>
                <button onClick={() => handleTabChange('services')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'services' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Serviços</button>
                <button onClick={() => handleTabChange('settings')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'settings' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Configurações</button>
            </div>
            {renderContent()}
        </div>
    );
};