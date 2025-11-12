import React from 'react';

const SettingsCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray">
        <h3 className="text-xl font-semibold text-white mb-6 border-b border-brand-gray pb-4">{title}</h3>
        <div className="space-y-6">
            {children}
        </div>
    </div>
);

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
            <SettingsCard title="Conta">
                <InputField label="Nome" type="text" id="name" value="Admin" />
                <InputField label="E-mail" type="email" id="email" value="admin@barberpro.com" />
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                    <button className="bg-brand-gray hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Alterar Senha
                    </button>
                </div>
                 <div className="pt-4">
                    <button className="bg-brand-gold text-brand-dark font-bold py-2 px-6 rounded-lg hover:opacity-90">
                        Salvar Alterações
                    </button>
                </div>
            </SettingsCard>

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