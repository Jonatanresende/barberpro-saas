import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import { Barbearia, Barbeiro, Servico, AppointmentStatus, Agendamento, BarbeiroDisponibilidade } from '@/types';
import Calendar from '@/components/booking/Calendar';
import TimeSlots from '@/components/booking/TimeSlots';

const PublicBookingPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    // Data state
    const [barbearia, setBarbearia] = useState<Barbearia | null>(null);
    const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [agendamentosDoMes, setAgendamentosDoMes] = useState<Pick<Agendamento, 'data' | 'hora' | 'barbeiro_id'>[]>([]);
    const [disponibilidadesDoMes, setDisponibilidadesDoMes] = useState<BarbeiroDisponibilidade[]>([]);

    // Form state
    const [step, setStep] = useState(1);
    const [clienteNome, setClienteNome] = useState('');
    const [clienteTelefone, setClienteTelefone] = useState('');
    const [selectedServico, setSelectedServico] = useState<Servico | null>(null);
    const [selectedBarbeiro, setSelectedBarbeiro] = useState<Barbeiro | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Inicializa como null para forçar a seleção
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // UI state
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    useEffect(() => {
        if (barbearia) {
            api.getBookingDataForMonth(barbearia.id, currentMonth.getFullYear(), currentMonth.getMonth())
                .then(({ agendamentos, disponibilidades }) => {
                    setAgendamentosDoMes(agendamentos);
                    setDisponibilidadesDoMes(disponibilidades);
                })
                .catch(() => toast.error("Erro ao buscar horários do mês."));
        }
    }, [currentMonth, barbearia]);

    const getBarberAvailabilityForDate = (barbeiroId: string, date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        return disponibilidadesDoMes.find(d => d.barbeiro_id === barbeiroId && d.data === dateString);
    };

    const barberDaysOff = useMemo(() => {
        if (!selectedBarbeiro) return [];
        return disponibilidadesDoMes
            .filter(d => d.barbeiro_id === selectedBarbeiro.id && d.disponivel === false)
            .map(d => d.data);
    }, [disponibilidadesDoMes, selectedBarbeiro]);

    const availableTimes = useMemo(() => {
        if (!barbearia || !selectedDate || !selectedServico || !selectedBarbeiro) return [];

        const dateString = selectedDate.toISOString().split('T')[0];
        const dayOfWeek = selectedDate.getDay();
        
        // 1. Verificar se o dia é de funcionamento da barbearia
        if (!barbearia.operating_days?.includes(dayOfWeek)) {
            return [];
        }

        // 2. Verificar se o barbeiro tirou folga neste dia
        if (barberDaysOff.includes(dateString)) {
            return [];
        }

        // 3. Determinar horários de início e fim (priorizando a disponibilidade específica do barbeiro)
        const availability = getBarberAvailabilityForDate(selectedBarbeiro.id, selectedDate);
        
        const startTime = availability?.hora_inicio || barbearia.start_time || '09:00';
        const endTime = availability?.hora_fim || barbearia.end_time || '18:00';
        const serviceDuration = selectedServico.duracao; // Duração do serviço em minutos

        const times: string[] = [];
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        let currentTime = new Date(selectedDate);
        currentTime.setHours(startHour, startMinute, 0, 0);
        
        let endDateTime = new Date(selectedDate);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        const now = new Date();
        const isToday = selectedDate.toDateString() === now.toDateString();

        while (currentTime.getTime() + serviceDuration * 60 * 1000 <= endDateTime.getTime()) {
            
            // Se for hoje, verifica se o slot já passou
            if (isToday && currentTime <= now) {
                currentTime.setMinutes(currentTime.getMinutes() + serviceDuration);
                continue;
            }

            const timeString = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            times.push(timeString);
            currentTime.setMinutes(currentTime.getMinutes() + serviceDuration);
        }

        return times;
    }, [barbearia, selectedDate, selectedServico, selectedBarbeiro, barberDaysOff]);

    const bookedTimes = useMemo(() => {
        if (!selectedBarbeiro || !selectedDate) return [];
        const dateString = selectedDate.toISOString().split('T')[0];
        
        // Filtra agendamentos para o barbeiro e data selecionados
        const appointments = agendamentosDoMes
            .filter(ag => ag.barbeiro_id === selectedBarbeiro.id && ag.data === dateString)
            .map(ag => ag.hora.slice(0, 5)); // Pega apenas HH:MM

        // Se o serviço selecionado for de 60 minutos, precisamos marcar slots de 30 minutos como ocupados também.
        // No entanto, a lógica de `availableTimes` já garante que os slots gerados são múltiplos da duração do serviço.
        // Portanto, basta verificar se o slot gerado está na lista de agendamentos.
        return appointments;
    }, [agendamentosDoMes, selectedBarbeiro, selectedDate]);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setSelectedTime(null);
    };

    const handleNext = () => {
        switch (step) {
            case 1:
                if (!clienteNome.trim() || !clienteTelefone.trim()) {
                    toast.error("Por favor, preencha seu nome e telefone.");
                    return;
                }
                break;
            case 2:
                if (!selectedServico) {
                    toast.error("Por favor, escolha um serviço.");
                    return;
                }
                if (!selectedBarbeiro) {
                    toast.error("Por favor, escolha um barbeiro.");
                    return;
                }
                // Se o barbeiro não tiver horários disponíveis para a data atual, forçamos a seleção de data
                if (!selectedDate) {
                    setSelectedDate(new Date()); // Define a data atual como padrão para ir para o próximo passo
                }
                break;
            case 3:
                if (!selectedDate) {
                    toast.error("Por favor, escolha uma data.");
                    return;
                }
                if (!selectedTime) {
                    toast.error("Por favor, escolha um horário.");
                    return;
                }
                break;
            default:
                break;
        }
        setStep(s => s + 1);
    };

    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = async () => {
        if (!barbearia || !selectedServico || !selectedBarbeiro || !selectedDate || !selectedTime || !clienteNome || !clienteTelefone) {
            toast.error("Por favor, preencha todos os campos.");
            return;
        }
        setIsSubmitting(true);
        try {
            const agendamentoPayload = {
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
            };

            const agendamento = await api.createAgendamento(agendamentoPayload);
            
            // VERIFICAÇÃO DE SEGURANÇA: Garante que os dados essenciais estão presentes antes de navegar
            if (!agendamento || !agendamento.data || !agendamento.hora) {
                throw new Error("O agendamento foi criado, mas os dados de data/hora estão faltando no retorno.");
            }

            navigate('/booking-success', { state: { agendamento, barbearia } });
        } catch (error: any) {
            toast.error(`Falha ao agendar: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-brand-dark text-white">Carregando...</div>;
    if (!barbearia) return <div className="flex items-center justify-center h-screen bg-brand-dark text-white">Barbearia não encontrada.</div>;

    const renderStep = () => {
        switch (step) {
            case 1: // Client Info
                return (
                    <div className="space-y-4">
                        <input type="text" value={clienteNome} onChange={e => setClienteNome(e.target.value)} placeholder="Seu Nome Completo" required className="bg-brand-gray w-full px-4 py-3 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold" />
                        <input type="tel" value={clienteTelefone} onChange={e => setClienteTelefone(e.target.value)} placeholder="Seu Telefone (WhatsApp)" required className="bg-brand-gray w-full px-4 py-3 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold" />
                    </div>
                );
            case 2: // Barber & Service
                return (
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-xl font-bold text-brand-gold mb-4">Escolha o Serviço</h3>
                            <div className="space-y-3">
                                {servicos.map(s => (
                                    <button key={s.id} type="button" onClick={() => setSelectedServico(s)} className={`w-full p-4 rounded-lg text-left border-2 transition flex justify-between items-center ${selectedServico?.id === s.id ? 'border-brand-gold bg-brand-gray' : 'border-gray-600 bg-brand-dark hover:border-gray-500'}`}>
                                        <div><p className="font-semibold">{s.nome}</p><p className="text-sm text-gray-400">{s.duracao} min</p></div>
                                        <p className="font-bold text-brand-gold">R${s.preco.toFixed(2)}</p>
                                    </button>
                                ))}
                            </div>
                        </section>
                        <section>
                            <h3 className="text-xl font-bold text-brand-gold mb-4">Escolha o Barbeiro</h3>
                            <div className="flex space-x-4 overflow-x-auto pb-2">
                                {barbeiros.map(barbeiro => {
                                    // A disponibilidade aqui é apenas para fins visuais, a lógica principal de horário é feita no useMemo
                                    const availabilityRecord = selectedDate ? getBarberAvailabilityForDate(barbeiro.id, selectedDate) : null;
                                    const isAvailable = availabilityRecord ? availabilityRecord.disponivel === true : true;
                                    
                                    const handleBarberClick = () => {
                                        if (isAvailable) {
                                            setSelectedBarbeiro(barbeiro);
                                        } else {
                                            toast.error(`${barbeiro.nome} não está disponível na data selecionada.`);
                                        }
                                    };

                                    return (
                                        <button key={barbeiro.id} type="button" onClick={handleBarberClick} className={`flex-shrink-0 p-3 rounded-lg text-center border-2 transition ${selectedBarbeiro?.id === barbeiro.id ? 'border-brand-gold bg-brand-gray' : 'border-gray-600 bg-brand-dark'} ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500'}`}>
                                            <img src={barbeiro.foto_url} alt={barbeiro.nome} className="w-20 h-20 rounded-full mx-auto mb-2 object-cover"/>
                                            <p className="font-semibold text-sm">{barbeiro.nome}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                );
            case 3: // Date & Time
                return (
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-xl font-bold text-brand-gold mb-4">Escolha a Data</h3>
                            <Calendar 
                                selectedDate={selectedDate} 
                                onDateSelect={handleDateSelect} 
                                operatingDays={barbearia.operating_days || []}
                                fullyBookedDays={barberDaysOff}
                                onMonthChange={setCurrentMonth}
                                currentMonth={currentMonth}
                            />
                        </section>
                        {selectedDate && selectedBarbeiro && selectedServico && (
                            <section>
                                <h3 className="text-xl font-bold text-brand-gold mb-4">Escolha o Horário ({selectedServico.duracao} min)</h3>
                                {availableTimes.length > 0 ? (
                                    <TimeSlots availableTimes={availableTimes} bookedTimes={bookedTimes} selectedTime={selectedTime} onTimeSelect={setSelectedTime} />
                                ) : (
                                    <p className="text-gray-400">Nenhum horário disponível para este dia e serviço.</p>
                                )}
                            </section>
                        )}
                    </div>
                );
            case 4: // Confirmation
                return (
                    <div className="text-left space-y-4 bg-brand-dark p-6 rounded-lg border border-brand-gray">
                        <h3 className="text-xl font-bold text-brand-gold mb-4 text-center">Confirme seu Agendamento</h3>
                        <p><strong className="text-gray-400">Nome:</strong> {clienteNome}</p>
                        <p><strong className="text-gray-400">Serviço:</strong> {selectedServico?.nome}</p>
                        <p><strong className="text-gray-400">Barbeiro:</strong> {selectedBarbeiro?.nome}</p>
                        <p><strong className="text-gray-400">Data:</strong> {selectedDate?.toLocaleDateString('pt-BR')} às {selectedTime}</p>
                        <p><strong className="text-gray-400">Local:</strong> {barbearia.endereco}</p>
                    </div>
                );
            default: return null;
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 1: return "1. Seus Dados";
            case 2: return "2. Serviço e Barbeiro";
            case 3: return "3. Data e Horário";
            case 4: return "4. Confirmação";
            default: return "Agendamento";
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark text-white font-sans p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-brand-gray rounded-xl shadow-lg p-8 border border-gray-700">
                <h2 className="text-3xl font-bold text-center mb-2">{barbearia.nome}</h2>
                <h3 className="text-xl font-semibold text-brand-gold text-center mb-8">{getStepTitle()}</h3>
                
                <div className="min-h-[300px]">
                    {renderStep()}
                </div>

                <div className="flex justify-between items-center mt-8 pt-4 border-t border-brand-gray">
                    {step > 1 ? (
                        <button onClick={handleBack} className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 font-semibold">Voltar</button>
                    ) : (
                        <Link to={`/${slug}`} className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 font-semibold">Cancelar</Link>
                    )}

                    {step < 4 && <button onClick={handleNext} className="px-6 py-2 rounded-lg bg-brand-gold text-brand-dark font-bold">Próximo</button>}
                    {step === 4 && <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-green-500 text-white font-bold disabled:opacity-50">{isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento'}</button>}
                </div>
            </div>
        </div>
    );
};

export default PublicBookingPage;