// Post-export step: inject PWA head tags into the Expo web index.html.
// Usage: node scripts/inject-pwa-head.js [dist-dir]
// Idempotent — safe to re-run. Run after `expo export --platform web`.
const fs = require('fs');
const path = require('path');

const dir = process.argv[2] || path.join(__dirname, '..', 'dist');
const file = path.join(dir, 'index.html');

const TAGS = [
  '<meta name="description" content="New Era — discover businesses, products, and services, and talk to them directly." />',
  '<meta name="theme-color" content="#2C3E7A" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<link rel="manifest" href="/manifest.json" />',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
  `<script>
  (function () {
    try {
      var t = localStorage.getItem('theme') || 'system';
      var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.style.background = dark ? '#121317' : '#F7F7F9';
      document.addEventListener('DOMContentLoaded', function () {
        document.body.style.background = dark ? '#121317' : '#F7F7F9';
        document.body.style.margin = '0';
      });
    } catch (e) {}
  })();
  </script>`,
];

let html = fs.readFileSync(file, 'utf8');
if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `  ${TAGS.join('\n  ')}\n  </head>`);
  fs.writeFileSync(file, html);
  console.log('injected PWA head tags into', file);
} else {
  console.log('already injected, skipping');
}
