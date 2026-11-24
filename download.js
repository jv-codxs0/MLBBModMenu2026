module.exports = async (req, res) => {
  const allowed = (process.env.ALLOWED_HOSTS || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const ref = req.headers.referer || req.headers.origin || '';
  let host = '';
  try { host = new URL(ref).host.toLowerCase(); } catch (e) {}
  if (!host || !allowed.includes(host)) {
    res.statusCode = 403;
    return res.end('Please start the download from the website.');
  }
  const { GITHUB_TOKEN, GH_OWNER, GH_REPO, GH_ASSET_ID } = process.env;
  try {
    const r = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/releases/assets/${GH_ASSET_ID}`,
      { redirect: 'manual', headers: {
          Accept: 'application/octet-stream',
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'keymodlegend' } });
    const loc = r.headers.get('location');
    if (r.status === 302 && loc) {
      res.statusCode = 302;
      res.setHeader('Location', loc);
      res.setHeader('Cache-Control', 'no-store');
      return res.end();
    }
    res.statusCode = 502;
    res.end('Download is unavailable right now.');
  } catch (e) {
    res.statusCode = 502;
    res.end('Download is unavailable right now.');
  }
};
