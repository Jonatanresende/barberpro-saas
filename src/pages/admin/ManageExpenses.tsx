import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import { GastoSaas } from '@/types';
import { DollarSignIcon, XCircleIcon } from '@/components/icons';

const ExpenseModal = ({ isOpen, onClose, onSave, expenseToEdit }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => Promise<void>, expenseToEdit: GastoSaas | null }) => {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (expenseToEdit) {
            setDescricao(expenseToEdit.descricao);
            setValor(String(expenseToEdit.valor));
            setData(expenseToEdit.data);
        } else {
            setDescricao('');
            setValor('');
            setData(new Date().toISOString().split('T')[0]);
        }
    }, [expenseToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsedValue = parseFloat(valor.replace(',', '.'));

        if (!descricao.trim() || isNaN(parsedValue) || parsedValue <= 0 || !data) {
            toast.error("Preencha a descrição, o valor e a data corretamente.");
            return;
        }

        setIsSaving(true);
        const expenseData = {
            descricao: descricao.trim(),
            valor: parsedValue,
            data,
        };

        await onSave(expenseData);
        setIsSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-brand-dark rounded-lg shadow-xl w-full max-w-md border border-brand-gray" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-brand-gray">
                    <h3 className="text-xl font-semibold text-white">{expenseToEdit ? 'Editar Gasto' : 'Adicionar Novo Gasto'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="descricao" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
                        <input type="text" id="descricao" value={descricao} onChange={e => setDescricao(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
                    </div>
                    <div>
                        <label htmlFor="valor" className="block text-sm font-medium text-gray-300 mb-1">Valor (R$)</label>
                        <input type="number" step="0.01" id="valor" value={valor} onChange={e => setValor(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
                    </div>
                    <div>
                        <label htmlFor="data" className="block text-sm font-medium text-gray-300 mb-1">Data</label>
                        <input type="date" id="data" value={data} onChange={e => setData(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-brand-gray">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-brand-gray hover:bg-gray-700 text-white font-semibold">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg bg-brand-gold hover:opacity-90 text-brand-dark font-bold disabled:opacity-50">
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ManageExpenses = () => {
    const [expenses, setExpenses] = useState<GastoSaas[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<GastoSaas | null>(null);

    const fetchExpenses = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getSaasExpenses();
            setExpenses(data);
        } catch (error) {
            toast.error("Falha ao carregar gastos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleOpenModal = (expense: GastoSaas | null = null) => {
        setExpenseToEdit(expense);
        setIsModalOpen(true);
    };

    const handleSave = async (expenseData: any) => {
        let promise;
        if (expenseToEdit) {
            promise = api.updateSaasExpense(expenseToEdit.id, expenseData);
        } else {
            promise = api.createSaasExpense(expenseData);
        }

        toast.promise(promise, {
            loading: 'Salvando gasto...',
            success: () => {
                fetchExpenses();
                setIsModalOpen(false);
                return `Gasto ${expenseToEdit ? 'atualizado' : 'adicionado'} com sucesso!`;
            },
            error: (err) => `Falha ao salvar: ${err.message}`,
        });
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja remover este gasto?")) {
            toast.promise(api.deleteSaasExpense(id), {
                loading: 'Removendo...',
                success: () => {
                    fetchExpenses();
                    return 'Gasto removido com sucesso!';
                },
                error: (err) => `Falha ao remover: ${err.message}`,
            });
        }
    };

    const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`;

    return (
        <>
            <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-xl font-semibold text-white">Gastos Mensais do SaaS</h2>
                    <button onClick={() => handleOpenModal()} className="bg-brand-gold text-brand-dark font-bold py-2 px-4 rounded-lg hover:opacity-90 w-full sm:w-auto">Adicionar Gasto</button>
                </div>
                {loading ? <p className="text-center text-gray-400">Carregando...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-brand-gray text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3">Data</th>
                                    <th className="px-6 py-3">Descrição</th>
                                    <th className="px-6 py-3">Valor</th>
                                    <th className="px-6 py-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Nenhum gasto registrado.</td></tr>
                                ) : (
                                    expenses.map(expense => (
                                        <tr key={expense.id} className="border-b border-brand-gray hover:bg-brand-gray">
                                            <td className="px-6 py-4 font-medium text-white">{new Date(expense.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                            <td className="px-6 py-4">{expense.descricao}</td>
                                            <td className="px-6 py-4 text-red-400 font-semibold">{formatCurrency(expense.valor)}</td>
                                            <td className="px-6 py-4 space-x-2 text-xs">
                                                <button onClick={() => handleOpenModal(expense)} className="text-blue-400 hover:text-blue-300">Editar</button>
                                                <button onClick={() => handleDelete(expense.id)} className="text-red-400 hover:text-red-300">Remover</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <ExpenseModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave} 
                expenseToEdit={expenseToEdit} 
            />
        </>
    );
};

export default ManageExpenses;