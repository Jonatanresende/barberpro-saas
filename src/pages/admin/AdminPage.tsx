// ... (código anterior)
                            <tbody>
                                {barbearias.map(b => (
                                    <tr key={b.id} className="border-b border-brand-gray hover:bg-brand-gray">
                                        <td className="px-6 py-4 align-middle">
                                            <img src={b.foto_url || 'https://via.placeholder.com/40'} alt={b.nome} className="w-10 h-10 rounded-full object-cover" />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-white align-middle">{b.nome}</td>
                                        <td className="px-6 py-4 align-middle">{b.dono_email}</td>
                                        <td className="px-6 py-4 align-middle">{b.plano || 'N/A'}</td> {/* Adicionado fallback 'N/A' */}
                                        <td className="px-6 py-4 align-middle">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.status === 'ativa' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">{new Date(b.criado_em).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => handleOpenEditModal(b)} className="text-blue-400 hover:text-blue-300">Editar</button>
                                                <button onClick={() => handleToggleStatus(b)} className="text-yellow-400 hover:text-yellow-300">{b.status === 'ativa' ? 'Desativar' : 'Ativar'}</button>
                                                <button onClick={() => handleDelete(b)} className="text-red-400 hover:text-red-300">Excluir</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
// ... (restante do código)