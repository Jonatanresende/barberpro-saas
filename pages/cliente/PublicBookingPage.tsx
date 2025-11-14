import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Barbearia, Barbeiro, Servico, AppointmentStatus, Agendamento } from '../../types';
import Calendar from '../../components/booking/Calendar';
import TimeSlots from '../../components/booking/TimeSlots';

const PublicBookingPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    // Data state
    const [barbearia, setBarbearia] = useState<Barbearia | null>(null);
    const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [agendamentosDoDia, setAgendamentosDoDia] = useState<Pick<Agendamento, 'hora' | 'barbeiro_id'>[]>([]);

    // Form state
    const [clienteNome, setClienteNome] = useState('');
    const [clienteTelefone, setClienteTelefone] = useState('');
    const [selectedServico, setSelectedServico] = useState<Servico | null>(null);
    const [selectedBarbeiro, setSelectedBarbeiro] = useState<Barbeiro | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // UI state
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch initial barbershop data
    useEffect(() => {
        const fetchBarbeariaData = async () => {
            if (!slug) return;
            try {
                setLoading(true);
                const data = await api.getBarbeariaBySlug(slug);
                if (data) {
                    setBarbearia(data);
                    const [barbeirosData, servicosData] = await Promise.all([
                        api.getBarbeirosByBarbearia(data.id),
                        api.getServicosByBarbearia(data.id)
                    ]);
                    setBarbeiros(barbeirosData.filter(b => b.ativo));
                    setServicos(servicosData);
                }
            } catch (error) {
                toast.error("Não foi possível carregar os dados da barbearia.");
            } finally {
                setLoading(false);
            }
        };
        fetchBarbeariaData();
    }, [slug]);

    // Fetch appointments for the selected date
    useEffect(() => {
        if (selectedDate && barbearia) {
            const dateString = selectedDate.toISOString().split('T')[0];
            api.getAgendamentosByDate(barbearia.id, dateString)
                .then(setAgendamentosDoDia)
                .catch(() => toast.error("Erro ao buscar horários."));
        }
    }, [selectedDate, barbearia]);

    const availableTimes = useMemo(() => {
        // Placeholder for business hours - to be replaced with dynamic data
        const times = [];
        for (let i = 9; i <= 18; i++) {
            times.push(`${String(i).padStart(2, '0')}:00`);
            if (i < 18) times.push(`${String(i).padStart(2, '0')}:30`);
        }
        return times;
    }, []);

    const bookedTimes = useMemo(() => {
        if (!selectedBarbeiro) return [];
        return agendamentosDoDia
            .filter(ag => ag.barbeiro_id === selectedBarbeiro.id)
            .map(ag => ag.hora);
    }, [agendamentosDoDia, selectedBarbeiro]);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setSelectedTime(null); // Reset time when date changes
    };

    const handleBarberSelect = (barber: Barbeiro) => {
        setSelectedBarbeiro(barber);
        setSelectedTime(null); // Reset time when barber changes
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barbearia || !selectedServico || !selectedBarbeiro || !selectedDate || !selectedTime || !clienteNome || !clienteTelefone) {
            toast.error("Por favor, preencha todos os campos.");
            return;
        }
        setIsSubmitting(true);
        try {
            await api.createAgendamento({
                barbearia_id: barbearia.id,
                servico_id: selectedServico.id,
                servico_nome: selectedServico.nome,
                barbeiro_id: selectedBarbeiro.id,
                barbeiro_nome: selectedBarbeiro.nome,
                data: selectedDate.toISOString().split('T')[0],
                hora: selectedTime,
                cliente_nome: clienteNome,
                cliente_telefone: clienteTelefone,
                status: AppointmentStatus.PENDENTE,
            });
            navigate('/confirmation');
        } catch (error: any) {
            toast.error(`Falha ao agendar: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-brand-dark text-white">Carregando...</div>;
    if (!barbearia) return <div className="flex items-center justify-center h-screen bg-brand-dark text-white">Barbearia não encontrada.</div>;

    const isFormComplete = barbearia && selectedServico && selectedBarbeiro && selectedDate && selectedTime && clienteNome && clienteTelefone;

    return (
        <div className="min-h-screen bg-brand-dark text-white font-sans">
            <header className="relative h-64">
                <img src={barbearia.foto_url} alt={barbearia.nome} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-white">{barbearia.nome}</h1>
                    <p className="text-lg text-gray-300 mt-2">{barbearia.endereco}</p>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8">
                <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Left Column: Steps */}
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-brand-gold mb-4">1. Seus Dados</h2>
                            <div className="space-y-4">
                                <input type="text" value={clienteNome} onChange={e => setClienteNome(e.target.value)} placeholder="Seu Nome Completo" required className="bg-brand-gray w-full px-4 py-3 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold" />
                                <input type="tel" value={clienteTelefone} onChange={e => setClienteTelefone(e.target.value)} placeholder="Seu Telefone (WhatsApp)" required className="bg-brand-gray w-full px-4 py-3 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold" />
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-brand-gold mb-4">2. Escolha o Serviço</h2>
                            <div className="space-y-3">
                                {servicos.map(s => (
                                    <button key={s.id} type="button" onClick={() => setSelectedServico(s)} className={`w-full p-4 rounded-lg text-left border-2 transition flex justify-between items-center ${selectedServico?.id === s.id ? 'border-brand-gold bg-brand-gray' : 'border-gray-600 bg-brand-dark hover:border-gray-500'}`}>
                                        <div>
                                            <p className="font-semibold">{s.nome}</p>
                                            <p className="text-sm text-gray-400">{s.duracao} min</p>
                                        </div>
                                        <p className="font-bold text-brand-gold">R${s.preco.toFixed(2)}</p>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-brand-gold mb-4">3. Escolha o Barbeiro</h2>
                            <div className="flex space-x-4 overflow-x-auto pb-2">
                                {barbeiros.map(b => (
                                    <button key={b.id} type="button" onClick={() => handleBarberSelect(b)} className={`flex-shrink-0 p-3 rounded-lg text-center border-2 transition ${selectedBarbeiro?.id === b.id ? 'border-brand-gold bg-brand-gray' : 'border-gray-600 bg-brand-dark hover:border-gray-500'}`}>
                                        <img src={b.foto_url} alt={b.nome} className="w-20 h-20 rounded-full mx-auto mb-2 object-cover"/>
                                        <p className="font-semibold text-sm">{b.nome}</p>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Calendar & Time */}
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-brand-gold mb-4">4. Escolha a Data</h2>
                            <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
                        </section>

                        {selectedDate && selectedBarbeiro && (
                            <section>
                                <h2 className="text-2xl font-bold text-brand-gold mb-4">5. Escolha o Horário</h2>
                                <TimeSlots availableTimes={availableTimes} bookedTimes={bookedTimes} selectedTime={selectedTime} onTimeSelect={setSelectedTime} />
                            </section>
                        )}

                        <button type="submit" className="w-full bg-brand-gold text-brand-dark font-bold py-4 px-4 rounded-lg text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" disabled={!isFormComplete || isSubmitting}>
                            {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default PublicBookingPage;