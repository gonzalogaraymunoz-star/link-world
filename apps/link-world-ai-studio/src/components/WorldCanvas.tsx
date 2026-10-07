import React from 'react';
import { 
  Map, ChevronDown, Layers, FileText, CreditCard, Crosshair, 
  ArrowRight, ArrowUpRight, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { Business, AttentionItem } from '../services/linkContext.ts';
import { ASSETS } from '../assets/images.ts';

interface WorldCanvasProps {
  businesses: Business[];
  attentionItems?: AttentionItem[];
  onSelectBusiness: (business: Business) => void;
  onNavigate: (dimension: string, business?: Business | null) => void;
  searchFilter: string;
}

export const WorldCanvas: React.FC<WorldCanvasProps> = ({
  businesses,
  attentionItems = [],
  onSelectBusiness,
  onNavigate,
}) => {
  // Helper para buscar célula por slug
  const findBiz = (slug: string) => businesses.find(b => b.slug.toLowerCase().includes(slug.toLowerCase()));
  const openBiz = (slug: string) => { const b = findBiz(slug); if (b) onSelectBusiness(b); };

  return (
    <div className="flex flex-col xl:flex-row gap-6 p-4 sm:p-6 max-w-[1600px] mx-auto animate-fadeIn">
      
      {/* ========================================================
          COLUMNA CENTRAL: CANVAS DEL TERRITORIO LINK WORLD
      ======================================================== */}
      <div className="flex-1 flex flex-col justify-between space-y-8 min-w-0">
        
        {/* Encabezado del Canvas */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-neutral-500">
              ECOSISTEMA ECONÓMICO Y OPERACIONAL
            </span>

            {/* Controles de vista superiores */}
            <div className="flex items-center gap-3 text-xs">
              <button type="button" disabled title="Mapa Google no integrado todavía en esta exportación"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-medium opacity-70 cursor-not-allowed"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-subtle)', color: 'var(--ink)' }}
              >
                <Map className="w-3.5 h-3.5 text-neutral-500" />
                <span>Vista Territorio · ilustrativa</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              <div className="hidden sm:flex items-center gap-2 text-neutral-500 text-xs font-medium">
                <span className="cursor-pointer hover:text-black dark:hover:text-white" onClick={() => onNavigate('businesses')}>Células</span>
                <span>|</span>
                <span className="cursor-pointer hover:text-black dark:hover:text-white" onClick={() => onNavigate('operations')}>Operaciones</span>
                <span>|</span>
                <span className="cursor-pointer hover:text-black dark:hover:text-white" onClick={() => onNavigate('models')}>Modelos</span>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight leading-none text-neutral-900 dark:text-white">
              LINK WORLD
            </h1>
            <h2 className="text-lg sm:text-xl font-display font-medium tracking-wide mt-1.5 text-neutral-800 dark:text-neutral-200 uppercase">
              ECOSISTEMA ECONÓMICO VIVO
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
            Explora las células, recorre la Concha de cada negocio y comprueba la economía real demostrada en Supabase sin necesidad de nuevo deploy.
          </p>
        </section>

        {/* ========================================================
            MAPA CENTRAL INTERACTIVO DE TERRITORIO (4 ISLAS DE CÉLULAS)
        ======================================================== */}
        <section className="relative w-full min-h-[460px] lg:min-h-[520px] rounded-2xl overflow-hidden p-6 flex items-center justify-center">
          
          {/* Curvas topográficas de fondo (SVG curvas de nivel) */}
          <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20">
            <svg className="w-full h-full" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 250C150 150 350 120 500 200C650 280 750 220 850 180" stroke="#C9B89D" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M-50 320C100 220 280 180 440 240C600 300 700 380 850 320" stroke="#C9B89D" strokeWidth="1" />
              <path d="M120 80C240 160 400 130 540 80C680 30 780 100 880 140" stroke="#C9B89D" strokeWidth="0.8" strokeDasharray="3 3" />
              <path d="M200 420C320 340 480 380 620 420C720 450 820 400 900 360" stroke="#C9B89D" strokeWidth="1" />
              {/* Líneas de conexión entre nodos */}
              <path d="M280 180C340 190 420 170 480 180" stroke="#8C7E6A" strokeWidth="1.2" strokeDasharray="2 3" />
              <path d="M260 260C300 300 340 330 360 380" stroke="#8C7E6A" strokeWidth="1.2" strokeDasharray="2 3" />
              <path d="M480 230C520 270 530 320 550 350" stroke="#8C7E6A" strokeWidth="1.2" strokeDasharray="2 3" />
              <path d="M380 390C430 400 480 390 530 380" stroke="#8C7E6A" strokeWidth="1.2" strokeDasharray="2 3" />
              {/* Nodos de anclaje dorados */}
              <circle cx="380" cy="220" r="3" fill="#A89274" />
              <circle cx="480" cy="230" r="3" fill="#A89274" />
              <circle cx="430" cy="320" r="2.5" fill="#A89274" />
            </svg>
          </div>

          {/* Grilla espacial de las 4 células */}
          <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-8 items-center">
            
            {/* 1. NODO CARACOL (Arriba Izquierda) */}
            <div 
              onClick={() => openBiz('caracol')}
              className="flex items-center gap-4 cursor-pointer group hover:scale-[1.02] transition-transform"
            >
              <div className="space-y-1 text-right max-w-[190px]">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--link-fluor-strong)' }} />
                  <strong className="text-sm font-bold font-display tracking-tight text-neutral-900 dark:text-white">
                    CARACOL
                  </strong>
                </div>
                <p className="text-[11px] text-neutral-500 leading-tight">
                  {findBiz('caracol')?.summary || 'Restobar · San Pedro de Atacama'}
                </p>
                <div className="pt-1">
                  <div className="flex items-center justify-end gap-1 font-mono">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">Consultar FIN</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded"></span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    Información viva en ficha del negocio
                  </div>
                </div>
              </div>

              {/* Isla visual con forma orgánica */}
              <div className="relative w-36 h-28 sm:w-44 sm:h-32 rounded-[28px] overflow-hidden shadow-lg border border-neutral-200/60 dark:border-neutral-700/60 group-hover:shadow-xl transition-shadow shrink-0">
                <img 
                  src={ASSETS.caracolLodge} 
                  alt="Caracol (imagen ilustrativa, no foto de Google Maps)" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
            </div>

            {/* 2. NODO LAMA (Arriba Derecha) */}
            <div 
              onClick={() => openBiz('lama')}
              className="flex items-center gap-4 cursor-pointer group hover:scale-[1.02] transition-transform md:justify-end"
            >
              {/* Isla visual */}
              <div className="relative w-36 h-28 sm:w-44 sm:h-32 rounded-[28px] overflow-hidden shadow-lg border border-neutral-200/60 dark:border-neutral-700/60 group-hover:shadow-xl transition-shadow shrink-0">
                <img 
                  src={ASSETS.lamaDesert} 
                  alt="LAMA" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>

              <div className="space-y-1 text-left max-w-[190px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--link-fluor-strong)' }} />
                  <strong className="text-sm font-bold font-display tracking-tight text-neutral-900 dark:text-white">
                    LAMA
                  </strong>
                </div>
                <p className="text-[11px] text-neutral-500 leading-tight">
                  {findBiz('lama')?.summary || 'Turismo y experiencias · Atacama'}
                </p>
                <div className="pt-1">
                  <div className="flex items-center gap-1 font-mono">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">Consultar FIN</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded"></span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    Información viva en ficha del negocio
                  </div>
                </div>
              </div>
            </div>

            {/* 3. NODO LINK (Abajo Izquierda) */}
            <div 
              onClick={() => openBiz('link-cupones')}
              className="flex items-center gap-4 cursor-pointer group hover:scale-[1.02] transition-transform"
            >
              <div className="space-y-1 text-right max-w-[190px]">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block bg-neutral-400" />
                  <strong className="text-sm font-bold font-display tracking-tight text-neutral-900 dark:text-white">
                    {findBiz('link-cupones')?.name || 'LINK CUPONES'}
                  </strong>
                </div>
                <p className="text-[11px] text-neutral-500 leading-tight">
                  {findBiz('link-cupones')?.summary || 'LINK Cupones · capacidad del ecosistema'}
                </p>
                <div className="pt-1">
                  <div className="flex items-center justify-end gap-1 font-mono">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">Consultar FIN</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded"></span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    Información viva en ficha del negocio
                  </div>
                </div>
              </div>

              {/* Isla visual */}
              <div className="relative w-36 h-28 sm:w-44 sm:h-32 rounded-[28px] overflow-hidden shadow-lg border border-neutral-200/60 dark:border-neutral-700/60 group-hover:shadow-xl transition-shadow shrink-0">
                <img 
                  src={ASSETS.linkCube} 
                  alt="LINK (imagen ilustrativa, no foto de Google Maps)" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
            </div>

            {/* 4. NODO HOTEL EXPERIENCE (Abajo Derecha) */}
            <div 
              onClick={() => openBiz('hotel-experience')}
              className="flex items-center gap-4 cursor-pointer group hover:scale-[1.02] transition-transform md:justify-end"
            >
              {/* Isla visual */}
              <div className="relative w-36 h-28 sm:w-44 sm:h-32 rounded-[28px] overflow-hidden shadow-lg border border-neutral-200/60 dark:border-neutral-700/60 group-hover:shadow-xl transition-shadow shrink-0">
                <img 
                  src={ASSETS.hotelVilla} 
                  alt="Hotel Experience (imagen ilustrativa, no foto de Google Maps)" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>

              <div className="space-y-1 text-left max-w-[190px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--link-fluor-strong)' }} />
                  <strong className="text-sm font-bold font-display tracking-tight text-neutral-900 dark:text-white">
                    HOTEL EXPERIENCE
                  </strong>
                </div>
                <p className="text-[11px] text-neutral-500 leading-tight">
                  {findBiz('hotel-experience')?.summary || 'Hotel Experience · Intermediación turística'}
                </p>
                <div className="pt-1">
                  <div className="flex items-center gap-1 font-mono">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">Consultar FIN</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded"></span>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono">
                    Información viva en ficha del negocio
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Indicadores cuantitativos solo cuando exista una fuente real. */}
        <section className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <strong className="text-xs font-mono uppercase font-bold tracking-wider">AHORA</strong>
              <span className="w-1.5 h-1.5 rounded-full" style={{background:'var(--link-fluor-strong)'}} />
              <span className="text-xs text-neutral-500">Métricas operacionales: disponibles en las mesas canónicas</span>
            </div>
            <button type="button" onClick={() => onNavigate('operations')} className="text-xs flex items-center gap-1 hover:underline">Abrir Operaciones <ArrowRight size={14}/></button>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <button type="button" onClick={() => onNavigate('fin')} className="p-3 text-left" style={{background:'var(--surface-low)'}}>FIN · Consultar cobros verificados →</button>
            <button type="button" onClick={() => onNavigate('director')} className="p-3 text-left" style={{background:'var(--surface-low)'}}>Director · Consultar misiones →</button>
          </div>
        </section>
      </div>

      {/* ========================================================
          COLUMNA DERECHA: PANEL "SEÑALES POR REVISAR" (300px)
      ======================================================== */}
      <aside className="w-full xl:w-[320px] shrink-0 space-y-4">
        
        {/* Encabezado del Panel */}
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-sm uppercase tracking-tight text-neutral-900 dark:text-white">
              SEÑALES POR REVISAR
            </h2>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              4
            </span>
          </div>

          <button 
            onClick={() => onNavigate('director')}
            className="w-6 h-6 rounded-full border flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs leading-relaxed text-neutral-500">
          Señales asociadas a fichas de negocio; confirmar su vigencia en Director.
        </p>
        <div className="space-y-3 text-xs">
          {attentionItems.length ? attentionItems.slice(0, 6).map(item => {
            const related = businesses.find(b => b.slug === item.businessSlug);
            return (
              <button key={item.id} type="button" onClick={() => related ? onSelectBusiness(related) : onNavigate('director')}
                className="w-full text-left p-4 transition-opacity hover:opacity-80"
                style={{background:'var(--surface-low)',borderLeft:'2px solid var(--link-fluor-strong)'}}>
                <div className="font-mono text-[10px] uppercase text-neutral-500">{item.businessName} · {item.dimension}</div>
                <p className="mt-2 text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{item.reason}</p>
                <span className="mt-3 flex items-center gap-1 text-[11px] font-semibold">Abrir contexto <ArrowRight size={12}/></span>
              </button>
            );
          }) : (
            <p className="p-5 text-sm text-neutral-500" style={{background:'var(--surface-low)'}}>Sin señales registradas.</p>
          )}
        </div>
      </aside>

    </div>
  );
};
