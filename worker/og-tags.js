// Cloudflare Worker: dynamic OG tags for /s/:slug and /listing/:id
// Static SPA can't unfurl (crawlers don't run JS), so this fetches the
// business from the API and returns minimal HTML with og:* meta, then
// the browser loads the Vite SPA normally.
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/s\/([\w-]+)/);
    if (!m) return fetch(req);
    const slug = m[1];
    const api = env.API_URL || 'http://localhost:4000';
    let name = slug, image = `${env.R2_PUBLIC_URL}/placeholder.jpg`, price = '';
    try {
      const r = await fetch(`${api}/storefront/${slug}`);
      if (r.ok) ({ name, image, price } = await r.json());
    } catch {}
    return new Response(
      `<!doctype html><html><head><meta property="og:title" content="${name}"><meta property="og:image" content="${image}"><meta property="og:description" content="${price}"></head><body><script>location.href="/#${url.pathname}"</script></body></html>`,
      { headers: { 'content-type': 'text/html' } }
    );
  },
};
