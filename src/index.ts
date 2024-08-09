interface Env {
	MUNKI_BUCKET: R2Bucket;
	BASIC_USERNAME: string;
	BASIC_PASSWORD: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const objectName = decodeURIComponent(url.pathname.slice(1));

		// Basic Authentication
		const authHeader = request.headers.get('Authorization');
		const authString = `Basic ${btoa(`${env.BASIC_USERNAME}:${env.BASIC_PASSWORD}`)}`;

		if (!authHeader || authHeader !== authString) {
			return new Response('Unauthorized', {
				status: 401,
				headers: { 'WWW-Authenticate': 'Basic realm="Restricted"' }
			});
		}

		// Handle GET requests
		if (request.method === 'GET') {
			if (!objectName) {
				return new Response(`Object not found`, { status: 404 });
			}

			const object = await env.MUNKI_BUCKET.get(objectName);
			if (!object) {
				return new Response(`Object "${objectName}" not found`, { status: 404 });
			}

			return new Response(object.body, {
				headers: {
					'Content-Type': object.httpMetadata.contentType,
					'ETag': object.httpEtag,
				}
			});
		}

		// Method Not Allowed
		return new Response('Method Not Allowed', { status: 405, headers: { 'Allow': 'GET' } });
	}
} satisfies ExportedHandler<Env>;
