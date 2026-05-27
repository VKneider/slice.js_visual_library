import path from 'path';

export function securityMiddleware(options = {}) {
  const {
    allowedExtensions = ['.js', '.css', '.html', '.json', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.woff', '.woff2', '.ttf', '.md'],
    blockedPaths = [
      '/node_modules',
      '/package.json',
      '/package-lock.json',
      '/.env',
      '/.git'
    ],
    allowPublicAssets = true
  } = options;

  return (req, res, next) => {
    const requestPath = req.path;

    const isBlockedPath = blockedPaths.some((blocked) =>
      requestPath.startsWith(blocked) || requestPath.includes(blocked)
    );

    if (isBlockedPath) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access to this resource is not allowed',
        path: requestPath
      });
    }

    if (allowPublicAssets) {
      const publicPaths = ['/assets', '/public', '/images', '/styles'];
      const isPublicAsset = publicPaths.some((publicPath) =>
        requestPath.startsWith(publicPath)
      );

      if (isPublicAsset) {
        return next();
      }
    }

    const fileExtension = path.extname(requestPath).toLowerCase();
    if (fileExtension && !allowedExtensions.includes(fileExtension)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'File type not allowed',
        extension: fileExtension
      });
    }

    const normalizedPath = path.normalize(requestPath);
    if (normalizedPath.includes('..') || normalizedPath.includes('~')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid path',
        path: requestPath
      });
    }

    next();
  };
}

export function sliceFrameworkProtection(options = {}) {
  const {
    port = 3000,
    strictMode = false,
    allowedDomains = []
  } = options;

  return (req, res, next) => {
    const requestPath = req.path;
    const frameworkPaths = [
      '/Slice/Components/Structural',
      '/Slice/Core',
      '/Slice/Services'
    ];

    const isFrameworkFile = frameworkPaths.some((fwPath) =>
      requestPath.startsWith(fwPath)
    );

    if (!isFrameworkFile) {
      return next();
    }

    const referer = req.get('Referer') || req.get('Referrer');
    const origin = req.get('Origin');
    const host = req.get('Host');

    const validOrigins = [
      `http://localhost:${port}`,
      `http://127.0.0.1:${port}`,
      `http://0.0.0.0:${port}`,
      `https://localhost:${port}`,
      ...allowedDomains
    ];

    if (host) {
      validOrigins.push(`http://${host}`);
      validOrigins.push(`https://${host}`);
    }

    const hasValidReferer = referer && validOrigins.some((valid) => referer.startsWith(valid));
    const hasValidOrigin = origin && validOrigins.some((valid) => origin === valid);
    const isSameHost = host && referer && referer.includes(host);

    if (hasValidReferer || hasValidOrigin || isSameHost) {
      return next();
    }

    if (strictMode) {
      return res.status(403).json({
        error: 'Framework Protection',
        message: 'Direct access to Slice.js framework files is blocked',
        tip: 'Framework files must be loaded through the application',
        path: requestPath
      });
    }

    next();
  };
}

export function suspiciousRequestLogger() {
  const suspiciousPatterns = [
    /\.\.\//,
    /~/,
    /\.env/,
    /\.git/,
    /package\.json/,
    /package-lock\.json/,
    /node_modules/
  ];

  return (req, res, next) => {
    const requestPath = req.path;
    const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(requestPath));
    if (isSuspicious) {
      const clientIp = req.ip || req.connection.remoteAddress;
      console.warn(`Suspicious request: ${requestPath} from ${clientIp}`);
    }
    next();
  };
}

export default {
  securityMiddleware,
  sliceFrameworkProtection,
  suspiciousRequestLogger
};
