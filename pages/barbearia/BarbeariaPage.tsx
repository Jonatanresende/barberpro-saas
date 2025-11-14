import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Barbeiro, Servico, Agendamento, AppointmentStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CalendarIcon, ScissorsIcon, UsersIcon } from '../../components/icons';

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
    const [stats, setStats] = useState({ totalAgendamentos: 0, totalBarbeiros: 0, totalClientes: 0 });

    useEffect(() => {
        if(user?.barbeariaId) {
            api.getBarbeariaDashboardStats(user.barbeariaId).then(setStats);
        }
    }, [user]);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Agendamentos Hoje" value={stats.totalAgendamentos} icon={<CalendarIcon className="w-6 h-6 text-brand-gold" />} />
            <StatCard title="Total de Barbeiros" value={stats.totalBarbeiros} icon={<ScissorsIcon className="w-6 h-6 text-brand-gold" />} />
            <StatCard title="Total de Clientes" value={stats.totalClientes} icon={<UsersIcon className="w-6 h-6 text-brand-gold" />} />
        </div>
    );
};

const ManageBarbers = () => {
    const { user } = useAuth();
    const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
    
    useEffect(() => {
        if(user?.barbeariaId) {
            api.getBarbeirosByBarbearia(user.barbeariaId).then(setBarbeiros);
        }
    }, [user]);

    return (
        <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Gerenciar Barbeiros</h2>
                <button className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90">Adicionar Barbeiro</button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {barbeiros.map(barbeiro => (
                    <div key={barbeiro.id} className="bg-brand-gray p-4 rounded-lg text-center">
                        <img src={barbeiro.foto_url} alt={barbeiro.nome} className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-brand-gold"/>
                        <h3 className="font-semibold text-white">{barbeiro.nome}</h3>
                        <p className="text-sm text-gray-400">{barbeiro.especialidade}</p>
                        <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-semibold ${barbeiro.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                           {barbeiro.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ManageServices = () => {
    const { user } = useAuth();
    const [servicos, setServicos] = useState<Servico[]>([]);

    useEffect(() => {
        if(user?.barbeariaId) {
            api.getServicosByBarbearia(user.barbeariaId).then(setServicos);
        }
    }, [user]);
    
    return (
        <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Gerenciar Serviços</h2>
                <button className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90">Adicionar Serviço</button>
            </div>
            <ul className="space-y-3">
                {servicos.map(servico => (
                    <li key={servico.id} className="bg-brand-gray p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-white">{servico.nome}</p>
                            <p className="text-sm text-gray-400">{servico.duracao} min</p>
                        </div>
                        <p className="text-lg font-bold text-brand-gold">R$ {servico.preco.toFixed(2)}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ManageAppointments = () => {
    const { user } = useAuth();
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    
    useEffect(() => {
        if (user?.barbeariaId) {
            api.getAgendamentosByBarbearia(user.barbeariaId).then(setAgendamentos);
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
            <h2 className="text-xl font-semibold mb-4 text-white">Todos os Agendamentos</h2>
            <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-brand-gray text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Cliente</th>
                            <th className="px-6 py-3">Serviço</th>
                            <th className="px-6 py-3">Barbeiro</th>
                            <th className="px-6 py-3">Data & Hora</th>
                            <th className="px-6 py-3">Status</th>
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
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Settings = () => {
    const [link, setLink] = useState('navalha-de-ouro');
    return (
        <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray max-w-lg">
             <h2 className="text-xl font-semibold text-white mb-4">Configurações da Barbearia</h2>
             <div>
                <label htmlFor="custom-link" className="block text-sm font-medium text-gray-300 mb-2">Link Personalizado</label>
                <div className="flex items-center">
                    <span className="text-gray-400 bg-brand-gray px-3 py-2 rounded-l-md border border-r-0 border-gray-600">barberpro.app/</span>
                    <input type="text" id="custom-link" value={link} onChange={e => setLink(e.target.value)} className="bg-brand-gray w-full px-3 py-2 rounded-r-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
                </div>
                <button className="mt-4 bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90">Salvar Alterações</button>
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