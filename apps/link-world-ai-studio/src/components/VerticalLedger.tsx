import React from 'react';
import {
  Home, Compass, Radio, RefreshCw, Lock, ClipboardList, Layers, ArrowUpRight,
  BarChart3, Share2, Users, FileCheck, Box, TrendingUp, LayoutGrid, Sprout,
  GitFork, Settings, Network, X, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { Business } from '../services/linkContext.ts';

interface VerticalLedgerProps {
  currentDimension: string;
  selectedBusiness: Business | null;
  onNavigate: (dimension: string, business?: Business | null) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  desktopCollapsed: boolean;
  onToggleDesktop: () => void;
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
  desktopCollapsed,
  onToggleDesktop,
}) => {
  const groups: NavGroup[] = [
    { title: 'LINK', items: [
      { id: 'businesses', label: 'Negocios', icon: Home, implemented: true },
      { id: 'director', label: 'Director', icon: Compass, implemented: true },
    ]},
    { title: 'OPERACIÓN', items: [
      { id: 'mar', label: 'MAR', icon: Radio, implemented: false },
      { id: 'sales', label: 'Ventas', icon: RefreshCw, implemented: false },
      { id: 'closing', label: 'Cierre', icon: Lock, implemented: false },
      { id: 'boarding', label: 'Boarding', icon: ClipboardList, implemented: false },
      { id: 'operations', label: 'Opera', icon: Layers, implemented: true },
      { id: 'postventa', label: 'Postventa', icon: ArrowUpRight, implemented: false },
    ]},
    { title: 'CAPACIDADES', items: [
      { id: 'fin', label: 'FIN', icon: BarChart3, implemented: true },
      { id: 'rrss', label: 'RRSS', icon: Share2, implemented: false },
      { id: 'personas', label: 'Personas', icon: Users, implemented: false },
      { id: 'evidencias', label: 'Evidencias', icon: FileCheck, implemented: false },
      { id: 'artefactos', label: 'Artefactos', icon: Box, implemented: false },
      { id: 'evolution', label: 'Evolución', icon: TrendingUp, implemented: false },
    ]},
    { title: 'REPRODUCCIÓN', items: [
      { id: 'models', label: 'Modelos', icon: LayoutGrid, implemented: true },
      { id: 'genesis', label: 'Génesis', icon: Sprout, implemented: false },
      { id: 'mitosis', label: 'Mitosis - Meiosis', icon: GitFork, implemented: false },
    ]},
    { title: 'SISTEMA', items: [
      { id: 'administracion', label: 'Administración', icon: Settings, implemented: false },
      { id: 'conexiones', label: 'Conexiones', icon: Network, implemented: false },
    ]},
  ];

  const handleSelect = (id: string) => {
    onNavigate(id, selectedBusiness);
    onCloseMobile();
  };

  return (
    <>
      {mobileOpen && <div onClick={onCloseMobile} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden" />}

      <aside
        className={
          'fixed md:sticky top-0 left-0 z-50 md:z-20 h-screen shrink-0 overflow-y-auto flex flex-col justify-between transition-[width,transform] duration-200 ease-out ' +
          (mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0')
        }
        style={{
          width: mobileOpen ? 210 : desktopCollapsed ? 58 : 210,
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div className={'h-14 flex items-center border-b ' + (desktopCollapsed && !mobileOpen ? 'justify-center px-2' : 'justify-between px-4')} style={{ borderColor: 'var(--border-subtle)' }}>
            <button onClick={() => { onNavigate('world', null); onCloseMobile(); }} className="flex items-center gap-2.5 text-left group" title="LINK WORLD">
              <div className="relative w-6 h-6 rounded-full border border-neutral-800 flex items-center justify-center shrink-0">
                <div className="w-3.5 h-3.5 rounded-full border border-neutral-700 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--link-fluor-strong)' }} />
                </div>
              </div>
              {(!desktopCollapsed || mobileOpen) && (
                <span className="font-display font-extrabold text-sm tracking-tight whitespace-nowrap" style={{ color: 'var(--ink)' }}>LINK WORLD</span>
              )}
            </button>

            <button aria-label="Cerrar navegación" onClick={onCloseMobile} className="p-1 md:hidden" style={{ color: 'var(--ink-muted)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden md:flex h-9 items-center justify-end px-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              type="button"
              onClick={onToggleDesktop}
              aria-label={desktopCollapsed ? 'Expandir menú' : 'Plegar menú'}
              title={desktopCollapsed ? 'Expandir menú' : 'Plegar menú'}
              className="p-1.5 rounded-full hover:opacity-70"
            >
              {desktopCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
          </div>

          <nav className={desktopCollapsed && !mobileOpen ? 'px-2 py-3 space-y-3' : 'px-3 py-3 space-y-4'}>
            {groups.map(group => (
              <div key={group.title} className="space-y-0.5">
                {(!desktopCollapsed || mobileOpen) ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider block px-2.5 py-1 font-semibold" style={{ color: 'var(--ink-faint)' }}>{group.title}</span>
                ) : (
                  <div className="mx-auto my-2 h-px w-5" style={{ background: 'var(--border-subtle)' }} />
                )}

                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = currentDimension === item.id || (item.id === 'businesses' && (currentDimension === 'world' || currentDimension === 'business'));
                    const compact = desktopCollapsed && !mobileOpen;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        title={item.implemented ? item.label : item.label + ' · En preparación'}
                        className={
                          (compact ? 'h-9 w-full justify-center px-1 ' : 'w-full text-left px-2.5 py-1.5 justify-between ') +
                          'rounded-sm text-[13px] flex items-center transition-all ' +
                          (isActive ? 'font-bold shadow-xs' : 'font-normal hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50')
                        }
                        style={{
                          background: isActive ? 'var(--surface)' : 'transparent',
                          color: isActive ? 'var(--ink)' : 'var(--ink-secondary)',
                          borderLeft: isActive && !compact ? '3px solid var(--link-fluor)' : '3px solid transparent',
                        }}
                      >
                        <div className={'flex items-center truncate ' + (compact ? 'justify-center' : 'gap-2.5')}>
                          <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? 'var(--ink)' : 'var(--ink-muted)' }} />
                          {!compact && <>
                            <span className="truncate">{item.label}</span>
                            {!item.implemented && <span className="text-[9px] opacity-40" aria-label="En preparación">○</span>}
                          </>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {(!desktopCollapsed || mobileOpen) ? (
          <div className="p-4 border-t text-[10px] font-mono" style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-faint)' }}>
            <div className="font-semibold text-neutral-600 dark:text-neutral-400">ORGANISMO LINK V1</div>
            <div>ESTADO VIVO · SUPABASE</div>
          </div>
        ) : (
          <div className="flex justify-center border-t py-3" style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-faint)' }}>
            <CircleDotFallback />
          </div>
        )}
      </aside>
    </>
  );
};

const CircleDotFallback = () => (
  <span className="relative block h-4 w-4 rounded-full border" style={{ borderColor: 'var(--ink-faint)' }}>
    <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'var(--link-fluor)' }} />
  </span>
);
