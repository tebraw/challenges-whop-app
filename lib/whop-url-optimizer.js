/**
 * 🔗 WHOP URL OPTIMIZER (JavaScript Version)
 * 
 * Optimiert Whop URLs mit Handle und Product ID
 */

/**
 * Generiert optimierte Whop Community URL
 */
function getOptimizedWhopUrl(tenant) {
  // Strategie 1: Handle + Product ID (optimal)
  if (tenant.whopHandle && tenant.whopProductId) {
    return `https://whop.com/${tenant.whopHandle}/?productId=${tenant.whopProductId}`;
  }
  
  // Strategie 2: Nur Handle
  if (tenant.whopHandle) {
    return `https://whop.com/${tenant.whopHandle}/`;
  }
  
  // Strategie 3: Fallback zu Company ID
  if (tenant.whopCompanyId) {
    return `https://whop.com/company${tenant.whopCompanyId}/`;
  }
  
  // Fallback: Whop Homepage
  return 'https://whop.com/';
}

/**
 * Prüft ob URL optimiert ist
 */
function isOptimizedUrl(url) {
  return url.includes('/company') === false;
}

module.exports = {
  getOptimizedWhopUrl,
  isOptimizedUrl
};