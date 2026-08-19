'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import SeletorComCriar from '@/components/SeletorComCriar';

/**
 * Registo de vários itens de uma só vez.
 * Dois modos: repetição (N cópias iguais, numeradas automaticamente) ou lista
 * (colar de uma folha de cálculo, uma linha por equipamento).
 */
export default function RegistoEmLote({ categorias, departamentos, fornecedores, contratos, recarregar, fechar, feito }: any) {
  const [modo, setModo] = useState<'repetir' | 'lista'>('repetir');
  const [base, setBase] = useState<any>({
    tipo: 'EQUIPAMENTO', categoriaId: '', marca: '', modelo: '', localizacao: '',
    departamentoId: '', fornecedorId: '', contratoId: '',
    dataAquisicao: new Date().toISOString().slice(0, 10), fimGarantia: '', temDisco: false,
  });
  const [quantidade, setQuantidade] = useState(5);
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState('');
  const [aGuardar, setAGuardar] = useState(false);
  const set = (c: string, v: any) => setBase((s: any) => ({ ...s, [c]: v }));

  /** Cada linha: n.º de série ; localização ; responsável (as duas últimas são opcionais) */
  function analisarTexto() {
    return texto.split('\n').map((l) => l.trim()).filter(Boolean).map((linha) => {
      const [numSerie, localizacao] = linha.split(/[;\t]/).map((x) => x?.trim());
      return { numSerie: numSerie || null, ...(localizacao ? { localizacao } : {}) };
    });
  }

  async function guardar() {
    setErro('');
    if (!base.marca.trim() || !base.modelo.trim()) { setErro('Indique a marca e o modelo comuns aos equipamentos.'); return; }
    const variacoes = modo === 'lista' ? analisarTexto() : undefined;
    if (modo === 'lista' && (!variacoes || variacoes.length === 0)) { setErro('Cole pelo menos uma linha.'); return; }
    setAGuardar(true);
    try {
      const r = await api('/activos/lote', {
        method: 'POST',
        body: JSON.stringify({ base, quantidade: modo === 'repetir' ? quantidade : undefined, variacoes }),
      });
      setResultado(r);
    } catch (e: any) { setErro(e.message); } finally { setAGuardar(false); }
  }

  const totalPrevisto = modo === 'repetir' ? quantidade : analisarTexto().length;

  return (
    <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal-caixa sm:max-w-2xl">
        <div className="modal-cabecalho">
          <div className="flex-1">
            <h3 className="font-bold">Registar vários itens</h3>
            <p className="text-[11.5px] text-cinza">Para remessas de equipamento igual</p>
          </div>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>

        {resultado ? (
          <>
            <div className="modal-corpo">
              <p className="text-[15px] font-semibold text-verde mb-2">✓ {resultado.criados} item(ns) registado(s)</p>
              <div className="max-h-52 overflow-y-auto space-y-1 mb-3">
                {resultado.itens.map((i: any) => (
                  <p key={i.id} className="text-[12.5px] font-mono">{i.numInventario} — {i.marca} {i.modelo}</p>
                ))}
              </div>
              {resultado.erros.length > 0 && (
                <div className="bg-vermelho/5 border border-vermelho/20 rounded-lg p-3">
                  <p className="text-[13px] font-semibold text-vermelho mb-1">{resultado.erros.length} linha(s) com erro:</p>
                  {resultado.erros.map((e: any, i: number) => (
                    <p key={i} className="text-[12px]">Linha {e.linha}: {e.erro}</p>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-rodape">
              <button className="btn-primario" onClick={feito}>Concluído</button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-corpo space-y-3.5">
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setModo('repetir')}
                  className={`px-3 py-2 rounded-lg text-[12.5px] font-semibold ${modo === 'repetir' ? 'bg-preto text-white' : 'bg-papel text-cinza'}`}>
                  ⧉ Repetir N vezes
                </button>
                <button type="button" onClick={() => setModo('lista')}
                  className={`px-3 py-2 rounded-lg text-[12.5px] font-semibold ${modo === 'lista' ? 'bg-preto text-white' : 'bg-papel text-cinza'}`}>
                  📋 Colar lista
                </button>
              </div>

              <p className="text-[12.5px] text-cinza">
                Preencha os dados comuns a todos os equipamentos. Os números de inventário são atribuídos
                automaticamente e em sequência.
              </p>

              <div className="grid sm:grid-cols-2 gap-3.5">
                <SeletorComCriar rotulo="Categoria" valor={base.categoriaId} aoMudar={(v) => set('categoriaId', v)}
                  opcoes={categorias.filter((c: any) => c.tipo === base.tipo).map((c: any) => ({ id: c.id, nome: `${c.icone ?? ''} ${c.nome}`.trim() }))}
                  endpoint="/categorias" aoCriar={recarregar}
                  campos={[
                    { chave: 'nome', rotulo: 'Nome da categoria', obrigatorio: true },
                    { chave: 'cicloVidaMeses', rotulo: 'Ciclo de vida (meses)', tipo: 'numero', valorInicial: '60' },
                  ]} />
                <div>
                  <label className="campo-rotulo">Marca</label>
                  <input className="campo-input" value={base.marca} onChange={(e) => set('marca', e.target.value)} placeholder="Ex.: HP" />
                </div>
                <div>
                  <label className="campo-rotulo">Modelo</label>
                  <input className="campo-input" value={base.modelo} onChange={(e) => set('modelo', e.target.value)} placeholder="Ex.: ProDesk 400 G7" />
                </div>
                <div>
                  <label className="campo-rotulo">Localização comum</label>
                  <input className="campo-input" value={base.localizacao} onChange={(e) => set('localizacao', e.target.value)} placeholder="Ex.: Armazém" />
                </div>
                <SeletorComCriar rotulo="Departamento" valor={base.departamentoId} aoMudar={(v) => set('departamentoId', v)}
                  opcoes={departamentos.map((d: any) => ({ id: d.id, nome: d.nome }))}
                  endpoint="/departamentos" aoCriar={recarregar} textoVazio="— Não atribuído —" />
                <SeletorComCriar rotulo="Fornecedor" valor={base.fornecedorId} aoMudar={(v) => set('fornecedorId', v)}
                  opcoes={fornecedores.map((x: any) => ({ id: x.id, nome: x.nome }))}
                  endpoint="/fornecedores" aoCriar={recarregar} textoVazio="— Nenhum —"
                  campos={[
                    { chave: 'nome', rotulo: 'Nome do fornecedor', obrigatorio: true },
                    { chave: 'apoioTecnico', rotulo: 'Linha de apoio técnico' },
                  ]} />
                <div>
                  <label className="campo-rotulo">Data de aquisição</label>
                  <input className="campo-input" type="date" value={base.dataAquisicao} onChange={(e) => set('dataAquisicao', e.target.value)} />
                </div>
                <div>
                  <label className="campo-rotulo">Fim de garantia</label>
                  <input className="campo-input" type="date" value={base.fimGarantia} onChange={(e) => set('fimGarantia', e.target.value)} />
                </div>
              </div>

              {modo === 'repetir' ? (
                <div>
                  <label className="campo-rotulo">Quantos equipamentos?</label>
                  <input className="campo-input" type="number" min={1} max={100} value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))} />
                  <p className="text-[11px] text-cinza mt-1">Máximo 100 de cada vez. Os números de série podem ser preenchidos depois.</p>
                </div>
              ) : (
                <div>
                  <label className="campo-rotulo">Uma linha por equipamento</label>
                  <textarea className="campo-input min-h-[130px] font-mono !text-[13px]" value={texto} onChange={(e) => setTexto(e.target.value)}
                    placeholder={'CZC1234XKL; Balcão 1\nCZC1234XKM; Balcão 2\nCZC1234XKN; Balcão 3'} />
                  <p className="text-[11px] text-cinza mt-1">
                    Formato: <b>n.º de série ; localização</b> — a localização é opcional. Pode colar directamente de uma folha de cálculo.
                  </p>
                </div>
              )}

              <label className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={base.temDisco} onChange={(e) => set('temDisco', e.target.checked)} />
                Contêm suporte de armazenamento (exige sanitização em caso de abate)
              </label>

              {erro && <p className="text-vermelho text-sm">{erro}</p>}
            </div>
            <div className="modal-rodape">
              <button className="btn-contorno" onClick={fechar}>Cancelar</button>
              <button className="btn-primario" onClick={guardar} disabled={aGuardar || totalPrevisto === 0}>
                {aGuardar ? 'A registar…' : `Registar ${totalPrevisto} item(ns)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
