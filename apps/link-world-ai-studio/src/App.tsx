import React, { useEffect, useState, useRef } from 'react';
import { VerticalLedger } from './components/VerticalLedger.tsx';
import { TopUtilityBar } from './components/TopUtilityBar.tsx';
import { WorldCanvas } from './components/WorldCanvas.tsx';
const BusinessUniverse = React.lazy(() => import('./components/BusinessUniverse.tsx').then(module => ({ default: module.BusinessUniverse })));
const ConchaWorkspace = React.lazy(() => import('./components/ConchaWorkspace.tsx').then(module => ({ default: module.ConchaWorkspace })));
const FinWorkspace = React.lazy(() => import('./components/FinWorkspace.tsx').then(module => ({ default: module.FinWorkspace })));
const OperationsWorkspace = React.lazy(() => import('./components/OperationsWorkspace.tsx').then(module => ({ default: module.OperationsWorkspace })));
const DirectorWorkspace = React.lazy(() => import('./components/DirectorWorkspace.tsx').then(module => ({ default: module.DirectorWorkspace })));
const ModelsWorkspace = React.lazy(() => import('./components/ModelsWorkspace.tsx').then(module => ({ default: module.ModelsWorkspace })));
import { EmptyState } from './components/EmptyState.tsx';
import { Business, linkContext, AttentionItem } from './services/linkContext.ts';
import { supabase } from './lib/supabase.ts';
import { Lock, LogIn, X, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentDimension, setCurrentDimension] = useState<string>('world');
  const [dimensionPath, setDimensionPath] = useState<string[]>(['LINK']);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [loadError, setLoadError] = useState('');
  const authModalRef = useRef<HTMLDivElement>(null);

  // Tema canónico: DAY MODE por defecto
  const [theme, setTheme] = useState<'day' | 'night' | 'gray'>(() => {
    try {
      const saved = localStorage.getItem('link-world-theme');
      if (saved === 'night' || saved === 'gray') return saved;
    } catch {}
    return 'day';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileLedgerOpen, setMobileLedgerOpen] = useState(false);

  // Estado de conexión y autenticación
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);

  // Modal de autenticación
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Aplicar tema en el elemento html
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('link-world-theme', theme);
    } catch {}
  }, [theme]);

  // Auth callbacks stay synchronous: Supabase calls are made by the loading effect.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'TOKEN_REFRESHED'].includes(event)) {
        setBusinesses([]);
        setAttentionItems([]);
        setLoading(true);
        if (event === 'SIGNED_OUT') { setSelectedBusiness(null); setCurrentDimension('world'); setDimensionPath(['LINK']); }
        setIsMember(false);
        setUserEmail(undefined);
        setRefreshToken(value => value + 1);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    async function boot() {
      try {
        const [ping, bizRes] = await Promise.all([linkContext.pingConnection(), linkContext.getBusinesses()]);
        if (!active) return;
        setSupabaseConnected(ping.ok);
        setIsMember(ping.isMember);
        setUserEmail(ping.email);
        setBusinesses(bizRes.data || []);
        setAttentionItems(linkContext.deriveRealAttention(bizRes.data || []));
        setSelectedBusiness(previous => previous ? bizRes.data?.find(b => b.id === previous.id) || null : null);
        if (bizRes.status === 'error' || bizRes.status === 'unauthorized') setLoadError(bizRes.errorMessage || 'No fue posible cargar las células.');
      } catch {
        if (active) { setSupabaseConnected(false); setLoadError('No fue posible conectar. Intenta actualizar.'); }
      } finally { if (active) setLoading(false); }
    }
    void boot();
    return () => { active = false; };
  }, [refreshToken]);

  useEffect(() => {
    if (!authModalOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    authModalRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setAuthModalOpen(false); setAuthPassword(''); }
      if (event.key === 'Tab') {
        const elements = authModalRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input');
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [authModalOpen]);

  // Manejo de navegación dimensional
  const handleNavigate = (dim: string, biz: Business | null = null) => {
    setCurrentDimension(dim);
    setMobileLedgerOpen(false);
    setSearchQuery('');
    if (biz) setSelectedBusiness(biz);
    else if (dim === 'fin' || dim === 'operations') setSelectedBusiness(null);

    if (dim === 'world') {
      setDimensionPath(['LINK']);
      setSelectedBusiness(null);
    } else if (dim === 'businesses') {
      setDimensionPath(['LINK', 'Células']);
      setSelectedBusiness(null);
    } else if (dim === 'business' && (biz || selectedBusiness)) {
      const activeBiz = biz || selectedBusiness;
      setDimensionPath(['LINK', 'Células', activeBiz?.name || '']);
    } else if (dim === 'concha' && (biz || selectedBusiness)) {
      const activeBiz = biz || selectedBusiness;
      setDimensionPath(['LINK', 'Células', activeBiz?.name || '', 'Concha']);
    } else if (dim === 'fin') {
      const activeBiz = biz;
      setDimensionPath(activeBiz ? ['LINK', 'Células', activeBiz.name, 'FIN'] : ['LINK', 'FIN']);
    } else if (dim === 'operations') {
      const activeBiz = biz;
      setDimensionPath(activeBiz ? ['LINK', 'Células', activeBiz.name, 'Operaciones'] : ['LINK', 'Operaciones']);
    } else if (dim === 'director') {
      setDimensionPath(['LINK', 'Director']);
    } else if (dim === 'models') {
      setDimensionPath(['LINK', 'Modelos']);
    } else {
      // Dimensiones transversales directas
      const titles: Record<string, string> = {
        mar: 'MAR',
        sales: 'Ventas',
        closing: 'Cierre',
        boarding: 'Boarding',
        postventa: 'Postventa',
        rrss: 'RRSS',
        personas: 'Personas',
        evidencias: 'Evidencias',
        artefactos: 'Artefactos',
        evolution: 'Evolución',
        genesis: 'Génesis',
        mitosis: 'Mitosis',
        administracion: 'Administración',
        conexiones: 'Conexiones',
      };
      const activeBiz = biz || selectedBusiness;
      setDimensionPath(activeBiz ? ['LINK', 'Células', activeBiz.name, titles[dim] || dim] : ['LINK', titles[dim] || dim]);
    }
  };

  const handleBack = () => {
    if (currentDimension !== 'business' && currentDimension !== 'world' && selectedBusiness) {
      handleNavigate('business', selectedBusiness);
    } else if (currentDimension === 'business') {
      handleNavigate('businesses', null);
    } else {
      handleNavigate('world', null);
    }
  };

  const handleSelectBusiness = (b: Business) => {
    setSelectedBusiness(b);
    handleNavigate('business', b);
  };

  // Autenticación de Miembro LINK
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) throw error;

      const ping = await linkContext.pingConnection();
      if (!ping.isMember) {
        setAuthError('Tu sesión está activa, pero esta cuenta no tiene membresía autorizada de LINK.');
        setAuthPassword('');
        return;
      }
      setAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Error al conectar sesión');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { setLoadError('No se pudo cerrar la sesión. Vuelve a intentarlo.'); return; }
    setBusinesses([]);
    setAttentionItems([]);
    handleNavigate('world');
    setIsMember(false);
    setUserEmail(undefined);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row transition-colors" style={{ background: 'var(--canvas)', color: 'var(--ink)' }}>
      {/* Navegación Vertical Izquierda: VerticalLedger (215px) */}
      <VerticalLedger
        currentDimension={currentDimension}
        selectedBusiness={selectedBusiness}
        onNavigate={handleNavigate}
        mobileOpen={mobileLedgerOpen}
        onCloseMobile={() => setMobileLedgerOpen(false)}
      />

      {/* Espacio Central: Canvas + Utilidades */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra Utilitaria Superior (48-56px) */}
        <TopUtilityBar
          dimensionPath={dimensionPath}
          onNavigatePath={(index) => index === 0 ? handleNavigate('world') : index === 1 ? handleNavigate('businesses') : selectedBusiness && handleNavigate('business', selectedBusiness)}
          onRefresh={() => setRefreshToken(value => value + 1)}
          refreshing={loading}
          onBack={handleBack}
          canGoBack={dimensionPath.length > 1}
          theme={theme}
          onThemeChange={setTheme}
          supabaseConnected={supabaseConnected}
          isMember={isMember}
          userEmail={userEmail}
          onOpenAuth={() => setAuthModalOpen(true)}
          onSignOut={handleSignOut}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobileLedger={() => setMobileLedgerOpen(true)}
        />

        {/* Canvas Principal */}
        <main className="flex-1 w-full min-w-0">
          {loading ? (
            <EmptyState
              type="loading"
              title="Cargando LINK WORLD"
              description="Conectando con Supabase y recuperando estado vivo del organismo..."
            />
          ) : (
            <React.Suspense key={refreshToken} fallback={<EmptyState type="loading" title="Cargando mesa" />}>
              {loadError ? <EmptyState type="error" title="No pudimos cargar LINK" description={loadError} actionLabel="Reintentar" onAction={() => setRefreshToken(value => value + 1)} /> : null}
              {/* Dimensión 0: LINK World / Territorio */}
              {(currentDimension === 'world' || currentDimension === 'businesses') && (
                <WorldCanvas
                  showAll={currentDimension === 'businesses'}
                  businesses={businesses}
                  attentionItems={attentionItems}
                  onSelectBusiness={handleSelectBusiness}
                  onNavigate={handleNavigate}
                  searchFilter={searchQuery}
                />
              )}

              {/* Dimensión 2: Célula Individual */}
              {currentDimension === 'business' && selectedBusiness && (
                <BusinessUniverse
                  business={selectedBusiness}
                  onNavigate={handleNavigate}
                  onBack={handleBack}
                />
              )}

              {/* Dimensión 3: La Concha Operacional */}
              {currentDimension === 'concha' && selectedBusiness && (
                <ConchaWorkspace
                  business={selectedBusiness}
                  onNavigate={handleNavigate}
                  onBack={handleBack}
                />
              )}

              {/* Dimensión Transversal: LINK FIN */}
              {currentDimension === 'fin' && (
                <FinWorkspace
                  businesses={businesses}
                  selectedBusiness={selectedBusiness}
                  onSelectBusiness={(business) => handleNavigate(currentDimension, business)}
                  onNavigate={handleNavigate}
                  onOpenAuth={() => setAuthModalOpen(true)}
                />
              )}

              {/* Dimensión Transversal: Torre de Operaciones */}
              {currentDimension === 'operations' && (
                <OperationsWorkspace
                  businesses={businesses}
                  selectedBusiness={selectedBusiness}
                  onSelectBusiness={(business) => handleNavigate(currentDimension, business)}
                  onNavigate={handleNavigate}
                />
              )}

              {/* Dimensión Transversal: LINK Director */}
              {currentDimension === 'director' && (
                <DirectorWorkspace
                  businesses={businesses}
                  onNavigate={handleNavigate}
                />
              )}

              {/* Dimensión: Model Foundry y La Concha Eterna */}
              {currentDimension === 'models' && (
                <ModelsWorkspace
                  onNavigate={handleNavigate}
                  onOpenAuth={() => setAuthModalOpen(true)}
                />
              )}

              {/* Dimensiones en preparación bajo la Arquitectura Maestra V1 */}
              {['mar', 'sales', 'closing', 'boarding', 'postventa', 'rrss', 'personas', 'evidencias', 'artefactos', 'evolution', 'genesis', 'mitosis', 'administracion', 'conexiones'].includes(currentDimension) && (
                <div className="py-6">
                  <EmptyState
                    type="in_preparation"
                    title={`Dimensión ${currentDimension.toUpperCase()} · Arquitectura Maestra V1`}
                    description={`La capacidad ${currentDimension.toUpperCase()} forma parte del diseño canónico de LINK WORLD y se encuentra en etapa de conexión estructural.`}
                    actionLabel="Volver al Territorio LINK"
                    onAction={() => handleNavigate('world', null)}
                  />
                </div>
              )}
            </React.Suspense>
          )}
        </main>
      </div>

      {/* Modal de Sesión de Miembro LINK */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div ref={authModalRef} role="dialog" aria-modal="true" aria-labelledby="auth-title"
            className="p-6 max-w-sm w-full space-y-4 shadow-2xl relative rounded-xs"
            style={{ background: 'var(--canvas)', border: '1px solid var(--border-subtle)' }}
          >
            <button
              aria-label="Cerrar acceso"
              onClick={() => { setAuthModalOpen(false); setAuthPassword(''); }}
              className="absolute right-4 top-4 hover:opacity-70"
              style={{ color: 'var(--ink)' }}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider block" style={{ color: 'var(--ink-faint)' }}>
                SEGURIDAD Y RLS
              </span>
              <h2 id="auth-title" className="text-lg font-bold font-display" style={{ color: 'var(--ink)' }}>
                Sesión Miembro LINK
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                Ingresa con tu cuenta de Supabase LINK para desbloquear vistas financieras, operacionales y de modelos protegidas.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xs text-xs flex items-center gap-2" style={{ background: '#FEECEC', color: '#E5484D' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-3 text-xs font-mono">
              <div>
                <label htmlFor="auth-email" className="block mb-1 text-[11px]" style={{ color: 'var(--ink-muted)' }}>CORREO ELECTRÓNICO</label>
                <input
                  id="auth-email" autoComplete="username"
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="usuario@link.world"
                  className="w-full px-3 py-2 rounded-xs border outline-none"
                  style={{ background: 'var(--surface-low)', borderColor: 'var(--border-subtle)', color: 'var(--ink)' }}
                />
              </div>

              <div>
                <label htmlFor="auth-password" className="block mb-1 text-[11px]" style={{ color: 'var(--ink-muted)' }}>CONTRASEÑA</label>
                <input
                  id="auth-password" autoComplete="current-password"
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xs border outline-none"
                  style={{ background: 'var(--surface-low)', borderColor: 'var(--border-subtle)', color: 'var(--ink)' }}
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2 font-bold font-mono text-xs rounded-xs transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5"
                style={{ background: 'var(--link-fluor)', color: 'var(--ink)' }}
              >
                {authLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Conectar Sesión</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
