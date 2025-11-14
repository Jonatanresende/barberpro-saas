import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Barbearia, Servico } from '../../types';
import { InstagramIcon, WhatsAppIcon, ScissorsIcon } from '../../components/icons';

const PublicProfilePage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [barbearia, setBarbearia] = useState<Barbearia | null>(null);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchData();
    }, [slug]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-black text-white">Carregando...</div>;
    }

    if (!barbearia) {
        return <div className="flex items-center justify-center h-screen bg-black text-white">Barbearia não encontrada.</div>;
    }

    return (
        <div className="bg-[#121212] text-white font-sans">
            {/* Header */}
            <header className="bg-black/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex justify-between items-center">
                    <span className="text-sm">Seg. à Sáb.</span>
                    <span className="text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        Minha Conta
                    </span>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center text-center bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1585749425332-9b175015e5d0?q=80&w=2070&auto=format&fit=crop')" }}>
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <img src={barbearia.foto_url} alt={`Logo ${barbearia.nome}`} className="w-40 h-40 rounded-full object-cover border-4 border-brand-gold mb-4" />
                    <h1 className="text-4xl md:text-5xl font-bold">{barbearia.nome}</h1>
                    <p className="text-brand-gold mt-1">AGENDE SEU HORÁRIO</p>
                    <p className="mt-4 max-w-md">Escolha o seu estilo que a gente capricha!</p>
                    <Link to={`/${slug}/agendamento`} className="mt-6 bg-orange-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        AGENDAR HORÁRIO
                    </Link>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-16 bg-cover bg-center" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/brick-wall.png')" }}>
                 <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-2">Nossos serviços</h2>
                    <div className="w-24 h-1 bg-orange-500 mx-auto mb-12"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {servicos.map(servico => (
                            <div key={servico.id} className="relative group overflow-hidden rounded-lg">
                                <img src={servico.imagem_url || 'https://images.unsplash.com/photo-1622288432453-531452789e54?q=80&w=1974&auto=format&fit=crop'} alt={servico.nome} className="w-full h-60 object-cover transform group-hover:scale-110 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                                    <ScissorsIcon className="w-10 h-10 text-orange-500 mb-2" />
                                    <h3 className="text-2xl font-semibold">{servico.nome}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to={`/${slug}/agendamento`} className="mt-12 inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-600 transition-colors">
                        Agende seu horário →
                    </Link>
                </div>
            </section>

            {/* Social Section */}
            <section className="py-16 bg-[#f5f5f5] text-black">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold">SIGA-NOS!</h2>
                    <p className="text-gray-600 mt-2 mb-8">Acompanhe nossa rede social</p>
                    <div className="flex justify-center items-center gap-6">
                        <a href={barbearia.instagram_url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                            <InstagramIcon className="w-8 h-8" />
                        </a>
                        <a href={barbearia.whatsapp_url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                            <WhatsAppIcon className="w-8 h-8" />
                        </a>
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
    );
};

export default PublicProfilePage;