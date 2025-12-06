import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import { ProfessionalType } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import Modal from '@/components/Modal';
import ProfessionalTypeModal from './ProfessionalTypeModal';

const ManageProfessionalTypes = () => {
    const { user } = useAuth();
    const [types, setTypes] = useState<ProfessionalType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [typeToEdit, setTypeToEdit] = useState<ProfessionalType | null>(null);

    const fetchTypes = useCallback(async () => {
        if (user?.barbeariaId) {
            try {
                setLoading(true);
                const data = await api.getProfessionalTypes(user.barbeariaId);
                setTypes(data);
            } catch (error) {
                toast.error("Falha ao carregar tipos de profissional.");
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => { fetchTypes(); }, [fetchTypes]);

    const handleOpenModal = (type: ProfessionalType | null = null) => {
        setTypeToEdit(type);
        setIsModalOpen(true);
    };

    const handleSave = async (typeData: { name: string; commission_percent: number }) => {
        if (!user?.barbeariaId) return;
        
        let promise;
        if (typeToEdit) {
            promise = api.updateProfessionalType(typeToEdit.id, typeData);
        } else {
            promise = api.createProfessionalType(user.barbeariaId, typeData);
        }

        await promise;
        fetchTypes();
        setIsModalOpen(false);
    };

    const handleDelete = (type: ProfessionalType) => {
        if (window.confirm(`Tem certeza que deseja remover o tipo "${type.name}"? Todos os barbeiros associados a este tipo terão sua comissão redefinida para o padrão da barbearia.`)) {
            toast.promise(api.deleteProfessionalType(type.id), {
                loading: 'Removendo...',
                success: () => {
                    fetchTypes();
                    return 'Tipo removido com sucesso!';
                },
                error: (err) => `Falha ao remover: ${err.message}`,
            });
        }
    };

    return (
        <>
            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Gerenciar Tipos de Profissional</h2>
                    <button onClick={() => handleOpenModal()} className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90">
                        Criar Novo Tipo
                    </button>
                </div>
                {loading ? <p className="text-center text-gray-400">Carregando...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-brand-gray text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3">Nome do Tipo</th>
                                    <th className="px-6 py-3">Comissão (%)</th>
                                    <th className="px-6 py-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {types.map(type => (
                                    <tr key={type.id} className="border-b border-brand-gray hover:bg-brand-gray">
                                        <td className="px-6 py-4 font-medium text-white">{type.name}</td>
                                        <td className="px-6 py-4 font-semibold text-brand-gold">{type.commission_percent}%</td>
                                        <td className="px-6 py-4 space-x-2">
                                            <button onClick={() => handleOpenModal(type)} className="text-blue-400 hover:text-blue-300">Editar</button>
                                            <button onClick={() => handleDelete(type)} className="text-red-400 hover:text-red-300">Remover</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={typeToEdit ? 'Editar Tipo de Profissional' : 'Criar Novo Tipo de Profissional'}>
                <ProfessionalTypeModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave} 
                    typeToEdit={typeToEdit} 
                />
            </Modal>
        </>
    );
};

export default ManageProfessionalTypes;