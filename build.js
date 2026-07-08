#!/usr/bin/env node
/**
 * Syncs header/footer across every page from a single source of truth.
 *
 * The header and footer used to be pasted by hand into every HTML file.
 * That drifted out of sync at least once (two pages had different GitHub
 * links after a manual edit touched only some of them). Now
 * partials/header.html and partials/footer.html are the ONLY place to edit
 * the header/footer markup — everything else is regenerated from them.
 *
 * Usage: after editing partials/header.html or partials/footer.html, run
 *
 *   node build.js
 *
 * ...then commit the regenerated page files. No dependencies, no install
 * step. The published site stays a plain static HTML — this script only
 * needs to run on your machine (or in CI) before you commit, not at
 * deploy/serve time.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PARTIALS_DIR = path.join(ROOT, 'partials');

// Every page that shares the header/footer, and which nav link (if any)
// should get the "active" class on that page.
const PAGES = [
    { file: 'index.html', navId: 'index' },
    { file: 'resume.html', navId: 'resume' },
    { file: 'projects.html', navId: 'projects' },
    { file: 'contact.html', navId: 'contact' },
    { file: '404.html', navId: null },
];

const HEADER_RE = /<!-- BUILD:HEADER -->[\s\S]*?<!-- \/BUILD:HEADER -->/;
const FOOTER_RE = /<!-- BUILD:FOOTER -->[\s\S]*?<!-- \/BUILD:FOOTER -->/;

const headerSrc = fs.readFileSync(path.join(PARTIALS_DIR, 'header.html'), 'utf8').trim();
const footerSrc = fs.readFileSync(path.join(PARTIALS_DIR, 'footer.html'), 'utf8').trim();

// Stamps class="active" onto the nav link matching the current page.
// partials/header.html itself stays free of any active class — this is
// the only place that decides which link lights up.
function withActiveNav(headerHtml, navId) {
    return headerHtml.replace(
        /<a href="([^"]+)" data-page="([^"]+)"/g,
        (match, href, page) => {
            const activeAttr = page === navId ? ' class="active"' : '';
            return `<a href="${href}"${activeAttr} data-page="${page}"`;
        }
    );
}

let updatedCount = 0;
const missingMarkers = [];

for (const { file, navId } of PAGES) {
    const filePath = path.join(ROOT, file);
    if (!fs.existsSync(filePath)) {
        console.warn(`Skipping ${file} — file not found.`);
        continue;
    }

    const original = fs.readFileSync(filePath, 'utf8');

    if (!HEADER_RE.test(original) || !FOOTER_RE.test(original)) {
        missingMarkers.push(file);
        continue;
    }

    const headerBlock = `<!-- BUILD:HEADER -->\n${withActiveNav(headerSrc, navId)}\n    <!-- /BUILD:HEADER -->`;
    const footerBlock = `<!-- BUILD:FOOTER -->\n${footerSrc}\n    <!-- /BUILD:FOOTER -->`;

    let html = original.replace(HEADER_RE, headerBlock);
    html = html.replace(FOOTER_RE, footerBlock);

    if (html !== original) {
        fs.writeFileSync(filePath, html);
        updatedCount++;
        console.log(`Updated ${file}`);
    } else {
        console.log(`${file} already up to date`);
    }
}

if (missingMarkers.length) {
    console.warn(
        `\nWarning: no <!-- BUILD:HEADER --> / <!-- BUILD:FOOTER --> markers found in:\n  - ${missingMarkers.join('\n  - ')}\n` +
        'These files were left untouched. Wrap their <header> and <footer> blocks in the markers (see any other page for the pattern).'
    );
}

console.log(`\nDone — ${updatedCount} file(s) synced from partials/header.html and partials/footer.html.`);
