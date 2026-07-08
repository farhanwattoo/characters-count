# DeviceTester — オンライン・デバイス診断ツールキット

Static, dependency-free site with five browser-based hardware tests (keyboard,
mouse, microphone, speaker, internet speed) plus an educational guide, in
Japanese. The site lives in `Pictures/tools/keyboardtest/` — that folder is the
web root (robots.txt, sitemap.xml and the Google Search Console verification
file sit at its top level).

## ⚠️ Before deploying: set your production domain

All absolute URLs (canonical tags, Open Graph `og:url` / `og:image`,
`sitemap.xml`, `robots.txt`, JSON-LD) currently use
**`https://keyboardtest.com`** — the domain that was already present in the
repo's structured data. If your production domain is different, replace it
everywhere in one step:

```sh
cd Pictures/tools/keyboardtest
grep -rl 'keyboardtest.com' . | xargs sed -i 's|https://keyboardtest.com|https://YOUR-DOMAIN.example|g'
```

The site must also be served from the **root** of that domain (not a subpath
like `/Pictures/tools/keyboardtest/`) for robots.txt, sitemap.xml, and the
Search Console verification file to work.

## Speed test

`speed-script.js` measures real transfers against Cloudflare's public
measurement endpoints (`speed.cloudflare.com/__down` / `__up`) — the same
backend speed.cloudflare.com uses. It never shows simulated numbers: if the
endpoints are unreachable it displays an error state instead.

## Post-deploy SEO checklist

1. Verify the property in [Google Search Console](https://search.google.com/search-console)
   (the `google8a2939e9b7d79b04.html` token file is served from the web root).
2. Submit `sitemap.xml` in Search Console.
3. Confirm rich results with the [Rich Results Test](https://search.google.com/test/rich-results)
   (FAQPage / SoftwareApplication / Article / BreadcrumbList markup is embedded).
4. Check social previews (og-image.png, 1200×630) with a card validator.
