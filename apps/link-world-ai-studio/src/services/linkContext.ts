import { supabase } from '../lib/supabase.ts';

export interface Business {
  id: string;
  global_id?: string;
  slug: string;
  name: string;
  sector?: string;
  city?: string;
  country?: string;
  summary?: string;
  google_place_id?: string | null;
  verification_status?: string;
  updated_at?: string;
  created_at?: string;
  owned_facts?: Record<string, any>;
  evidence?: Array<{ date?: string; fact?: string; type?: string; repo?: string; state?: string }>;
  economic_stage?: string;
  certified_economic_stage?: string | null;
  has_verified_cash?: boolean;
}

export interface ClientCounterpart {
  id: string;
  business_id: string;
  slug: string;
  name: string;
  role: string;
  relationship_state: string;
  city?: string;
  country?: string;
  summary?: string;
  global_id?: string;
  created_at?: string;
}

export interface ProductItem {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  price_amount?: number;
  price_currency?: string;
}

export interface AttentionItem {
  id: string;
  title: string;
  businessSlug: string;
  businessName: string;
  reason: string;
  dimension: string;
  severity: 'high' | 'medium' | 'low';
  source: 'database_record' | 'owned_facts_mission' | 'connection_gate';
  rawRef?: any;
}

export interface DataFetchResult<T> {
  data: T | null;
  status: 'ready' | 'empty' | 'unauthorized' | 'error' | 'loading';
  errorMessage?: string;
}

export const linkContext = {
  // Verificación de conexión viva y estado de autenticación
  async pingConnection(): Promise<{ ok: boolean; authenticated: boolean; isMember: boolean; email?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authenticated = Boolean(session);
      let isMember = false;

      if (authenticated) {
        const { data } = await supabase.rpc('link_world_is_member');
        isMember = data === true;
      }

      // Probar lectura de tabla pública canónica
      const { error } = await supabase.from('link_world_businesses').select('id').limit(1);
      return {
        ok: !error,
        authenticated,
        isMember,
        email: session?.user?.email,
      };
    } catch {
      return { ok: false, authenticated: false, isMember: false };
    }
  },

  // Consulta superior de células
  async getBusinesses(): Promise<DataFetchResult<Business[]>> {
    try {
      const { data, error } = await supabase
        .from('link_world_businesses')
        .select('*')
        .order('name');

      if (error) {
        if (error.code === '42501' || error.message?.includes('permission')) {
          return { data: null, status: 'unauthorized', errorMessage: error.message };
        }
        return { data: null, status: 'error', errorMessage: error.message };
      }

      if (!data || data.length === 0) {
        return { data: [], status: 'empty' };
      }

      return { data: data as Business[], status: 'ready' };
    } catch (err: any) {
      return { data: null, status: 'error', errorMessage: err.message };
    }
  },

  // Contrapartes / Clientes registrados
  async getClients(businessId?: string): Promise<DataFetchResult<ClientCounterpart[]>> {
    try {
      let query = supabase.from('link_world_clients').select('*');
      if (businessId) query = query.eq('business_id', businessId);
      
      const { data, error } = await query;
      if (error) {
        if (error.code === '42501' || error.message?.includes('permission')) {
          return { data: null, status: 'unauthorized', errorMessage: error.message };
        }
        return { data: null, status: 'error', errorMessage: error.message };
      }

      if (!data || data.length === 0) {
        return { data: [], status: 'empty' };
      }

      return { data: data as ClientCounterpart[], status: 'ready' };
    } catch (err: any) {
      return { data: null, status: 'error', errorMessage: err.message };
    }
  },

  // Productos de la célula
  async getProducts(businessId?: string): Promise<DataFetchResult<ProductItem[]>> {
    try {
      let query = supabase.from('link_world_products').select('*');
      if (businessId) query = query.eq('business_id', businessId);

      const { data, error } = await query;
      if (error) {
        if (error.code === '42501' || error.message?.includes('permission')) {
          return { data: null, status: 'unauthorized', errorMessage: error.message };
        }
        return { data: null, status: 'error', errorMessage: error.message };
      }

      if (!data || data.length === 0) {
        return { data: [], status: 'empty' };
      }

      return { data: data as ProductItem[], status: 'ready' };
    } catch (err: any) {
      return { data: null, status: 'error', errorMessage: err.message };
    }
  },

  // Mesa Financiera LINK FIN (Requiere permisos de miembro)
  async getFinances(businessId?: string): Promise<{
    summary: DataFetchResult<any>;
    movements: DataFetchResult<any[]>;
    lifecycle: DataFetchResult<any>;
  }> {
    const summaryRes = await (async () => {
      try {
        let q = supabase.from('link_fin_real_summary_v').select('*');
        if (businessId) q = q.eq('business_id', businessId);
        const { data, error } = businessId ? await q.maybeSingle() : await q;
        if (error) {
          return { data: null, status: 'unauthorized' as const, errorMessage: error.message };
        }
        return { data, status: data ? ('ready' as const) : ('empty' as const) };
      } catch (err: any) {
        return { data: null, status: 'error' as const, errorMessage: err.message };
      }
    })();

    const movementsRes = await (async () => {
      try {
        let q = supabase.from('link_fin_real_movements_v').select('*').order('occurred_at', { ascending: false });
        if (businessId) q = q.eq('business_id', businessId);
        const { data, error } = await q.limit(50);
        if (error) {
          return { data: null, status: 'unauthorized' as const, errorMessage: error.message };
        }
        return { data: data || [], status: (data && data.length > 0) ? ('ready' as const) : ('empty' as const) };
      } catch (err: any) {
        return { data: null, status: 'error' as const, errorMessage: err.message };
      }
    })();

    const lifecycleRes = await (async () => {
      try {
        let q = supabase.from('link_fin_business_lifecycle_v').select('*');
        if (businessId) q = q.eq('business_id', businessId);
        const { data, error } = businessId ? await q.maybeSingle() : await q;
        if (error) {
          return { data: null, status: 'unauthorized' as const, errorMessage: error.message };
        }
        return { data, status: data ? ('ready' as const) : ('empty' as const) };
      } catch (err: any) {
        return { data: null, status: 'error' as const, errorMessage: err.message };
      }
    })();

    return {
      summary: summaryRes,
      movements: movementsRes,
      lifecycle: lifecycleRes,
    };
  },

  // Model Foundry / Cartera de Modelos
  async getModels(): Promise<DataFetchResult<any[]>> {
    try {
      const { data, error } = await supabase
        .from('link_world_model_portfolio_v')
        .select('*');
      
      if (error) {
        return { data: null, status: 'unauthorized', errorMessage: error.message };
      }
      return { data: data || [], status: data?.length ? 'ready' : 'empty' };
    } catch (err: any) {
      return { data: null, status: 'error', errorMessage: err.message };
    }
  },

  // Extraer exclusivamente atención real comprobada desde los datos canónicos
  deriveRealAttention(businesses: Business[]): AttentionItem[] {
    const items: AttentionItem[] = [];

    for (const b of businesses) {
      // 1. Misiones reales registradas en owned_facts
      const missionArch = b.owned_facts?.mission_architecture?.missions;
      const activeMissionId = b.owned_facts?.mission_architecture?.active_mission_id;
      if (Array.isArray(missionArch)) {
        const activeM = missionArch.find((m: any) => m.id === activeMissionId || m.status === 'in_progress');
        if (activeM) {
          items.push({
            id: activeM.id,
            title: activeM.title,
            businessSlug: b.slug,
            businessName: b.name,
            reason: `Misión en progreso registrada en la arquitectura de ${b.name}.`,
            dimension: 'Director',
            severity: 'medium',
            source: 'owned_facts_mission',
          });
        }
      }

      // 2. Misiones activas en rrss_bridge
      if (b.owned_facts?.rrss_bridge?.active_mission) {
        const misId = b.owned_facts.rrss_bridge.active_mission;
        if (!items.some(x => x.id === misId)) {
          items.push({
            id: misId,
            title: `Habilitar puente RRSS / Zernio para ${b.name}`,
            businessSlug: b.slug,
            businessName: b.name,
            reason: 'Puente social en estado pendiente con evidencia requerida.',
            dimension: 'RRSS',
            severity: 'high',
            source: 'owned_facts_mission',
          });
        }
      }

      // 3. Verificación de gates de entrada y estabilización
      if (b.owned_facts?.entry_stabilization?.next_gate) {
        const gate = b.owned_facts.entry_stabilization.next_gate;
        items.push({
          id: `GATE-${b.slug}`,
          title: `Completar siguiente gate: ${gate}`,
          businessSlug: b.slug,
          businessName: b.name,
          reason: 'Gate de estabilización pendiente para consolidar la célula.',
          dimension: 'Evolución',
          severity: 'medium',
          source: 'connection_gate',
        });
      }
    }

    return items;
  }
};
