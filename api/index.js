// api/index.js - Seguridad automatica sin configuracion
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  securityMiddleware,
  sliceFrameworkProtection,
  suspiciousRequestLogger
} from './middleware/securityMiddleware.js';
import { createPublicEnvProvider } from './utils/publicEnvResolver.js';

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
    '.js', '.mjs', '.css', '.html', '.json',
    '.svg', '.png', '.jpg', '.jpeg', '.gif',
    '.woff', '.woff2', '.ttf', '.ico', '.md'
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
  app.use('/Components', (req, res) => res.status(404).send('Not found'));
}

app.use('/bundles/', (req, res, next) => {
  if (req.path.endsWith('.js') || req.path.endsWith('.mjs')) {
    const cleanedPath = req.path.replace(/^\//, '');
    const filePath = path.join(__dirname, `../${folderDeployed}`, 'bundles', cleanedPath);

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

app.use('/bundles/', express.static(path.join(__dirname, `../${folderDeployed}`, 'bundles')));

if (runMode === 'development') {
  app.use('/Slice/', express.static(path.join(__dirname, '..', 'node_modules', 'slicejs-web-framework', 'Slice')));
}

const publicFolders = Array.isArray(sliceConfig.publicFolders) ? sliceConfig.publicFolders : [];
const normalizedPublicFolders = publicFolders
  .filter((entry) => typeof entry === 'string')
  .map((entry) => entry.trim())
  .filter((entry) => entry.length > 0)
  .map((entry) => (entry.startsWith('/') ? entry : `/${entry}`));

if (runMode === 'development') {
  app.use(express.static(path.join(__dirname, `../${folderDeployed}`)));
} else {
  app.use('/App', express.static(path.join(__dirname, `../${folderDeployed}`, 'App')));
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
  for (const folder of normalizedPublicFolders) {
    app.use(folder, express.static(path.join(__dirname, `../${folderDeployed}`, folder)));
  }
  app.use('/bundles/', express.static(path.join(__dirname, `../${folderDeployed}`, 'bundles')));
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
// SPA FALLBACK
// ==============================================

app.get('*', (req, res) => {
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
  server = app.listen(PORT, () => {
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

startServer();

export default app;
