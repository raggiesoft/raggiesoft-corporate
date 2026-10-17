/**
 * @license MIT
 * ============================================================================
 * scripts/build.mjs — RaggieSoft Media (corporate.raggiesoft.com)
 * ============================================================================
 * Architectural Overview:
 * Static Site Generation (SSG) compiler for `corporate.raggiesoft.com` (the
 * real-world B2B corporate hub of Michael P. Ragsdale, spun off from
 * `/raggiesoft.com/www/pages/raggiesoft-media/`).
 *
 * Tech Stack:
 * - Bootstrap 5.3.8 Static SSG + Frutiger Aero / Dark Aero adaptive glass UI
 * - Modern Web Guidance `dark-mode-toggle` (`<meta name="color-scheme">` +
 *   `data-bs-theme` synchronization)
 * - WCAG 2.1 AA / Section 508 compliant landmarks, skip links, focus rings,
 *   and OpenGraph (`og:*`) + Twitter Card social metadata (`title <= 60` chars,
 *   `description <= 155` chars).
 *
 * Routes Emitted to `./dist`:
 * - `/index.html` (RaggieSoft Media Hub)
 * - `/licensing/index.html` (Master Licensing Portal — MIT & CC BY-SA 4.0)
 * - `/licensing/commercial/index.html` (Commercial Synchronization Portal)
 * - `/projects/index.html` (Open-Source & Legacy Projects Hub)
 * - `/projects/stardust-engine-cms/index.html` (The Stardust Engine CMS / Elara)
 * - `/projects/storetrainer/index.html` (RaggieSoft StoreTrainer Overview & Gateway to storetrainer.raggiesoft.com)
 * - `/careers/index.html` (Careers & Employment Scam Warning Notice)
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

/**
 * Escapes HTML special characters for safe interpolation.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Writes a static file to `./dist`, creating parent directories automatically.
 * @param {string} relPath
 * @param {string} content
 */
function writeDistFile(relPath, content) {
  const fullPath = path.join(distDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
}

/**
 * Builds `/assets/corporate-client.js` implementing the Modern Web Guidance
 * two-state color-scheme toggle (reverting to system default when matching OS)
 * and synchronizing Bootstrap 5.3.8's `data-bs-theme` attribute.
 * @returns {string}
 */
function buildCorporateClientJs() {
  return `/**
 * @license MIT
 * corporate-client.js — Progressive Enhancement for corporate.raggiesoft.com
 * Implements Modern Web Guidance dark-mode-toggle (Frutiger Aero Light vs. Dark Aero)
 * and synchronizes Bootstrap 5.3.8 data-bs-theme.
 */
(function () {
  var meta = document.querySelector('meta[name="color-scheme"]');
  var toggleBtn = document.getElementById('theme-toggle');
  var toggleLabel = document.getElementById('theme-toggle-label');

  function getSystemScheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function getRenderedScheme() {
    var stored = null;
    try {
      stored = localStorage.getItem('color-scheme');
    } catch (e) {}
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return getSystemScheme();
  }

  function updateThemeState() {
    var current = getRenderedScheme();
    document.documentElement.setAttribute('data-bs-theme', current);
    if (!toggleLabel) return;
    var stored = null;
    try {
      stored = localStorage.getItem('color-scheme');
    } catch (e) {}
    if (stored === 'light' || stored === 'dark') {
      toggleLabel.textContent = current === 'dark' ? '🌙 Dark' : '☀️ Light';
    } else {
      toggleLabel.textContent = current === 'dark' ? '🌙 Dark (Auto)' : '☀️ Light (Auto)';
    }
  }

  if (toggleBtn && meta) {
    updateThemeState();
    toggleBtn.addEventListener('click', function () {
      var current = getRenderedScheme();
      var target = current === 'dark' ? 'light' : 'dark';
      var sys = getSystemScheme();
      try {
        if (target === sys) {
          localStorage.removeItem('color-scheme');
          meta.content = 'light dark';
        } else {
          localStorage.setItem('color-scheme', target);
          meta.content = target;
        }
      } catch (e) {
        meta.content = target;
      }
      updateThemeState();
    });

    window.addEventListener('storage', function (e) {
      if (e.key === 'color-scheme') {
        meta.content = e.newValue || 'light dark';
        updateThemeState();
      }
    });
  }

  /* Mobile Hamburger Menu Toggle (michaelpragsdale.com pattern) */
  var menuBtn = document.getElementById('mobile-menu-toggle');
  var primaryNav = document.getElementById('primary-navigation');
  if (menuBtn && primaryNav) {
    menuBtn.addEventListener('click', function () {
      var isOpen = primaryNav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  /* Hydrate scraper-protected B2B email links (.elara-secure-mail) */
  var mailLinks = document.querySelectorAll('.elara-secure-mail');
  for (var i = 0; i < mailLinks.length; i++) {
    var link = mailLinks[i];
    var u = link.getAttribute('data-u');
    var d = link.getAttribute('data-d');
    var t = link.getAttribute('data-t');
    if (u && d && t) {
      var addr = u + '@' + d + '.' + t;
      link.setAttribute('href', 'mailto:' + addr);
      link.setAttribute('title', 'Email ' + addr);
    }
  }
})();
`;
}

/**
 * Wraps route body HTML inside the Bootstrap 5.3.8 Corporate Aero document shell.
 * @param {Object} page
 * @returns {string}
 */
function renderCorporateShell(page) {
  const safeTitle = escapeHtml(page.title.slice(0, 60));
  const safeDesc = escapeHtml(page.description.slice(0, 155));
  const canonicalPath = page.route || '/';
  const canonicalUrl = `https://corporate.raggiesoft.com${canonicalPath === '/' ? '' : canonicalPath}`;
  const ogImage =
    page.ogImage ||
    'https://assets.raggiesoft.com/raggiesoft-corporate/images/og/raggiesoft-corporate-og.jpg';

  const navItems = [
    { href: '/', label: 'Hub', icon: 'fa-solid fa-building-columns' },
    { href: '/licensing', label: 'Licensing', icon: 'fa-solid fa-file-signature' },
    { href: '/licensing/commercial', label: 'Sync Portal', icon: 'fa-solid fa-briefcase' },
    { href: '/projects', label: 'Projects', icon: 'fa-brands fa-osi' },
    { href: '/projects/stardust-engine-cms', label: 'Stardust CMS', icon: 'fa-solid fa-rocket' },
    { href: '/projects/storetrainer', label: 'StoreTrainer', icon: 'fa-solid fa-floppy-disk' },
    { href: '/careers', label: 'Careers Notice', icon: 'fa-solid fa-shield-halved' }
  ];

  const navHtml = navItems
    .map((item) => {
      const isActive = item.href === canonicalPath;
      return `
        <li>
          <a href="${item.href}" class="corp-nav-link"${isActive ? ' aria-current="page"' : ''}>
            <i class="${item.icon}" aria-hidden="true"></i> ${escapeHtml(item.label)}
          </a>
        </li>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en" data-bs-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <script>
      try {
        var storedScheme = localStorage.getItem('color-scheme');
        document.querySelector('meta[name="color-scheme"]').content = storedScheme ?? 'light dark';
        var resolvedBsTheme = (storedScheme === 'light' || storedScheme === 'dark')
          ? storedScheme
          : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        document.documentElement.setAttribute('data-bs-theme', resolvedBsTheme);
      } catch (e) {}
    </script>
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="RaggieSoft Media" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
    <link rel="icon" type="image/png" href="https://assets.raggiesoft.com/raggiesoft-corporate/images/logos/raggiesoft-logo.png" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" />
    <link rel="stylesheet" href="https://kit.fontawesome.com/ec060982d4.css" crossorigin="anonymous" />
    <link rel="stylesheet" href="/assets/corporate-aero.css?v=20261017c" />
    <link rel="stylesheet" href="https://assets.raggiesoft.com/common/css/raggiesoft-network.css?v=20261017i" />
  </head>
  <body>
    <a href="#content" class="skip-link">Skip to main content</a>

    <nav class="rs-network-bar" aria-label="RaggieSoft Ecosystem Network">
      <div class="rs-network-bar-inner">
        <span class="rs-network-label">✦ RaggieSoft Network:</span>
        <ul class="rs-network-links">
          <li><a href="https://raggiesoft.com">🌐 Hub</a></li>
          <li><a href="https://nebulae.raggiesoft.com">🌌 Nebulae</a></li>
          <li><a href="https://music.raggiesoft.com">🎧 Music</a></li>
          <li><a href="https://books.raggiesoft.com">📚 Books</a></li>
          <li><a href="https://stardust.raggiesoft.com">🚀 Stardust</a></li>
          <li><a href="https://engineroom.raggiesoft.com">⚙️ Engine Room</a></li>
          <li><a href="https://lore.raggiesoft.com">🏛️ Lore</a></li>
          <li><a href="https://corporate.raggiesoft.com" aria-current="page" class="is-active">🏢 Corporate</a></li>
          <li><a href="https://storetrainer.raggiesoft.com">💾 StoreTrainer</a></li>
          <li><a href="https://michaelpragsdale.com">👔 Michael P. Ragsdale</a></li>
        </ul>
      </div>
    </nav>

    <header class="corp-navbar" role="banner">
      <div class="corp-header-inner">
        <a href="/" class="corp-brand-link">
          <img
            src="https://assets.raggiesoft.com/raggiesoft-corporate/images/logos/raggiesoft-logo.png"
            alt="RaggieSoft Media Official Seal"
            class="corp-brand-logo"
            width="36"
            height="36"
          />
          <div>
            <span class="corp-brand-title">RaggieSoft Media</span>
            <span class="corp-brand-subtitle">IP, Licensing &amp; Open-Source • Norfolk, VA</span>
          </div>
        </a>

        <button
          type="button"
          class="mobile-menu-toggle"
          id="mobile-menu-toggle"
          aria-expanded="false"
          aria-controls="primary-navigation"
          aria-label="Toggle navigation menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <nav id="primary-navigation" class="corp-primary-nav" aria-label="Primary Corporate Navigation">
          <ul class="corp-nav-links">
            ${navHtml}
            <li>
              <a href="https://michaelpragsdale.com" class="btn btn-sm btn-success rounded-pill px-3 fw-bold text-nowrap" target="_blank" rel="noopener noreferrer">
                <i class="fa-solid fa-user-tie me-1" aria-hidden="true"></i> Portfolio ↗
              </a>
            </li>
            <li>
              <button
                type="button"
                id="theme-toggle"
                class="btn btn-sm btn-outline-info rounded-pill px-3 fw-bold text-nowrap"
                aria-label="Toggle between Frutiger Aero Light Mode and Dark Aero Mode"
              >
                <span id="theme-toggle-label">◐ Theme</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <main id="content" class="flex-grow-1" tabindex="-1">
      ${page.html}
    </main>

    <footer class="corp-footer py-5 mt-5" role="contentinfo">
      <div class="container">
        <div class="row gy-4 mb-4">
          <div class="col-lg-4 col-md-6">
            <h2 class="h5 text-uppercase fw-bold mb-2">RaggieSoft Media</h2>
            <p class="small text-body-secondary mb-3">
              Real-world independent multimedia asset management, open-source software architecture, and master licensing administration operated by <strong>Michael P. Ragsdale</strong>.
            </p>
            <p class="small text-body-emphasis mb-0 font-monospace py-1 px-2 d-inline-block rounded border border-secondary-subtle">
              <i class="fa-solid fa-location-dot me-2 text-primary" aria-hidden="true"></i>HQ: Norfolk, Virginia
            </p>
          </div>

          <div class="col-lg-4 col-md-6">
            <h2 class="h6 text-uppercase fw-bold border-bottom border-secondary-subtle pb-2 mb-3">Operations &amp; Ecosystem Directory</h2>
            <ul class="list-unstyled small mb-0 d-grid gap-2">
              <li><a href="/licensing/commercial" class="text-decoration-none"><i class="fa-solid fa-briefcase fa-fw me-2 text-primary" aria-hidden="true"></i>Commercial Sync Licensing Portal</a></li>
              <li><a href="/licensing" class="text-decoration-none"><i class="fa-solid fa-scale-balanced fa-fw me-2 text-warning" aria-hidden="true"></i>Master Licensing (MIT &amp; CC BY-SA 4.0)</a></li>
              <li><a href="https://raggiesoft.com" class="text-decoration-none"><i class="fa-solid fa-globe fa-fw me-2 text-info" aria-hidden="true"></i>RaggieSoft Hub (raggiesoft.com)</a></li>
              <li><a href="https://engineroom.raggiesoft.com" class="text-decoration-none"><i class="fa-solid fa-compact-disc fa-fw me-2 text-primary" aria-hidden="true"></i>Engine Room Records (engineroom.raggiesoft.com)</a></li>
              <li><a href="https://stardust.raggiesoft.com" class="text-decoration-none"><i class="fa-solid fa-shuttle-space fa-fw me-2 text-warning" aria-hidden="true"></i>The Stardust Engine (stardust.raggiesoft.com)</a></li>
              <li><a href="https://music.raggiesoft.com" class="text-decoration-none"><i class="fa-solid fa-headphones fa-fw me-2 text-primary" aria-hidden="true"></i>The Listening Room (music.raggiesoft.com)</a></li>
              <li><a href="https://books.raggiesoft.com" class="text-decoration-none"><i class="fa-solid fa-book-open fa-fw me-2 text-warning" aria-hidden="true"></i>RaggieSoft Book Reader (books.raggiesoft.com)</a></li>
              <li><a href="https://lore.raggiesoft.com" class="text-decoration-none"><i class="fa-solid fa-scroll fa-fw me-2 text-info" aria-hidden="true"></i>Universe Lore Omnibus (lore.raggiesoft.com)</a></li>
              <li><a href="https://storetrainer.raggiesoft.com" class="text-decoration-none"><i class="fa-solid fa-floppy-disk fa-fw me-2 text-success" aria-hidden="true"></i>RaggieSoft StoreTrainer (storetrainer.raggiesoft.com)</a></li>
              <li><a href="https://nebulae.raggiesoft.com" class="text-decoration-none"><i class="fa-solid fa-compass fa-fw me-2 text-info" aria-hidden="true"></i>The RaggieSoft Nebulae (nebulae.raggiesoft.com)</a></li>
              <li><a href="https://michaelpragsdale.com" class="text-decoration-none"><i class="fa-solid fa-user-tie fa-fw me-2 text-success" aria-hidden="true"></i>Michael P. Ragsdale (michaelpragsdale.com)</a></li>
            </ul>
          </div>

          <div class="col-lg-4 col-md-12">
            <h2 class="h6 text-uppercase fw-bold border-bottom border-secondary-subtle pb-2 mb-3">Security &amp; Employment Notice</h2>
            <div class="aero-footer-alert p-3 small mb-3" role="note">
              <strong class="d-block mb-1 text-uppercase font-monospace text-body-emphasis">
                <i class="fa-solid fa-shield-check me-2 text-success" aria-hidden="true"></i>Single-Person Entity Notice
              </strong>
              <span class="text-body-secondary">RaggieSoft Media is a single-person entity operated solely by Michael P. Ragsdale and is not hiring.</span>
              <a href="/careers" class="text-danger fw-bold text-decoration-none d-block mt-2">
                Read Recruitment Scam Warning <i class="fa-solid fa-arrow-right ms-1" aria-hidden="true"></i>
              </a>
            </div>
            <p class="small text-body-secondary mb-0">
              <a href="https://raggiesoft.com/about/terms" class="me-3">Terms of Service</a>
              <a href="https://raggiesoft.com/about/privacy">Privacy Policy</a>
            </p>
          </div>
        </div>

        <div class="disclaimer-box mb-3" role="note" aria-label="Fictitious Persons and Entities Disclaimer">
          <strong>Fictitious Persons, Bands &amp; In-Universe Entities Disclaimer:</strong> While <strong>RaggieSoft Media</strong> and <strong>Engine Room Records</strong> (no &ldquo;LLC&rdquo;) are the real-world creative and technical brands of <strong>Michael P. Ragsdale</strong>, all narrative characters, bands (including The Stardust Engine, Fractured Prisms, Crimson Node, The Paper Wall, and The Arctic Symphony Project), biographies, universities (including Commonwealth Polytechnic Institute / CPI, The Forgers, and The Crucible), corporations (including OmniCorp, Apex Records, Prairie Coachworks, and Sainte-Claire), transit agencies (Blue Ridge Transit), in-universe legal filings, and any entity with <strong>&ldquo;LLC&rdquo;</strong>, <strong>&ldquo;Trust&rdquo;</strong>, or <strong>&ldquo;Holdings&rdquo;</strong> in its name (including <em>Engine Room Records, LLC</em>, <em>The O'Connell Family Revocable Trust</em>, <em>The O'Connell Family, LLC</em>, <em>Artists First Management, LLC</em>, <em>Stardust Properties, LLC</em>, <em>Stardust Blacksburg, LLC</em>, <em>Stardust Strategic Assets, LLC</em>, <em>Pacific Rim Properties, LLC</em>, <em>Jessica Miller Center, LLC</em>, and <em>Aethelgard Holdings, LLC</em>) across the wider RaggieSoft network are works of fiction. Any resemblance to actual persons (living or dead), businesses, institutions, or events is purely coincidental.
        </div>

        <p class="small text-body-secondary mb-0">
          &copy; 2026 Michael P. Ragsdale / RaggieSoft Media. Source code licensed under the
          <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">MIT License</a>.
          Creative content licensed under
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>.
        </p>
      </div>
    </footer>

    <script src="/assets/corporate-client.js?v=20261017c" defer></script>
    <script src="https://assets.raggiesoft.com/common/js/raggiesoft-network.js?v=20261017i" defer></script>
  </body>
</html>`;
}

function buildCorporateSite() {
  const portedPagesPath = path.join(projectRoot, 'src', 'data', 'ported-pages.json');
  const portedPages = fs.existsSync(portedPagesPath)
    ? JSON.parse(fs.readFileSync(portedPagesPath, 'utf-8'))
    : [];

  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  const cssContent = fs.readFileSync(
    path.join(projectRoot, 'src', 'styles', 'corporate-aero.css'),
    'utf-8'
  );
  const clientJsContent = buildCorporateClientJs();
  writeDistFile('assets/corporate-aero.css', cssContent);
  writeDistFile('assets/corporate-client.js', clientJsContent);

  const workspaceRoot = path.resolve(projectRoot, '..', '..', '..');
  const sharedCdnCssDir = path.join(workspaceRoot, 'raggiesoft-assets', 'raggiesoft-corporate', 'css');
  const sharedCdnJsDir = path.join(workspaceRoot, 'raggiesoft-assets', 'raggiesoft-corporate', 'js');
  fs.mkdirSync(sharedCdnCssDir, { recursive: true });
  fs.mkdirSync(sharedCdnJsDir, { recursive: true });
  fs.writeFileSync(path.join(sharedCdnCssDir, 'corporate-aero.css'), cssContent, 'utf-8');
  fs.writeFileSync(path.join(sharedCdnJsDir, 'corporate-client.js'), clientJsContent, 'utf-8');

  for (const page of portedPages) {
    const relPath = page.route === '/' ? 'index.html' : `${page.route.slice(1)}/index.html`;
    writeDistFile(relPath, renderCorporateShell(page));
  }

  console.log(
    `✅ Built corporate.raggiesoft.com static bundle in ${distDir} (${portedPages.length} B2B routes compiled).`
  );
}

buildCorporateSite();

if (process.argv.includes('--serve')) {
  const port = Number(process.env.PORT || 4322);
  const server = http.createServer((req, res) => {
    const urlPath = (req.url || '/').split('?')[0];
    let filePath = path.join(distDir, urlPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!path.extname(filePath) && fs.existsSync(`${filePath}/index.html`)) {
      filePath = `${filePath}/index.html`;
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath);
    const mime =
      ext === '.css'
        ? 'text/css; charset=utf-8'
        : ext === '.js'
          ? 'application/javascript; charset=utf-8'
          : 'text/html; charset=utf-8';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(fs.readFileSync(filePath));
  });
  server.listen(port, () => {
    console.log(`🚀 RaggieSoft Media preview server running at http://localhost:${port}`);
  });
}

