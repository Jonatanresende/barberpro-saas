import React, { useEffect, useState, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '@/services/api';
import { Barbearia, Plano } from '@/types';
import { ActivityIcon, DollarSignIcon, StoreIcon, UsersIcon } from '@/components/icons';
import SettingsPage from '@/pages/admin/SettingsPage';
import Modal from '@/components/Modal';
import BarbershopModal from '@/pages/admin/BarbershopModal';
import PlanModal from '@/pages/admin/PlanModal';

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
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateTime, setDateTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const dashboardData = await api.getAdminDashboardData();
                setData(dashboardData);
                setError(null);
            } catch (err: any) {
                const errorMessage = err.message || 'Falha ao carregar dados do dashboard.';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="text-center py-10 text-gray-400">Carregando dados do dashboard...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-400">Erro: {error}</div>;
    }

    if (!data) return null;

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Dashboard Geral</h2>
                    <p className="text-gray-400">Bem-vindo ao painel de administrador.</p>
                </div>
                <div className="text-right bg-brand-dark p-3 rounded-lg border border-brand-gray">
                    <p className="text-lg font-semibold text-white">{dateTime.toLocaleTimeString('pt-BR')}</p>
                    <p className="text-sm text-gray-400">{dateTime.toLocaleDateString('pt-BR', { dateStyle: 'full' })}</p>
                </div>
            </div>

            <div className="bg-brand-dark p-4 rounded-lg border border-brand-gray">
                <p className="text-sm text-gray-300">
                    🔔 Última atividade: Nova barbearia cadastrada - <span className="font-semibold text-brand-gold">{data.latestBarbershops[0]?.nome}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Receita Total" value={`R$ ${data.totalRevenue.toFixed(2)}`} icon={<DollarSignIcon className="w-6 h-6 text-brand-gold" />} />
                <StatCard title="Total de Barbearias" value={data.totalBarbearias} icon={<StoreIcon className="w-6 h-6 text-brand-gold" />} />
                <StatCard title="Total de Usuários" value={data.totalBarbershopUsers} icon={<UsersIcon className="w-6 h-6 text-brand-gold" />} />
                <StatCard title="Barbearias Ativas" value={data.activeBarbearias} icon={<ActivityIcon className="w-6 h-6 text-brand-gold" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                    <h3 className="text-lg font-semibold text-white mb-4">Crescimento de Usuários</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.userGrowthChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#111111', border: '1px solid #374151' }} />
                            <Legend />
                            <Line type="monotone" dataKey="Usuários" stroke="#D4AF37" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                    <h3 className="text-lg font-semibold text-white mb-4">Receita Mensal (R$)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.monthlyRevenueChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#111111', border: '1px solid #374151' }} />
                            <Legend />
                            <Bar dataKey="Receita" fill="#D4AF37" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <h3 className="text-lg font-semibold text-white mb-4">Últimas Barbearias Cadastradas</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-brand-gray text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">Nome da Barbearia</th>
                                <th className="px-6 py-3">Data de Cadastro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.latestBarbershops.map((barbershop: any, index: number) => (
                                <tr key={index} className="border-b border-brand-gray hover:bg-brand-gray">
                                    <td className="px-6 py-4 font-medium text-white">{barbershop.nome}</td>
                                    <td className="px-6 py-4">{new Date(barbershop.criado_em).toLocaleString('pt-BR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

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
            toast.error('Falha ao carregar barbearias.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBarbearias(); }, [fetchBarbearias]);

    const handleOpenCreateModal = () => {
        setBarbeariaToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (barbearia: Barbearia) => {
        setBarbeariaToEdit(barbearia);
        setIsModalOpen(true);
    };

    const handleSave = async (barbeariaData: any, password?: string, photoFile?: File) => {
        const toastId = toast.loading('Salvando...');
        try {
            if (barbeariaToEdit) {
                await api.updateBarbearia(barbeariaToEdit.id, barbeariaToEdit.dono_id!, barbeariaData, photoFile);
            } else {
                await api.createBarbeariaAndOwner(barbeariaData, password!, photoFile);
            }
            toast.success(`Barbearia ${barbeariaToEdit ? 'atualizada' : 'cadastrada'} com sucesso!`, { id: toastId });
            fetchBarbearias();
            setIsModalOpen(false);
        } catch (err: any) {
            toast.error(`Falha ao salvar: ${err.message}`, { id: toastId });
        }
    };

    const handleToggleStatus = async (barbearia: Barbearia) => {
        const newStatus = barbearia.status === 'ativa' ? 'inativa' : 'ativa';
        const toastId = toast.loading('Atualizando status...');
        try {
            await api.updateBarbearia(barbearia.id, barbearia.dono_id!, { status: newStatus });
            toast.success('Status atualizado com sucesso!', { id: toastId });
            fetchBarbearias();
        } catch (err: any) {
            toast.error(`Falha ao atualizar status: ${err.message}`, { id: toastId });
        }
    };

    const handleDelete = (barbearia: Barbearia) => {
        if (window.confirm('Tem certeza que deseja excluir esta barbearia e a conta do proprietário? Esta ação não pode ser desfeita.')) {
            const toastId = toast.loading('Excluindo...');
            api.deleteBarbearia(barbearia.id, barbearia.dono_id!)
                .then(() => {
                    toast.success('Barbearia e proprietário excluídos com sucesso!', { id: toastId });
                    setBarbearias(prev => prev.filter(b => b.id !== barbearia.id));
                })
                .catch((err) => {
                    toast.error(`Falha ao excluir: ${err.message}`, { id: toastId });
                });
        }
    };

    return (
        <>
            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Gerenciar Barbearias</h2>
                    <button onClick={handleOpenCreateModal} className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90">
                        Cadastrar Barbearia
                    </button>
                </div>
                <div className="overflow-x-auto">
                    {loading ? <p className="text-center text-gray-400">Carregando...</p> : (
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-brand-gray text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3">Foto</th>
                                    <th className="px-6 py-3">Nome</th>
                                    <th className="px-6 py-3">Dono</th>
                                    <th className="px-6 py-3">Plano</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Data de Criação</th>
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
                                        <td className="px-6 py-4 align-middle">{b.dono_email}</td>
                                        <td className="px-6 py-4 align-middle">{b.plano}</td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.status === 'ativa' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">{new Date(b.criado_em).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => handleOpenEditModal(b)} className="text-blue-400 hover:text-blue-300">Editar</button>
                                                <button onClick={() => handleToggleStatus(b)} className="text-yellow-400 hover:text-yellow-300">{b.status === 'ativa' ? 'Desativar' : 'Ativar'}</button>
                                                <button onClick={() => handleDelete(b)} className="text-red-400 hover:text-red-300">Excluir</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={barbeariaToEdit ? 'Editar Barbearia' : 'Cadastrar Barbearia'}>
                <BarbershopModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} barbeariaToEdit={barbeariaToEdit} />
            </Modal>
        </>
    );
};

const Plans = () => {
    const [planos, setPlanos] = useState<Plano[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [planToEdit, setPlanToEdit] = useState<Plano | null>(null);

    const fetchPlanos = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getPlanos();
            setPlanos(data);
        } catch (error) {
            toast.error('Falha ao carregar planos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPlanos(); }, [fetchPlanos]);

    const handleOpenCreateModal = () => {
        setPlanToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (plano: Plano) => {
        setPlanToEdit(plano);
        setIsModalOpen(true);
    };

    const handleSave = async (planoData: any) => {
        const toastId = toast.loading('Salvando plano...');
        try {
            if (planToEdit) {
                await api.updatePlano(planToEdit.id, planoData);
            } else {
                await api.createPlano(planoData);
            }
            toast.success(`Plano ${planToEdit ? 'atualizado' : 'criado'} com sucesso!`, { id: toastId });
            fetchPlanos();
            setIsModalOpen(false);
        } catch (err: any) {
            toast.error(`Falha ao salvar: ${err.message}`, { id: toastId });
        }
    };

    const handleDelete = (plano: Plano) => {
        if (window.confirm(`Tem certeza que deseja excluir o plano "${plano.nome}"?`)) {
            const toastId = toast.loading('Excluindo...');
            api.deletePlano(plano.id)
                .then(() => {
                    toast.success('Plano excluído com sucesso!', { id: toastId });
                    fetchPlanos();
                })
                .catch((err) => {
                    toast.error(`Falha ao excluir: ${err.message}`, { id: toastId });
                });
        }
    };

    return (
        <>
            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-white">Gerenciar Planos</h2>
                    <button onClick={handleOpenCreateModal} className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90">
                        Criar Novo Plano
                    </button>
                </div>
                {loading ? <p className="text-center text-gray-400">Carregando planos...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {planos.map(plano => (
                            <div key={plano.id} className={`border rounded-lg p-6 text-center flex flex-col ${plano.popular ? 'border-2 border-brand-gold' : 'border-brand-gray'}`}>
                                {plano.popular && <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-gold text-brand-dark px-3 py-1 text-sm font-bold rounded-full">POPULAR</span>}
                                <h3 className="text-2xl font-bold text-brand-gold">{plano.nome}</h3>
                                <p className="text-4xl font-extrabold my-4">R${plano.preco.toFixed(2)}<span className="text-base font-medium text-gray-400">/mês</span></p>
                                <ul className="space-y-2 text-gray-300 text-left flex-grow">
                                    {plano.features.map((feature, index) => <li key={index}>- {feature}</li>)}
                                </ul>
                                <div className="mt-6 flex justify-center space-x-2">
                                    <button onClick={() => handleOpenEditModal(plano)} className="text-blue-400 hover:text-blue-300 font-semibold">Editar</button>
                                    <button onClick={() => handleDelete(plano)} className="text-red-400 hover:text-red-300 font-semibold">Excluir</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={planToEdit ? 'Editar Plano' : 'Criar Novo Plano'}>
                <PlanModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} planToEdit={planToEdit} />
            </Modal>
        </>
    );
};

const AdminPage = () => {
    const location = useLocation();
    const renderContent = () => {
        const path = location.pathname;
        if (path.endsWith('/barbershops')) return <ManageBarbershops />;
        if (path.endsWith('/plans')) return <Plans />;
        if (path.endsWith('/settings')) return <SettingsPage />;
        return <AdminDashboard />;
    };
    return (
        <div className="space-y-6">
            <div className="flex border-b border-brand-gray flex-wrap">
                <NavLink to="/admin/dashboard" className={({ isActive }) => `px-4 py-2 text-sm font-medium ${isActive ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Dashboard</NavLink>
                <NavLink to="/admin/barbershops" className={({ isActive }) => `px-4 py-2 text-sm font-medium ${isActive ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Barbearias</NavLink>
                <NavLink to="/admin/plans" className={({ isActive }) => `px-4 py-2 text-sm font-medium ${isActive ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Planos</NavLink>
                <NavLink to="/admin/settings" className={({ isActive }) => `px-4 py-2 text-sm font-medium ${isActive ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Configurações</NavLink>
            </div>
            <div className="mt-6">{renderContent()}</div>
        </div>
    );
};

export default AdminPage;