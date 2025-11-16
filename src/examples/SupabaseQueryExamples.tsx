/**
 * Ejemplo de uso de los Query Helpers y Hooks
 * 
 * Este archivo muestra cómo usar las funciones de consulta y hooks
 * en diferentes escenarios de tu aplicación.
 */

import React, { useState } from 'react';
import { 
  useCompanies, 
  useSamples, 
  useMyCompany,
  useCompanySamples,
  useGeneralStats 
} from './lib/useSupabaseQuery';
import * as queries from './lib/supabaseQueries';

// ============================================
// EJEMPLO 1: Usar hooks en componentes
// ============================================

function CompaniesListComponent() {
  const { data: companies, loading, error, refetch } = useCompanies();

  if (loading) return <div>Cargando empresas...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Empresas ({companies?.length})</h2>
      <button onClick={refetch}>Recargar</button>
      
      {companies?.map(company => (
        <div key={company.id}>
          <h3>{company.name}</h3>
          <p>{company.email}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// EJEMPLO 2: Búsqueda de empresas
// ============================================

function CompanySearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: results, loading } = useSearchCompanies(searchTerm);

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar empresas..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {loading && <p>Buscando...</p>}
      
      {results?.map(company => (
        <div key={company.id}>{company.name}</div>
      ))}
    </div>
  );
}

// ============================================
// EJEMPLO 3: Usar queries directamente (sin hooks)
// ============================================

async function handleCreateCompany() {
  try {
    const newCompany = await queries.createCompany({
      name: 'Mi Empresa',
      email: 'empresa@example.com',
      phone: '123456789'
    });
    
    console.log('Empresa creada:', newCompany);
  } catch (error) {
    console.error('Error al crear empresa:', error);
  }
}

async function handleUpdateCompany(id: string) {
  try {
    const updated = await queries.updateCompany(id, {
      name: 'Nombre Actualizado'
    });
    
    console.log('Empresa actualizada:', updated);
  } catch (error) {
    console.error('Error al actualizar:', error);
  }
}

// ============================================
// EJEMPLO 4: Dashboard con estadísticas
// ============================================

function DashboardComponent() {
  const { data: stats, loading } = useGeneralStats();

  if (loading) return <div>Cargando estadísticas...</div>;

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="stats">
        <div>Total Empresas: {stats?.totalCompanies}</div>
        <div>Total Muestras: {stats?.totalSamples}</div>
        <div>Total Catadores: {stats?.totalCatadores}</div>
      </div>
    </div>
  );
}

// ============================================
// EJEMPLO 5: Vista de empresa con sus muestras
// ============================================

function CompanyDetailComponent({ companyId }: { companyId: string }) {
  const { data: company, loading: loadingCompany } = useCompany(companyId);
  const { data: samples, loading: loadingSamples } = useCompanySamples(companyId);

  if (loadingCompany || loadingSamples) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <h2>{company?.name}</h2>
      <p>Email: {company?.email}</p>
      
      <h3>Muestras ({samples?.length})</h3>
      {samples?.map(sample => (
        <div key={sample.id}>
          <p>{sample.nombre} - Código: {sample.codigotexto}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// EJEMPLO 6: Formulario con mutaciones
// ============================================

function CreateSampleForm({ companyId }: { companyId: string }) {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newSample = await queries.createSample({
        nombre,
        categoria,
        empresa_id: companyId
      });

      console.log('Muestra creada:', newSample);
      alert('Muestra creada exitosamente');
      
      // Limpiar formulario
      setNombre('');
      setCategoria('');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear muestra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nombre de la muestra"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />
      
      <input
        type="text"
        placeholder="Categoría"
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear Muestra'}
      </button>
    </form>
  );
}

// ============================================
// EJEMPLO 7: Realtime subscriptions
// ============================================

import { useEffect } from 'react';
import { supabase } from './lib/supabase';

function RealtimeSamplesComponent() {
  const { data: samples, refetch } = useSamples();

  useEffect(() => {
    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('muestras-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'muestras'
        },
        (payload) => {
          console.log('Cambio detectado:', payload);
          refetch(); // Recargar datos
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return (
    <div>
      <h2>Muestras en Tiempo Real</h2>
      {samples?.map(sample => (
        <div key={sample.id}>{sample.nombre}</div>
      ))}
    </div>
  );
}

export {
  CompaniesListComponent,
  CompanySearchComponent,
  DashboardComponent,
  CompanyDetailComponent,
  CreateSampleForm,
  RealtimeSamplesComponent
};
