import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';

interface ClientAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ClientAccountModal = ({ isOpen, onClose }: ClientAccountModalProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !phone.trim()) {
      toast.error('Preencha nome e telefone.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Placeholder para futura integração real
      await new Promise(resolve => setTimeout(resolve, 400));
      toast.success('Em breve você poderá acompanhar seus agendamentos por aqui.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Minha Conta">
      <p className="text-sm text-gray-300 mb-4">
        Cadastre seus dados para receber novidades e acompanhar seus agendamentos.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Nome completo</label>
          <input
            type="text"
            value={name}
            onChange={event => setName(event.target.value)}
            className="w-full px-3 py-2 rounded-md bg-brand-gray border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-brand-gold"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Telefone / WhatsApp</label>
          <input
            type="tel"
            value={phone}
            onChange={event => setPhone(event.target.value)}
            className="w-full px-3 py-2 rounded-md bg-brand-gray border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-brand-gold"
            placeholder="(00) 00000-0000"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 rounded-md bg-brand-gold text-brand-dark font-semibold hover:bg-yellow-400 transition disabled:opacity-50"
        >
          {isSubmitting ? 'Enviando...' : 'Quero ser avisado'}
        </button>
      </form>
    </Modal>
  );
};

export default ClientAccountModal;

