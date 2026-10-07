import React, { useEffect, useState } from 'react';
import { 
  Workflow, GitFork, Split, RefreshCw, Layers, ArrowRight, ShieldCheck
} from 'lucide-react';
import { linkContext, DataFetchResult } from '../services/linkContext.ts';
import { EmptyState } from './EmptyState.tsx';

interface ModelsWorkspaceProps {
  onNavigate: (dimension: string) => void;
  onOpenAuth?: () => void;
}

export const ModelsWorkspace: React.FC<ModelsWorkspaceProps> = ({
  onNavigate,
  onOpenAuth,
}) => {
  const loadVersion = React.useRef(0);
  const [modelsResult, setModelsResult] = useState<DataFetchResult<any[]>>({
    data: null,
    status: 'loading',
  });

  const maturityLabels: Record<string, string> = {
    hobby: 'Hobby',
    candidate: 'Modelo Candidato',
    evidenced: 'Evidenciado',
    repeatable: 'Repetible',
    productizable: 'Productizable',
    business_candidate: 'Candidato a Negocio',
    business: 'Negocio',
    replicable: 'Replicable',
  };

  async function loadModels() {
    const version = ++loadVersion.current;
    setModelsResult({ data: null, status: 'loading' });
    const res = await linkContext.getModels();
    if (version === loadVersion.current) setModelsResult(res);
  }

  useEffect(() => {
    void loadModels();
    return () => { loadVersion.current += 1; };
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 animate-fadeIn">
      {/* Cabecera Editorial de Modelos y La Concha Eterna */}
      <section className="space-y-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="text-[11px] font-mono tracking-widest uppercase flex items-center gap-2" style={{ color: 'var(--ink-faint)' }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--link-fluor)' }} />
          <span>REPRODUCCIÓN Y LA CONCHA ETERNA · MODEL FOUNDRY</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight" style={{ color: 'var(--ink)' }}>
            Cartera de Modelos Reutilizables
          </h1>
          <p className="text-xs sm:text-sm max-w-2xl leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
            Un modelo representa una forma reutilizable de resolver un dolor y producir valor. Los modelos validados originan nuevas células mediante Mitosis o Meiosis sin heredar la evidencia económica ajena.
          </p>
        </div>

        {/* Principio de Mitosis y Meiosis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono">
          <div className="p-3.5 rounded-xs" style={{ background: 'var(--surface-low)', borderLeft: '2px solid var(--link-fluor)' }}>
            <span className="text-[10px] uppercase font-bold block mb-1" style={{ color: 'var(--ink)' }}>
              MITOSIS · Replicación de Modelo
            </span>
            <p className="font-sans text-xs" style={{ color: 'var(--ink-muted)' }}>
              Hereda estructura, Concha base y artefactos. <strong style={{ color: 'var(--ink)' }}>Nunca hereda ventas, pagos ni dinero real de la madre.</strong>
            </p>
          </div>

          <div className="p-3.5 rounded-xs" style={{ background: 'var(--surface-low)' }}>
            <span className="text-[10px] uppercase font-bold block mb-1" style={{ color: 'var(--ink)' }}>
              MEIOSIS · Recombinación
            </span>
            <p className="font-sans text-xs" style={{ color: 'var(--ink-muted)' }}>
              Combina componentes probados de varios modelos para responder a un dolor nuevo, conservando la genealogía de sus orígenes.
            </p>
          </div>
        </div>
      </section>

      {/* Cartera de Modelos */}
      {modelsResult.status === 'loading' ? <EmptyState type="loading" title="Cargando modelos" /> : modelsResult.status === 'unauthorized' ? (
        <EmptyState
          type="unauthorized"
          title="Ingresa para consultar modelos"
          description="Ingresa con tu cuenta de miembro LINK para consultar la cartera y sus evidencias."
          actionLabel="Iniciar Sesión de Miembro LINK"
          onAction={onOpenAuth}
        />
      ) : modelsResult.status === 'empty' ? (
        <EmptyState
          type="empty"
          title="Sin modelos registrados actualmente"
          description="No existen modelos activos en link_world_model_portfolio_v para este entorno."
        />
      ) : modelsResult.status === 'error' ? (
        <EmptyState
          type="error"
          title="Fallo al consultar cartera de modelos"
          description={modelsResult.errorMessage}
        />
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <h2 className="text-xs font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--ink)' }}>
              Modelos Registrados ({modelsResult.data?.length || 0})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modelsResult.data?.map((m: any) => (
              <div 
                key={m.id}
                className="p-5 rounded-xs space-y-3"
                style={{ background: 'var(--surface-low)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--ink-faint)' }}>{m.model_key}</span>
                    <h3 className="text-base font-bold font-display" style={{ color: 'var(--ink)' }}>{m.name}</h3>
                  </div>

                  <span 
                    className="text-[10px] font-mono px-2 py-0.5 rounded-xs"
                    style={{ background: 'var(--surface)', color: 'var(--ink-muted)' }}
                  >
                    {maturityLabels[m.maturity_stage || ''] || m.maturity_stage || 'Sin etapa registrada'}
                  </span>
                </div>

                {m.pain_statement && (
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {m.pain_statement}
                  </p>
                )}

                <div 
                  className="pt-2 border-t flex items-center justify-between text-xs font-mono"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <span style={{ color: 'var(--ink-faint)' }}>
                    Readiness: <strong style={{ color: 'var(--ink)' }}>{m.readiness_score || 0}%</strong>
                  </span>
                  <span style={{ color: 'var(--ink-muted)' }}>
                    {m.verified_evidence_count || 0} evidencias verificadas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
