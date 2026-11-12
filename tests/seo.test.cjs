'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createServer } = require('../scripts/serve.cjs');
const publicRoot = path.resolve(__dirname, '../public');
const read = (file) => fs.readFileSync(path.join(publicRoot, file), 'utf8');
const html = read('index.html');
const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)[1];
const meta = (name) => {
    const tag = [...html.matchAll(/<meta\b[^>]*>/g)].find(([value]) => value.includes(`name="${name}"`) || value.includes(`property="${name}"`));
    return tag?.[0].match(/\bcontent="([^"]*)"/)?.[1];
};

test('search metadata identifies the project and its creator without canonicalizing to the portfolio', () => {
    assert.match(html.match(/<title>([^<]+)<\/title>/)[1], /The Progressbar Np by Sujeet Khadka/);
    assert.equal(canonical, 'https://the-progressbar-np.netlify.app/');
    assert.equal(meta('og:url'), canonical);
    assert.match(meta('description'), /Sujeet Khadka/);
    assert.equal(meta('author'), 'Sujeet Khadka');
    assert.doesNotMatch(meta('robots'), /noindex/);
    assert.match(html, /<h3[^>]*>Created by Sujeet Khadka<\/h3>/);
    const structured = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const person = structured['@graph'].find((item) => item['@type'] === 'Person');
    const website = structured['@graph'].find((item) => item['@type'] === 'WebSite');
    const webpage = structured['@graph'].find((item) => item['@type'] === 'WebPage');
    assert.equal(person.name, 'Sujeet Khadka');
    assert.equal(new URL(person.url).hostname, 'www.sujeetkhadka.com.np');
    assert.equal(website.url, canonical);
    assert.equal(webpage.url, canonical);
    assert.equal(website.creator['@id'], person['@id']);
    assert.equal(webpage.author['@id'], person['@id']);
    assert.ok(html.includes(`href="${person.url}" rel="author"`));
});

test('crawler discovery and the sharing image agree with the canonical homepage', () => {
    const locations = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    assert.deepEqual(locations, [canonical]);
    const robots = read('robots.txt');
    assert.ok(robots.includes('Sitemap: ' + new URL('sitemap.xml', canonical).href));
    assert.doesNotMatch(robots, /^Disallow:\s*\/(?:archive\/?)?\s*$/m);
    const imageUrl = new URL(meta('og:image'));
    assert.equal(imageUrl.origin, new URL(canonical).origin);
    assert.equal(meta('twitter:image'), imageUrl.href);
    const png = fs.readFileSync(path.join(publicRoot, imageUrl.pathname));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 1200);
    assert.equal(png.readUInt32BE(20), 630);
});

test('HTTP serving exposes the sitemap, redirects aliases, and prevents archive indexing', async (t) => {
    const server = createServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const origin = 'http://127.0.0.1:' + server.address().port;
    const home = await fetch(origin);
    assert.equal(home.status, 200);
    assert.equal(home.headers.get('x-robots-tag'), null);
    for (const filename of ['robots.txt', 'sitemap.xml']) {
        const response = await fetch(origin + '/' + filename);
        assert.equal(response.status, 200);
        assert.match(response.headers.get('content-type'), filename.endsWith('.xml') ? /application\/xml/ : /text\/plain/);
    }
    for (const alias of ['index.htm', 'index.html']) {
        const response = await fetch(origin + '/' + alias + '?from=bookmark', { redirect: 'manual' });
        assert.equal(response.status, 301);
        assert.equal(response.headers.get('location'), '/?from=bookmark');
    }
    for (const filename of ['index.htm', 'original.htm']) {
        const response = await fetch(origin + '/archive/v1/' + filename, { method: 'HEAD' });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow');
    }
    assert.match(read('archive/v1/index.htm'), /name="robots" content="noindex, follow"/);
});
