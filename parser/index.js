import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { parseMarkdownFile } from './lib/markdownParser.js';
import { writeComponentFiles } from './lib/generator.js';
import { collectDocCandidates } from './lib/report.js';
import { writeDocsIndex } from './lib/docsIndex.js';
import { generateMainRoutesFile } from './lib/routesSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const MARKDOWN_DIR = path.join(ROOT, 'src', 'markdown');
const OUTPUT_DIR = path.join(ROOT, 'src', 'Components', 'DocumentationPages');
const APP_COMPONENTS_DIR = path.join(ROOT, 'src', 'Components', 'AppComponents');
const COMPONENTS_REGISTRY_PATH = path.join(ROOT, 'src', 'Components', 'components.js');
const DOCS_INDEX_PATH = path.join(ROOT, 'src', 'Components', 'AppComponents', 'ComponentsPage', 'docsIndex.js');
const DOCUMENTATION_ROUTES_PATH = path.join(ROOT, 'src', 'Components', 'AppComponents', 'ComponentsPage', 'documentationRoutes.generated.js');
const FLAT_DOC_ROUTES_PATH = path.join(ROOT, 'src', 'Components', 'AppComponents', 'ComponentsPage', 'docRoutes.generated.js');
const MAIN_ROUTES_PATH = path.join(ROOT, 'src', 'routes.js');
const REPORT_PATH = path.join(ROOT, 'parser', 'report.json');

const REQUIRED_FRONT_MATTER = ['title', 'route', 'section', 'group', 'order', 'component'];

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const readAllMarkdownFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...readAllMarkdownFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
};

const readAllGeneratedDocs = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...readAllGeneratedDocs(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push({ filePath: fullPath, content: fs.readFileSync(fullPath, 'utf8') });
    }
  }

  return files;
};

const parseArgs = (args) => {
  return {
    lintOnly: args.includes('--lint-only'),
    syncOnly: args.includes('--sync-only')
  };
};

const parseRegistryObject = (fileContent) => {
  const match = fileContent.match(/const components = ({[\s\S]*?});/);
  if (!match) {
    throw new Error('Invalid components.js format. Expected: const components = { ... };');
  }
  return JSON.parse(match[1]);
};

const serializeRegistryObject = (components) => {
  const sorted = Object.keys(components)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = components[key];
      return acc;
    }, {});

  return `const components = ${JSON.stringify(sorted, null, 2)};\n\nexport default components;\n`;
};

const validateFrontMatter = (frontMatter, filePath) => {
  const errors = [];
  if (!frontMatter) {
    errors.push(`[${filePath}] Missing front matter block`);
    return errors;
  }

  for (const key of REQUIRED_FRONT_MATTER) {
    if (!frontMatter[key] || String(frontMatter[key]).trim() === '') {
      errors.push(`[${filePath}] Missing required front matter field: ${key}`);
    }
  }

  const parsedOrder = Number(frontMatter.order);
  if (!Number.isFinite(parsedOrder)) {
    errors.push(`[${filePath}] front matter field "order" must be a number`);
  }

  return errors;
};

const lintMarkdownSourceForManualPropsTable = (markdownSource, filePath) => {
  if (!markdownSource || typeof markdownSource !== 'string') {
    return [];
  }

  const hasApiHeading = /(^|\n)##\s+API\s*(\n|$)/i.test(markdownSource);
  const hasPropHeader = /(^|\n)\|\s*Prop\s*\|\s*Type\s*\|(?:\s*Required\s*\|)?\s*Default\s*\|/i.test(markdownSource);

  if (!hasApiHeading || !hasPropHeader) {
    return [];
  }

  return [
    `[${filePath}] Manual props table detected. Remove it and rely on "Props (Generated from static props)".`
  ];
};

const buildRoutesTree = (entries) => {
  const sectionsMap = new Map();
  const routeSet = new Set();
  const defaultRoute = '/docs';

  for (const entry of entries) {
    const routeKey = `${entry.route}::${entry.component}`;
    if (routeSet.has(routeKey)) {
      continue;
    }
    routeSet.add(routeKey);

    const sectionKey = entry.section || 'General';
    const groupKey = entry.group || 'Pages';
    if (!sectionsMap.has(sectionKey)) {
      sectionsMap.set(sectionKey, new Map());
    }
    const groups = sectionsMap.get(sectionKey);
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push({
      title: entry.navLabel || entry.title,
      path: entry.route,
      component: entry.component,
      order: Number(entry.order) || 0
    });
  }

  const sections = [];
  for (const [sectionName, groups] of sectionsMap.entries()) {
    const sectionItems = [];
    for (const [, items] of groups.entries()) {
      items.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
      sectionItems.push(...items.map(({ order, ...rest }) => rest));
    }
    sections.push({
      key: sectionName,
      title: sectionName,
      path: `/docs/${sectionName.toLowerCase().replace(/\s+/g, '-')}`,
      items: sectionItems
    });
  }

  sections.sort((a, b) => a.title.localeCompare(b.title));

  return {
    defaultRoute,
    sections
  };
};

const generateDocumentationRoutesFile = (entries) => {
  const tree = buildRoutesTree(entries);
  const defaultComponent = 'DocumentationLibraryHome';

  const lines = [];
  lines.push('// Auto-generated by parser/index.js. Do not edit manually.');
  lines.push('const documentationRoutes = {');
  lines.push('  defaultRoute: {');
  lines.push(`    path: '${tree.defaultRoute}',`);
  lines.push(`    component: '${defaultComponent}',`);
  lines.push("    title: 'Documentation'" );
  lines.push('  },');
  for (const section of tree.sections) {
    const key = section.key.replace(/[^a-zA-Z0-9]/g, '');
    lines.push(`  ${key}: {`);
    lines.push(`    title: '${section.title.replace(/'/g, "\\'")}',`);
    lines.push(`    path: '${section.path}',`);
    lines.push('    items: [');
    for (const item of section.items) {
      lines.push('      {');
      lines.push(`        title: '${item.title.replace(/'/g, "\\'")}',`);
      lines.push(`        path: '${item.path.replace(/'/g, "\\'")}',`);
      lines.push(`        component: '${item.component.replace(/'/g, "\\'")}'`);
      lines.push('      },');
    }
    lines.push('    ]');
    lines.push('  },');
  }
  lines.push('};');
  lines.push('');
  lines.push('export default documentationRoutes;');
  lines.push('');
  return lines.join('\n');
};

const generateFlatDocRoutesFile = (entries) => {
  const defaultComponent = 'DocumentationLibraryHome';
  const flatRoutes = [{ path: '/docs', component: defaultComponent }];

  const seen = new Set();
  for (const entry of entries) {
    const routeKey = `${entry.route}::${entry.component}`;
    if (seen.has(routeKey)) continue;
    seen.add(routeKey);
    flatRoutes.push({
      path: entry.route,
      component: entry.component
    });
  }

  const lines = [];
  lines.push('// Auto-generated by parser/index.js. Do not edit manually.');
  lines.push('// Flat route-to-component mappings for bundle analyzer.');
  lines.push('const docRoutes = [');
  for (const route of flatRoutes) {
    lines.push(`  { path: '${route.path.replace(/'/g, "\\'")}', component: '${route.component.replace(/'/g, "\\'")}' },`);
  }
  lines.push('];');
  lines.push('');
  lines.push('export default docRoutes;');
  lines.push('');
  return lines.join('\n');
};

const mergeComponentsRegistry = (existingRegistry, generatedComponents) => {
  const merged = { ...existingRegistry };
  for (const componentName of generatedComponents) {
    merged[componentName] = 'DocumentationPages';
  }
  merged.CopyMarkdownMenu = 'AppComponents';
  return merged;
};

const syncComponentsRegistry = (generatedComponents) => {
  const registryContent = fs.readFileSync(COMPONENTS_REGISTRY_PATH, 'utf8');
  const existingRegistry = parseRegistryObject(registryContent);
  const mergedRegistry = mergeComponentsRegistry(existingRegistry, generatedComponents);
  const output = serializeRegistryObject(mergedRegistry);
  fs.writeFileSync(COMPONENTS_REGISTRY_PATH, output, 'utf8');
};

const syncCopyMarkdownMenu = () => {
  const sourcePath = path.join(ROOT, 'parser', 'templates', 'CopyMarkdownMenu');
  const targetPath = path.join(APP_COMPONENTS_DIR, 'CopyMarkdownMenu');

  ensureDir(targetPath);
  const files = ['CopyMarkdownMenu.js', 'CopyMarkdownMenu.html', 'CopyMarkdownMenu.css'];
  for (const fileName of files) {
    fs.copyFileSync(path.join(sourcePath, fileName), path.join(targetPath, fileName));
  }
};

const syncGlobalStyles = () => {
  const sourceFile = path.join(ROOT, 'parser', 'templates', 'DocumentationBase.css');
  const targetFile = path.join(ROOT, 'src', 'Styles', 'DocumentationBase.css');
  fs.copyFileSync(sourceFile, targetFile);
};

const run = () => {
  const options = parseArgs(process.argv.slice(2));

  ensureDir(path.dirname(REPORT_PATH));

  const markdownFiles = readAllMarkdownFiles(MARKDOWN_DIR);
  console.log(`Found ${markdownFiles.length} markdown files in src/markdown`);

  const generated = [];
  const indexEntries = [];
  const validationErrors = [];

  for (const markdownFilePath of markdownFiles) {
    const relativePath = path.relative(ROOT, markdownFilePath).replace(/\\/g, '/');
    const baseName = path.basename(markdownFilePath);
    if (baseName.startsWith('_')) {
      continue;
    }
    try {
      const parsed = parseMarkdownFile(markdownFilePath, { projectRoot: ROOT });
      const errors = validateFrontMatter(parsed.frontMatter, relativePath);
      if (errors.length > 0) {
        validationErrors.push(...errors);
        continue;
      }

      validationErrors.push(
        ...lintMarkdownSourceForManualPropsTable(parsed.frontMatter?.markdownSource || '', relativePath)
      );
      if (validationErrors.length > 0) {
        continue;
      }

      const generateFlag = parsed.frontMatter.generate;
      const isGenerateFalse = generateFlag === false || String(generateFlag).toLowerCase() === 'false';
      if (isGenerateFalse) {
        indexEntries.push(parsed.frontMatter);
        continue;
      }

      indexEntries.push(parsed.frontMatter);

      if (!options.lintOnly && !options.syncOnly) {
        const markdownPath = path.relative(MARKDOWN_DIR, markdownFilePath).replace(/\\/g, '/');
        const result = writeComponentFiles(parsed, OUTPUT_DIR, markdownPath);
        generated.push({ filePath: relativePath, component: result.componentClass });
      } else {
        generated.push({ filePath: relativePath, component: parsed.frontMatter.component });
      }
    } catch (error) {
      validationErrors.push(`[${relativePath}] ${error.message}`);
    }
  }

  if (validationErrors.length > 0) {
    console.error('Markdown validation failed:');
    for (const error of validationErrors) {
      console.error(`- ${error}`);
    }
    const reportPayload = {
      generated,
      validationErrors,
      markdownCandidates: [],
      requiresCustomBlocks: []
    };
    fs.writeFileSync(REPORT_PATH, JSON.stringify(reportPayload, null, 2), 'utf8');
    process.exit(1);
  }

  if (!options.lintOnly) {
    syncCopyMarkdownMenu();
    syncGlobalStyles();
    ensureDir(path.dirname(DOCS_INDEX_PATH));
    writeDocsIndex(indexEntries, DOCS_INDEX_PATH);

    const routesContent = generateDocumentationRoutesFile(indexEntries);
    fs.writeFileSync(DOCUMENTATION_ROUTES_PATH, routesContent, 'utf8');

    const flatRoutesContent = generateFlatDocRoutesFile(indexEntries);
    fs.writeFileSync(FLAT_DOC_ROUTES_PATH, flatRoutesContent, 'utf8');

    const mainRoutesContent = generateMainRoutesFile(indexEntries);
    fs.writeFileSync(MAIN_ROUTES_PATH, mainRoutesContent, 'utf8');

    const generatedComponentNames = generated.map((entry) => entry.component);
    syncComponentsRegistry(generatedComponentNames);
  }

  const docs = readAllGeneratedDocs(OUTPUT_DIR);
  const report = collectDocCandidates(docs);
  const reportPayload = {
    generated,
    validationErrors,
    ...report
  };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(reportPayload, null, 2), 'utf8');

  if (options.lintOnly) {
    console.log('Markdown lint completed successfully.');
  } else if (options.syncOnly) {
    console.log('Registry sync completed successfully.');
  } else {
    console.log('Documentation pages generated successfully.');
  }
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  run();
}

export { validateFrontMatter, mergeComponentsRegistry, lintMarkdownSourceForManualPropsTable, generateMainRoutesFile };
