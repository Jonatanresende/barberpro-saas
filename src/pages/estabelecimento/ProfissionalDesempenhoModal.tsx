import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import { Barbeiro } from '@/types';
import { DollarSignIcon, ScissorsIcon } from '@/components/icons';

interface BarberPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  barber: Barbeiro | null;
  isProfessionalPlan: boolean;
}

interface PerformanceData {
    barberName: string;
    commissionRate: number;
    totalGenerated: number;
    totalCommission: number;
    services: {
        data: string;
        servico: string;
        valor: number;
        comissao: number;
    }[];
}

const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

const BarberPerformanceModal = ({ isOpen, onClose, barber, isProfessionalPlan }: BarberPerformanceModalProps) => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = useCallback(async () => {
    if (!barber || !isProfessionalPlan) return;
    setLoading(true);
    try {
      const performanceData = await api.getBarberPerformanceData(barber.id);
      setData(performanceData);
    } catch (error) {
      toast.error("Falha ao carregar dados de desempenho.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [barber, isProfessionalPlan]);

  useEffect(() => {
    if (isOpen && barber) {
      fetchPerformance();
    }
  }, [isOpen, barber, fetchPerformance]);

  if (!isOpen) return null;

  if (!isProfessionalPlan) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Desempenho do Barbeiro">
            <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30 text-red-400">
                <p className="font-semibold">Acesso Negado.</p>
                <p className="text-sm mt-1">O relatório de desempenho individual é um recurso exclusivo do Plano Profissional.</p>
            </div>
        </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Desempenho de ${barber?.nome || 'Barbeiro'}`}>
      {loading ? (
        <p className="text-center text-gray-400 py-8">Carregando dados dos últimos 30 dias...</p>
      ) : data ? (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          
          {/* Cartões de Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-brand-dark p-4 rounded-lg border border-brand-gold/50">
              <p className="text-sm text-gray-400">Total Gerado (30 dias)</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(data.totalGenerated)}</p>
            </div>
            <div className="bg-brand-dark p-4 rounded-lg border border-green-500/50">
              <p className="text-sm text-gray-400">Comissão ({data.commissionRate}%)</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(data.totalCommission)}</p>
            </div>
          </div>

          {/* Lista de Serviços */}
          <div>
            <h3 className="text-lg font-semibold text-brand-gold mb-3">Serviços Concluídos (Últimos 30 dias)</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300 min-w-[400px]">
                    <thead className="bg-brand-gray text-xs uppercase">
                        <tr>
                            <th className="px-4 py-2">Data</th>
                            <th className="px-4 py-2">Serviço</th>
                            <th className="px-4 py-2">Valor</th>
                            <th className="px-4 py-2">Comissão</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.services.length > 0 ? data.services.map((service, index) => (
                            <tr key={index} className="border-b border-gray-700 hover:bg-brand-gray">
                                <td className="px-4 py-3">{new Date(service.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                <td className="px-4 py-3">{service.servico}</td>
                                <td className="px-4 py-3">{formatCurrency(service.valor)}</td>
                                <td className="px-4 py-3 text-green-400">{formatCurrency(service.comissao)}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="text-center py-4 text-gray-500">Nenhum serviço concluído nos últimos 30 dias.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-red-400 py-8">Não foi possível carregar os dados de desempenho.</p>
      )}
    </Modal>
  );
};

export default BarberPerformanceModal;