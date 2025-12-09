import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import { Barbearia, Plano, User } from '@/types';
import { DollarSignIcon, UsersIcon, StoreIcon, ClipboardListIcon } from '@/components/icons';
import Modal from '@/components/Modal';
import BarbershopModal from '@/pages/admin/BarbershopModal';
import PlanModal from '@/pages/admin/PlanModal';
import SettingsPage from '@/pages/admin/SettingsPage';
import ManageExpenses from '@/pages/admin/ManageExpenses';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

// --- Componentes de Dashboard ---

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray flex items-center shadow-lg">
        <div className="p-3 rounded-full bg-brand-gray mr-4">{icon}</div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getAdminDashboardData();
            setStats(data);
        } catch (error) {
            toast.error("Falha ao carregar dados do dashboard.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

    if (loading) return <p className="text-center text-gray-400">Carregando...</p>;
    if (!stats) return <p className="text-center text-gray-400">Não foi possível carregar os dados.</p>;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Receita Mensal Estimada" value={formatCurrency(stats.totalRevenue)} icon={<DollarSignIcon className="w-6 h-6 text-brand-gold" />} />
                <StatCard title="Gasto Mensal Total" value={formatCurrency(stats.totalMonthlyExpense)} icon={<DollarSignIcon className="w-6 h-6 text-red-400" />} />
                <StatCard title="Total de Barbearias" value={stats.totalBarbearias} icon={<StoreIcon className="w-6 h-6 text-brand-gold" />} />
                <StatCard title="Barbearias Ativas" value={stats.activeBarbearias} icon={<StoreIcon className="w-6 h-6 text-green-400" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-brand-dark p-6 rounded-lg border border-brand-gray">
                    <h3 className="text-xl font-semibold text-white mb-4">Crescimento de Usuários (Barbearia)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.userGrowthChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #444', color: '#fff' }} />
                            <Legend />
                            <Line type="monotone" dataKey="Usuários" stroke="#D4AF37" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                    <h3 className="text-xl font-semibold text-white mb-4">Novas Barbearias</h3>
                    <ul className="space-y-3">
                        {stats.latestBarbershops.map((b: any, index: number) => (
                            <li key={index} className="bg-brand-gray p-3 rounded-lg">
                                <p className="font-semibold text-white">{b.nome}</p>
                                <p className="text-xs text-gray-400">Criado em: {new Date(b.criado_em).toLocaleDateString()}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

// --- Componentes de Gerenciamento ---

const ManageBarbershops = () => {
    const [barbearias, setBarbearias] = useState<Barbearia[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [barbeariaToEdit, setBarbeariaToEdit] = useState<Barbearia | null>(null);

    const fetchBarbearias = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getBarbearias();
            setBarbearias(data);
        } catch (error) {
            toast.error("Falha ao carregar barbearias.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBarbearias();
    }, [fetchBarbearias]);

    const handleOpenCreateModal = () => {
        setBarbeariaToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (barbearia: Barbearia) => {
        setBarbeariaToEdit(barbearia);
        setIsModalOpen(true);
    };

    const handleSave = async (barbeariaData: any, password?: string, photoFile?: File) => {
        let promise;
        if (barbeariaToEdit) {
            promise = api.updateBarbearia(barbeariaToEdit.id, barbeariaToEdit.dono_id, barbeariaData, photoFile);
        } else {
            promise = api.createBarbeariaAndOwner(barbeariaData, password!, photoFile);
        }

        toast.promise(promise, {
            loading: 'Salvando barbearia...',
            success: () => {
                fetchBarbearias();
                setIsModalOpen(false);
                return `Barbearia ${barbeariaToEdit ? 'atualizada' : 'adicionada'} com sucesso!`;
            },
            error: (err) => `Falha ao salvar: ${err.message}`,
        });
    };

    const handleToggleStatus = (barbearia: Barbearia) => {
        const newStatus = barbearia.status === 'ativa' ? 'inativa' : 'ativa';
        const promise = api.updateBarbearia(barbearia.id, barbearia.dono_id, { status: newStatus });

        toast.promise(promise, {
            loading: 'Atualizando status...',
            success: () => {
                fetchBarbearias();
                return `Status alterado para ${newStatus} com sucesso!`;
            },
            error: (err) => `Falha ao alterar status: ${err.message}`,
        });
    };

    const handleDelete = (barbearia: Barbearia) => {
        if (window.confirm(`Tem certeza que deseja remover a barbearia "${barbearia.nome}"? Esta ação é irreversível e excluirá a conta do proprietário.`)) {
            toast.promise(api.deleteBarbearia(barbearia.id, barbearia.dono_id), {
                loading: 'Removendo...',
                success: () => {
                    fetchBarbearias();
                    return 'Barbearia removida com sucesso!';
                },
                error: (err) => `Falha ao remover: ${err.message}`,
            });
        }
    };

    return (
        <>
            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-xl font-semibold text-white">Gerenciar Barbearias</h2>
                    <button onClick={handleOpenCreateModal} className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90 w-full sm:w-auto">Adicionar Barbearia</button>
                </div>
                {loading ? <p className="text-center text-gray-400">Carregando...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-brand-gray text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3">Logo</th>
                                    <th className="px-6 py-3">Nome</th>
                                    <th className="px-6 py-3 hidden sm:table-cell">E-mail Dono</th>
                                    <th className="px-6 py-3 hidden md:table-cell">Plano</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {barbearias.map(b => (
                                    <tr key={b.id} className="border-b border-brand-gray hover:bg-brand-gray">
                                        <td className="px-6 py-4 align-middle">
                                            <img src={b.foto_url || 'https://via.placeholder.com/40'} alt={b.nome} className="w-10 h-10 rounded-full object-cover" />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white align-middle">{b.nome}</td>
                                        <td className="px-6 py-4 align-middle hidden sm:table-cell">{b.dono_email}</td>
                                        <td className="px-6 py-4 align-middle hidden md:table-cell">{b.plano || 'N/A'}</td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.status === 'ativa' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex flex-col space-y-1 sm:flex-row sm:space-x-2 sm:space-y-0 text-xs">
                                                <button onClick={() => handleOpenEditModal(b)} className="text-blue-400 hover:text-blue-300">Editar</button>
                                                <button onClick={() => handleToggleStatus(b)} className="text-yellow-400 hover:text-yellow-300">{b.status === 'ativa' ? 'Desativar' : 'Ativar'}</button>
                                                <button onClick={() => handleDelete(b)} className="text-red-400 hover:text-red-300">Excluir</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={barbeariaToEdit ? 'Editar Barbearia' : 'Adicionar Nova Barbearia'}>
                <BarbershopModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave} 
                    barbeariaToEdit={barbeariaToEdit} 
                />
            </Modal>
        </>
    );
};

const ManagePlans = () => {
    const [planos, setPlanos] = useState<Plano[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [planToEdit, setPlanToEdit] = useState<Plano | null>(null);

    const fetchPlans = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getPlanos();
            setPlanos(data);
        } catch (error) {
            toast.error("Falha ao carregar planos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const handleOpenModal = (plan: Plano | null = null) => {
        setPlanToEdit(plan);
        setIsModalOpen(true);
    };

    const handleSave = async (planoData: any) => {
        let promise;
        if (planToEdit && 'id' in planToEdit) {
            promise = api.updatePlano(planToEdit.id, planoData);
        } else {
            promise = api.createPlano(planoData);
        }

        toast.promise(promise, {
            loading: 'Salvando plano...',
            success: () => {
                fetchPlans();
                setIsModalOpen(false);
                return `Plano ${planToEdit ? 'atualizado' : 'adicionado'} com sucesso!`;
            },
            error: (err) => `Falha ao salvar: ${err.message}`,
        });
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja remover este plano?")) {
            toast.promise(api.deletePlano(id), {
                loading: 'Removendo...',
                success: () => {
                    fetchPlans();
                    return 'Plano removido com sucesso!';
                },
                error: (err) => `Falha ao remover: ${err.message}`,
            });
        }
    };

    return (
        <>
            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-xl font-semibold text-white">Gerenciar Planos</h2>
                    <button onClick={() => handleOpenModal()} className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90 w-full sm:w-auto">Adicionar Plano</button>
                </div>
                {loading ? <p className="text-center text-gray-400">Carregando...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-brand-gray text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3">Nome</th>
                                    <th className="px-6 py-3">Preço</th>
                                    <th className="px-6 py-3 hidden sm:table-cell">Limite Barbeiros</th>
                                    <th className="px-6 py-3 hidden md:table-cell">Popular</th>
                                    <th className="px-6 py-3">Ativo</th>
                                    <th className="px-6 py-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {planos.map(plano => (
                                    <tr key={plano.id} className="border-b border-brand-gray hover:bg-brand-gray">
                                        <td className="px-6 py-4 font-medium text-white">{plano.nome}</td>
                                        <td className="px-6 py-4 text-brand-gold">R$ {plano.preco.toFixed(2)}</td>
                                        <td className="px-6 py-4 hidden sm:table-cell">{plano.limite_barbeiros || 'Ilimitado'}</td>
                                        <td className="px-6 py-4 hidden md:table-cell">{plano.popular ? 'Sim' : 'Não'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${plano.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {plano.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 space-x-2 text-xs">
                                            <button onClick={() => handleOpenModal(plano)} className="text-blue-400 hover:text-blue-300">Editar</button>
                                            <button onClick={() => handleDelete(plano.id)} className="text-red-400 hover:text-red-300">Excluir</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={planToEdit ? 'Editar Plano' : 'Adicionar Novo Plano'}>
                <PlanModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave} 
                    planToEdit={planToEdit} 
                />
            </Modal>
        </>
    );
};


// --- Componente Principal ---

const AdminPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const determineActiveTab = () => {
        const pathEnd = location.pathname.split('/').pop();
        switch (pathEnd) {
            case 'barbershops': return 'barbershops';
            case 'plans': return 'plans';
            case 'settings': return 'settings';
            case 'expenses': return 'expenses';
            case 'dashboard':
            default: return 'dashboard';
        }
    };

    const [activeTab, setActiveTab] = useState(determineActiveTab());

    useEffect(() => {
        setActiveTab(determineActiveTab());
    }, [location.pathname]);

    const handleTabChange = (tab: string) => {
        navigate(`/admin/${tab}`);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <AdminDashboard />;
            case 'barbershops': return <ManageBarbershops />;
            case 'plans': return <ManagePlans />;
            case 'expenses': return <ManageExpenses />;
            case 'settings': return <SettingsPage />;
            default: return <AdminDashboard />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex border-b border-brand-gray flex-wrap gap-2 overflow-x-auto pb-2">
                <button onClick={() => handleTabChange('dashboard')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeTab === 'dashboard' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Dashboard</button>
                <button onClick={() => handleTabChange('barbershops')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeTab === 'barbershops' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Barbearias</button>
                <button onClick={() => handleTabChange('plans')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeTab === 'plans' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Planos</button>
                <button onClick={() => handleTabChange('expenses')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeTab === 'expenses' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Gastos</button>
                <button onClick={() => handleTabChange('settings')} className={`flex-shrink-0 px-4 py-2 text-sm font-medium ${activeTab === 'settings' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Configurações</button>
            </div>
            {renderContent()}
        </div>
    );
};

export default AdminPage;