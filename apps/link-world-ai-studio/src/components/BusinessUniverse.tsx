import React, { useEffect, useState } from 'react';
import { 
  Building2, ArrowLeft, ShieldCheck, DollarSign, Activity, 
  Workflow, Layers, MapPin, ArrowRight, CheckCircle2, 
  FileText, Users, Tag, AlertCircle, Compass
} from 'lucide-react';
import { Business, linkContext, ClientCounterpart, ProductItem } from '../services/linkContext.ts';

interface BusinessUniverseProps {
  business: Business;
  onNavigate: (dimension: string, business?: Business | null) => void;
  onBack: () => void;
}

export const BusinessUniverse: React.FC<BusinessUniverseProps> = ({
  business,
  onNavigate,
  onBack,
}) => {
  const [clients, setClients] = useState<ClientCounterpart[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setQueryError('');
      setClients([]);
      setProducts([]);
      const [cRes, pRes] = await Promise.all([
        linkContext.getClients(business.id),
        linkContext.getProducts(business.id),
      ]);
      if (active) {
        setQueryError(cRes.errorMessage || pRes.errorMessage || '');
        setClients(cRes.data || []);
        setProducts(pRes.data || []);
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [business.id]);

  const owned = business.owned_facts || {};
  const activeMission = owned?.rrss_bridge?.active_mission || 
    owned?.mission_architecture?.active_mission_id || 
    (owned?.mission_architecture?.missions?.[0]?.id);
  const activeMissionTitle = owned?.mission_architecture?.missions?.[0]?.title ||
    (activeMission ? `Misión activa ${activeMission}` : null);

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 animate-fadeIn">
      {/* Cabecera Editorial de la Célula */}
      <section className="space-y-4 pb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-[11px] font-mono tracking-widest uppercase flex items-center gap-2" style={{ color: 'var(--ink-faint)' }}>
            <span 
              className="w-2 h-2 rounded-full inline-block" 
              style={{ background: 'var(--link-fluor)' }} 
            />
            <span>CÉLULA ECONÓMICA · {business.slug}</span>
          </div>

          <button
            onClick={onBack}
            className="text-xs font-mono flex items-center gap-1.5 self-start sm:self-auto hover:opacity-70 transition-opacity"
            style={{ color: 'var(--ink-muted)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Células</span>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight"
              style={{ color: 'var(--ink)' }}
            >
              {business.name}
            </h1>

            {business.verification_status === 'verified' && (
              <span 
                className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-xs inline-flex items-center gap-1 font-medium"
                style={{ background: 'var(--surface-high)', color: 'var(--ink)' }}
              >
                <ShieldCheck className="w-3 h-3" />
                REGISTRO VERIFICADO
              </span>
            )}
          </div>

          <p 
            className="text-sm sm:text-base max-w-3xl leading-relaxed"
            style={{ color: 'var(--ink-muted)' }}
          >
            {business.summary || business.sector || 'Célula económica activa en LINK WORLD.'}
          </p>

          {business.city && (
            <div className="flex items-center gap-1.5 text-xs font-mono pt-1" style={{ color: 'var(--ink-faint)' }}>
              <MapPin className="w-3.5 h-3.5" />
              <span>{business.city}, {business.country || 'Chile'}</span>
            </div>
          )}
        </div>

        {/* Misión Actual de la Célula */}
        {activeMission && (
          <div 
            className="p-3.5 rounded-xs flex items-center justify-between gap-3 text-xs"
            style={{ background: 'var(--surface-low)', borderLeft: '2px solid var(--link-fluor)' }}
          >
            <div>
              <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--ink-faint)' }}>
                MISIÓN ACTUAL DE LA CÉLULA ({activeMission})
              </span>
              <strong className="block mt-0.5" style={{ color: 'var(--ink)' }}>
                {activeMissionTitle || 'Progresión y conexión activa en el ecosistema.'}
              </strong>
            </div>

            <button
              onClick={() => onNavigate('director', business)}
              className="px-2.5 py-1 text-xs font-mono rounded-xs shrink-0 transition-opacity hover:opacity-80"
              style={{ background: 'var(--surface-high)', color: 'var(--ink)' }}
            >
              Ver en Director →
            </button>
          </div>
        )}
      </section>

      {/* Anatomía y Roles Canónicos de la Célula */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--ink-faint)' }}>
          Anatomía Operacional Canónica
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xs" style={{ background: 'var(--surface-low)' }}>
            <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--ink-faint)' }}>
              QUIÉN VENDE / FACTURA
            </span>
            <strong className="block mt-1 font-medium" style={{ color: 'var(--ink)' }}>
              {owned?.sales_apparatus?.channel || 'Sin rol registrado'}
            </strong>
          </div>

          <div className="p-3.5 rounded-xs" style={{ background: 'var(--surface-low)' }}>
            <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--ink-faint)' }}>
              QUIÉN OPERA
            </span>
            <strong className="block mt-1 font-medium" style={{ color: 'var(--ink)' }}>
              {owned?.hotel_experience_bridge?.role || 'Sin operador registrado'}
            </strong>
          </div>

          <div className="p-3.5 rounded-xs" style={{ background: 'var(--surface-low)' }}>
            <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--ink-faint)' }}>
              CONTRAPARTES CONECTADAS
            </span>
            <strong className="block mt-1 font-medium" style={{ color: 'var(--ink)' }}>
              {loading ? 'Consultando…' : queryError ? 'Consulta no disponible' : `${clients.length} registradas`}
            </strong>
          </div>

          <div className="p-3.5 rounded-xs" style={{ background: 'var(--surface-low)' }}>
            <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--ink-faint)' }}>
              PRODUCTOS REGISTRADOS
            </span>
            <strong className="block mt-1 font-medium" style={{ color: 'var(--ink)' }}>
              {loading ? 'Consultando…' : queryError ? 'Consulta no disponible' : `${products.length} ofertas estructuradas`}
            </strong>
          </div>
        </div>
      </section>

      {/* Las Grandes Puertas Internas de la Célula */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--ink-faint)' }}>
          Dimensiones de la Célula
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Puerta 1: La Concha Operativa */}
          <div
            onClick={() => onNavigate('concha', business)}
            className="cursor-pointer p-5 rounded-xs transition-colors flex flex-col justify-between group"
            style={{ background: 'var(--surface-low)' }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Workflow className="w-4 h-4" style={{ color: 'var(--ink)' }} />
                  <h3 className="font-bold text-base font-display" style={{ color: 'var(--ink)' }}>
                    La Concha
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--ink-faint)' }}>
                  6 ETAPAS
                </span>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                MAR → Venta → Cierre → Boarding → Opera → Postventa. Recorrido operacional de cada caso.
              </p>

              <div 
                className="grid grid-cols-6 gap-1 text-[9px] font-mono text-center pt-2 border-t"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-faint)' }}
              >
                <span>MAR</span>
                <span>VENTA</span>
                <span>CIERRE</span>
                <span>BOARD</span>
                <span>OPERA</span>
                <span>POST</span>
              </div>
            </div>

            <div 
              className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-mono"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink)' }}
            >
              <span>Abrir Concha</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* Puerta 2: LINK FIN Filtrado */}
          <div
            onClick={() => onNavigate('fin', business)}
            className="cursor-pointer p-5 rounded-xs transition-colors flex flex-col justify-between group"
            style={{ background: 'var(--surface-low)' }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" style={{ color: 'var(--ink)' }} />
                  <h3 className="font-bold text-base font-display" style={{ color: 'var(--ink)' }}>
                    LINK FIN ({business.slug})
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--ink-faint)' }}>
                  ECONOMÍA DEMOSTRADA
                </span>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                Movimientos, facturación, cobros verificados y brechas de vida económica.
              </p>

              <div 
                className="text-[10px] font-mono p-2 rounded-xs"
                style={{ background: 'var(--surface)', color: 'var(--ink-muted)' }}
              >
                Regla: Factura no es cobro. Solo caja verificada entra al gate económico.
              </div>
            </div>

            <div 
              className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-mono"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink)' }}
            >
              <span>Ver finanzas</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* Puerta 3: Operaciones */}
          <div
            onClick={() => onNavigate('operations', business)}
            className="cursor-pointer p-5 rounded-xs transition-colors flex flex-col justify-between group"
            style={{ background: 'var(--surface-low)' }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" style={{ color: 'var(--ink)' }} />
                  <h3 className="font-bold text-base font-display" style={{ color: 'var(--ink)' }}>
                    Operaciones y Entregas
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--ink-faint)' }}>
                  EJECUCIÓN
                </span>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                Servicios programados, asignación de operadores, logística y evidencia de entrega.
              </p>
            </div>

            <div 
              className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-mono"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink)' }}
            >
              <span>Ver operaciones</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* Puerta 4: Evolución */}
          <div
            onClick={() => onNavigate('evolution', business)}
            className="cursor-pointer p-5 rounded-xs transition-colors flex flex-col justify-between group"
            style={{ background: 'var(--surface-low)' }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" style={{ color: 'var(--ink)' }} />
                  <h3 className="font-bold text-base font-display" style={{ color: 'var(--ink)' }}>
                    Evolución Económica
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--ink-faint)' }}>
                  13 FASES
                </span>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                De Nacimiento a Negocio Comprobado, Recurrencia, Rentabilidad y Reproducción.
              </p>
            </div>

            <div 
              className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-mono"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink)' }}
            >
              <span>Ver ciclo de vida</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>
      </section>

      {/* Evidencias Históricas Registradas de la Célula */}
      {Array.isArray(business.evidence) && business.evidence.length > 0 && (
        <section className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-xs font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--ink-faint)' }}>
            Evidencias Registradas ({business.evidence.length})
          </h2>

          <div className="space-y-2">
            {business.evidence.map((ev, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xs text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                style={{ background: 'var(--surface-low)' }}
              >
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] uppercase block" style={{ color: 'var(--ink-faint)' }}>
                    {ev.type || 'registro'} · {ev.date || 'fecha no especificada'}
                  </span>
                  <p style={{ color: 'var(--ink)' }}>
                    {ev.fact || ev.repo || 'Evidencia verificable de la célula.'}
                  </p>
                </div>

                <span 
                  className="text-[10px] font-mono px-2 py-0.5 rounded-xs self-start sm:self-auto"
                  style={{ background: 'var(--surface)', color: 'var(--ink-muted)' }}
                >
                  {ev.state || 'REGISTRADA'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
