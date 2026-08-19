const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.sqlite');

// Initialize SQLite Database
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    plan TEXT,
    budget TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread', -- 'unread', 'read', 'replied', 'archived'
    is_starred INTEGER DEFAULT 0,
    admin_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// MIME dictionary
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

// Helper: parse JSON request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        req.socket.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Helper: send JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  // --- API ROUTING ---
  if (pathname === '/api/inquiries' && method === 'POST') {
    try {
      const data = await parseBody(req);
      if (!data.name || !data.email || !data.message) {
        return sendJson(res, 400, { error: 'お名前、メールアドレス、ご相談内容は必須です。' });
      }

      const stmt = db.prepare(`
        INSERT INTO inquiries (name, company, email, phone, plan, budget, message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        data.name || '',
        data.company || '',
        data.email || '',
        data.phone || '',
        data.plan || 'Small Website',
        data.budget || '未定',
        data.message || ''
      );

      return sendJson(res, 201, {
        success: true,
        message: 'お問い合わせを受け付けました。okinawa@kaizoratech.com に通知されました。',
      });
    } catch (err) {
      console.error('Error creating inquiry:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
  }

  if (pathname === '/api/inquiries' && method === 'GET') {
    try {
      const search = urlObj.searchParams.get('search') || '';
      const filter = urlObj.searchParams.get('filter') || 'all';

      let query = 'SELECT * FROM inquiries';
      const params = [];
      const conditions = [];

      if (filter === 'unread') {
        conditions.push("status = 'unread'");
      } else if (filter === 'replied') {
        conditions.push("status = 'replied'");
      } else if (filter === 'starred') {
        conditions.push('is_starred = 1');
      }

      if (search.trim()) {
        conditions.push('(name LIKE ? OR company LIKE ? OR email LIKE ? OR message LIKE ?)');
        const s = `%${search.trim()}%`;
        params.push(s, s, s, s);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      query += ' ORDER BY id DESC';

      const stmt = db.prepare(query);
      const rows = stmt.all(...params);

      // Summary Stats
      const totalCount = db.prepare('SELECT COUNT(*) as count FROM inquiries').get().count;
      const unreadCount = db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'unread'").get().count;
      const repliedCount = db.prepare("SELECT COUNT(*) as count FROM inquiries WHERE status = 'replied'").get().count;

      return sendJson(res, 200, {
        inquiries: rows,
        stats: {
          total: totalCount,
          unread: unreadCount,
          replied: repliedCount,
          targetEmail: 'okinawa@kaizoratech.com',
        },
      });
    } catch (err) {
      console.error('Error fetching inquiries:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
  }

  // PATCH: update status / star / notes
  const patchMatch = pathname.match(/^\/api\/inquiries\/(\d+)$/);
  if (patchMatch && method === 'PATCH') {
    try {
      const id = parseInt(patchMatch[1], 10);
      const data = await parseBody(req);
      const fields = [];
      const params = [];

      if (data.status !== undefined) {
        fields.push('status = ?');
        params.push(data.status);
      }
      if (data.is_starred !== undefined) {
        fields.push('is_starred = ?');
        params.push(data.is_starred ? 1 : 0);
      }
      if (data.admin_notes !== undefined) {
        fields.push('admin_notes = ?');
        params.push(data.admin_notes);
      }

      if (fields.length === 0) {
        return sendJson(res, 400, { error: 'No fields to update' });
      }

      params.push(id);
      const stmt = db.prepare(`UPDATE inquiries SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...params);

      return sendJson(res, 200, { success: true });
    } catch (err) {
      console.error('Error updating inquiry:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
  }

  // DELETE: delete inquiry
  if (patchMatch && method === 'DELETE') {
    try {
      const id = parseInt(patchMatch[1], 10);
      const stmt = db.prepare('DELETE FROM inquiries WHERE id = ?');
      stmt.run(id);
      return sendJson(res, 200, { success: true });
    } catch (err) {
      console.error('Error deleting inquiry:', err);
      return sendJson(res, 500, { error: 'Internal Server Error' });
    }
  }

  // --- STATIC FILE SERVING & ADMIN ROUTE ---
  let reqPath = pathname;
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (reqPath === '/admin') reqPath = '/admin.html';

  const filePath = path.join(__dirname, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`OKINAWA WEBSITE Server running at http://localhost:${PORT}`);
  console.log(`Admin Hub available at http://localhost:${PORT}/admin`);
  console.log(`Connected Email Hub: okinawa@kaizoratech.com`);
});
