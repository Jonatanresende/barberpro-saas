import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import { api } from '@/services/api';

interface FreeTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialState = {
  fullName: '',
  barbershopName: '',
  email: '',
  password: '',
  phone: '',
};

const FreeTrialModal = ({ isOpen, onClose }: FreeTrialModalProps) => {
  const [formData, setFormData] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setFormData(initialState);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const { fullName, barbershopName, email, password, phone } = formData;
    if (!fullName || !barbershopName || !email || !password || !phone) {
      toast.error('Preencha todos os campos para começar seu teste.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.startFreeTrialSignup({
        fullName,
        barbershopName,
        email,
        password,
        phone,
      });
      toast.success('Conta criada com sucesso! Redirecionando para o login...');
      handleClose();
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Não foi possível iniciar o teste.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Começar acesso gratuito">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Nome completo</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md bg-brand-gray border border-gray-600 text-white focus:ring-2 focus:ring-brand-gold"
            placeholder="Seu nome"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Nome da barbearia</label>
          <input
            type="text"
            name="barbershopName"
            value={formData.barbershopName}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md bg-brand-gray border border-gray-600 text-white focus:ring-2 focus:ring-brand-gold"
            placeholder="Ex: Barbearia do João"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">E-mail</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md bg-brand-gray border border-gray-600 text-white focus:ring-2 focus:ring-brand-gold"
            placeholder="voce@email.com"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Senha</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md bg-brand-gray border border-gray-600 text-white focus:ring-2 focus:ring-brand-gold"
            placeholder="Crie uma senha segura"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Telefone / WhatsApp</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-md bg-brand-gray border border-gray-600 text-white focus:ring-2 focus:ring-brand-gold"
            placeholder="(00) 00000-0000"
          />
        </div>
        <p className="text-xs text-gray-400">
          Ao continuar você aceita nossos termos de uso e receberá comunicações sobre o seu teste gratuito.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-md bg-brand-gold text-brand-dark font-bold hover:bg-yellow-400 transition disabled:opacity-50"
        >
          {isSubmitting ? 'Criando conta...' : 'Começar agora'}
        </button>
      </form>
    </Modal>
  );
};

export default FreeTrialModal;