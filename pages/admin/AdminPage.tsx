import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { Barbearia } from '../../types';
import { ScissorsIcon, StoreIcon, UsersIcon } from '../../components/icons';

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray flex items-center">
    <div className="p-3 rounded-full bg-brand-gray mr-4">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalBarbearias: 0, usuariosAtivos: 0, totalBarbeiros: 0 });

    useEffect(() => {
        api.getAdminDashboardStats().then(setStats);
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total de Barbearias" value={stats.totalBarbearias} icon={<StoreIcon className="w-6 h-6 text-brand-gold" />} />
            <StatCard title="Usuários Ativos" value={stats.usuariosAtivos} icon={<UsersIcon className="w-6 h-6 text-brand-gold" />} />
            <StatCard title="Total de Barbeiros" value={stats.totalBarbeiros} icon={<ScissorsIcon className="w-6 h-6 text-brand-gold" />} />
        </div>
    );
};

const ManageBarbershops = () => {
    const [barbearias, setBarbearias] = useState<Barbearia[]>([]);

    useEffect(() => {
        api.getBarbearias().then(setBarbearias);
    }, []);

    return (
        <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
            <h2 className="text-xl font-semibold mb-4 text-white">Gerenciar Barbearias</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-brand-gray text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Nome</th>
                            <th className="px-6 py-3">Dono</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Data de Criação</th>
                            <th className="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {barbearias.map(b => (
                            <tr key={b.id} className="border-b border-brand-gray hover:bg-brand-gray">
                                <td className="px-6 py-4 font-medium text-white">{b.nome}</td>
                                <td className="px-6 py-4">{b.dono_email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.status === 'ativa' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {b.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{new Date(b.criado_em).toLocaleDateString()}</td>
                                <td className="px-6 py-4 flex space-x-2">
                                    <button className="text-blue-400 hover:text-blue-300">Editar</button>
                                    <button className="text-yellow-400 hover:text-yellow-300">Desativar</button>
                                    <button className="text-red-400 hover:text-red-300">Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Plans = () => (
    <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
        <h2 className="text-xl font-semibold mb-4 text-white">Planos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-brand-gray rounded-lg p-6 text-center">
                <h3 className="text-2xl font-bold text-brand-gold">Básico</h3>
                <p className="text-4xl font-extrabold my-4">R$49<span className="text-base font-medium text-gray-400">/mês</span></p>
                <ul className="space-y-2 text-gray-300">
                    <li>Até 3 Barbeiros</li>
                    <li>Agendamento Online</li>
                    <li>Página Personalizada</li>
                </ul>
                <button className="mt-6 w-full bg-brand-gold text-brand-dark font-bold py-2 rounded-lg">Selecionar Plano</button>
            </div>
            <div className="border-2 border-brand-gold rounded-lg p-6 text-center relative">
                <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-gold text-brand-dark px-3 py-1 text-sm font-bold rounded-full">POPULAR</span>
                <h3 className="text-2xl font-bold text-brand-gold">Premium</h3>
                <p className="text-4xl font-extrabold my-4">R$99<span className="text-base font-medium text-gray-400">/mês</span></p>
                <ul className="space-y-2 text-gray-300">
                    <li>Barbeiros Ilimitados</li>
                    <li>Tudo do Básico</li>
                    <li>Relatórios Avançados</li>
                    <li>Suporte Prioritário</li>
                </ul>
                 <button className="mt-6 w-full bg-brand-gold text-brand-dark font-bold py-2 rounded-lg">Selecionar Plano</button>
            </div>
        </div>
    </div>
);

const AdminPage = () => {
    const location = useLocation();
    
    const renderContent = () => {
        const path = location.pathname;
        if (path.endsWith('/barbershops')) {
            return <ManageBarbershops />;
        }
        if (path.endsWith('/plans')) {
            return <Plans />;
        }
        return <AdminDashboard />;
    };

    return (
        <div className="space-y-6">
            <div className="flex border-b border-brand-gray">
                <NavLink 
                    to="/admin/dashboard" 
                    className={({ isActive }) => `px-4 py-2 text-sm font-medium ${isActive ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}
                >
                    Dashboard
                </NavLink>
                <NavLink 
                    to="/admin/barbershops" 
                    className={({ isActive }) => `px-4 py-2 text-sm font-medium ${isActive ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}
                >
                    Barbearias
                </NavLink>
                <NavLink 
                    to="/admin/plans" 
                    className={({ isActive }) => `px-4 py-2 text-sm font-medium ${isActive ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}
                >
                    Planos
                </NavLink>
            </div>
            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdminPage;