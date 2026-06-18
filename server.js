const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
};

const apiKey = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8').trim();

const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8')
);

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const { messages, model } = JSON.parse(body);
        const requestBody = {
          model: model || config.defaultModel,
          messages: [
            { role: 'system', content: config.systemPrompt },
            ...messages,
          ],
        };

        const apiRes = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!apiRes.ok) {
          const errText = await apiRes.text();
          res.writeHead(apiRes.status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: errText }));
          return;
        }

        const data = await apiRes.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      systemPrompt: config.systemPrompt,
      defaultModel: config.defaultModel,
    }));
    return;
  }

  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`OpenCode Chat running at http://localhost:${PORT}`);
});
