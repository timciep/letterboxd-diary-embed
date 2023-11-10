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

## Develop locally

```
npm install
npm run dev
```

[Cloudflare worker docs](https://developers.cloudflare.com/workers/)
