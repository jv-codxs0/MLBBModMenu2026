// Vercel serverless function: /api/download
// Only works when the request comes from your own website, then redirects to a
// short-lived signed GitHub link. A copied link stops working quickly.
module.exports = async (req, res) => {
  const allowed = (process.env.ALLOWED_HOSTS || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const ref = req.headers.referer || req.headers.origin || '';
  let host = '';
  try { host = new URL(ref).host.toLowerCase(); } catch (e) {}

  if (!host || !allowed.includes(host)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('Please start the download from the website.');
  }

  const { GITHUB_TOKEN, GH_OWNER, GH_REPO, GH_ASSET_ID } = process.env;
  try {
    const r = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/assets/${GH_ASSET_ID}`,
      {
        redirect: 'manual',
        headers: {
          Accept: 'application/octet-stream',
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'keymodlegend'
        }
      }
    );
    const loc = r.headers.get('location');
    if (r.status === 302 && loc) {
      res.statusCode = 302;
      res.setHeader('Location', loc);
      res.setHeader('Cache-Control', 'no-store');
      return res.end();
    }
    if (r.body) r.body.cancel();
    res.statusCode = 502;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Download is unavailable right now. Try again later.');
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Download is unavailable right now. Try again later.');
  }
};
