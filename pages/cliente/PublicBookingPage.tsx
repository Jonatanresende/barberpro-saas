import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Barbearia, Barbeiro, Servico, AppointmentStatus } from '../../types';
import { ScissorsIcon } from '../../components/icons';

const PublicBookingPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [barbearia, setBarbearia] = useState<Barbearia | null | undefined>(null);
    const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    
    const [step, setStep] = useState(1);
    const [selectedBarbeiro, setSelectedBarbeiro] = useState<string>('');
    const [selectedServico, setSelectedServico] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');

    useEffect(() => {
        if (slug) {
            api.getBarbeariaBySlug(slug).then(data => {
                setBarbearia(data);
                if (data) {
                    api.getBarbeirosByBarbearia(data.id).then(setBarbeiros);
                    api.getServicosByBarbearia(data.id).then(setServicos);
                }
            });
        }
    }, [slug]);

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barbearia) return;

        const selectedBarbeiroObj = barbeiros.find(b => b.id === selectedBarbeiro);
        const selectedServicoObj = servicos.find(s => s.id === selectedServico);

        const cliente_nome = (e.currentTarget.querySelector('input[name="name"]') as HTMLInputElement).value;
        const cliente_email = (e.currentTarget.querySelector('input[name="email"]') as HTMLInputElement).value;

        await api.createAgendamento({
            cliente_id: 'mock_client_id_' + Date.now(),
            cliente_nome,
            cliente_email,
            barbeiro_id: selectedBarbeiro,
            barbeiro_nome: selectedBarbeiroObj?.nome,
            servico_id: selectedServico,
            servico_nome: selectedServicoObj?.nome,
            barbearia_id: barbearia.id,
            data: selectedDate,
            hora: selectedTime,
            status: AppointmentStatus.PENDENTE,
        });
        navigate('/confirmation');
    };

    if (barbearia === undefined) {
      return <div className="flex items-center justify-center h-screen bg-brand-dark text-white">Carregando...</div>;
    }

    if (barbearia === null) {
      return <div className="flex items-center justify-center h-screen bg-brand-dark text-white">Barbearia não encontrada.</div>;
    }

    const availableTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl bg-brand-gray rounded-xl shadow-lg p-8 border border-gray-700">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-brand-dark rounded-full mb-4">
                        <ScissorsIcon className="h-10 w-10 text-brand-gold" />
                    </div>
                    <h1 className="text-4xl font-bold text-white">{barbearia.nome}</h1>
                    <p className="text-gray-400 mt-2">{barbearia.endereco}</p>
                </div>
                
                <form onSubmit={handleBooking} className="space-y-6">
                    {/* Step 1: Service */}
                    <div>
                        <h3 className="text-xl font-semibold text-brand-gold mb-3">1. Escolha o Serviço</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {servicos.map(s => (
                                <button key={s.id} type="button" onClick={() => setSelectedServico(s.id)} className={`p-4 rounded-lg text-left border-2 transition ${selectedServico === s.id ? 'border-brand-gold bg-brand-dark' : 'border-gray-600 bg-brand-gray hover:border-gray-500'}`}>
                                    <p className="font-semibold text-white">{s.nome}</p>
                                    <p className="text-sm text-gray-400">{s.duracao} min - R${s.preco.toFixed(2)}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Step 2: Barber */}
                    <div>
                         <h3 className="text-xl font-semibold text-brand-gold mb-3">2. Escolha o Barbeiro</h3>
                         <div className="flex space-x-4 overflow-x-auto pb-2">
                             {barbeiros.filter(b => b.ativo).map(b => (
                                <button key={b.id} type="button" onClick={() => setSelectedBarbeiro(b.id)} className={`flex-shrink-0 p-3 rounded-lg text-center border-2 transition ${selectedBarbeiro === b.id ? 'border-brand-gold bg-brand-dark' : 'border-gray-600 bg-brand-gray hover:border-gray-500'}`}>
                                     <img src={b.foto_url} alt={b.nome} className="w-20 h-20 rounded-full mx-auto mb-2"/>
                                     <p className="font-semibold text-white text-sm">{b.nome}</p>
                                 </button>
                             ))}
                         </div>
                    </div>

                    {/* Step 3: Date & Time */}
                    <div>
                        <h3 className="text-xl font-semibold text-brand-gold mb-3">3. Escolha a Data e Hora</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-brand-dark w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
                            <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="bg-brand-dark w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white">
                                <option value="">Selecione um horário</option>
                                {availableTimes.map(time => <option key={time} value={time}>{time}</option>)}
                            </select>
                        </div>
                    </div>

                     {/* Step 4: Personal Info */}
                    <div>
                        <h3 className="text-xl font-semibold text-brand-gold mb-3">4. Seus Dados</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <input type="text" name="name" placeholder="Seu Nome" required className="bg-brand-dark w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
                             <input type="email" name="email" placeholder="Seu E-mail" required className="bg-brand-dark w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-brand-gold text-brand-dark font-bold py-3 px-4 rounded-lg text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        disabled={!selectedServico || !selectedBarbeiro || !selectedDate || !selectedTime}
                    >
                        Confirmar Agendamento
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PublicBookingPage;