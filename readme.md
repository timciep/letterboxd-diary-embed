# Letterboxd diary embed

A Cloudflare Worker, enabling you to embed a list of your most recently watched movies, as logged on [Letterboxd](https://letterboxd.com/), on your website.

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

## Develop locally

```
npm install
npm run dev
```

[Cloudflare worker docs](https://developers.cloudflare.com/workers/)