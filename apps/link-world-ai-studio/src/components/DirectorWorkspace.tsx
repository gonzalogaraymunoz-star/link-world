import React, { useState } from 'react';
import { 
  Cpu, Copy, Check, AlertTriangle, ArrowRight, ShieldCheck, 
  HelpCircle, CheckCircle2, Clock
} from 'lucide-react';
import { Business, AttentionItem, linkContext } from '../services/linkContext.ts';
import { EmptyState } from './EmptyState.tsx';

interface DirectorWorkspaceProps {
  businesses: Business[];
  onNavigate: (dimension: string, business?: Business | null) => void;
}

export const DirectorWorkspace: React.FC<DirectorWorkspaceProps> = ({
  businesses,
  onNavigate,
}) => {
  const [copyError, setCopyError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Derivar exclusivamente misiones y atención real desde los datos canónicos
  const realAttention = linkContext.deriveRealAttention(businesses);

  const handleCopyPrompt = async (item: AttentionItem) => {
    const prompt = `[LINK DIRECTOR CONTEXT]\nMisión / Atención: ${item.title} (${item.id})\nCélula: ${item.businessName} (${item.businessSlug})\nDimensión: ${item.dimension}\nCausa: ${item.reason}\nRegla: Bounded-Auto bajo LINK_SYSTEM_CORE.md y MAPA_MAESTRO.`;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyError('');
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { setCopyError('No se pudo copiar. Permite el acceso al portapapeles y vuelve a intentarlo.'); }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 animate-fadeIn">
      {/* Cabecera Editorial del Director */}
      <section className="space-y-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="text-[11px] font-mono tracking-widest uppercase flex items-center gap-2" style={{ color: 'var(--ink-faint)' }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--link-fluor)' }} />
          <span>GOBIERNO E INTELIGENCIA · LINK DIRECTOR</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight" style={{ color: 'var(--ink)' }}>
            Coordinación y Modo Shadow
          </h1>
          <p className="text-xs sm:text-sm max-w-2xl leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
            Director observa el estado real en Supabase, identifica bloqueos, mantiene continuidad y prepara acciones sin ejecutar mutaciones destructivas unilaterales.
          </p>
        </div>

        {/* Reglas de Bounded-Auto en formato Ledger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono">
          <div className="p-3.5 rounded-xs" style={{ background: 'var(--surface-low)' }}>
            <span className="text-[10px] uppercase font-bold block mb-1" style={{ color: 'var(--ink)' }}>
              ✓ BOUNDED-AUTO (Acción Interna Segura)
            </span>
            <p className="font-sans text-xs" style={{ color: 'var(--ink-muted)' }}>
              Crear misiones, solicitar evidencias, clasificar intenciones y recuperar memoria de Hipocampo.
            </p>
          </div>

          <div className="p-3.5 rounded-xs" style={{ background: 'var(--surface-low)', borderLeft: '2px solid var(--link-fluor)' }}>
            <span className="text-[10px] uppercase font-bold block mb-1" style={{ color: 'var(--ink)' }}>
              ⚠ APROBACIÓN HUMANA REQUERIDA
            </span>
            <p className="font-sans text-xs" style={{ color: 'var(--ink-muted)' }}>
              Pagos, reembolsos, publicaciones externas, modificaciones de esquemas o credenciales.
            </p>
          </div>
        </div>
      </section>

      {copyError && <p role="alert" className="text-xs">{copyError}</p>}
      {/* Misiones Reales Verificadas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-xs font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--ink)' }}>
            Misiones y Gates Reales en Curso ({realAttention.length})
          </h2>
          <span className="text-[11px] font-mono" style={{ color: 'var(--ink-faint)' }}>
            Sin simulaciones
          </span>
        </div>

        {realAttention.length > 0 ? (
          <div className="space-y-3">
            {realAttention.map(item => (
              <div 
                key={item.id}
                className="p-4 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                style={{ background: 'var(--surface-low)', borderLeft: '2px solid var(--link-fluor)' }}
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="font-bold" style={{ color: 'var(--ink)' }}>{item.id}</span>
                    <span className="text-[10px] uppercase px-1.5 py-0.2 rounded-xs" style={{ background: 'var(--surface)', color: 'var(--ink-muted)' }}>
                      {item.businessName}
                    </span>
                    <span className="text-[10px] uppercase px-1.5 py-0.2 rounded-xs" style={{ background: 'var(--surface)', color: 'var(--ink-faint)' }}>
                      {item.dimension}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                    {item.title}
                  </h3>

                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {item.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyPrompt(item)}
                    className="px-3 py-1.5 rounded-xs text-xs font-mono flex items-center gap-1.5 transition-colors"
                    style={{ background: 'var(--surface-high)', color: 'var(--ink)' }}
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Trabajar en ChatGPT</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const b = businesses.find(x => x.slug === item.businessSlug);
                      if (b) onNavigate('business', b);
                    }}
                    className="px-3 py-1.5 rounded-xs text-xs font-mono flex items-center gap-1 transition-opacity hover:opacity-80"
                    style={{ background: 'var(--ink)', color: 'var(--canvas)' }}
                  >
                    <span>Ir a célula</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            type="empty"
            title="Sin misiones críticas pendientes"
            description="No se encontraron señales de misión en las fichas disponibles para esta sesión."
          />
        )}
      </section>
    </div>
  );
};
