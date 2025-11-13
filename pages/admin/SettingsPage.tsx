import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '@/src/integrations/supabase/client';
import Modal from '../../components/Modal';
import PasswordChangeModal from './PasswordChangeModal';

const SettingsCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
        <h3 className="text-xl font-semibold text-white mb-6 border-b border-brand-gray pb-4">{title}</h3>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

const AccountSettings = () => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.full_name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleAccountUpdate = async () => {
        if (!user) return;

        setIsSaving(true);
        const { error } = await supabase.auth.updateUser({
            email: email,
            data: { full_name: name }
        });
        setIsSaving(false);

        if (error) {
            toast.error(`Falha ao atualizar dados: ${error.message}`);
        } else {
            toast.success('Dados da conta atualizados com sucesso!');
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-40 bg-brand-dark rounded-lg border border-brand-gray">
                <div className="text-brand-gold text-lg">Carregando dados da conta...</div>
            </div>
        );
    }

    return (
        <>
            <SettingsCard title="Conta">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                    <button 
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="bg-brand-gray hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Alterar Senha
                    </button>
                </div>
                <div className="pt-4">
                    <button 
                        onClick={handleAccountUpdate}
                        disabled={isSaving}
                        className="bg-brand-gold text-brand-dark font-bold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </SettingsCard>
            <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Alterar Senha">
                <PasswordChangeModal onClose={() => setIsPasswordModalOpen(false)} />
            </Modal>
        </>
    );
};

const InputField = ({ label, type, id, value, placeholder }: { label: string, type: string, id: string, value?: string, placeholder?: string }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <input
            type={type}
            id={id}
            name={id}
            defaultValue={value}
            placeholder={placeholder}
            className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white"
        />
    </div>
);

const SettingsPage = () => {
    return (
        <div className="space-y-8">
            <AccountSettings />

            <SettingsCard title="Sistema">
                <InputField label="Nome do Sistema" type="text" id="system-name" value="BarberPro SaaS" />
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Logotipo</label>
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-brand-gray rounded-md flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Logo</span>
                        </div>
                        <input type="file" id="logo-upload" className="hidden" />
                        <label htmlFor="logo-upload" className="cursor-pointer bg-brand-gray hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            Fazer Upload
                        </label>
                    </div>
                </div>
                <InputField label="E-mail de Suporte" type="email" id="support-email" value="suporte@barberpro.com" />
                 <div className="pt-4">
                    <button className="bg-brand-gold text-brand-dark font-bold py-2 px-6 rounded-lg hover:opacity-90">
                        Salvar Alterações
                    </button>
                </div>
            </SettingsCard>

            <SettingsCard title="Suporte">
                <InputField label="E-mail de Contato" type="email" id="contact-email" value="contato@barberpro.com" />
                <InputField label="Link para Termos de Uso / Política de Privacidade" type="url" id="tos-link" value="https://barberpro.com/termos" />
                 <div className="pt-4">
                    <button className="bg-brand-gold text-brand-dark font-bold py-2 px-6 rounded-lg hover:opacity-90">
                        Salvar Alterações
                    </button>
                </div>
            </SettingsCard>
        </div>
    );
};

export default SettingsPage;