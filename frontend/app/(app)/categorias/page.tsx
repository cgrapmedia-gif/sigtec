'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { pode } from '@/lib/permissoes';

const TIPOS = [
  { valor: 'EQUIPAMENTO', rotulo: 'Equipamento' },
  { valor: 'SOFTWARE', rotulo: 'Software / licença' },
  { valor: 'SERVICO', rotulo: 'Serviço / subscrição' },
  { valor: 'INFRAESTRUTURA', rotulo: 'Infraestrutura' },
  { valor: 'CONSUMIVEL', rotulo: 'Consumível' },
  { valor: 'CONTRATO', rotulo: 'Contrato' },
];
const TIPOS_CAMPO = ['texto', 'numero', 'data', 'booleano'];

export default function CategoriasPage() {
  const podeGerir = pode('categorias.gerir');
  const [cats, setCats] = useState<any[]>([]);
  const [editar, setEditar] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const carregar = useCallback(() => { api('/categorias?todas=1').then(setCats).catch((e) => setMsg(e.message)); }, []);
  useEffect(carregar, [carregar]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold flex-1">Categorias</h1>
        {podeGerir && <button className="btn-primario" onClick={() => setEditar({})}>＋ Nova categoria</button>}
      </div>
      <p className="text-[13px] text-cinza">
        Cada categoria define o seu próprio ciclo de vida, critérios de obsolescência, rotina de manutenção e
        campos próprios. Criar uma categoria nova não exige alteração de código.
      </p>
      {msg && <p className="text-vermelho text-sm">{msg}</p>}

      <div className="cartao envolvente-tabela overflow-x-auto">
        <table className="w-full tabela-adaptavel sm:min-w-[760px]">
          <thead>
            <tr>
              <th className="th">Categoria</th><th className="th">Tipo</th><th className="th">Ciclo de vida</th>
              <th className="th">Critérios de obsolescência</th><th className="th">Rotina</th>
              <th className="th">Itens</th>{podeGerir && <th className="th"></th>}
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className={c.activa ? '' : 'opacity-50'}>
                <td data-principal className="td"><span className="mr-1.5">{c.icone}</span><span className="font-medium">{c.nome}</span></td>
                <td data-rotulo="Tipo" className="td text-[12.5px]">{TIPOS.find((t) => t.valor === c.tipo)?.rotulo ?? c.tipo}</td>
                <td data-rotulo="Ciclo de vida" className="td font-mono text-xs">{(c.cicloVidaMeses / 12).toFixed(c.cicloVidaMeses % 12 ? 1 : 0)} anos</td>
                <td data-rotulo="Critérios" className="td text-[12px] text-cinza">≥ {c.falhasCriticas} falhas/6m · reparação &gt; {c.racioReparacao}%</td>
                <td data-rotulo="Rotina" className="td text-[12px]">{c.rotinaMeses ? `${c.rotinaTarefa} (${c.rotinaMeses}m)` : '—'}</td>
                <td data-rotulo="Itens" className="td font-mono">{c.totalItens}</td>
                {podeGerir && <td data-accoes className="td text-right"><button className="btn-contorno !min-h-0 !px-2.5 !py-1 !text-[11px]" onClick={() => setEditar(c)}>Editar</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editar && <FormCategoria categoria={editar} fechar={() => setEditar(null)} feito={() => { setEditar(null); carregar(); }} />}
    </div>
  );
}

function FormCategoria({ categoria, fechar, feito }: any) {
  const novo = !categoria.id;
  const [f, setF] = useState<any>({
    nome: categoria.nome ?? '', tipo: categoria.tipo ?? 'EQUIPAMENTO', icone: categoria.icone ?? '',
    cicloVidaMeses: categoria.cicloVidaMeses ?? 60, falhasCriticas: categoria.falhasCriticas ?? 5,
    racioReparacao: categoria.racioReparacao ?? 50, rotinaTarefa: categoria.rotinaTarefa ?? '',
    rotinaMeses: categoria.rotinaMeses ?? '', activa: categoria.activa ?? true,
  });
  const [campos, setCampos] = useState<any[]>(Array.isArray(categoria.esquemaCampos) ? categoria.esquemaCampos : []);
  const [erro, setErro] = useState('');
  const set = (c: string, v: any) => setF((s: any) => ({ ...s, [c]: v }));

  async function guardar() {
    if (!f.nome.trim()) { setErro('Indique o nome da categoria.'); return; }
    try {
      const corpo = JSON.stringify({ ...f, rotinaMeses: f.rotinaMeses || null, esquemaCampos: campos });
      if (novo) await api('/categorias', { method: 'POST', body: corpo });
      else await api(`/categorias/${categoria.id}`, { method: 'PATCH', body: corpo });
      feito();
    } catch (e: any) { setErro(e.message); }
  }

  return (
    <Modal titulo={novo ? 'Nova categoria' : `Editar ${categoria.nome}`} fechar={fechar} rodape={
      <><button className="btn-contorno" onClick={fechar}>Cancelar</button><button className="btn-primario" onClick={guardar}>Guardar</button></>
    }>
      <div className="space-y-3.5">
        <div className="grid sm:grid-cols-[1fr_auto] gap-3.5">
          <div>
            <label className="campo-rotulo">Nome</label>
            <input className="campo-input" value={f.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex.: Ligação de Internet" />
          </div>
          <div>
            <label className="campo-rotulo">Ícone</label>
            <input className="campo-input w-24 text-center" value={f.icone} onChange={(e) => set('icone', e.target.value)} placeholder="🌐" />
          </div>
        </div>
        <div>
          <label className="campo-rotulo">Tipo de item</label>
          <select className="campo-input" value={f.tipo} onChange={(e) => set('tipo', e.target.value)}>
            {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}
          </select>
        </div>

        <fieldset className="border border-linha rounded-xl p-3.5">
          <legend className="text-[11.5px] font-semibold uppercase tracking-wide text-cinza px-1.5">Critérios de obsolescência</legend>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="campo-rotulo">Ciclo de vida (meses)</label>
              <input className="campo-input" type="number" min={1} value={f.cicloVidaMeses} onChange={(e) => set('cicloVidaMeses', e.target.value)} />
            </div>
            <div>
              <label className="campo-rotulo">Falhas críticas /6m</label>
              <input className="campo-input" type="number" min={1} value={f.falhasCriticas} onChange={(e) => set('falhasCriticas', e.target.value)} />
            </div>
            <div>
              <label className="campo-rotulo">Rácio reparação (%)</label>
              <input className="campo-input" type="number" min={1} max={100} value={f.racioReparacao} onChange={(e) => set('racioReparacao', e.target.value)} />
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-linha rounded-xl p-3.5">
          <legend className="text-[11.5px] font-semibold uppercase tracking-wide text-cinza px-1.5">Rotina de manutenção</legend>
          <div className="grid sm:grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="campo-rotulo">Tarefa</label>
              <input className="campo-input" value={f.rotinaTarefa} onChange={(e) => set('rotinaTarefa', e.target.value)} placeholder="Ex.: Limpeza de filtros" />
            </div>
            <div>
              <label className="campo-rotulo">Periodicidade</label>
              <select className="campo-input" value={f.rotinaMeses} onChange={(e) => set('rotinaMeses', e.target.value)}>
                <option value="">Sem rotina</option>
                <option value="1">Mensal</option><option value="3">Trimestral</option>
                <option value="6">Semestral</option><option value="12">Anual</option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-linha rounded-xl p-3.5">
          <legend className="text-[11.5px] font-semibold uppercase tracking-wide text-cinza px-1.5">Campos próprios desta categoria</legend>
          <p className="text-[11.5px] text-cinza mb-2">
            Definem que informação é pedida ao registar um item desta categoria — por exemplo, largura de banda
            numa ligação de internet, ou número de postos numa licença.
          </p>
          <div className="space-y-2">
            {campos.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input className="campo-input flex-1" value={c.rotulo}
                  onChange={(e) => setCampos((s) => s.map((x, j) => j === i ? { ...x, rotulo: e.target.value, chave: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') } : x))}
                  placeholder="Nome do campo" />
                <select className="campo-input w-32" value={c.tipo}
                  onChange={(e) => setCampos((s) => s.map((x, j) => j === i ? { ...x, tipo: e.target.value } : x))}>
                  {TIPOS_CAMPO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button className="text-vermelho px-2" onClick={() => setCampos((s) => s.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
          </div>
          <button className="btn-contorno !px-3 !py-1.5 !text-xs mt-2"
            onClick={() => setCampos((s) => [...s, { chave: '', rotulo: '', tipo: 'texto' }])}>＋ Acrescentar campo</button>
        </fieldset>

        {!novo && (
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={f.activa} onChange={(e) => set('activa', e.target.checked)} />
            Categoria activa (desactivar esconde-a de novos registos, sem afectar os itens existentes)
          </label>
        )}
        {erro && <p className="text-vermelho text-sm">{erro}</p>}
      </div>
    </Modal>
  );
}

function Modal({ titulo, children, rodape, fechar }: any) {
  return (
    <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal-caixa sm:max-w-2xl">
        <div className="modal-cabecalho">
          <h3 className="font-bold flex-1">{titulo}</h3>
          <button className="text-cinza text-xl px-2" onClick={fechar}>✕</button>
        </div>
        <div className="modal-corpo">{children}</div>
        <div className="modal-rodape">{rodape}</div>
      </div>
    </div>
  );
}
