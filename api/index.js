import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import sliceConfig from '../src/sliceConfig.json' with { type: 'json' };

let server;

const app = express();

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);

const runMode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const folderDeployed = runMode === 'production' ? 'dist' : 'src';

// Obtener puerto desde sliceConfig.json, con fallback a process.env.PORT
const PORT = sliceConfig.server?.port || process.env.PORT || 3001;

console.log(`🚀 Starting Slice.js server in ${runMode} mode`);
console.log(`📁 Serving files from: /${folderDeployed}`);

app.use('/Slice/', express.static(path.join(__dirname, '..', 'node_modules', 'slicejs-web-framework', 'Slice')));


// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, `../${folderDeployed}`)));

// Middleware para parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar headers de CORS
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

// Ruta de ejemplo para API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    mode: runMode,
    folder: folderDeployed,
    timestamp: new Date().toISOString(),
    framework: 'Slice.js',
    version: '2.0.0'
  });
});

// SPA fallback - servir index.html para rutas no encontradas
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, `../${folderDeployed}`,"App", 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <p>The requested file could not be found in /${folderDeployed}</p>
        <p>Make sure you've run the appropriate build command:</p>
        <ul>
          <li>For development: Files should be in /src</li>
          <li>For production: Run "npm run slice:build" first</li>
        </ul>
      `);
    }
  });
});

function startServer() {
  server = app.listen(PORT, () => {
    // Limpiar consola y mostrar banner de inicio
    console.clear();
    showWelcomeBanner();
    
    // Información del servidor
    console.log(`✅ Server running at ${'\x1b[36m'}http://localhost:${PORT}${'\x1b[0m'}`);
    console.log(`📂 Mode: ${'\x1b[32m'}${runMode}${'\x1b[0m'} (serving from ${'\x1b[33m'}/${folderDeployed}${'\x1b[0m'})`);
    console.log(`🔄 ${'\x1b[32m'}${runMode === 'production' ? 'Production' : 'Development'} mode${'\x1b[0m'}: serving from /${folderDeployed}`);
    console.log(`🛑 Press ${'\x1b[31m'}Ctrl+C${'\x1b[0m'} to stop\n`);
  });

  // Mostrar menú interactivo después de un momento
  setTimeout(showInteractiveMenu, 1500);
}

function showWelcomeBanner() {
  const modeLabel = runMode === 'production' ? 'Production' : 'Development';
  const banner = `
${'\x1b[36m'}╔══════════════════════════════════════════════════╗${'\x1b[0m'}
${'\x1b[36m'}║${'\x1b[0m'}              ${'\x1b[1m'}🍰 SLICE.JS SERVER${'\x1b[0m'}                ${'\x1b[36m'}║${'\x1b[0m'}
${'\x1b[36m'}║${'\x1b[0m'}            ${'\x1b[90m'}${modeLabel} Environment${'\x1b[0m'}                ${'\x1b[36m'}║${'\x1b[0m'}
${'\x1b[36m'}╚══════════════════════════════════════════════════╝${'\x1b[0m'}
`;
  console.log(banner);
}

async function showInteractiveMenu() {
  while (true) {
    try {
      console.log('\n' + '='.repeat(50));
      
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: '🎛️  Server Control Menu',
          choices: [
            '📊 Server Status',
            '🌐 Open in Browser',
            '🔄 Restart Server',
            '🛑 Stop Server'
          ]
        }
      ]);

      if (action === '📊 Server Status') {
        console.log(`\n📈 Server Status:`);
        console.log(`   🔗 URL: http://localhost:${PORT}`);
        console.log(`   📁 Mode: ${runMode}`);
        console.log(`   📂 Serving: /${folderDeployed}`);
        console.log(`   ⏰ Uptime: ${Math.floor(process.uptime())}s`);
      } else if (action === '🌐 Open in Browser') {
        const { default: open } = await import('open');
        await open(`http://localhost:${PORT}`);
        console.log('🌐 Opening browser...');
      } else if (action === '🛑 Stop Server') {
        console.log('\n🛑 Stopping server...');
        server.close(() => {
          console.log('✅ Server stopped successfully');
          process.exit(0);
        });
        break;
      } else if (action === '🔄 Restart Server') {
        console.log('\nRestarting server...');
        server.close(() => {
          console.log('Server stopped. Restarting...');
          startServer();
        });
        break;
      }
    } catch (error) {
      // Si hay error con inquirer, continuar sin menú
      console.log('\n💡 Interactive menu not available - Press Ctrl+C to stop');
      break;
    }
  }
}

// Manejar cierre del proceso
process.on('SIGINT', () => {
  console.log('\n🛑 Slice server stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Server terminated');
  process.exit(0);
});

// Iniciar servidor
startServer();

export default app;