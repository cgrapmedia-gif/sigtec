'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtData } from '@/lib/formato';

export default function QuestionarioPage() {
  const [respostas, setRespostas] = useState<any[]>([]);
  const [f, setF] = useState({ problema: '', equipamento: '', ferramenta: '', automatizar: '', formacao: '' });
  const [msg, setMsg] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const carregar = useCallback(() => { api('/questionario').then(setRespostas).catch((e) => setMsg(e.message)); }, []);
  useEffect(carregar, [carregar]);

  const set = (c: string, v: string) => setF((s) => ({ ...s, [c]: v }));

  async function enviar() {
    if (f.problema.trim().length < 5) { setMsg('Descreva pelo menos o principal problema.'); return; }
    try {
      await api('/questionario', { method: 'POST', body: JSON.stringify(f) });
      setF({ problema: '', equipamento: '', ferramenta: '', automatizar: '', formacao: '' });
      setSucesso(true); setMsg('');
      setTimeout(() => setSucesso(false), 4000);
      carregar();
    } catch (e: any) { setMsg(e.message); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Questionário Técnico</h1>
      <p className="text-[13px] text-cinza">
        Questionário permanente à equipa técnica. As respostas alimentam o plano de investimento e de formação
        apresentado à Direcção.
      </p>
      {msg && <p className="text-vermelho text-sm">{msg}</p>}

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <section className="cartao space-y-3.5">
          <h2 className="text-[15px] font-bold">A sua resposta</h2>
          <div>
            <label className="campo-rotulo">Qual o principal problema que encontra actualmente?</label>
            <textarea className="campo-input min-h-[80px]" value={f.problema} onChange={(e) => set('problema', e.target.value)} />
          </div>
          <div>
            <label className="campo-rotulo">Que equipamento apresenta mais falhas?</label>
            <input className="campo-input" value={f.equipamento} onChange={(e) => set('equipamento', e.target.value)} />
          </div>
          <div>
            <label className="campo-rotulo">Que ferramenta ou material necessita?</label>
            <input className="campo-input" value={f.ferramenta} onChange={(e) => set('ferramenta', e.target.value)} />
          </div>
          <div>
            <label className="campo-rotulo">Que processo deveria ser automatizado?</label>
            <input className="campo-input" value={f.automatizar} onChange={(e) => set('automatizar', e.target.value)} />
          </div>
          <div>
            <label className="campo-rotulo">Que formação considera necessária?</label>
            <input className="campo-input" value={f.formacao} onChange={(e) => set('formacao', e.target.value)} />
          </div>
          {sucesso && <p className="text-verde text-sm font-semibold">✓ Resposta registada. Obrigado pelo contributo.</p>}
          <button className="btn-primario" onClick={enviar}>Enviar resposta</button>
        </section>

        <section className="cartao">
          <h2 className="text-[15px] font-bold mb-3">Respostas recebidas ({respostas.length})</h2>
          <div className="space-y-3 max-h-[560px] overflow-y-auto">
            {respostas.map((r) => (
              <div key={r.id} className="border border-linha rounded-xl p-3.5">
                <div className="flex justify-between items-center mb-2">
                  <b className="text-[13px]">{r.autor?.nome}</b>
                  <span className="font-mono text-[11px] text-cinza">{fmtData(r.criadoEm)}</span>
                </div>
                <dl className="text-[12.5px] leading-relaxed space-y-1">
                  <div><b>Problema:</b> {r.problema}</div>
                  {r.equipamento && <div><b>Equipamento com falhas:</b> {r.equipamento}</div>}
                  {r.ferramenta && <div><b>Ferramenta necessária:</b> {r.ferramenta}</div>}
                  {r.automatizar && <div><b>A automatizar:</b> {r.automatizar}</div>}
                  {r.formacao && <div><b>Formação:</b> {r.formacao}</div>}
                </dl>
              </div>
            ))}
            {respostas.length === 0 && <p className="text-sm text-cinza py-4 text-center">Ainda não há respostas registadas.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
