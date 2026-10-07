import React from 'react';
import { Lock, AlertCircle, RefreshCw, Layers, ShieldAlert, FileSearch } from 'lucide-react';

interface EmptyStateProps {
  type: 'empty' | 'unauthorized' | 'error' | 'in_preparation' | 'loading';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  technicalDetails?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
  technicalDetails,
}) => {
  const configs = {
    empty: {
      icon: FileSearch,
      defaultTitle: 'Sin registros disponibles',
      defaultDesc: 'No existen datos verificados para esta consulta en la fuente canónica de Supabase.',
      color: 'var(--ink-muted)',
    },
    unauthorized: {
      icon: Lock,
      defaultTitle: 'Acceso Protegido por Membresía',
      defaultDesc: 'Esta dimensión contiene información financiera o estratégica sensible y requiere autenticación activa de miembro LINK.',
      color: 'var(--ink-muted)',
    },
    error: {
      icon: AlertCircle,
      defaultTitle: 'Fallo al consultar la fuente',
      defaultDesc: 'No fue posible completar la consulta en Supabase o el proveedor.',
      color: '#E5484D',
    },
    in_preparation: {
      icon: Layers,
      defaultTitle: 'Dimensión en Preparación',
      defaultDesc: 'Esta capacidad está especificada en la Arquitectura Maestra V1 y se encuentra en etapa de conexión.',
      color: 'var(--ink-muted)',
    },
    loading: {
      icon: RefreshCw,
      defaultTitle: 'Consultando fuente canónica',
      defaultDesc: 'Recuperando estado vivo desde Supabase...',
      color: 'var(--ink-muted)',
    },
  };

  const current = configs[type];
  const Icon = current.icon;

  return (
    <div className="py-12 px-6 text-center max-w-md mx-auto my-6 animate-fadeIn">
      <div 
        className="w-10 h-10 mx-auto mb-3 flex items-center justify-center rounded-sm"
        style={{ background: 'var(--surface)' }}
      >
        <Icon 
          className={`w-5 h-5 ${type === 'loading' ? 'animate-spin' : ''}`}
          style={{ color: current.color }} 
        />
      </div>

      <h3 
        className="text-base font-bold tracking-tight mb-1 font-display"
        style={{ color: 'var(--ink)' }}
      >
        {title || current.defaultTitle}
      </h3>

      <p 
        className="text-xs leading-relaxed mb-4"
        style={{ color: 'var(--ink-muted)' }}
      >
        {description || current.defaultDesc}
      </p>

      {technicalDetails && (
        <div 
          className="text-[11px] font-mono p-2.5 rounded-sm text-left mb-4 overflow-x-auto"
          style={{ background: 'var(--surface-low)', color: 'var(--ink-faint)' }}
        >
          {technicalDetails}
        </div>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-3.5 py-1.5 text-xs font-medium rounded-sm transition-all"
          style={{ 
            background: type === 'unauthorized' ? 'var(--link-fluor)' : 'var(--surface-high)',
            color: type === 'unauthorized' ? 'var(--ink)' : 'var(--ink)',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
