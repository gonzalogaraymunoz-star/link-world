import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight, Boxes, ChevronLeft, ChevronRight, CircleDot, Database, GitBranch,
  Layers, Maximize2, PanelRightClose, PanelRightOpen, RotateCcw, ServerCog, Sparkles,
} from 'lucide-react';
import { Business, AttentionItem } from '../services/linkContext.ts';
import { filterBusinesses } from '../services/dataState.ts';

interface WorldCanvasProps {
  businesses: Business[];
  attentionItems?: AttentionItem[];
  onSelectBusiness: (business: Business) => void;
  onNavigate: (dimension: string, business?: Business | null) => void;
  searchFilter: string;
  showAll?: boolean;
}

const stages = [
  { id: 'mar', label: 'MAR', note: 'escucha', x: 28, y: 29 },
  { id: 'sales', label: 'VENTA', note: 'propuesta', x: 66, y: 29 },
  { id: 'closing', label: 'CIERRE', note: 'compromiso', x: 79, y: 51 },
  { id: 'boarding', label: 'BOARDING', note: 'preparación', x: 66, y: 73 },
  { id: 'operations', label: 'OPERA', note: 'entrega', x: 28, y: 73 },
  { id: 'postventa', label: 'POSTVENTA', note: 'aprendizaje', x: 15, y: 51 },
] as const;

const governance = ['DIRECTOR', 'PULSO VIVO', 'HIPOCAMPO', 'CORTEX', 'LINK SHOW', 'ADMIN', 'CONEXIONES'];
const transversals = ['MAR', 'RRSS', 'VENTAS', 'CIERRE', 'BOARDING', 'OPERACIONES', 'POSTVENTA', 'FIN', 'PERSONAS', 'EVIDENCIAS', 'ARTEFACTOS', 'EVOLUCIÓN'];
const artifacts = ['AGENTIC CRM', 'PROPUESTA', 'PAYMENTS', 'HOTEL EXPERIENCE', 'TAXIHOTEL', 'TRANSLATE', 'LINK VOICE', 'LINK MOBILE', 'LINK FACTORY', 'DIGITAL WEB'];
const reproduction = ['EVIDENCIAS', 'APRENDIZAJE', 'GÉNESIS', 'ARTEFACTOS', 'MODELOS', 'EVOLUCIÓN', 'MITOSIS / MEIOSIS'];

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();

export const WorldCanvas: React.FC<WorldCanvasProps> = ({
  businesses, attentionItems = [], onSelectBusiness, onNavigate, searchFilter, showAll,
}) => {
  const [focusedBusinessId, setFocusedBusinessId] = useState<string | null>(null);
  const [showAllSignals, setShowAllSignals] = useState(false);
  const [signalsCollapsed, setSignalsCollapsed] = useState(false);

  const visible = useMemo(() => filterBusinesses(businesses, searchFilter), [businesses, searchFilter]);
  const focusedBusiness = businesses.find(business => business.id === focusedBusinessId) || null;
  const cellPool = visible.slice(0, 7);
  const interpretDimension = (dimension: string) => onNavigate(dimension, focusedBusiness || undefined);

  return (
    <div className="flex min-h-[calc(100vh-7.5rem)] min-w-0">
      <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
        <div className="min-w-[1120px] p-4 lg:p-5">
          <section
            className="relative h-[780px] overflow-hidden rounded-[28px] border organism-canvas"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--canvas)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="absolute left-7 top-6 z-20 max-w-[260px]">
              <span className="text-[10px] font-mono tracking-[0.32em] uppercase" style={{ color: 'var(--ink-faint)' }}>
                LINK WORLD · MAPA VIVO
              </span>
              <h1 className="mt-2 text-[28px] font-display font-bold tracking-tight">
                {focusedBusiness ? focusedBusiness.name : showAll ? 'CÉLULAS LINK' : 'LA CONCHA ETERNA'}
              </h1>
              <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                {focusedBusiness
                  ? 'La célula ocupa el centro. Todo el organismo se reinterpreta desde su operación, capacidades, artefactos y reproducción.'
                  : 'Un solo organismo. Las células mueven el sistema y las capacidades se comparten.'}
              </p>
              {focusedBusiness && (
                <button
                  type="button"
                  onClick={() => setFocusedBusinessId(null)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface)' }}
                >
                  <RotateCcw size={12} /> Volver al organismo
                </button>
              )}
            </div>

            <div className="absolute right-7 top-6 z-20 flex items-center gap-2">
              <span className="rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface)' }}>
                {focusedBusiness ? 'Interpretación de célula' : 'Vista global'}
              </span>
              <button type="button" onClick={() => onNavigate('businesses')} title="Ver todas las células" className="rounded-full border p-2" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface)' }}>
                <Maximize2 size={14} />
              </button>
            </div>

            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1200 780" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="linkFlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(124,87,146,.26)" />
                  <stop offset="52%" stopColor="rgba(231,139,73,.32)" />
                  <stop offset="100%" stopColor="rgba(53,142,208,.24)" />
                </linearGradient>
              </defs>
              <path d="M250 174 C380 70 820 70 1000 178" fill="none" stroke="url(#linkFlow)" strokeWidth="1.2" />
              <path d="M170 258 C340 170 480 188 600 258 C720 188 885 177 1038 265" fill="none" stroke="rgba(131,104,145,.18)" strokeWidth="1" />
              <path d="M172 622 C345 680 825 678 1030 620" fill="none" stroke="rgba(95,99,102,.18)" strokeWidth="1" />
              <path d="M248 703 C410 738 787 740 1000 704" fill="none" stroke="rgba(95,99,102,.18)" strokeWidth="1" />
              <path d="M365 375 C455 270 742 257 835 376 C905 466 800 575 602 568 C405 561 292 470 365 375Z" fill="none" stroke="rgba(231,139,73,.26)" strokeWidth="1.25" />
              <path d="M390 392 C470 312 708 300 808 386 C876 444 786 535 607 532 C443 529 327 466 390 392Z" fill="none" stroke="rgba(231,139,73,.16)" strokeWidth="1" />
              <path d="M176 333 C300 340 337 353 430 420" fill="none" stroke="rgba(124,87,146,.24)" strokeWidth="1" />
              <path d="M176 410 C302 409 350 418 430 445" fill="none" stroke="rgba(124,87,146,.20)" strokeWidth="1" />
              <path d="M835 342 C918 314 956 305 1030 302" fill="none" stroke="rgba(53,142,208,.28)" strokeWidth="1.1" />
              <path d="M835 452 C921 448 960 440 1032 412" fill="none" stroke="rgba(53,142,208,.24)" strokeWidth="1.1" />
              <path d="M600 564 C603 617 605 648 603 681" fill="none" stroke="rgba(231,139,73,.24)" strokeWidth="1.1" />
              <AnimatePresence>
                {focusedBusiness && (
                  <>
                    <motion.path
                      key={focusedBusiness.id + '-ring-a'}
                      d="M380 390 C445 275 760 268 824 390"
                      fill="none" stroke="rgba(242,126,42,.78)" strokeWidth="2"
                      initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.9, ease: 'easeInOut' }}
                    />
                    <motion.path
                      key={focusedBusiness.id + '-ring-b'}
                      d="M824 390 C875 505 745 568 604 568 C455 568 327 502 380 390"
                      fill="none" stroke="rgba(242,126,42,.64)" strokeWidth="2"
                      initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, delay: 0.18, ease: 'easeInOut' }}
                    />
                  </>
                )}
              </AnimatePresence>
            </svg>

            <div className="absolute left-[31%] right-[21%] top-[76px] z-10">
              <div className="text-center text-[9px] font-mono tracking-[0.28em] uppercase" style={{ color: 'var(--ink-faint)' }}>Gobierno e inteligencia</div>
              <div className="mt-5 flex items-start justify-between">
                {governance.map((label, index) => (
                  <motion.button
                    key={label} type="button"
                    onClick={() => {
                      const map: Record<string, string> = { DIRECTOR: 'director', ADMIN: 'administracion', CONEXIONES: 'conexiones' };
                      if (map[label]) interpretDimension(map[label]);
                    }}
                    className="group flex w-[72px] flex-col items-center gap-1 text-center"
                    initial={false}
                    animate={{ y: focusedBusiness ? Math.sin(index) * 3 : 0, opacity: focusedBusiness ? 0.96 : 0.76 }}
                    transition={{ duration: 0.5, delay: index * 0.035 }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full border shadow-sm" style={{ background: 'rgba(124,87,146,.72)', borderColor: 'rgba(90,63,106,.32)' }} />
                    <span className="text-[8px] font-mono leading-tight tracking-wide">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="absolute left-7 top-[285px] z-10 w-[205px]">
              <div className="mb-3 text-[9px] font-mono uppercase tracking-[0.22em]" style={{ color: 'var(--ink-faint)' }}>Capacidades transversales</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {transversals.map((label, index) => (
                  <motion.button
                    key={label} type="button"
                    onClick={() => {
                      const map: Record<string, string> = {
                        MAR: 'mar', RRSS: 'rrss', VENTAS: 'sales', CIERRE: 'closing', BOARDING: 'boarding',
                        OPERACIONES: 'operations', POSTVENTA: 'postventa', FIN: 'fin', PERSONAS: 'personas',
                        EVIDENCIAS: 'evidencias', ARTEFACTOS: 'artefactos', 'EVOLUCIÓN': 'evolution',
                      };
                      interpretDimension(map[label]);
                    }}
                    className="flex items-center gap-2 text-left"
                    animate={{ x: focusedBusiness ? (index % 2 === 0 ? 3 : -2) : 0, opacity: focusedBusiness ? 1 : 0.74 }}
                    transition={{ duration: 0.45, delay: index * 0.018 }}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full border" style={{ background: 'rgba(124,87,146,.40)', borderColor: 'rgba(124,87,146,.28)' }} />
                    <span className="text-[8px] font-mono">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="absolute left-[28%] top-[222px] z-10 h-[382px] w-[48%]">
              <div className="absolute inset-[7%] rounded-[50%] border" style={{ borderColor: 'rgba(231,139,73,.15)', background: 'radial-gradient(circle at center, rgba(238,224,205,.35), rgba(250,248,246,0) 67%)' }} />
              {stages.map((stage, index) => (
                <motion.button
                  key={(focusedBusiness?.id || 'world') + '-' + stage.id}
                  type="button" onClick={() => interpretDimension(stage.id)}
                  className="absolute z-20 flex h-[76px] w-[92px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[44%] border text-center"
                  style={{
                    left: String(stage.x) + '%', top: String(stage.y) + '%',
                    borderColor: focusedBusiness ? 'rgba(242,126,42,.62)' : 'rgba(231,139,73,.38)',
                    background: 'rgba(255,244,232,.82)',
                    boxShadow: focusedBusiness ? '0 10px 30px rgba(225,131,57,.10)' : 'none',
                  }}
                  initial={{ opacity: 0.45, scale: 0.94 }}
                  animate={{ opacity: 1, scale: focusedBusiness ? [0.96, 1.03, 1] : 1 }}
                  transition={{ duration: 0.5, delay: focusedBusiness ? index * 0.08 : 0 }}
                  whileHover={{ scale: 1.045 }}
                >
                  <span className="text-[10px] font-mono font-semibold">{stage.label}</span>
                  <span className="mt-1 text-[8px]" style={{ color: 'var(--ink-muted)' }}>{stage.note}</span>
                </motion.button>
              ))}

              <AnimatePresence mode="wait">
                {focusedBusiness ? (
                  <motion.div
                    key={focusedBusiness.id}
                    layoutId={'cell-' + focusedBusiness.id}
                    className="absolute left-1/2 top-1/2 z-30 flex h-[166px] w-[166px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border p-5 text-center"
                    style={{
                      borderColor: 'rgba(73,99,58,.42)',
                      background: 'radial-gradient(circle at 38% 34%, rgba(238,244,224,.96), rgba(214,224,199,.92))',
                      boxShadow: '0 22px 60px rgba(63,83,52,.18)',
                    }}
                    transition={{ type: 'spring', stiffness: 155, damping: 21 }}
                  >
                    <span className="text-[9px] font-mono uppercase tracking-[0.18em]" style={{ color: 'var(--ink-muted)' }}>Célula central</span>
                    <strong className="mt-2 max-w-[126px] text-[15px] font-display leading-tight">{focusedBusiness.name}</strong>
                    <span className="mt-2 text-[8px] font-mono" style={{ color: 'var(--ink-muted)' }}>
                      {focusedBusiness.city || focusedBusiness.sector || focusedBusiness.slug}
                    </span>
                    <button type="button" onClick={() => onSelectBusiness(focusedBusiness)} className="mt-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-mono" style={{ borderColor: 'rgba(73,99,58,.26)', background: 'rgba(255,255,255,.55)' }}>
                      Abrir ficha <ArrowRight size={10} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="concha"
                    className="absolute left-1/2 top-1/2 z-20 flex h-[162px] w-[162px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border text-center"
                    style={{
                      borderColor: 'rgba(90,114,130,.25)',
                      background: 'radial-gradient(circle at 45% 36%, rgba(255,255,255,.94), rgba(228,232,231,.88))',
                      boxShadow: '0 22px 55px rgba(95,105,105,.10)',
                    }}
                    initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
                  >
                    <span className="text-[19px] font-display font-semibold tracking-[0.17em]">CONCHA</span>
                    <span className="mt-2 text-[8px] font-mono uppercase tracking-[0.16em]" style={{ color: 'var(--ink-muted)' }}>6 etapas</span>
                    <span className="mt-1 text-[8px] max-w-[108px] leading-relaxed" style={{ color: 'var(--ink-muted)' }}>misma información · distinto contexto</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute right-[210px] top-[226px] z-10 w-[155px]">
              <div className="mb-3 text-[9px] font-mono uppercase tracking-[0.22em]" style={{ color: 'var(--ink-faint)' }}>Artefactos</div>
              <div className="space-y-2.5">
                {artifacts.map((label, index) => (
                  <motion.button
                    key={label} type="button" onClick={() => interpretDimension('artefactos')}
                    className="flex w-full items-center gap-2 text-left"
                    animate={{ x: focusedBusiness ? -3 : 0, opacity: focusedBusiness ? 1 : 0.72 }}
                    transition={{ duration: 0.45, delay: index * 0.02 }}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border" style={{ background: 'rgba(218,238,252,.72)', borderColor: 'rgba(53,142,208,.26)' }}><Boxes size={11} /></span>
                    <span className="text-[8px] font-mono leading-tight">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="absolute right-7 top-[244px] z-10 w-[150px]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-[0.22em]" style={{ color: 'var(--ink-faint)' }}>Células</span>
                <span className="text-[8px] font-mono" style={{ color: 'var(--ink-faint)' }}>{visible.length}</span>
              </div>
              <div className="relative min-h-[330px]">
                {cellPool.map(business => {
                  const active = focusedBusiness?.id === business.id;
                  if (active) {
                    return (
                      <div key={business.id} className="mb-2.5 flex h-[54px] items-center gap-2 rounded-full border border-dashed px-2 opacity-30" style={{ borderColor: 'var(--border-subtle)' }}>
                        <span className="h-9 w-9 rounded-full border" style={{ borderColor: 'var(--border-subtle)' }} />
                        <span className="text-[8px] font-mono">EN EL CENTRO</span>
                      </div>
                    );
                  }
                  return (
                    <motion.button
                      key={business.id} layoutId={'cell-' + business.id} type="button"
                      onClick={() => setFocusedBusinessId(business.id)}
                      className="mb-2.5 flex min-h-[54px] w-full items-center gap-2 rounded-full border px-2.5 py-1.5 text-left"
                      style={{ borderColor: 'rgba(73,99,58,.20)', background: 'linear-gradient(135deg, rgba(238,244,224,.85), rgba(224,229,214,.72))' }}
                      whileHover={{ x: -4, scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 190, damping: 20 }}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[9px] font-mono font-semibold" style={{ borderColor: 'rgba(73,99,58,.18)', background: 'rgba(255,255,255,.56)' }}>{initials(business.name)}</span>
                      <span className="min-w-0">
                        <strong className="block truncate text-[9px] leading-tight">{business.name}</strong>
                        <span className="mt-0.5 block truncate text-[7px] font-mono" style={{ color: 'var(--ink-muted)' }}>{business.city || business.sector || business.slug}</span>
                      </span>
                    </motion.button>
                  );
                })}
                {!cellPool.length && (
                  <div className="rounded-2xl border p-3 text-[9px]" style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-muted)' }}>
                    {searchFilter ? 'Sin coincidencias.' : 'Ingresa para ver células autorizadas.'}
                  </div>
                )}
                {visible.length > cellPool.length && (
                  <button type="button" onClick={() => onNavigate('businesses')} className="mt-2 w-full text-center text-[9px] font-mono underline underline-offset-4">+ {visible.length - cellPool.length} células</button>
                )}
              </div>
            </div>

            <div className="absolute bottom-[77px] left-[25%] right-[18%] z-10">
              <div className="mb-3 text-center text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: 'var(--ink-faint)' }}>Reproducción</div>
              <div className="flex items-start justify-between">
                {reproduction.map((label, index) => (
                  <motion.button
                    key={label} type="button"
                    onClick={() => {
                      if (label === 'MODELOS') interpretDimension('models');
                      else if (label === 'GÉNESIS') interpretDimension('genesis');
                      else if (label.includes('MITOSIS')) interpretDimension('mitosis');
                      else if (label === 'EVOLUCIÓN') interpretDimension('evolution');
                      else if (label === 'ARTEFACTOS') interpretDimension('artefactos');
                      else interpretDimension('evidencias');
                    }}
                    className="flex w-[74px] flex-col items-center gap-1.5 text-center"
                    animate={{ y: focusedBusiness ? (index % 2 === 0 ? -2 : 2) : 0 }}
                    transition={{ duration: 0.45, delay: index * 0.03 }}
                  >
                    <span className="h-5 w-5 rounded-full border" style={{ background: index === 3 ? 'rgba(179,204,219,.65)' : 'rgba(162,132,178,.40)', borderColor: 'rgba(124,87,146,.18)' }} />
                    <span className="text-[7.5px] font-mono leading-tight">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="absolute bottom-5 left-7 right-7 z-10 flex items-center gap-3">
              <span className="w-[180px] text-[8px] font-mono uppercase tracking-[0.18em]" style={{ color: 'var(--ink-faint)' }}>Infraestructura técnica</span>
              {[
                { label: 'SUPABASE', note: 'estado vivo', Icon: Database },
                { label: 'GITHUB', note: 'código canónico', Icon: GitBranch },
                { label: 'VERCEL', note: 'publicación', Icon: CircleDot },
                { label: 'CLOUDFLARE', note: 'runtime / edge', Icon: ServerCog },
              ].map(({ label, note, Icon }) => (
                <div key={label} className="flex flex-1 items-center gap-3 rounded-full border px-4 py-2" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(255,255,255,.42)' }}>
                  <Icon size={17} />
                  <span>
                    <strong className="block text-[9px] font-mono tracking-[0.12em]">{label}</strong>
                    <span className="block text-[7px]" style={{ color: 'var(--ink-muted)' }}>{note}</span>
                  </span>
                </div>
              ))}
            </div>

            {focusedBusiness && (
              <motion.div
                key={focusedBusiness.id + '-facts'}
                className="absolute bottom-[148px] left-7 z-20 flex max-w-[242px] items-start gap-2 rounded-2xl border p-3"
                style={{ borderColor: 'rgba(73,99,58,.18)', background: 'rgba(255,255,255,.72)', backdropFilter: 'blur(10px)' }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              >
                <Sparkles size={14} className="mt-0.5 shrink-0" />
                <div>
                  <span className="text-[8px] font-mono uppercase tracking-[0.16em]" style={{ color: 'var(--ink-faint)' }}>Foto de la célula</span>
                  <p className="mt-1 text-[9px] leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{focusedBusiness.summary || focusedBusiness.sector || 'Célula económica registrada en LINK WORLD.'}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {focusedBusiness.verification_status && (
                      <span className="rounded-full border px-2 py-0.5 text-[7px] font-mono" style={{ borderColor: 'var(--border-subtle)' }}>{focusedBusiness.verification_status}</span>
                    )}
                    {Array.isArray(focusedBusiness.evidence) && (
                      <span className="rounded-full border px-2 py-0.5 text-[7px] font-mono" style={{ borderColor: 'var(--border-subtle)' }}>{focusedBusiness.evidence.length} evidencias</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </section>
        </div>
      </div>

      <motion.aside
        className="sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 border-l xl:flex xl:flex-col"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--sidebar-bg)' }}
        animate={{ width: signalsCollapsed ? 52 : 286 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <div className="flex h-12 items-center justify-between border-b px-3" style={{ borderColor: 'var(--border-subtle)' }}>
          {!signalsCollapsed && <span className="text-[9px] font-mono uppercase tracking-[0.18em]">Señales por revisar</span>}
          <button type="button" aria-label={signalsCollapsed ? 'Abrir señales' : 'Plegar señales'} title={signalsCollapsed ? 'Abrir señales' : 'Plegar señales'} onClick={() => setSignalsCollapsed(value => !value)} className="ml-auto rounded-full p-1.5">
            {signalsCollapsed ? <PanelRightOpen size={15} /> : <PanelRightClose size={15} />}
          </button>
        </div>
        {signalsCollapsed ? (
          <div className="flex flex-1 flex-col items-center gap-3 pt-4">
            <Layers size={16} />
            <span className="rounded-full border px-1.5 py-0.5 text-[9px] font-mono" style={{ borderColor: 'var(--border-subtle)' }}>{attentionItems.length}</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3">
            <p className="mb-3 text-[10px] leading-relaxed" style={{ color: 'var(--ink-muted)' }}>Observaciones derivadas de las fichas. La célula activa filtra la lectura sin alterar la fuente.</p>
            <div className="space-y-2">
              {attentionItems
                .filter(item => !focusedBusiness || item.businessSlug === focusedBusiness.slug)
                .slice(0, showAllSignals ? 8 : 4)
                .map(item => (
                  <button
                    key={item.businessSlug + '-' + item.id} type="button"
                    onClick={() => {
                      const related = businesses.find(business => business.slug === item.businessSlug);
                      if (related) setFocusedBusinessId(related.id);
                      else onNavigate('director');
                    }}
                    className="w-full rounded-xl border p-3 text-left"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface)' }}
                  >
                    <span className="text-[8px] font-mono uppercase" style={{ color: 'var(--ink-faint)' }}>{item.businessName} · {item.dimension}</span>
                    <strong className="mt-1 block text-[11px] leading-tight">{item.title}</strong>
                    <p className="mt-1 text-[9px] leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{item.reason}</p>
                  </button>
                ))}
            </div>
            {attentionItems.length > 4 && (
              <button type="button" onClick={() => setShowAllSignals(value => !value)} className="mt-3 flex w-full items-center justify-center gap-1 text-[9px] font-mono">
                {showAllSignals ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
                {showAllSignals ? 'Mostrar menos' : 'Ver más'}
              </button>
            )}
            {!attentionItems.length && (
              <div className="rounded-xl border p-4 text-[10px]" style={{ borderColor: 'var(--border-subtle)', color: 'var(--ink-muted)' }}>Sin señales en las fichas disponibles.</div>
            )}
          </div>
        )}
      </motion.aside>
    </div>
  );
};
