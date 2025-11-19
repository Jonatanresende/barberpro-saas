import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { User } from '@/types';

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any, password?: string) => Promise<void>;
  userToEdit: User | null;
}

const AdminUserModal = ({ isOpen, onClose, onSave, userToEdit }: AdminUserModalProps) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setFullName(userToEdit.full_name || '');
      setEmail(userToEdit.email || '');
      setPassword('');
    } else {
      setFullName('');
      setEmail('');
      setPassword('');
    }
  }, [userToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit && !password) {
      toast.error("A senha é obrigatória para criar um novo administrador.");
      return;
    }
    setIsSaving(true);
    const userData = {
      full_name: fullName,
      email: email,
    };
    await onSave(userData, password);
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
        <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">E-mail</label>
        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
      </div>
      {!userToEdit && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
          <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
        </div>
      )}
      <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-brand-gray">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-brand-gray hover:bg-gray-700 text-white font-semibold">Cancelar</button>
        <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg bg-brand-gold hover:opacity-90 text-brand-dark font-bold disabled:opacity-50">
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
};

export default AdminUserModal;