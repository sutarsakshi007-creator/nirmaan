/**
 * Admin Authentication Middleware
 * Protects administrative mutation endpoints (POST, PUT, DELETE, /reset)
 * using an API key check from the request headers.
 */

function requireAdminAuth(req, res, next) {
  const configuredKey = process.env.ADMIN_API_KEY || 'apmc-vashi-secret-2026';
  const apiKey = req.headers['x-api-key'] || (
    req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ')
      ? req.headers['authorization'].slice(7).trim()
      : null
  );

  if (!apiKey || apiKey !== configuredKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Missing or invalid Admin API Key. Set x-api-key header or enter your admin passkey.'
    });
  }

  next();
}

module.exports = { requireAdminAuth };
