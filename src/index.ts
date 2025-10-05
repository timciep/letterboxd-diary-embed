/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { getHtml, getRaw } from "./letterboxd/letterboxd-helper";

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	letterboxd_diary_cache: KVNamespace;
	referer_log: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		
		if (url.pathname === '/list-referrers') {
			const referrerList = await env.referer_log.list();
			const uniqueBaseUrls = new Set<string>();
			
			for (const key of referrerList.keys) {
				try {
					const url = new URL(key.name);
					// Skip localhost and other local development URLs
					if (url.hostname === 'localhost' || 
						url.hostname === '127.0.0.1' || 
						url.hostname === '0.0.0.0' ||
						url.hostname.endsWith('atari-embeds.googleusercontent.com')
					) {
						continue;
					}
					uniqueBaseUrls.add(url.origin);
				} catch (e) {
					// Skip invalid URLs
					console.error(`Invalid URL in referer_log: ${key.name}`);
				}
			}
			
			return new Response(JSON.stringify({
				count: uniqueBaseUrls.size,
				referrers: Array.from(uniqueBaseUrls)
			}, null, 2), {
				headers: {
					"content-type": "application/json;charset=UTF-8",
					"Access-Control-Allow-Origin": "*",
				},
			});
		}

		const queryParams = getQueryParamsFromUrl(url);

		const test = queryParams.get('test') === 'true';
		const cache = queryParams.get('nocache') !== 'true';
		const username = queryParams.get('username');
		const raw = queryParams.get('raw');
		const myip = queryParams.get('myip');

		if (myip) {
			const ipv4 = await fetch('https://api.ipify.org?format=json');
			const ipv6 = await fetch('https://api64.ipify.org?format=json');

			return new Response(JSON.stringify({
				// @ts-ignore
				ipv4: (await ipv4.json())?.ip,
				// @ts-ignore
				ipv6: (await ipv6.json())?.ip,
			}), {
				headers: {
					"content-type": "application/json;charset=UTF-8",
				},
			});
		}

		if ( ! username) {
			return new Response('400. Request missing Letterboxd username.', {
				status: 400,
				headers: {
					"content-type": "text/plain;charset=UTF-8",
					"Access-Control-Allow-Origin": "*",
				},
			});
		}

		if (raw === 'true') {
			const raw = await getRaw(username);

			return new Response(JSON.stringify(raw, null, 2), {
				headers: {
					"content-type": "application/json;charset=UTF-8",
				},
			});
		}

		let html = !test && cache 
			? await env.letterboxd_diary_cache.get(username)
			: null;

		if ( ! html) {
			html = await getHtml(username, test);

			if (html === null) {
				return new Response('404. Letterboxd username not found.', {
					status: 404,
					headers: {
						"content-type": "text/plain;charset=UTF-8",
						"Access-Control-Allow-Origin": "*",
					},
				});
			}
	
			if ( ! test && cache) {
				// Write KV updates in the background to avoid blocking the response
				ctx.waitUntil(env.letterboxd_diary_cache.put(username, html, {
					expirationTtl: 60 * 60, // seconds (= 1 hour)
				}));

				const referer = request.headers.get('referer');

				// console.log({username, referer});

				if (referer) {
					ctx.waitUntil(env.referer_log.put(referer, 'true'));
				}
			}
		}

		return new Response(html, {
			headers: {
				"content-type": "text/html;charset=UTF-8",
				"Access-Control-Allow-Origin": "*",
			},
		});
	},
};
function getQueryParamsFromUrl(url: URL): URLSearchParams {
	const searchParams = url.searchParams;
	return searchParams;
}
