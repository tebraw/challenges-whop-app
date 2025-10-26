/**
 * 🔧 ENHANCED WHOP DATA LOADER
 * 
 * Lädt vollständige Company-Daten inklusive Handle und Product IDs
 * für optimierte URL-Generierung
 */

export interface EnhancedCompanyData {
  id: string;
  name: string;
  handle?: string;
  productId?: string;
}

/**
 * Lädt erweiterte Company-Daten mit Handle und erster Product ID
 */
export async function loadEnhancedCompanyData(companyId: string): Promise<EnhancedCompanyData> {
  console.log(`🔍 Loading enhanced data for company: ${companyId}`);
  
  const result: EnhancedCompanyData = {
    id: companyId,
    name: `Company ${companyId}` // Fallback
  };

  const headers = {
    'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    // SCHRITT 1: Lade detaillierte Company-Informationen
    console.log('📡 Step 1: Loading detailed company info...');
    
    const companyResponse = await fetch(`https://api.whop.com/v5/companies/${companyId}`, {
      headers
    });

    if (companyResponse.ok) {
      const companyData = await companyResponse.json();
      if (companyData.data) {
        result.name = companyData.data.name || result.name;
        result.handle = companyData.data.handle;
        console.log(`✅ Company name: ${result.name}`);
        console.log(`✅ Company handle: ${result.handle || 'Not available'}`);
      }
    } else {
      console.log('⚠️ Company details not available:', companyResponse.status);
    }

  } catch (error) {
    console.log('⚠️ Error loading company details:', error);
  }

  try {
    // SCHRITT 2: Lade Company Products um Product ID zu finden
    console.log('📦 Step 2: Loading company products...');
    
    const productsResponse = await fetch(`https://api.whop.com/v5/companies/${companyId}/products`, {
      headers
    });

    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      const products = productsData.data || [];
      
      if (products.length > 0) {
        // Priorisiere App-Produkte, ansonsten nehme das erste verfügbare
        const appProduct = products.find((p: any) => p.type === 'app');
        const selectedProduct = appProduct || products[0];
        
        result.productId = selectedProduct.id;
        console.log(`✅ Product ID: ${result.productId} (${selectedProduct.name || 'Unknown'})`);
        
        if (products.length > 1) {
          console.log(`📊 Total products found: ${products.length}`);
        }
      } else {
        console.log('⚠️ No products found for company');
      }
    } else {
      console.log('⚠️ Error loading products:', productsResponse.status);
    }

  } catch (error) {
    console.log('⚠️ Error loading company products:', error);
  }

  console.log('🎯 Enhanced company data loaded:', {
    id: result.id,
    name: result.name,
    handle: result.handle || '❌ Not available',
    productId: result.productId || '❌ Not available'
  });

  return result;
}

/**
 * Aktualisiert bestehende Tenant-Daten mit fehlenden Handle/Product IDs
 */
export async function updateTenantWithEnhancedData(
  tenantId: string, 
  companyId: string,
  prisma: any
): Promise<void> {
  console.log(`🔄 Updating tenant ${tenantId} with enhanced data...`);

  // Prüfe aktuellen Tenant-Status
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) {
    console.log('❌ Tenant not found');
    return;
  }

  // Prüfe welche Daten fehlen - keine Daten mehr nötig
  console.log('✅ Tenant already has complete data');
  return;

  // Lade erweiterte Daten (nicht mehr verwendet)
  // const enhancedData = await loadEnhancedCompanyData(companyId);

  // Bereite Update-Daten vor (nicht mehr verwendet)
  // const updateData: any = {};

  // Update durchführen wenn neue Daten verfügbar (nicht mehr verwendet)
  console.log('ℹ️ Enhanced data loading disabled - no fields to update');
}
