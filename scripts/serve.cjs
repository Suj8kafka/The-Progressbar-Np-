'use strict';

// Dependency-free local preview. Production remains a static site.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '../public');
const types = {
    '.htm': 'text/html; charset=utf-8', '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8'
};

function createServer() {
    return http.createServer(async (request, response) => {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            response.writeHead(405, { Allow: 'GET, HEAD' }).end();
            return;
        }
        try {
            const url = new URL(request.url, 'http://localhost');
            let pathname = decodeURIComponent(url.pathname);
            if (pathname === '/index.htm' || pathname === '/index.html') {
                response.writeHead(301, { Location: '/' + url.search }).end();
                return;
            }
            if (pathname.startsWith('/archive/')) response.setHeader('X-Robots-Tag', 'noindex, follow');
            if (pathname === '/') pathname = '/index.html';
            const file = path.resolve(root, '.' + pathname);
            const relative = path.relative(root, file);
            if (relative.startsWith('..') || path.isAbsolute(relative)
                || relative.split(/[\\/]/).some((part) => part.startsWith('.'))
                || !types[path.extname(file)]) {
                response.writeHead(404).end('Not found');
                return;
            }
            const content = await fs.readFile(file);
            response.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Cache-Control': 'no-store' });
            response.end(request.method === 'HEAD' ? undefined : content);
        } catch {
            response.writeHead(404).end('Not found');
        }
    });
}

if (require.main === module) {
    const port = Number(process.env.PORT || 4173);
    const server = createServer();
    server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log('Local: http://127.0.0.1:' + server.address().port));
}

module.exports = { createServer };
