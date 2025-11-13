import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '@/src/integrations/supabase/client';
import { api } from '../../services/api';
import { User } from '../../types';
import Modal from '../../components/Modal';
import PasswordChangeModal from './PasswordChangeModal';
import AdminUserModal from './AdminUserModal';

const SettingsCard = ({ title, children, actions }: { title: string, children: React.ReactNode, actions?: React.ReactNode }) => (
    <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
        <div className="flex justify-between items-center mb-6 border-b border-brand-gray pb-4">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            {actions && <div>{actions}</div>}
        </div>
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
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [otherAdmins, setOtherAdmins] = useState<User[]>([]);

    const fetchAdmins = useCallback(async () => {
        if (!user) return;
        try {
            const admins = await api.getAdminUsers();
            setOtherAdmins(admins.filter(admin => admin.id !== user.id));
        } catch (error: any) {
            toast.error(`Falha ao carregar administradores: ${error.message}`);
        }
    }, [user]);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

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
    
    const handleOpenCreateUserModal = () => {
        setUserToEdit(null);
        setIsUserModalOpen(true);
    };

    const handleOpenEditUserModal = (admin: User) => {
        setUserToEdit(admin);
        setIsUserModalOpen(true);
    };

    const handleSaveAdminUser = async (userData: any, password?: string) => {
        const promise = userToEdit
            ? api.updateAdminUser(userToEdit.id, userData)
            : api.createAdminUser(userData.email, password!, userData.full_name);

        toast.promise(promise, {
            loading: 'Salvando administrador...',
            success: () => {
                fetchAdmins();
                setIsUserModalOpen(false);
                return `Administrador ${userToEdit ? 'atualizado' : 'criado'} com sucesso!`;
            },
            error: (err: any) => `Falha ao salvar: ${err.message}`,
        });
    };

    const handleDeleteAdmin = (admin: User) => {
        if (window.confirm(`Tem certeza que deseja remover o administrador ${admin.full_name}?`)) {
            toast.promise(api.deleteAdminUser(admin.id), {
                loading: 'Removendo...',
                success: () => {
                    fetchAdmins();
                    return 'Administrador removido com sucesso!';
                },
                error: (err) => `Falha ao remover: ${err.message}`,
            });
        }
    };

    if (!user) {
        return <div className="text-center py-10">Carregando...</div>;
    }

    return (
        <>
            <SettingsCard 
                title="Conta Principal"
                actions={
                    <button onClick={handleOpenCreateUserModal} className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90 text-sm">
                        Adicionar Novo Administrador
                    </button>
                }
            >
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                    <button onClick={() => setIsPasswordModalOpen(true)} className="bg-brand-gray hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Alterar Senha
                    </button>
                </div>
                <div className="pt-4">
                    <button onClick={handleAccountUpdate} disabled={isSaving} className="bg-brand-gold text-brand-dark font-bold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50">
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </SettingsCard>

            {otherAdmins.length > 0 && (
                <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                    <h3 className="text-xl font-semibold text-white mb-6 border-b border-brand-gray pb-4">Outros Administradores</h3>
                    <div className="space-y-4">
                        {otherAdmins.map(admin => (
                            <div key={admin.id} className="flex items-center justify-between bg-brand-gray p-4 rounded-lg">
                                <div>
                                    <p className="font-semibold text-white">{admin.full_name}</p>
                                    <p className="text-sm text-gray-400">{admin.email}</p>
                                </div>
                                <div className="flex space-x-3">
                                    <button onClick={() => handleOpenEditUserModal(admin)} className="text-blue-400 hover:text-blue-300 font-semibold">Editar</button>
                                    <button onClick={() => handleDeleteAdmin(admin)} className="text-red-400 hover:text-red-300 font-semibold">Remover</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Alterar Senha">
                <PasswordChangeModal onClose={() => setIsPasswordModalOpen(false)} />
            </Modal>
            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={userToEdit ? 'Editar Administrador' : 'Adicionar Administrador'}>
                <AdminUserModal onClose={() => setIsUserModalOpen(false)} onSave={handleSaveAdminUser} userToEdit={userToEdit} />
            </Modal>
        </>
    );
};

const InputField = ({ label, type, id, value, placeholder }: { label: string, type: string, id: string, value?: string, placeholder?: string }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <input type={type} id={id} name={id} defaultValue={value} placeholder={placeholder} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
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