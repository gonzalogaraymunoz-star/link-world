import React from 'react';
import { 
  Home, Compass, Radio, RefreshCw, Lock, 
  ClipboardList, Layers, ArrowUpRight, BarChart3, 
  Share2, Users, FileCheck, Box, TrendingUp, 
  LayoutGrid, Sprout, GitFork, Settings, Network, X
} from 'lucide-react';
import { Business } from '../services/linkContext.ts';

interface VerticalLedgerProps {
  currentDimension: string;
  selectedBusiness: Business | null;
  onNavigate: (dimension: string, business?: Business | null) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  implemented: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const VerticalLedger: React.FC<VerticalLedgerProps> = ({
  currentDimension,
  selectedBusiness,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}) => {
  const groups: NavGroup[] = [
    {
      title: 'LINK',
      items: [
        { id: 'businesses', label: 'Negocios', icon: Home, implemented: true },
        { id: 'director', label: 'Director', icon: Compass, implemented: true },
      ],
    },
    {
      title: 'OPERACIÓN',
      items: [
        { id: 'mar', label: 'MAR', icon: Radio, implemented: false },
        { id: 'sales', label: 'Ventas', icon: RefreshCw, implemented: false },
        { id: 'closing', label: 'Cierre', icon: Lock, implemented: false },
        { id: 'boarding', label: 'Boarding', icon: ClipboardList, implemented: false },
        { id: 'operations', label: 'Opera', icon: Layers, implemented: true },
        { id: 'postventa', label: 'Postventa', icon: ArrowUpRight, implemented: false },
      ],
    },
    {
      title: 'CAPACIDADES',
      items: [
        { id: 'fin', label: 'FIN', icon: BarChart3, implemented: true },
        { id: 'rrss', label: 'RRSS', icon: Share2, implemented: false },
        { id: 'personas', label: 'Personas', icon: Users, implemented: false },
        { id: 'evidencias', label: 'Evidencias', icon: FileCheck, implemented: false },
        { id: 'artefactos', label: 'Artefactos', icon: Box, implemented: false },
        { id: 'evolution', label: 'Evolución', icon: TrendingUp, implemented: false },
      ],
    },
    {
      title: 'REPRODUCCIÓN',
      items: [
        { id: 'models', label: 'Modelos', icon: LayoutGrid, implemented: true },
        { id: 'genesis', label: 'Génesis', icon: Sprout, implemented: false },
        { id: 'mitosis', label: 'Mitosis - Meiosis', icon: GitFork, implemented: false },
      ],
    },
    {
      title: 'SISTEMA',
      items: [
        { id: 'administracion', label: 'Administración', icon: Settings, implemented: false },
        { id: 'conexiones', label: 'Conexiones', icon: Network, implemented: false },
      ],
    },
  ];

  const handleSelect = (id: string) => {
    onNavigate(id, selectedBusiness);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-20 h-screen w-[210px] shrink-0 overflow-y-auto flex flex-col justify-between transition-transform duration-200 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ 
          backgroundColor: 'var(--sidebar-bg)', 
          borderRight: '1px solid var(--border-subtle)' 
        }}
      >
        {/* Logo superior de LINK WORLD con símbolo de radar */}
        <div>
          <div className="h-14 px-5 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={() => { onNavigate('world', null); onCloseMobile(); }}
              className="flex items-center gap-2.5 text-left group"
            >
              {/* Símbolo concéntrico con punto verde flúor */}
              <div className="relative w-6 h-6 rounded-full border border-neutral-800 flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full border border-neutral-700 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--link-fluor-strong)' }} />
                </div>
              </div>
              <span className="font-display font-extrabold text-sm tracking-tight" style={{ color: 'var(--ink)' }}>
                LINK WORLD
              </span>
            </button>

            <button 
              aria-label="Cerrar navegación"
              onClick={onCloseMobile}
              className="p-1 md:hidden"
              style={{ color: 'var(--ink-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Menú de Grupos Semánticos */}
          <nav className="px-3 py-3 space-y-4">
            {groups.map((group) => (
              <div key={group.title} className="space-y-0.5">
                <span 
                  className="text-[10px] font-mono uppercase tracking-wider block px-2.5 py-1 font-semibold"
                  style={{ color: 'var(--ink-faint)' }}
                >
                  {group.title}
                </span>

                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentDimension === item.id || 
                      (item.id === 'businesses' && (currentDimension === 'world' || currentDimension === 'business'));

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        title={item.implemented ? item.label : `${item.label} · En preparación`}
                        className={`w-full text-left px-2.5 py-1.5 rounded-sm text-[13px] flex items-center justify-between transition-all ${
                          isActive 
                            ? 'font-bold shadow-xs' 
                            : 'font-normal hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
                        }`}
                        style={{
                          background: isActive ? 'var(--surface)' : 'transparent',
                          color: isActive ? 'var(--ink)' : 'var(--ink-secondary)',
                          borderLeft: isActive ? '3px solid var(--link-fluor)' : '3px solid transparent',
                        }}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon 
                            className="w-4 h-4 shrink-0" 
                            style={{ color: isActive ? 'var(--ink)' : 'var(--ink-muted)' }} 
                          />
                          <span className="truncate">{item.label}</span>
                          {!item.implemented && <span className="text-[9px] opacity-40" aria-label="En preparación">○</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer pequeño */}
        <div className="p-4 border-t text-[10px] font-mono" style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-faint)' }}>
          <div className="font-semibold text-neutral-600 dark:text-neutral-400">ORGANISMO LINK V1</div>
          <div>ESTADO VIVO · SUPABASE</div>
        </div>
      </aside>
    </>
  );
};
