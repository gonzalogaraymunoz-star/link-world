import React, { useState } from 'react';
import { 
  Activity, Clock, MapPin, CheckCircle2, ShieldCheck, 
  ExternalLink, ArrowRight, Building2
} from 'lucide-react';
import { Business } from '../services/linkContext.ts';
import { EmptyState } from './EmptyState.tsx';

interface OperationsWorkspaceProps {
  businesses: Business[];
  selectedBusiness: Business | null;
  onSelectBusiness: (business: Business | null) => void;
  onNavigate: (dimension: string, business?: Business | null) => void;
}

export const OperationsWorkspace: React.FC<OperationsWorkspaceProps> = ({
  businesses,
  selectedBusiness,
  onSelectBusiness,
  onNavigate,
}) => {
  // Extraer información operativa canónica real desde owned_facts
  const operationalCells = businesses.filter(b => {
    if (selectedBusiness && b.id !== selectedBusiness.id) return false;
    const facts = b.owned_facts || {};
    return facts.operational_house_candidate || 
           facts.entry_stabilization || 
           facts.house_model ||
           facts.hotel_experience_bridge;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 animate-fadeIn">
      {/* Cabecera Editorial de la Torre de Operaciones */}
      <section className="space-y-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase flex items-center gap-2" style={{ color: 'var(--ink-faint)' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--link-fluor)' }} />
              <span>DIMENSIÓN TRANSVERSAL · TORRE DE OPERACIONES</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mt-1" style={{ color: 'var(--ink)' }}>
              Ejecución y Entrega en el Mundo Real
            </h1>
            <p className="text-xs sm:text-sm pt-1" style={{ color: 'var(--ink-muted)' }}>
              Principio innegociable: Operación completada ≠ Entrega verificada. El gate de Negocio Comprobado exige evidencia demostrable de la prestación.
            </p>
          </div>

          {/* Selector de Célula */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono" style={{ color: 'var(--ink-faint)' }}>CÉLULA:</span>
            <select
              value={selectedBusiness?.id || 'all'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all') onSelectBusiness(null);
                else {
                  const b = businesses.find(x => x.id === val);
                  if (b) onSelectBusiness(b);
                }
              }}
              className="text-xs font-mono px-2.5 py-1.5 rounded-xs border outline-none"
              style={{ background: 'var(--surface-low)', color: 'var(--ink)', borderColor: 'var(--border-subtle)' }}
            >
              <option value="all">Todas las células</option>
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Criterio Canónico de Verificación de Entrega */}
        <div 
          className="p-3.5 rounded-xs text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          style={{ background: 'var(--surface-low)', borderLeft: '2px solid var(--link-fluor)' }}
        >
          <span style={{ color: 'var(--ink)' }}>
            <strong>Criterio de Entrega:</strong> Operaciones entrega un paquete cerrado a Postventa únicamente cuando existe lista, acta o comprobante verificable de prestación en el mundo real.
          </span>
          <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--ink-faint)' }}>
            REGLA 21 · LINK WORLD
          </span>
        </div>
      </section>

      {/* Células con Núcleo Operacional Conectado */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-xs font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--ink)' }}>
            Núcleos Operacionales Verificados ({operationalCells.length})
          </h2>
          <span className="text-[11px] font-mono" style={{ color: 'var(--ink-faint)' }}>
            Datos reales de arquitectura de célula
          </span>
        </div>

        {operationalCells.length > 0 ? (
          <div className="space-y-3">
            {operationalCells.map(b => {
              const facts = b.owned_facts || {};
              const stabilization = facts.entry_stabilization;
              const completedSteps = stabilization?.completed || [];
              const nextGate = stabilization?.next_gate;

              return (
                <div 
                  key={b.id}
                  className="p-5 rounded-xs space-y-3 transition-colors"
                  style={{ background: 'var(--surface-low)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--ink-faint)' }}>
                        {b.slug} · NÚCLEO OPERATIVO
                      </span>
                      <h3 className="text-base font-bold font-display" style={{ color: 'var(--ink)' }}>
                        {b.name}
                      </h3>
                    </div>

                    <span 
                      className="text-[10px] font-mono px-2 py-0.5 rounded-xs font-medium"
                      style={{ background: 'var(--surface)', color: 'var(--ink-muted)' }}
                    >
                      {stabilization?.state || 'conectado'}
                    </span>
                  </div>

                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {b.summary || 'Célula con capacidades operacionales integradas al ecosistema.'}
                  </p>

                  {/* Siguiente Gate Operacional */}
                  {nextGate && (
                    <div 
                      className="p-2.5 rounded-xs text-xs font-mono flex items-center justify-between"
                      style={{ background: 'var(--surface)', color: 'var(--ink)' }}
                    >
                      <span>Siguiente Gate Operacional: <strong>{nextGate}</strong></span>
                      <button
                        onClick={() => onNavigate('business', b)}
                        className="text-[11px] hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>Abrir célula</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Pasos completados verificados */}
                  {completedSteps.length > 0 && (
                    <div className="pt-2 border-t text-[11px] font-mono" style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-faint)' }}>
                      <span>Capacidades estabilizadas: </span>
                      <span style={{ color: 'var(--ink-muted)' }}>{completedSteps.join(' · ')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            type="empty"
            title="Sin operaciones conectadas para este filtro"
            description="La fuente canónica no registra actualmente eventos operacionales pendientes para la célula seleccionada."
          />
        )}
      </section>
    </div>
  );
};
