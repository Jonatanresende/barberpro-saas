import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import { Estabelecimento, Profissional, Servico, AppointmentStatus, ProfissionalDisponibilidade } from '@/types';
import Calendar from '@/components/booking/Calendar';
import TimeSlots from '@/components/booking/TimeSlots';
import { useVocabulario } from '@/hooks/useVocabulario';

const PublicBookingPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    // Data state
    const [estabelecimento, setEstabelecimento] = useState<Estabelecimento | null>(null);
    const vocab = useVocabulario(estabelecimento?.nicho);
    const [profissionais, setProfissionais] = useState<Profissional[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    // Agendamentos ocupados do mês
    const [agendamentosDoMes, setAgendamentosDoMes] = useState<any[]>([]);
    const [disponibilidadesDoMes, setDisponibilidadesDoMes] = useState<ProfissionalDisponibilidade[]>([]);

    // Form state
    const [step, setStep] = useState(1);
    const [clienteNome, setClienteNome] = useState('');
    const [clienteTelefone, setClienteTelefone] = useState('');
    const [selectedServico, setSelectedServico] = useState<Servico | null>(null);
    const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // UI state
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchEstabelecimentoData = async () => {
            if (!slug) return;
            try {
                setLoading(true);
                const data = await api.getEstabelecimentoBySlug(slug);
                if (data) {
                    setEstabelecimento(data);
                    const [profissionaisData, servicosData] = await Promise.all([
                        api.getProfissionaisPublicos(data.id),
                        api.getServicosByEstabelecimento(data.id)
                    ]);
                    setProfissionais(profissionaisData);
                    setServicos(servicosData);
                }
            } catch (error) {
                toast.error("Não foi possível carregar os dados do estabelecimento.");
            } finally {
                setLoading(false);
            }
        };
        fetchEstabelecimentoData();
    }, [slug]);

    useEffect(() => {
        if (estabelecimento) {
            api.getBookingDataForMonth(estabelecimento.id, currentMonth.getFullYear(), currentMonth.getMonth())
                .then(({ agendamentos, disponibilidades }) => {
                    setAgendamentosDoMes(agendamentos);
                    setDisponibilidadesDoMes(disponibilidades);
                })
                .catch(() => toast.error("Erro ao buscar horários do mês."));
        }
    }, [currentMonth, estabelecimento]);

    const getProfissionalAvailabilityForDate = (profissionalId: string, date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        return disponibilidadesDoMes.find(d => d.profissional_id === profissionalId && d.data === dateString);
    };

    const profissionalDaysOff = useMemo(() => {
        if (!selectedProfissional) return [];
        return disponibilidadesDoMes
            .filter(d => d.profissional_id === selectedProfissional.id && d.disponivel === false)
            .map(d => d.data);
    }, [disponibilidadesDoMes, selectedProfissional]);

    const availableTimes = useMemo(() => {
        if (!estabelecimento || !selectedDate || !selectedServico || !selectedProfissional) return [];

        const dateString = selectedDate.toISOString().split('T')[0];
        const dayOfWeek = selectedDate.getDay();

        // 1. Verificar se o dia é de funcionamento do estabelecimento
        if (!estabelecimento.operating_days?.includes(dayOfWeek)) {
            return [];
        }

        // 2. Verificar se o profissional tirou folga neste dia
        if (profissionalDaysOff.includes(dateString)) {
            return [];
        }

        // 3. Determinar horários de início e fim (priorizando a disponibilidade específica do profissional)
        const availability = getProfissionalAvailabilityForDate(selectedProfissional.id, selectedDate);

        const startTime = availability?.hora_inicio || estabelecimento.start_time || '09:00';
        const endTime = availability?.hora_fim || estabelecimento.end_time || '18:00';
        const serviceDuration = selectedServico.duracao;

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
            if (isToday && currentTime <= now) {
                currentTime.setMinutes(currentTime.getMinutes() + serviceDuration);
                continue;
            }
            const timeString = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            times.push(timeString);
            currentTime.setMinutes(currentTime.getMinutes() + serviceDuration);
        }

        return times;
    }, [estabelecimento, selectedDate, selectedServico, selectedProfissional, profissionalDaysOff]);

    const bookedTimes = useMemo(() => {
        if (!selectedProfissional || !selectedDate) return [];
        const dateString = selectedDate.toISOString().split('T')[0];

        return (agendamentosDoMes as any[])
            .filter(ag => {
                const agProfissionalId = ag.profissional_id;
                return agProfissionalId === selectedProfissional.id && ag.data === dateString;
            })
            .map((ag: any) => ag.hora.slice(0, 5));
    }, [agendamentosDoMes, selectedProfissional, selectedDate]);

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
                if (!selectedProfissional) {
                    toast.error(`Por favor, escolha ${vocab.profissional.artigo === 'a' ? 'uma' : 'um'} ${vocab.profissional.singular.toLowerCase()}.`);
                    return;
                }
                if (!selectedDate) {
                    setSelectedDate(new Date());
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
        if (!estabelecimento || !selectedServico || !selectedProfissional || !selectedDate || !selectedTime || !clienteNome || !clienteTelefone) {
            toast.error("Por favor, preencha todos os campos.");
            return;
        }
        setIsSubmitting(true);
        try {
            const agendamentoPayload = {
                estabelecimento_id: estabelecimento.id,
                servico_id: selectedServico.id,
                servico_nome: selectedServico.nome,
                profissional_id: selectedProfissional.id,
                profissional_nome: selectedProfissional.nome,
                data: selectedDate.toISOString().split('T')[0],
                hora: selectedTime,
                cliente_nome: clienteNome,
                cliente_telefone: clienteTelefone,
                status: AppointmentStatus.PENDENTE,
            };

            const agendamento = await api.createAgendamento(agendamentoPayload);

            if (!agendamento || !agendamento.data || !agendamento.hora) {
                throw new Error("O agendamento foi criado, mas os dados de data/hora estão faltando no retorno.");
            }

            navigate('/booking-success', { state: { agendamento, estabelecimento } });
        } catch (error: any) {
            toast.error(`Falha ao agendar: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-brand-dark text-white">Carregando...</div>;
    if (!estabelecimento) return <div className="flex items-center justify-center h-screen bg-brand-dark text-white">Estabelecimento não encontrado.</div>;

    const renderStep = () => {
        switch (step) {
            case 1: // Dados do Cliente
                return (
                    <div className="space-y-4">
                        <input type="text" value={clienteNome} onChange={e => setClienteNome(e.target.value)} placeholder="Seu Nome Completo" required className="bg-brand-gray w-full px-4 py-3 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold" />
                        <input type="tel" value={clienteTelefone} onChange={e => setClienteTelefone(e.target.value)} placeholder="Seu Telefone (WhatsApp)" required className="bg-brand-gray w-full px-4 py-3 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold" />
                    </div>
                );
            case 2: // Serviço & Profissional
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
                            <h3 className="text-xl font-bold text-brand-gold mb-4">Escolha {vocab.profissional.artigo === 'a' ? 'a' : 'o'} {vocab.profissional.singular}</h3>
                            <div className="flex space-x-4 overflow-x-auto pb-2">
                                {profissionais.map(profissional => {
                                    const availabilityRecord = selectedDate ? getProfissionalAvailabilityForDate(profissional.id, selectedDate) : null;
                                    const isAvailable = availabilityRecord ? availabilityRecord.disponivel === true : true;

                                    const handleProfissionalClick = () => {
                                        if (isAvailable) {
                                            setSelectedProfissional(profissional);
                                        } else {
                                            toast.error(`${profissional.nome} não está disponível na data selecionada.`);
                                        }
                                    };

                                    return (
                                        <button key={profissional.id} type="button" onClick={handleProfissionalClick} className={`flex-shrink-0 p-3 rounded-lg text-center border-2 transition ${selectedProfissional?.id === profissional.id ? 'border-brand-gold bg-brand-gray' : 'border-gray-600 bg-brand-dark'} ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500'}`}>
                                            <img src={profissional.foto_url} alt={profissional.nome} className="w-20 h-20 rounded-full mx-auto mb-2 object-cover" />
                                            <p className="font-semibold text-sm">{profissional.nome}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                );
            case 3: // Data & Horário
                return (
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-xl font-bold text-brand-gold mb-4">Escolha a Data</h3>
                            <Calendar
                                selectedDate={selectedDate}
                                onDateSelect={handleDateSelect}
                                operatingDays={estabelecimento.operating_days || []}
                                fullyBookedDays={profissionalDaysOff}
                                onMonthChange={setCurrentMonth}
                                currentMonth={currentMonth}
                            />
                        </section>
                        {selectedDate && selectedProfissional && selectedServico && (
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
            case 4: // Confirmação
                return (
                    <div className="text-left space-y-4 bg-brand-dark p-6 rounded-lg border border-brand-gray">
                        <h3 className="text-xl font-bold text-brand-gold mb-4 text-center">Confirme seu Agendamento</h3>
                        <p><strong className="text-gray-400">Nome:</strong> {clienteNome}</p>
                        <p><strong className="text-gray-400">Serviço:</strong> {selectedServico?.nome}</p>
                        <p><strong className="text-gray-400">{vocab.profissional.singular}:</strong> {selectedProfissional?.nome}</p>
                        <p><strong className="text-gray-400">Data:</strong> {selectedDate?.toLocaleDateString('pt-BR')} às {selectedTime}</p>
                        <p><strong className="text-gray-400">Local:</strong> {estabelecimento.endereco}</p>
                    </div>
                );
            default: return null;
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 1: return "1. Seus Dados";
            case 2: return `2. Serviço e ${vocab.profissional.singular}`;
            case 3: return "3. Data e Horário";
            case 4: return "4. Confirmação";
            default: return "Agendamento";
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark text-white font-sans p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-brand-gray rounded-xl shadow-lg p-8 border border-gray-700">
                <h2 className="text-3xl font-bold text-center mb-2">{estabelecimento.nome}</h2>
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
