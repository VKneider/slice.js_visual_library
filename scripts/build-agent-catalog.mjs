import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const MARKDOWN_DIR = path.join(ROOT, 'src', 'markdown');
const REGISTRY_PATH = path.join(ROOT, 'src', 'Components', 'components.js');
const PACKAGE_PATH = path.join(ROOT, 'package.json');
const OUTPUT_PATH = path.join(ROOT, 'agent', 'docs-manifest.json');

const DEFAULT_REPOSITORY = 'VKneider/slicejs-components';
const DEFAULT_RAW_BASE_URL = 'https://raw.githubusercontent.com/VKneider/slicejs-components';

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(',')
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  return trimmed.replace(/^['"]|['"]$/g, '');
}

function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return null;

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    data[key] = parseScalar(line.slice(separator + 1));
  }

  return data;
}

function readMarkdownFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...readMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function readRegistry() {
  const source = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const match = source.match(/const components = ({[\s\S]*?});/);
  if (!match) throw new Error('Could not parse src/Components/components.js');
  return JSON.parse(match[1]);
}

function getComponentName(frontMatter, registry) {
  const generatedName = String(frontMatter.component || '');
  const candidate = generatedName.replace(/Documentation$/, '');
  return registry[candidate] === 'Visual' || registry[candidate] === 'Service'
    ? candidate
    : null;
}

function getKind(componentName, registry) {
  return componentName ? registry[componentName] : 'Documentation';
}

function getRevision() {
  // Keep local and PR generation deterministic. Release automation can provide
  // an immutable tag or commit explicitly through SLICE_DOCS_REVISION.
  return process.env.SLICE_DOCS_REVISION || 'master';
}

function buildDocument(filePath, registry, revision, rawBaseUrl) {
  const relativePath = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const source = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const frontMatter = parseFrontMatter(source);
  if (!frontMatter || !frontMatter.title || !frontMatter.component) return null;

  const sourcePath = relativePath;
  const id = sourcePath.replace(/^src\/markdown\//, '').replace(/\.md$/i, '');
  const component = getComponentName(frontMatter, registry);

  return {
    id,
    title: String(frontMatter.title),
    kind: getKind(component, registry),
    ...(component ? { component } : {}),
    sourcePath,
    route: frontMatter.route || null,
    section: frontMatter.section || null,
    group: frontMatter.group || null,
    order: Number.isFinite(Number(frontMatter.order)) ? Number(frontMatter.order) : 0,
    description: frontMatter.description || '',
    tags: Array.isArray(frontMatter.tags) ? frontMatter.tags : [],
    rawUrl: `${rawBaseUrl}/${revision}/${sourcePath}`
  };
}

function buildManifest() {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
  const registry = readRegistry();
  const revision = getRevision();
  const rawBaseUrl = process.env.SLICE_COMPONENTS_RAW_BASE_URL || DEFAULT_RAW_BASE_URL;
  const documents = readMarkdownFiles(MARKDOWN_DIR)
    .filter((filePath) => !path.basename(filePath).startsWith('_'))
    .map((filePath) => buildDocument(filePath, registry, revision, rawBaseUrl))
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    schemaVersion: 1,
    catalog: 'slicejs-components',
    displayName: 'Slice.js Components',
    version: packageJson.version,
    revision,
    repository: DEFAULT_REPOSITORY,
    rawBaseUrl,
    documents
  };
}

const manifest = buildManifest();
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Wrote ${path.relative(ROOT, OUTPUT_PATH)} (${manifest.documents.length} documents)`);
