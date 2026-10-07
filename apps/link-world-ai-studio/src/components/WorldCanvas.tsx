import React from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { Business, AttentionItem } from '../services/linkContext.ts';
import { filterBusinesses } from '../services/dataState.ts';
import { ASSETS } from '../assets/images.ts';

interface WorldCanvasProps {
  businesses: Business[];
  attentionItems?: AttentionItem[];
  onSelectBusiness: (business: Business) => void;
  onNavigate: (dimension: string, business?: Business | null) => void;
  searchFilter: string;
  showAll?: boolean;
}
export const WorldCanvas: React.FC<WorldCanvasProps> = ({businesses, attentionItems = [], onSelectBusiness, onNavigate, searchFilter, showAll}) => {
  const visible = filterBusinesses(businesses, searchFilter);
  const imageFor = (business: Business) => business.slug.includes('caracol') ? ASSETS.caracolLodge : business.slug.includes('lama') ? ASSETS.lamaDesert : business.slug.includes('hotel-experience') ? ASSETS.hotelVilla : ASSETS.linkCube;
  return <div className="flex flex-col xl:flex-row gap-8 p-4 sm:p-6 max-w-[1600px] mx-auto">
    <div className="flex-1 min-w-0 space-y-8">
      <section className="space-y-3">
        <span className="text-[11px] font-mono tracking-widest uppercase" style={{color: 'var(--ink-muted)'}}>ECOSISTEMA ECONÓMICO Y OPERACIONAL</span>
        <h1 className="text-4xl sm:text-6xl font-bold font-display tracking-tight">{showAll ? 'CÉLULAS LINK' : 'LINK WORLD'}</h1>
        <p className="text-sm max-w-2xl leading-relaxed" style={{color: 'var(--ink-muted)'}}>Explora las células, recorre la Concha de cada negocio y consulta su evidencia económica.</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <button onClick={() => onNavigate('businesses')} className="px-3 py-2" style={{background: 'var(--surface)'}}>Células · {businesses.length}</button>
          <button onClick={() => onNavigate('operations')} className="px-3 py-2" style={{background: 'var(--surface)'}}>Operaciones →</button>
          <button onClick={() => onNavigate('models')} className="px-3 py-2" style={{background: 'var(--surface)'}}>Modelos →</button>
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono border-b pb-3" style={{borderColor: 'var(--border-subtle)'}}>
          <span>{searchFilter ? `RESULTADOS · ${visible.length}` : 'CÉLULAS DISPONIBLES'}</span>
          <span style={{color: 'var(--ink-muted)'}}>Imágenes ilustrativas</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map(business => <button key={business.id} type="button" onClick={() => onSelectBusiness(business)} className="text-left rounded-xl p-4 sm:p-5 flex items-center gap-4 transition-transform hover:-translate-y-0.5" style={{background: 'var(--surface-low)'}}>
            <img src={imageFor(business)} alt="" loading="lazy" className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl shrink-0"/>
            <div className="min-w-0 space-y-2">
              <h2 className="font-bold font-display text-lg break-words">{business.name}</h2>
              <p className="text-xs leading-relaxed line-clamp-3" style={{color: 'var(--ink-muted)'}}>{business.summary || business.sector || 'Ficha de negocio registrada'}</p>
              <span className="text-[11px] font-mono flex items-center gap-1">Abrir célula <ArrowRight size={12}/></span>
            </div>
          </button>)}
        </div>
        {!visible.length && <p className="p-6 text-sm" style={{background: 'var(--surface-low)',color: 'var(--ink-muted)'}}>{searchFilter ? 'No hay células que coincidan con tu búsqueda.' : 'No hay células disponibles para tu sesión. Ingresa para consultar los negocios autorizados.'}</p>}
      </section>
      <section className="flex flex-wrap gap-3 border-t pt-5" style={{borderColor: 'var(--border-subtle)'}}>
        <button onClick={() => onNavigate('fin')} className="text-xs p-4 text-left" style={{background: 'var(--surface-low)'}}>FIN · Cobros y evidencia económica →</button>
        <button onClick={() => onNavigate('director')} className="text-xs p-4 text-left" style={{background: 'var(--surface-low)'}}>Director · Misiones y próximos pasos →</button>
      </section>
    </div>
    <aside className="w-full xl:w-[300px] shrink-0 space-y-4">
      <div className="flex justify-between border-b pb-3" style={{borderColor: 'var(--border-subtle)'}}><h2 className="text-sm font-bold font-display">SEÑALES POR REVISAR</h2><span className="text-xs font-mono">{attentionItems.length}</span></div>
      <p className="text-xs leading-relaxed" style={{color: 'var(--ink-muted)'}}>Señales registradas en las fichas. Confirma su vigencia en Director.</p>
      {attentionItems.slice(0,6).map(item => <button key={`${item.businessSlug}-${item.id}`} onClick={() => { const related = businesses.find(b => b.slug === item.businessSlug); related ? onSelectBusiness(related) : onNavigate('director'); }} className="w-full text-left p-4 space-y-2" style={{background: 'var(--surface-low)',borderLeft: '2px solid var(--link-fluor)'}}>
        <span className="text-[10px] font-mono uppercase" style={{color: 'var(--ink-muted)'}}>{item.businessName} · {item.dimension}</span><h3 className="text-sm font-bold">{item.title}</h3><p className="text-xs leading-relaxed" style={{color: 'var(--ink-muted)'}}>{item.reason}</p><span className="text-[11px]">Abrir contexto →</span>
      </button>)}
      {!attentionItems.length && <div className="p-5 text-xs flex items-center gap-2" style={{background:'var(--surface-low)',color:'var(--ink-muted)'}}><Layers size={14}/>Sin señales en las fichas disponibles.</div>}
    </aside>
  </div>;
};
