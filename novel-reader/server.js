const http = require('http');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const PORT = 3000;
const BOOKS_DIR = '/root/.openclaw/workspace/shared';

// 加载所有书籍
function getBooks() {
  const dirs = fs.readdirSync(BOOKS_DIR).filter(d => {
    const stat = fs.statSync(path.join(BOOKS_DIR, d));
    return stat.isDirectory();
  });
  
  return dirs.map(dir => {
    const bookDir = path.join(BOOKS_DIR, dir);
    const chaptersDir = path.join(bookDir, 'chapters');
    const manifestPath = path.join(bookDir, 'manifest.json');
    
    let meta = { title: dir, author: 'AI协作', description: '' };
    if (fs.existsSync(manifestPath)) {
      try { meta = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch(e) {}
    }
    
    let chapters = [];
    if (fs.existsSync(chaptersDir)) {
      chapters = fs.readdirSync(chaptersDir)
        .filter(f => f.endsWith('.md'))
        .sort((a, b) => a.localeCompare(b))
        .map(f => {
          const num = f.replace(/\D/g, '');
          const firstLine = fs.readFileSync(path.join(chaptersDir, f), 'utf8').split('\n')[0];
          const name = firstLine.replace(/^#\s*/, '').trim() || `第${num}章`;
          return { file: f, num: num || f, name, link: `/book/${dir}/chapter/${f}` };
        });
    }
    
    return { id: dir, ...meta, chapters, chapterCount: chapters.length };
  });
}

function buildBookLink(book) {
  return { id: book.id, title: book.title, author: book.author, description: book.description, chapterCount: book.chapterCount, link: `/book/${book.id}/` };
}

// ========== 页面构建 ==========

function buildHome() {
  const books = getBooks().map(buildBookLink);
  const totalBooks = books.length;
  const totalChapters = books.reduce((sum, b) => sum + b.chapterCount, 0);
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>小说书架</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f2f5; color: #333; line-height: 1.6; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 1.1em; }
    .container { max-width: 900px; margin: 30px auto; padding: 0 20px; }
    .stats { display: flex; justify-content: center; gap: 40px; margin-bottom: 30px; }
    .stat { text-align: center; }
    .stat-num { font-size: 2em; font-weight: bold; color: #667eea; }
    .stat-label { color: #666; font-size: 0.9em; }
    .book-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .book-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s; text-decoration: none; color: inherit; }
    .book-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
    .book-title { font-size: 1.3em; font-weight: bold; margin-bottom: 8px; color: #1a1a1a; }
    .book-meta { font-size: 0.85em; color: #666; margin-bottom: 12px; }
    .book-desc { font-size: 0.9em; color: #555; margin-bottom: 12px; line-height: 1.5; }
    .book-chapters { font-size: 0.8em; color: #667eea; background: #f0f2f5; padding: 4px 10px; border-radius: 12px; display: inline-block; }
    .footer { text-align: center; padding: 40px 20px; color: #999; font-size: 0.85em; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📚 小说书架</h1>
    <p>AI协作创作 · 多书籍阅读平台</p>
  </div>
  <div class="container">
    <div class="stats">
      <div class="stat"><div class="stat-num">${totalBooks}</div><div class="stat-label">本书</div></div>
      <div class="stat"><div class="stat-num">${totalChapters}</div><div class="stat-label">章节</div></div>
    </div>
    <div class="book-grid">
      ${books.map(book => `
      <a href="${book.link}" class="book-card">
        <div class="book-title">📖 ${book.title}</div>
        <div class="book-meta">作者：${book.author}</div>
        <div class="book-desc">${book.description || '暂无简介'}</div>
        <span class="book-chapters">${book.chapterCount}章</span>
      </a>`).join('')}
    </div>
  </div>
  <div class="footer">
    <p>按 Ctrl+C 停止服务 · 端口 ${PORT}</p>
  </div>
</body>
</html>`;
}

function buildBookIndex(book) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${book.title} - 小说阅读</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; }
    .back-bar { background: white; padding: 12px 20px; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 10; }
    .back-link { color: #667eea; text-decoration: none; font-size: 0.9em; }
    .back-link:hover { text-decoration: underline; }
    .container { max-width: 800px; margin: 0 auto; padding: 30px 20px; }
    h1 { font-size: 1.8em; margin-bottom: 8px; text-align: center; }
    .subtitle { text-align: center; color: #666; margin-bottom: 30px; font-size: 0.9em; }
    .chapter-list { list-style: none; }
    .chapter-item { background: white; border-radius: 8px; margin-bottom: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); transition: transform 0.2s; }
    .chapter-item:hover { transform: translateX(4px); }
    .chapter-link { display: block; padding: 14px 18px; text-decoration: none; color: #333; }
    .chapter-num { display: inline-block; background: #667eea; color: white; padding: 2px 10px; border-radius: 10px; font-size: 0.8em; margin-right: 10px; }
    .chapter-name { font-size: 1em; }
  </style>
</head>
<body>
  <div class="back-bar"><a href="/" class="back-link">← 返回书架</a></div>
  <div class="container">
    <h1>📖 ${book.title}</h1>
    <p class="subtitle">${book.author} · 共${book.chapterCount}章</p>
    <ul class="chapter-list">
      ${book.chapters.map(ch => `
      <li class="chapter-item">
        <a href="${ch.link}" class="chapter-link">
          <span class="chapter-num">${ch.num}</span>
          <span class="chapter-name">${ch.name}</span>
        </a>
      </li>`).join('')}
    </ul>
  </div>
</body>
</html>`;
}

function renderChapter(book, chapter) {
  const filepath = path.join(BOOKS_DIR, book.id, 'chapters', chapter);
  if (!fs.existsSync(filepath)) return null;
  
  const markdown = fs.readFileSync(filepath, 'utf8');
  const html = marked(markdown);
  const title = markdown.split('\n')[0].replace(/^#\s*/, '').trim();
  
  // 构建导航
  const idx = book.chapters.findIndex(c => c.file === chapter);
  const prev = idx > 0 ? book.chapters[idx - 1] : null;
  const next = idx < book.chapters.length - 1 ? book.chapters[idx + 1] : null;
  
  const navHtml = (prev || next) ? `<div class="nav">
    ${prev ? `<a href="/book/${book.id}/chapter/${prev.file}">← ${prev.name}</a>` : '<span>'}
    ${next ? `<a href="/book/${book.id}/chapter/${next.file}">${next.name} →</a>` : '<span>'}
  </div>` : '';
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${book.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #333; line-height: 1.8; max-width: 800px; margin: 0 auto; padding: 0 20px 40px; }
    .top-bar { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid #eee; margin-bottom: 24px; position: sticky; top: 0; background: white; z-index: 10; }
    .back-link { color: #667eea; text-decoration: none; font-size: 0.9em; }
    .back-link:hover { text-decoration: underline; }
    .book-name { font-size: 0.85em; color: #999; }
    h1 { font-size: 1.6em; margin-bottom: 24px; color: #1a1a1a; border-bottom: 2px solid #667eea; padding-bottom: 12px; }
    .content { font-size: 1.05em; }
    .content p { margin-bottom: 1em; text-align: justify; }
    hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
    blockquote { border-left: 4px solid #667eea; padding-left: 14px; color: #666; margin: 1.5em 0; }
    .nav { display: flex; justify-content: space-between; padding-top: 20px; border-top: 1px solid #eee; margin-top: 30px; }
    .nav a { padding: 8px 16px; background: #f5f5f5; text-decoration: none; color: #333; border-radius: 6px; font-size: 0.9em; }
    .nav a:hover { background: #e9ecef; }
    .nav span { padding: 8px 16px; color: #ccc; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="top-bar">
    <a href="/book/${book.id}/" class="back-link">← 目录</a>
    <span class="book-name">${book.title}</span>
  </div>
  <h1>${title}</h1>
  <div class="content">${html}</div>
  ${navHtml}
</body>
</html>`;
}

// ========== 路由 ==========

const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent(req.url.split('?')[0]);
  
  // 首页
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(buildHome());
    return;
  }
  
  // 某本书的目录
  const bookMatch = pathname.match(/^\/book\/([^\/]+)\/$/);
  if (bookMatch) {
    const books = getBooks();
    const book = books.find(b => b.id === bookMatch[1]);
    if (book) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(buildBookIndex(book));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>书籍不存在</h1>');
    }
    return;
  }
  
  // 某章节
  const chapterMatch = pathname.match(/^\/book\/([^\/]+)\/chapter\/(.+)$/);
  if (chapterMatch) {
    const books = getBooks();
    const book = books.find(b => b.id === chapterMatch[1]);
    if (book) {
      const html = renderChapter(book, chapterMatch[2]);
      if (html) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>章节不存在</h1>');
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>书籍不存在</h1>');
    }
    return;
  }
  
  // 其他404
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>页面不存在</h1>');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`📚 小说书架已启动`);
  console.log(`🌐 访问地址: http://0.0.0.0:${PORT}`);
  console.log(`📁 书籍目录: ${BOOKS_DIR}`);
  console.log(`\n新增书籍: 在 ${BOOKS_DIR} 下创建目录，放入 chapters/ 目录即可`);
  console.log(`可选: 在书籍目录创建 manifest.json 设置 title/author/description`);
  console.log(`\n按 Ctrl+C 停止服务`);
});
