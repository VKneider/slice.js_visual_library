// api/index.js - Seguridad automatica sin configuracion
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import compression from 'compression';
import {
  securityMiddleware,
  sliceFrameworkProtection,
  suspiciousRequestLogger
} from './middleware/securityMiddleware.js';
import { createPublicEnvProvider } from './utils/publicEnvResolver.js';
import { createDevDepsOptimizer } from 'slicejs-web-framework/api/framework/devDepsOptimizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import sliceConfig from '../src/sliceConfig.json' with { type: 'json' };

let server;
const app = express();

// Parsear argumentos de linea de comandos
const args = process.argv.slice(2);
const cliMode = args.includes('--production') ? 'production' : 'development';
const runMode = process.env.NODE_ENV === 'production' ? 'production' : cliMode;
const folderDeployed = runMode === 'production' ? 'dist' : 'src';
const publicEnvProvider = createPublicEnvProvider({
  mode: runMode,
  envFilePath: path.join(__dirname, '..', '.env')
});

// Obtener puerto desde process.env.PORT con fallback a sliceConfig.json
const PORT = process.env.PORT || sliceConfig.server?.port || 3001;

// ==============================================
// MIDDLEWARES DE SEGURIDAD (APLICAR PRIMERO)
// ==============================================

app.use(suspiciousRequestLogger());
app.use(sliceFrameworkProtection());

app.use(securityMiddleware({
  allowedExtensions: [
    '.js', '.mjs', '.cjs',
    '.css',
    '.html', '.htm',
    '.json',
    '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico',
    '.woff', '.woff2', '.ttf', '.otf', '.eot',
    '.txt', '.xml', '.pdf', '.md',
    '.webm', '.mp4', '.mp3', '.wav', '.ogg',
    '.wasm'
  ],
  blockedPaths: [
    '/node_modules',
    '/package.json',
    '/package-lock.json',
    '/.env',
    '/.git',
    '/api/middleware'
  ],
  allowPublicAssets: true
}));

// ==============================================
// MIDDLEWARES DE APLICACION
// ==============================================

app.use(compression({ threshold: 0 }));

app.use((req, res, next) => {
  if (req.path.endsWith('.js') || req.path.endsWith('.mjs')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ==============================================
// RUNTIME MODE ENDPOINT
// ==============================================

app.get('/slice-env.json', (req, res) => {
  const payload = publicEnvProvider.getPayload();
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json(payload);
});

// ==============================================
// PWA — manifest + service worker (dev y prod)
// ==============================================
// Resolve a deployed asset preferring the public/ folder (the convention),
// falling back to the deploy root for pre-`public/` projects.
const resolveDeployedFile = (fileName) => {
  const inPublic = path.join(__dirname, `../${folderDeployed}`, 'public', fileName);
  return fs.existsSync(inPublic) ? inPublic : path.join(__dirname, `../${folderDeployed}`, fileName);
};

const servePwaFile = (res, fileName, contentType, extraHeaders = {}) => {
  const filePath = resolveDeployedFile(fileName);
  try {
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', contentType);
      for (const [key, value] of Object.entries(extraHeaders)) res.setHeader(key, value);
      return res.send(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error);
    return res.status(500).send(`Error reading ${fileName}`);
  }
  return res.status(404).send(`${fileName} not found`);
};

app.get('/service-worker.js', (req, res) => {
  servePwaFile(res, 'service-worker.js', 'application/javascript; charset=utf-8', {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Service-Worker-Allowed': '/',
  });
});

app.get('/manifest.json', (req, res) => {
  servePwaFile(res, 'manifest.json', 'application/manifest+json; charset=utf-8');
});

// ==============================================
// ARCHIVOS ESTATICOS (DESPUES DE SEGURIDAD)
// ==============================================

if (runMode === 'production') {
  app.get('/Slice/Slice.js', (req, res) => {
    const slicePath = path.join(__dirname, '..', 'node_modules', 'slicejs-web-framework', 'Slice', 'Slice.js');
    if (fs.existsSync(slicePath)) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      return res.send(fs.readFileSync(slicePath, 'utf8'));
    }
    return res.status(404).send('Slice.js not found');
  });

  app.use('/Slice', (req, res) => res.status(404).send('Not found'));
}

app.use('/bundles/', (req, res, next) => {
  if (req.path.endsWith('.js') || req.path.endsWith('.mjs')) {
    const cleanedPath = req.path.replace(/^\//, '');
    let filePath = path.join(__dirname, '../dist', 'bundles', cleanedPath);

    // Bundler v2 may emit this import relative to /bundles even when source file
    // lives under Components/AppComponents/ComponentsPage.
    if (cleanedPath === 'documentationRoutes.generated.js' || cleanedPath === 'docsIndex.js') {
      const resolvedFile = path.join(
        __dirname,
        `../${folderDeployed}`,
        'Components',
        'AppComponents',
        'ComponentsPage',
        cleanedPath
      );
      filePath = resolvedFile;
    }

    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.send(fileContent);
      } catch (error) {
        return res.status(500).send('Error reading bundle file');
      }
    }

    return res.status(404).send('Bundle file not found');
  }

  next();
});

app.use('/bundles/', express.static(path.join(__dirname, '../dist', 'bundles')));

if (runMode === 'development') {
  app.use('/Slice/', express.static(path.join(__dirname, '..', 'node_modules', 'slicejs-web-framework', 'Slice')));
}

if (runMode === 'development') {
  // External (node_modules) dependency support in dev — always on. Rewrites
  // bare imports in served src modules to /@slice-modules/… and serves each
  // package pre-bundled with esbuild (same resolver as the production build).
  // Mirrors the framework's createSliceServer; this app runs its own server.
  const projectRoot = path.join(__dirname, '..');
  const devDeps = createDevDepsOptimizer({ projectRoot });

  if (devDeps.enabled) {
    const srcRoot = path.join(projectRoot, folderDeployed);

    app.get(/^\/@slice-modules\/(.+)$/, async (req, res) => {
      const spec = req.params[0];
      try {
        const { code } = await devDeps.bundlePackage(spec);
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        return res.send(code);
      } catch (error) {
        const message = `Failed to load external dependency "${spec}": ${error.message}`;
        console.error(`[slice:dev] ${message}`);
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        return res.status(502).send(`throw new Error(${JSON.stringify(message)});`);
      }
    });

    app.use(async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      const reqPath = req.path;
      if (!(reqPath.endsWith('.js') || reqPath.endsWith('.mjs'))) return next();
      if (reqPath.startsWith('/@slice-modules/') || reqPath.startsWith('/bundles/') || reqPath.startsWith('/Slice/')) {
        return next();
      }
      const filePath = path.join(srcRoot, decodeURIComponent(reqPath));
      const normalized = path.normalize(filePath);
      if (normalized !== srcRoot && !normalized.startsWith(srcRoot + path.sep)) return next();
      if (!fs.existsSync(normalized) || !fs.statSync(normalized).isFile()) return next();
      try {
        const original = fs.readFileSync(normalized, 'utf8');
        const rewritten = await devDeps.rewriteBareImports(original);
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        return res.send(rewritten);
      } catch (error) {
        console.error(`[slice:dev] Failed to rewrite ${reqPath}: ${error.message}`);
        return next();
      }
    });
  }

  // Centralized public/ folder served at the root URL (Themes, Styles, images…).
  // Mounted before the general src static so its files win at the root.
  app.use(express.static(path.join(__dirname, `../${folderDeployed}`, 'public')));
  app.use(express.static(path.join(__dirname, `../${folderDeployed}`)));
} else {
  // Serve the built public/ assets at the root URL.
  app.use(express.static(path.join(__dirname, `../${folderDeployed}`, 'public')));
  app.use('/App', express.static(path.join(__dirname, `../${folderDeployed}`, 'App')));
  app.use('/Components', express.static(path.join(__dirname, `../${folderDeployed}`, 'Components')));
  app.get('/manifest.json', (req, res) => {
    const manifestPath = path.join(__dirname, `../${folderDeployed}`, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.send(fs.readFileSync(manifestPath, 'utf8'));
    }
    return res.status(404).send('manifest.json not found');
  });
  app.get('/service-worker.js', (req, res) => {
    const workerPath = path.join(__dirname, `../${folderDeployed}`, 'service-worker.js');
    if (fs.existsSync(workerPath)) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      return res.send(fs.readFileSync(workerPath, 'utf8'));
    }
    return res.status(404).send('service-worker.js not found');
  });
  app.get('/routes.js', (req, res) => {
    const routesPath = path.join(__dirname, `../${folderDeployed}`, 'routes.js');
    if (fs.existsSync(routesPath)) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      return res.send(fs.readFileSync(routesPath, 'utf8'));
    }
    return res.status(404).send('routes.js not found');
  });
  app.get('/sliceConfig.json', (req, res) => {
    const configPath = path.join(__dirname, `../${folderDeployed}`, 'sliceConfig.json');
    if (fs.existsSync(configPath)) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.send(fs.readFileSync(configPath, 'utf8'));
    }
    return res.status(404).send('sliceConfig.json not found');
  });
  app.use('/dist/', express.static(path.join(__dirname, '..', 'dist')));
}

// ==============================================
// RUTAS DE API
// ==============================================

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    mode: runMode,
    folder: folderDeployed,
    timestamp: new Date().toISOString(),
    framework: 'Slice.js',
    version: '2.0.0',
    security: {
      enabled: true,
      mode: 'automatic',
      description: 'Zero-config security - works with any domain'
    }
  });
});

// ==============================================
// SEO: robots.txt & sitemap.xml
// ==============================================

app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, `../${folderDeployed}`, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, `../${folderDeployed}`, 'sitemap.xml'));
});

// ==============================================
// API 404 — before SPA fallback
// ==============================================

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// ==============================================
// SPA FALLBACK
// ==============================================

app.use((req, res) => {
  const indexPath = path.join(__dirname, `../${folderDeployed}`, 'App', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <p>The requested file could not be found in /${folderDeployed}</p>
        <p>Make sure you've run the appropriate build command:</p>
        <ul>
          <li>For development: Files should be in /src</li>
          <li>For production: Run "npm run build" first</li>
        </ul>
      `);
    }
  });
});

// ==============================================
// INICIO DEL SERVIDOR
// ==============================================

function startServer() {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log('Security middleware active (zero-config, automatic)');
    console.log(`Slice.js server running on port ${PORT}`);
  });
}

process.on('SIGINT', () => {
  console.log('\nSlice server stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nServer terminated');
  process.exit(0);
});

if (!process.env.VERCEL) {
  startServer();
}

export default app;
