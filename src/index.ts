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
		const queryParams = getQueryParamsFromUrl(request.url);

		const test = queryParams.get('test') === 'true';
		const cache = queryParams.get('nocache') !== 'true';
		const username = queryParams.get('username');

		if ( ! username) {
			return new Response('400. Request missing Letterboxd username.', {
				status: 400,
				headers: {
					"content-type": "text/plain;charset=UTF-8",
					"Access-Control-Allow-Origin": "*",
				},
			});
		}

		if (queryParams.get('raw') === 'true') {
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
	
			if ( ! test && cache) {
				await env.letterboxd_diary_cache.put(username, html, {
					expirationTtl: 60 * 60, // seconds (= 1 hour)
				});
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

function getQueryParamsFromUrl(url: string): URLSearchParams {
	const urlObj = new URL(url);
	const searchParams = urlObj.searchParams;

	return searchParams;
}
