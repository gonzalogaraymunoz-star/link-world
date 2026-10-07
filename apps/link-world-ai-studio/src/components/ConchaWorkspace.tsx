import React, { useState } from 'react';
import { 
  Workflow, ArrowRight, MessageSquare, ShoppingCart, Lock, 
  ClipboardCheck, Activity, Award, ArrowLeft
} from 'lucide-react';
import { Business } from '../services/linkContext.ts';

interface ConchaWorkspaceProps {
  business: Business;
  onNavigate: (dimension: string, business?: Business | null) => void;
  onBack: () => void;
}

export const ConchaWorkspace: React.FC<ConchaWorkspaceProps> = ({
  business,
  onNavigate,
  onBack,
}) => {
  const [activeStage, setActiveStage] = useState<string>('mar');

  const stages = [
    {
      id: 'mar',
      name: 'MAR',
      title: 'Membrana y Escucha',
      desc: 'Conversación, relación, escucha y conducción del interés del mundo exterior.',
      icon: MessageSquare,
      handoff: 'Entrega persona, necesidad, idioma y conversación estructurada a Venta.',
    },
    {
      id: 'sales',
      name: 'VENTA',
      title: 'Propuesta de Valor',
      desc: 'Transforma la necesidad comprendida en una propuesta comercial y cotización concreta.',
      icon: ShoppingCart,
      handoff: 'Entrega propuesta aceptada con precio, producto y condiciones a Cierre.',
    },
    {
      id: 'closing',
      name: 'CIERRE',
      title: 'Compromiso Formal',
      desc: 'Convierte la aceptación comercial en un compromiso verificable, reserva y solicitud de pago.',
      icon: Lock,
      handoff: 'Entrega compromiso formalizado y estado de cobro a Boarding.',
    },
    {
      id: 'boarding',
      name: 'BOARDING',
      title: 'Preparación Operacional',
      desc: 'Recopila datos de pasajeros, documentación, asigna recursos y verifica readiness.',
      icon: ClipboardCheck,
      handoff: 'Entrega paquete operacional completo y verificado a Opera.',
    },
    {
      id: 'operations',
      name: 'OPERA',
      title: 'Ejecución Real',
      desc: 'Entrega y cumple la promesa en el mundo real, registrando incidencias y evidencia de entrega.',
      icon: Activity,
      handoff: 'Entrega resultado de prestación y evidencia de entrega a Postventa.',
    },
    {
      id: 'postventa',
      name: 'POSTVENTA',
      title: 'Cierre y Aprendizaje',
      desc: 'Comprueba satisfacción, resuelve reclamos, gestiona devoluciones y alimenta nuevos ciclos.',
      icon: Award,
      handoff: 'Cierra el caso o genera nueva señal para MAR / Venta (recurrencia).',
    },
  ];

  const current = stages.find(s => s.id === activeStage) || stages[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 animate-fadeIn">
      {/* Cabecera Editorial de La Concha */}
      <section className="space-y-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-[11px] font-mono tracking-widest uppercase flex items-center gap-2" style={{ color: 'var(--ink-faint)' }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--link-fluor)' }} />
            <span>DIMENSIÓN 3 · LA CONCHA OPERACIONAL</span>
          </div>

          <button
            onClick={onBack}
            className="text-xs font-mono flex items-center gap-1.5 self-start sm:self-auto hover:opacity-70 transition-opacity"
            style={{ color: 'var(--ink-muted)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a {business.name}</span>
          </button>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight" style={{ color: 'var(--ink)' }}>
            La Concha Operacional de {business.name}
          </h1>
          <p className="text-xs sm:text-sm max-w-2xl leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
            Estructura de doble articulación: Dirección coordina prioridades desde arriba y la célula opera sus casos desde abajo a través de las 6 etapas.
          </p>
        </div>

        {/* Las 6 Etapas: Navegación Architectural Ledger */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {stages.map((st, i) => {
            const active = activeStage === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setActiveStage(st.id)}
                className="p-3 text-left rounded-xs transition-colors flex flex-col justify-between"
                style={{
                  background: active ? 'var(--surface-high)' : 'var(--surface-low)',
                  borderBottom: active ? '2px solid var(--link-fluor)' : '2px solid transparent',
                }}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-2" style={{ color: 'var(--ink-faint)' }}>
                  <span>0{i + 1}</span>
                  <st.icon className="w-3.5 h-3.5" style={{ color: active ? 'var(--ink)' : 'var(--ink-faint)' }} />
                </div>
                <div>
                  <strong className="block text-xs font-bold font-mono" style={{ color: 'var(--ink)' }}>
                    {st.name}
                  </strong>
                  <span className="text-[10px] truncate block" style={{ color: 'var(--ink-muted)' }}>
                    {st.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Mesa de Trabajo de la Etapa Seleccionada */}
      <section className="space-y-4">
        <div className="p-4 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'var(--surface-low)' }}>
          <div>
            <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--ink-faint)' }}>
              MESA DE TRABAJO
            </span>
            <h2 className="text-xl font-bold font-display mt-0.5" style={{ color: 'var(--ink)' }}>
              {current.name} · {current.title}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
              {current.desc}
            </p>
          </div>

          <div 
            className="p-3 rounded-xs text-xs font-mono max-w-sm"
            style={{ background: 'var(--surface)', color: 'var(--ink)' }}
          >
            <span className="text-[10px] text-slate-500 uppercase block mb-1">CONTRATO DE HANDOFF</span>
            {current.handoff}
          </div>
        </div>

        {/* Paneles de la Mesa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-xs space-y-2" style={{ background: 'var(--surface-low)' }}>
            <span className="text-[10px] font-mono uppercase font-bold block" style={{ color: 'var(--ink-faint)' }}>
              ENTRADAS DE {current.name}
            </span>
            <p style={{ color: 'var(--ink-muted)' }}>
              Datos e información estructurada recibida de la etapa anterior para operar sin fricción.
            </p>
            <div className="pt-2 border-t font-mono text-[11px] space-y-1" style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-muted)' }}>
              <div>• Identificador de caso canónico</div>
              <div>• Célula: {business.slug}</div>
              <div>• Trazabilidad inmutable</div>
            </div>
          </div>

          <div className="p-4 rounded-xs space-y-2" style={{ background: 'var(--surface-low)' }}>
            <span className="text-[10px] font-mono uppercase font-bold block" style={{ color: 'var(--ink-faint)' }}>
              ARTEFACTOS DE LA MESA
            </span>
            <p style={{ color: 'var(--ink-muted)' }}>
              Herramientas concretas de software y plantillas que facilitan el trabajo de esta etapa.
            </p>
            <div className="pt-2 border-t font-mono text-[11px] space-y-1" style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-muted)' }}>
              {activeStage === 'mar' && <div>• ComunEscucha / Inbox unificado</div>}
              {activeStage === 'sales' && <div>• Catálogo / Cotizador dinámico</div>}
              {activeStage === 'closing' && <div>• Payment Orchestrator / Gates</div>}
              {activeStage === 'boarding' && <div>• Autorrellenador de Formularios</div>}
              {activeStage === 'operations' && <div>• Torre de Control / Check-in</div>}
              {activeStage === 'postventa' && <div>• Sensor de Aprendizajes / Feedback</div>}
            </div>
          </div>

          <div className="p-4 rounded-xs space-y-2" style={{ background: 'var(--surface-low)' }}>
            <span className="text-[10px] font-mono uppercase font-bold block" style={{ color: 'var(--ink-faint)' }}>
              GATE DE SALIDA
            </span>
            <p style={{ color: 'var(--ink-muted)' }}>
              Condición estricta requerida para que el caso avance a la siguiente fase de La Concha.
            </p>
            <div className="p-2.5 rounded-xs text-[11px] font-mono" style={{ background: 'var(--surface)', color: 'var(--ink)' }}>
              Condición: Contrato verificado con respaldo.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
