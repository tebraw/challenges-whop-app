// Add this to your admin API to log headers in production
// Temporarily add this to app/api/admin/challenges/route.ts

export async function GET(request: Request) {
  console.log("🔍 PRODUCTION HEADERS DEBUG:");
  
  const headers = new Headers(request.headers);
  const allHeaders: Record<string, string> = {};
  
  headers.forEach((value, key) => {
    allHeaders[key] = value;
    console.log(`${key}: ${value}`);
  });
  
  // Log specific Whop headers
  const whopHeaders = {
    'x-whop-company-id': headers.get('x-whop-company-id'),
    'x-whop-experience-id': headers.get('x-whop-experience-id'),
    'x-whop-user-id': headers.get('x-whop-user-id'),
    'x-whop-app-id': headers.get('x-whop-app-id'),
    'authorization': headers.get('authorization')
  };
  
  console.log("🎯 WHOP SPECIFIC HEADERS:", whopHeaders);
  
  return Response.json({
    message: "Headers logged to console",
    whopHeaders,
    allHeaders
  });
}