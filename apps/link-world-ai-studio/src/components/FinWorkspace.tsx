import React, { useEffect, useState } from 'react';
import { 
  DollarSign, RefreshCw, Search, ExternalLink, ArrowRight, ShieldCheck, Lock
} from 'lucide-react';
import { Business, linkContext } from '../services/linkContext.ts';
import { EmptyState } from './EmptyState.tsx';

interface FinWorkspaceProps {
  businesses: Business[];
  selectedBusiness: Business | null;
  onSelectBusiness: (business: Business | null) => void;
  onNavigate: (dimension: string, business?: Business | null) => void;
  onOpenAuth: () => void;
}

export const FinWorkspace: React.FC<FinWorkspaceProps> = ({
  businesses,
  selectedBusiness,
  onSelectBusiness,
  onOpenAuth,
}) => {
  const [section, setSection] = useState<string>('home');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [summaryState, setSummaryState] = useState<any>(null);
  const [movementsState, setMovementsState] = useState<any>(null);
  const [lifecycleState, setLifecycleState] = useState<any>(null);

  const sections = [
    { id: 'home', label: 'Inicio', icon: '⌂' },
    { id: 'evolution', label: 'Evolución', icon: '↗' },
    { id: 'movements', label: 'Movimientos', icon: '≋' },
    { id: 'billing', label: 'Facturación', icon: '▤' },
    { id: 'collections', label: 'Cobros', icon: '↘' },
    { id: 'outflows', label: 'Egresos', icon: '↗' },
    { id: 'transfers', label: 'Transferencias', icon: '⇄' },
    { id: 'collaborators', label: 'Colaboradores', icon: '◎' },
    { id: 'taxes', label: 'Impuestos', icon: '%' },
    { id: 'reconciliation', label: 'Conciliación', icon: '✓' },
    { id: 'documents', label: 'Comprobantes', icon: '□' },
    { id: 'connections', label: 'Conexiones', icon: '⌁' },
    { id: 'activity', label: 'Actividad', icon: '◌' },
  ];

  async function loadData() {
    setLoading(true);
    const data = await linkContext.getFinances(selectedBusiness ? selectedBusiness.id : undefined);
    setSummaryState(data.summary);
    setMovementsState(data.movements);
    setLifecycleState(data.lifecycle);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [selectedBusiness?.id]);

  const money = (n: number = 0, currency: string = 'CLP') => {
    try {
      return new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
    } catch {
      return `$${Math.round(n).toLocaleString('es-CL')}`;
    }
  };

  const day = (v?: string) => v ? new Date(v).toLocaleDateString('es-CL') : '—';

  // Si no hay acceso autorizado a FIN
  const isUnauthorized = summaryState?.status === 'unauthorized' || movementsState?.status === 'unauthorized';

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 animate-fadeIn">
      {/* Encabezado Editorial de LINK FIN */}
      <section className="space-y-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase flex items-center gap-2" style={{ color: 'var(--ink-faint)' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--link-fluor)' }} />
              <span>DIMENSIÓN TRANSVERSAL · LINK FIN</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mt-1" style={{ color: 'var(--ink)' }}>
              Verdad Económica y Certificación
            </h1>
            <p className="text-xs sm:text-sm pt-1" style={{ color: 'var(--ink-muted)' }}>
              Principio innegociable: Factura no es cobro. Solo caja verificada ingresa al cómputo de Negocio Comprobado.
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
              <option value="all">Todas las células (Consolidado)</option>
              {businesses.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <button
              onClick={loadData}
              title="Actualizar finanzas"
              className="p-1.5 rounded-xs hover:opacity-70 transition-opacity"
              style={{ background: 'var(--surface)', color: 'var(--ink)' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 13 Secciones Operativas */}
        <div className="overflow-x-auto pt-2">
          <div className="flex items-center gap-1 min-w-max pb-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`px-3 py-1 text-xs font-mono rounded-xs transition-colors ${
                  section === s.id ? 'font-bold' : ''
                }`}
                style={{
                  background: section === s.id ? 'var(--ink)' : 'transparent',
                  color: section === s.id ? 'var(--canvas)' : 'var(--ink-muted)',
                }}
              >
                <span className="mr-1 opacity-70">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Si la consulta requiere autenticación de miembro LINK */}
      {isUnauthorized ? (
        <EmptyState
          type="unauthorized"
          title="Mesa FIN Protegida por Seguridad RLS"
          description="Las vistas link_fin_real_summary_v y link_fin_real_movements_v contienen datos bancarios y tributarios reales de LINK CONTROL CENTRAL. Para visualizarlos se requiere una sesión activa con membresía autorizada."
          actionLabel="Iniciar Sesión de Miembro LINK"
          onAction={onOpenAuth}
          technicalDetails="Error Supabase: permission denied for view link_fin_real_summary_v (Row Level Security)"
        />
      ) : (
        <>
          {/* KPIs de Caja */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-xs" style={{ background: 'var(--surface-low)' }}>
              <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--ink-faint)' }}>
                FACTURADO LÍQUIDO
              </span>
              <strong className="text-xl font-bold font-display block mt-1" style={{ color: 'var(--ink)' }}>
                {money(summaryState?.data?.income_after_tax || 0)}
              </strong>
              <small className="text-[10px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                {summaryState?.data?.evidenced_movements || 0} respaldos documentales
              </small>
            </div>

            <div className="p-4 rounded-xs" style={{ background: 'var(--surface-low)' }}>
              <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--ink-faint)' }}>
                COBRADO VERIFICADO
              </span>
              <strong className="text-xl font-bold font-display block mt-1" style={{ color: 'var(--ink)' }}>
                {money(summaryState?.data?.income_collected || 0)}
              </strong>
              <small className="text-[10px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                {summaryState?.data?.verified_cash_movements || 0} movimientos de caja
              </small>
            </div>

            <div className="p-4 rounded-xs" style={{ background: 'var(--surface-low)' }}>
              <span className="text-[10px] font-mono uppercase block" style={{ color: 'var(--ink-faint)' }}>
                PENDIENTE DE COBRO
              </span>
              <strong className="text-xl font-bold font-display block mt-1" style={{ color: 'var(--ink)' }}>
                {money(Math.max(0, (summaryState?.data?.income_after_tax || 0) - (summaryState?.data?.income_collected || 0)))}
              </strong>
              <small className="text-[10px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                Facturado sin dinero en cuenta
              </small>
            </div>

            <div className="p-4 rounded-xs" style={{ background: 'var(--surface)', borderLeft: '2px solid var(--link-fluor)' }}>
              <span className="text-[10px] font-mono uppercase block font-bold" style={{ color: 'var(--ink)' }}>
                NETO REAL
              </span>
              <strong className="text-xl font-bold font-display block mt-1" style={{ color: 'var(--ink)' }}>
                {money(summaryState?.data?.net_real || summaryState?.data?.income_collected || 0)}
              </strong>
              <small className="text-[10px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                Solo caja comprobada
              </small>
            </div>
          </section>

          {/* Lista de movimientos */}
          <section className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--ink-faint)' }}>
              Movimientos Financieros ({movementsState?.data?.length || 0})
            </h2>

            {movementsState?.status === 'empty' ? (
              <EmptyState
                type="empty"
                title="Sin movimientos registrados"
                description={`No existen transacciones financieras verificadas registradas para ${selectedBusiness ? selectedBusiness.name : 'este filtro'}.`}
              />
            ) : (
              <div className="overflow-x-auto text-xs" style={{ background: 'var(--surface-low)' }}>
                <table className="w-full text-left">
                  <thead className="border-b font-mono text-[10px]" style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-faint)' }}>
                    <tr>
                      <th className="p-3">FECHA</th>
                      <th className="p-3">CONCEPTO</th>
                      <th className="p-3">ESTADO</th>
                      <th className="p-3 text-right">BRUTO</th>
                      <th className="p-3 text-right">CAJA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {movementsState?.data?.map((m: any) => (
                      <tr key={m.id} className="hover:opacity-80 transition-opacity">
                        <td className="p-3 font-mono" style={{ color: 'var(--ink-muted)' }}>{day(m.occurred_at)}</td>
                        <td className="p-3 font-medium" style={{ color: 'var(--ink)' }}>{m.concept || m.transaction_type}</td>
                        <td className="p-3">
                          <span 
                            className="text-[10px] font-mono px-2 py-0.5 rounded-xs"
                            style={{ 
                              background: m.payment_verified ? 'var(--link-fluor-soft)' : 'var(--surface)',
                              color: 'var(--ink)'
                            }}
                          >
                            {m.payment_verified ? 'Caja Verificada' : 'Solo Facturado'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono" style={{ color: 'var(--ink-muted)' }}>
                          {money(m.gross_amount, m.currency)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold" style={{ color: 'var(--ink)' }}>
                          {money(m.payment_verified ? m.net_basis_amount : 0, m.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
