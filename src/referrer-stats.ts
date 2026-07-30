import { shouldExcludeReferrer } from "./referrer-filter";

/** Must match the `dataset` name in wrangler.toml. */
const DATASET = 'referer_stats';

/** Analytics Engine caps a data point's index at 96 bytes. */
const MAX_INDEX_LENGTH = 96;

const MAX_DAYS = 90; // Analytics Engine retention
const MAX_LIMIT = 500;

/**
 * How a request's referer was classified at write time:
 *
 * - `site`     — a real public referring site; what /top-referrers ranks.
 * - `filtered` — localhost, IPs, internal hosts, throwaway preview domains
 *                (see shouldExcludeReferrer).
 * - `none`     — no Referer header at all (direct/non-browser fetches).
 *
 * All three are written to the dataset, so filtered and referer-less traffic
 * stays queryable by hand; only `site` rows are ranked.
 */
type RefererCategory = 'site' | 'filtered' | 'none';

export interface TopReferrer {
	referrer: string;
	requests: number;
	cacheHits: number;
	cacheHitRate: number;
}

/**
 * Record one embed request against the Analytics Engine dataset.
 *
 * Unlike the referer_log KV write, this runs on every request — cache hits
 * included — so the counts reflect actual traffic rather than cache misses.
 * writeDataPoint is non-blocking and does not need ctx.waitUntil.
 */
export function recordRefererHit(
	dataset: AnalyticsEngineDataset | undefined,
	referer: string | null,
	username: string,
	cacheHit: boolean,
): void {
	// Binding may be absent in older local configs; never break a request over stats.
	if ( ! dataset) {
		return;
	}

	let origin = '(none)';
	let category: RefererCategory = 'none';

	if (referer) {
		try {
			const parsed = new URL(referer);
			origin = parsed.origin;
			category = shouldExcludeReferrer(parsed) ? 'filtered' : 'site';
		} catch (e) {
			origin = '(invalid)';
			category = 'filtered';
		}
	}

	try {
		dataset.writeDataPoint({
			indexes: [origin.slice(0, MAX_INDEX_LENGTH)],
			blobs: [origin, username, category],
			doubles: [cacheHit ? 1 : 0],
		});
	} catch (e) {
		console.error(`Failed to write referer data point: ${e}`);
	}
}

/**
 * Rank referring sites by request volume over the last `days` days.
 *
 * The Analytics Engine binding is write-only, so reads go through the SQL API,
 * which needs an account ID and an API token with Account Analytics Read.
 */
export async function queryTopReferrers(
	accountId: string,
	apiToken: string,
	days: number,
	limit: number,
): Promise<TopReferrer[]> {
	// Clamped and rounded before interpolation — the SQL API takes no bind params.
	const safeDays = Math.min(Math.max(Math.round(days), 1), MAX_DAYS);
	const safeLimit = Math.min(Math.max(Math.round(limit), 1), MAX_LIMIT);

	const sql = `
		SELECT
			blob1 AS referrer,
			SUM(_sample_interval) AS requests,
			SUM(_sample_interval * double1) AS cache_hits
		FROM ${DATASET}
		WHERE timestamp >= NOW() - INTERVAL '${safeDays}' DAY
			AND blob3 = 'site'
		GROUP BY referrer
		ORDER BY requests DESC
		LIMIT ${safeLimit}
		FORMAT JSON
	`;

	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiToken}`,
				'content-type': 'text/plain',
			},
			body: sql,
		},
	);

	if ( ! response.ok) {
		throw new Error(`Analytics Engine query failed (${response.status}): ${await response.text()}`);
	}

	const body = await response.json() as { data?: Array<Record<string, unknown>> };

	return (body.data ?? []).map((row) => {
		const requests = Number(row.requests) || 0;
		const cacheHits = Number(row.cache_hits) || 0;

		return {
			referrer: String(row.referrer),
			requests,
			cacheHits,
			cacheHitRate: requests > 0 ? Math.round((cacheHits / requests) * 1000) / 1000 : 0,
		};
	});
}
