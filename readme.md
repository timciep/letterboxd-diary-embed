# Letterboxd diary embed

* [Use it here](https://letterboxd-embed.timcieplowski.com/)

* [Self-service page (letterboxd-embed.timcieplowski.com) repo](https://github.com/timciep/letterboxd-embed-landing-page)

---

A Cloudflare Worker, enabling you to embed a list of your most recently watched movies, as logged on [Letterboxd](https://letterboxd.com/), on your website.

<img width="688" alt="image" src="https://github.com/timciep/letterboxd-diary-embed/assets/2245341/d9ad68e2-6fca-469c-875e-878037252fc6">

## Use embed

Add the following to your website, where you want the list (**replace \<your-letterboxd-username\>**):

```html
<div id="letterboxd-embed-wrapper-tc"></div>
<script>
    fetch('lb-embed-content.bokonon.dev?username=<your-letterboxd-username>')
        .then(response => response.text())
        .then(data => {
            document.getElementById('letterboxd-embed-wrapper-tc').innerHTML = data;
        });
</script>
```

### URL params for fetch

* `username`: (required) Letterboxd username.
* `test`: If `true`, uses hard-coded Letterboxd response from repo.
* `nocache`: If `true`, passes 1-hour cache of response.
* `raw`: If `true`, returns raw uncached Letterboxd JSON payload.

## Referrer stats

Two endpoints, backed by different stores:

* `/list-referrers` — unique referring origins, from the `referer_log` KV namespace. No volume data, and it only records on a cache miss.
* `/top-referrers` — referring sites ranked by request count, from an [Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/) dataset written on *every* request.

### `/top-referrers` params

* `days`: Lookback window, 1–90. Defaults to `7`.
* `limit`: Rows returned, 1–500. Defaults to `50`.
* `token`: Required only if the `STATS_TOKEN` secret is set.

Response rows carry `referrer` and `requests`.

### Setup

The dataset itself needs no setup — it is created on first write, as soon as a build with the `referer_stats` binding is deployed. Reading it back does need credentials, since the Worker binding is write-only and reads go through the SQL API:

```
npx wrangler secret put CF_ACCOUNT_ID       # Cloudflare account ID
npx wrangler secret put CF_ANALYTICS_TOKEN  # API token with Account Analytics Read
npx wrangler secret put STATS_TOKEN         # optional; gates /top-referrers
```

Until the first two are set, `/top-referrers` returns 501 — writes still accumulate in the meantime. **Without `STATS_TOKEN` the endpoint is public**, like `/list-referrers`, which means anyone can read the traffic volumes of every site using the embed.

Every request is written, tagged in `blob3` as `site` (a real referring site), `filtered` ([`shouldExcludeReferrer`](src/referrer-filter.ts) rejects it — localhost, IPs, preview domains), or `none` (no `Referer` header). `/top-referrers` ranks only `site`; the rest stay queryable via the SQL API. Retention is 90 days.

## Develop locally

```
npm install
npm run dev
```

[Cloudflare worker docs](https://developers.cloudflare.com/workers/)

---

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/P5P3QXEV3)

