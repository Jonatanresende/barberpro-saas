import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import { Barbearia, Servico, Agendamento } from '@/types';
import { InstagramIcon, WhatsAppIcon, ScissorsIcon, CalendarIcon, UsersIcon } from '@/components/icons';
import ClientAccountModal from '@/pages/cliente/ClientAccountModal';
import ClientAppointmentModal from '@/pages/cliente/ClientAppointmentModal';
import ClientHistoryModal from '@/pages/cliente/ClientHistoryModal';

const PublicProfilePage = () => {
    const { slug } = useParams<{ slug: string }>();
    const [barbearia, setBarbearia] = useState<Barbearia | null>(null);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal States
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // Data States
    const [foundAppointment, setFoundAppointment] = useState<Agendamento | null>(null);
    const [clientPhone, setClientPhone] = useState('');
    const [clientHistory, setClientHistory] = useState<Agendamento[]>([]);
    const [clientNameForHistory, setClientNameForHistory] = useState('');

    const fetchData = async () => {
        if (!slug) return;
        try {
            setLoading(true);
            const barbeariaData = await api.getBarbeariaBySlug(slug);
            if (barbeariaData) {
                setBarbearia(barbeariaData);
                const servicosData = await api.getServicosByBarbearia(barbeariaData.id);
                setServicos(servicosData);
            } else {
                toast.error("Barbearia não encontrada.");
            }
        } catch (error) {
            toast.error("Falha ao carregar dados da barbearia.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [slug]);

    const handleAppointmentFound = (appointment: Agendamento, phone: string) => {
        setFoundAppointment(appointment);
        setClientPhone(phone);
        setIsAppointmentModalOpen(true);
    };

    const handleHistoryFound = (clientName: string, appointments: Agendamento[]) => {
        setClientNameForHistory(clientName);
        setClientHistory(appointments);
        setIsHistoryModalOpen(true);
    };

    const resetAppointmentState = () => {
        setFoundAppointment(null);
        setClientPhone('');
        setIsAppointmentModalOpen(false);
    };

    const resetHistoryState = () => {
        setClientHistory([]);
        setClientNameForHistory('');
        setIsHistoryModalOpen(false);
    };

    const handleAppointmentUpdate = () => {
        // Após cancelar, reabre o modal de busca para verificar o status ou fechar
        resetAppointmentState();
        // Reabre o modal de conta para que o cliente possa buscar novamente ou ver o histórico
        setIsAccountModalOpen(true); 
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-black text-white">Carregando...</div>;
    }

    if (!barbearia) {
        return <div className="flex items-center justify-center h-screen bg-black text-white">Barbearia não encontrada.</div>;
    }

    const defaultHeroImage = 'https://images.unsplash.com/photo-1585749425332-9b175015e5d0?q=80&w=2070&auto=format&fit=crop';

    return (
        <>
            <div className="bg-[#121212] text-white font-sans">
                {/* Header */}
                <header className="bg-black/80 backdrop-blur-sm sticky top-0 z-50">
                    <div className="container mx-auto px-4 h-16 flex justify-end items-center">
                        <button onClick={() => setIsAccountModalOpen(true)} className="text-sm flex items-center gap-2 hover:text-brand-gold transition-colors">
                            <UsersIcon className="h-5 w-5" />
                            Minha Conta
                        </button>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative h-[60vh] flex items-center justify-center text-center bg-cover bg-center" style={{ backgroundImage: `url(${barbearia.hero_image_url || defaultHeroImage})` }}>
                    <div className="absolute inset-0 bg-black/60"></div>
                    <div className="relative z-10 flex flex-col items-center p-4">
                        {barbearia.foto_url ? (
                            <img src={barbearia.foto_url} alt={`Logo ${barbearia.nome}`} className="w-40 h-40 rounded-full object-cover border-4 border-brand-gold mb-4" />
                        ) : (
                            <div className="w-40 h-40 rounded-full border-4 border-brand-gold mb-4 bg-brand-gray flex items-center justify-center">
                                <ScissorsIcon className="w-20 h-20 text-brand-gold" />
                            </div>
                        )}
                        <h1 className="text-4xl md:text-5xl font-bold">{barbearia.nome}</h1>
                        <p className="text-brand-gold mt-1">{barbearia.hero_title}</p>
                        <p className="mt-4 max-w-md">{barbearia.hero_subtitle}</p>
                        <Link to={`/${slug}/agendamento`} className="mt-6 bg-brand-gold text-brand-dark font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5" />
                            AGENDAR HORÁRIO
                        </Link>
                    </div>
                </section>

                {/* Services Section */}
                <section className="py-16 bg-cover bg-center" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/brick-wall.png')" }}>
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-4xl font-bold mb-2">{barbearia.services_title}</h2>
                        <div className="w-24 h-1 bg-brand-gold mx-auto mb-12"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            {servicos.map(servico => (
                                <div key={servico.id} className="bg-brand-dark border border-brand-gray p-6 rounded-lg text-left">
                                    <h3 className="text-xl font-bold text-white">{servico.nome}</h3>
                                    <div className="flex justify-between items-baseline mt-2">
                                        <span className="text-gray-400">{servico.duracao} min</span>
                                        <span className="text-2xl font-bold text-brand-gold">R${servico.preco.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link to={`/${slug}/agendamento`} className="mt-12 inline-block bg-brand-gold text-brand-dark font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-colors">
                            Agende seu horário →
                        </Link>
                    </div>
                </section>

                {/* Social Section */}
                <section className="py-16 bg-[#f5f5f5] text-black">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-4xl font-bold">{barbearia.social_title}</h2>
                        <p className="text-gray-600 mt-2 mb-8">{barbearia.social_subtitle}</p>
                        <div className="flex justify-center items-center gap-6">
                            {barbearia.instagram_url && (
                                <a href={barbearia.instagram_url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                                    <InstagramIcon className="w-8 h-8" />
                                </a>
                            )}
                            {barbearia.whatsapp_url && (
                                <a href={barbearia.whatsapp_url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                                    <WhatsAppIcon className="w-8 h-8" />
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-black py-4">
                    <div className="container mx-auto px-4 text-center text-sm text-gray-400">
                        © {new Date().getFullYear()} - Todos os direitos reservados
                    </div>
                </footer>
            </div>
            
            {/* Modals */}
            <ClientAccountModal 
                isOpen={isAccountModalOpen} 
                onClose={() => setIsAccountModalOpen(false)} 
                onAppointmentFound={handleAppointmentFound}
                onHistoryFound={handleHistoryFound}
            />
            {barbearia && (
                <ClientAppointmentModal
                    isOpen={isAppointmentModalOpen}
                    onClose={resetAppointmentState}
                    appointment={foundAppointment}
                    barbearia={barbearia}
                    clientPhone={clientPhone}
                    onAppointmentUpdate={handleAppointmentUpdate}
                />
            )}
            <ClientHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={resetHistoryState}
                clientName={clientNameForHistory}
                appointments={clientHistory}
            />
        </>
    );
};

export default PublicProfilePage;