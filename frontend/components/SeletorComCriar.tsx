'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

/**
 * Selector com criação no próprio local.
 *
 * Resolve um atrito clássico: estar a meio de um formulário, precisar de um departamento
 * ou categoria que ainda não existe, e ter de abandonar tudo para o criar noutro ecrã.
 * Aqui o botão «＋» abre um mini-formulário em linha, cria o registo e selecciona-o.
 */

export type CampoNovo = {
  chave: string;
  rotulo: string;
  tipo?: 'texto' | 'numero' | 'seleccao';
  opcoes?: string[];
  obrigatorio?: boolean;
  valorInicial?: string;
};

type Props = {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  opcoes: { id: string; nome: string }[];
  aoCriar?: () => void;              // recarregar a lista depois de criar
  endpoint?: string;                 // ex.: '/departamentos'
  campos?: CampoNovo[];              // campos do mini-formulário
  textoVazio?: string;
  ajuda?: string;
  permitirCriar?: boolean;
};

export default function SeletorComCriar({
  rotulo, valor, aoMudar, opcoes, aoCriar, endpoint, campos, textoVazio, ajuda, permitirCriar = true,
}: Props) {
  const [aCriar, setACriar] = useState(false);
  const [dados, setDados] = useState<Record<string, string>>({});
  const [erro, setErro] = useState('');
  const [aGuardar, setAGuardar] = useState(false);

  const listaCampos: CampoNovo[] = campos ?? [{ chave: 'nome', rotulo: 'Nome', obrigatorio: true }];

  function abrir() {
    const iniciais: Record<string, string> = {};
    for (const c of listaCampos) if (c.valorInicial) iniciais[c.chave] = c.valorInicial;
    setDados(iniciais);
    setErro('');
    setACriar(true);
  }

  async function criar() {
    if (!endpoint) return;
    for (const c of listaCampos) {
      if (c.obrigatorio && !dados[c.chave]?.trim()) { setErro(`Preencha «${c.rotulo}».`); return; }
    }
    setAGuardar(true);
    setErro('');
    try {
      const criado = await api(endpoint, { method: 'POST', body: JSON.stringify(dados) });
      setACriar(false);
      aoCriar?.();
      // Selecciona automaticamente o que acabou de criar
      const id = criado?.id ?? criado?.user?.id;
      if (id) aoMudar(id);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <div>
      <label className="campo-rotulo">{rotulo}</label>
      <div className="flex gap-2">
        <select className="campo-input flex-1" value={valor} onChange={(e) => aoMudar(e.target.value)}>
          <option value="">{textoVazio ?? '— Seleccionar —'}</option>
          {opcoes.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
        {permitirCriar && endpoint && (
          <button type="button" onClick={abrir} title={`Criar ${rotulo.toLowerCase()}`}
            className="btn-contorno !px-3 shrink-0" aria-label={`Criar ${rotulo.toLowerCase()}`}>＋</button>
        )}
      </div>
      {ajuda && !aCriar && <p className="text-[11px] text-cinza mt-1">{ajuda}</p>}

      {aCriar && (
        <div className="border border-dourado bg-[#FDFBF3] rounded-xl p-3 mt-2 space-y-2.5">
          <p className="text-[12px] font-semibold text-dourado uppercase tracking-wide">Criar {rotulo.toLowerCase()}</p>
          {listaCampos.map((c) => (
            <div key={c.chave}>
              <label className="campo-rotulo">{c.rotulo}{c.obrigatorio && ' *'}</label>
              {c.tipo === 'seleccao' ? (
                <select className="campo-input" value={dados[c.chave] ?? ''}
                  onChange={(e) => setDados((s) => ({ ...s, [c.chave]: e.target.value }))}>
                  <option value="">— Seleccionar —</option>
                  {(c.opcoes ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input className="campo-input" type={c.tipo === 'numero' ? 'number' : 'text'}
                  value={dados[c.chave] ?? ''}
                  onChange={(e) => setDados((s) => ({ ...s, [c.chave]: e.target.value }))} />
              )}
            </div>
          ))}
          {erro && <p className="text-vermelho text-[12.5px]">{erro}</p>}
          <div className="flex gap-2">
            <button type="button" className="btn-contorno !min-h-0 !py-2 !text-xs flex-1" onClick={() => setACriar(false)}>
              Cancelar
            </button>
            <button type="button" className="btn-primario !min-h-0 !py-2 !text-xs flex-1" onClick={criar} disabled={aGuardar}>
              {aGuardar ? 'A criar…' : 'Criar e usar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
