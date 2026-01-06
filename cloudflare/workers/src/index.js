export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Only proxy API requests
    if (!url.pathname.startsWith('/api')) {
      return new Response('Not Found', { status: 404 });
    }

    // Build the backend URL
    const backendUrl = new URL(url.pathname + url.search, env.BACKEND_URL);

    // Forward the request to the backend
    const backendRequest = new Request(backendUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined,
    });

    try {
      const backendResponse = await fetch(backendRequest);

      // Clone the response and add CORS headers
      const response = new Response(backendResponse.body, backendResponse);
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      return response;
    } catch (error) {
      return new Response('Backend Error', { status: 502 });
    }
  },
};
