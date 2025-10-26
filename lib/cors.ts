export function setCorsHeaders(response: Response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-experience-id, x-whop-user-token, x-whop-experience-id, x-whop-company-id, Cache-Control');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Vary', 'Origin');
  return response;
}

export function createCorsResponse(data: any, status: number = 200) {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    }
  });
  return setCorsHeaders(response);
}

export function handleCorsPreflightOptions() {
  const response = new Response(null, {
    status: 200,
  });
  return setCorsHeaders(response);
}
