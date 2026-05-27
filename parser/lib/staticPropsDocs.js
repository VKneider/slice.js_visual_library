import fs from 'fs';
import path from 'path';

const parseRegistryObject = (fileContent) => {
  const match = fileContent.match(/const components = ({[\s\S]*?});/);
  if (!match) {
    throw new Error('Invalid components.js format. Expected: const components = { ... };');
  }
  return JSON.parse(match[1]);
};

const readCategoryPathFromConfig = (configPath, category) => {
  const raw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(raw);
  const categoryEntry = config?.paths?.components?.[category];
  if (!categoryEntry || !categoryEntry.path) {
    return null;
  }
  return categoryEntry.path.replace(/^[/\\]+/, '');
};

const isIdentifierStart = (char) => /[A-Za-z_$]/.test(char);
const isIdentifierPart = (char) => /[A-Za-z0-9_$]/.test(char);

const skipWhitespace = (source, state) => {
  while (state.index < source.length && /\s/.test(source[state.index])) {
    state.index += 1;
  }
};

const readIdentifier = (source, state) => {
  const start = state.index;
  if (!isIdentifierStart(source[state.index])) return null;
  state.index += 1;
  while (state.index < source.length && isIdentifierPart(source[state.index])) {
    state.index += 1;
  }
  return source.slice(start, state.index);
};

const readString = (source, state) => {
  const quote = source[state.index];
  if (quote !== '"' && quote !== "'") return null;
  state.index += 1;
  let out = '';

  while (state.index < source.length) {
    const ch = source[state.index];
    if (ch === '\\') {
      const next = source[state.index + 1];
      out += next || '';
      state.index += 2;
      continue;
    }
    if (ch === quote) {
      state.index += 1;
      return out;
    }
    out += ch;
    state.index += 1;
  }

  throw new Error('Unterminated string literal');
};

const readNumber = (source, state) => {
  const start = state.index;
  if (source[state.index] === '-') state.index += 1;

  let hasDigits = false;
  while (state.index < source.length && /\d/.test(source[state.index])) {
    hasDigits = true;
    state.index += 1;
  }

  if (source[state.index] === '.') {
    state.index += 1;
    while (state.index < source.length && /\d/.test(source[state.index])) {
      hasDigits = true;
      state.index += 1;
    }
  }

  if (!hasDigits) {
    state.index = start;
    return null;
  }

  return Number(source.slice(start, state.index));
};

const readLiteralKeyword = (source, state) => {
  if (source.startsWith('true', state.index)) {
    state.index += 4;
    return true;
  }
  if (source.startsWith('false', state.index)) {
    state.index += 5;
    return false;
  }
  if (source.startsWith('null', state.index)) {
    state.index += 4;
    return null;
  }
  return undefined;
};

const parseArray = (source, state) => {
  if (source[state.index] !== '[') {
    throw new Error('Expected array start');
  }
  state.index += 1;
  const values = [];

  while (state.index < source.length) {
    skipWhitespace(source, state);
    if (source[state.index] === ']') {
      state.index += 1;
      return values;
    }

    values.push(parseValue(source, state));
    skipWhitespace(source, state);

    if (source[state.index] === ',') {
      state.index += 1;
      continue;
    }

    if (source[state.index] === ']') {
      state.index += 1;
      return values;
    }

    throw new Error('Expected , or ] in array');
  }

  throw new Error('Unterminated array literal');
};

const parseObject = (source, state) => {
  if (source[state.index] !== '{') {
    throw new Error('Expected object start');
  }
  state.index += 1;
  const out = {};

  while (state.index < source.length) {
    skipWhitespace(source, state);
    if (source[state.index] === '}') {
      state.index += 1;
      return out;
    }

    let key;
    if (source[state.index] === '"' || source[state.index] === "'") {
      key = readString(source, state);
    } else {
      key = readIdentifier(source, state);
    }

    if (!key) {
      throw new Error('Expected object key');
    }

    skipWhitespace(source, state);
    if (source[state.index] !== ':') {
      throw new Error('Expected : after object key');
    }
    state.index += 1;

    out[key] = parseValue(source, state);
    skipWhitespace(source, state);

    if (source[state.index] === ',') {
      state.index += 1;
      continue;
    }

    if (source[state.index] === '}') {
      state.index += 1;
      return out;
    }

    throw new Error('Expected , or } in object');
  }

  throw new Error('Unterminated object literal');
};

function parseValue(source, state) {
  skipWhitespace(source, state);

  if (source[state.index] === '{') return parseObject(source, state);
  if (source[state.index] === '[') return parseArray(source, state);
  if (source[state.index] === '"' || source[state.index] === "'") return readString(source, state);

  const number = readNumber(source, state);
  if (number !== null) return number;

  const literal = readLiteralKeyword(source, state);
  if (literal !== undefined) return literal;

  const identifier = readIdentifier(source, state);
  if (identifier) return identifier;

  throw new Error(`Unsupported value near index ${state.index}`);
}

const extractStaticPropsObjectSource = (source) => {
  const marker = 'static props =';
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) return null;

  const openIndex = source.indexOf('{', markerIndex + marker.length);
  if (openIndex === -1) return null;

  let depth = 0;
  let inString = false;
  let quote = '';

  for (let i = openIndex; i < source.length; i += 1) {
    const ch = source[i];

    if (inString) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === quote) {
        inString = false;
        quote = '';
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      quote = ch;
      continue;
    }

    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openIndex, i + 1);
      }
    }
  }

  return null;
};

const normalizePropConfig = (rawConfig) => {
  if (!rawConfig || typeof rawConfig !== 'object' || Array.isArray(rawConfig)) {
    return { type: 'any', required: false };
  }

  const config = {
    type: typeof rawConfig.type === 'string' ? rawConfig.type.toLowerCase() : 'any',
    required: rawConfig.required === true
  };

  if (rawConfig.default !== undefined) {
    config.default = rawConfig.default;
  }

  if (Array.isArray(rawConfig.allowedValues) && rawConfig.allowedValues.length > 0) {
    config.allowedValues = rawConfig.allowedValues;
  }

  if (rawConfig.schema && typeof rawConfig.schema === 'object' && !Array.isArray(rawConfig.schema)) {
    const schema = {};
    Object.entries(rawConfig.schema).forEach(([name, nested]) => {
      schema[name] = normalizePropConfig(nested);
    });
    config.schema = schema;
  }

  if (rawConfig.items && typeof rawConfig.items === 'object' && !Array.isArray(rawConfig.items)) {
    config.items = normalizePropConfig(rawConfig.items);
  }

  return config;
};

const extractStaticPropsFromSource = (source) => {
  const objectSource = extractStaticPropsObjectSource(source);
  if (!objectSource) return null;

  try {
    const state = { index: 0 };
    const raw = parseObject(objectSource, state);
    const props = {};
    Object.entries(raw || {}).forEach(([name, value]) => {
      props[name] = normalizePropConfig(value);
    });
    return Object.keys(props).length > 0 ? props : null;
  } catch {
    return null;
  }
};

const inferSourceComponentName = (docComponentName) => {
  if (!docComponentName) return '';
  if (docComponentName.endsWith('Documentation')) {
    return docComponentName.slice(0, -'Documentation'.length);
  }
  return docComponentName;
};

const toCellLiteral = (value) => {
  if (value === undefined) return '-';
  if (typeof value === 'string') return `\`${value}\``;
  if (value === null) return '`null`';
  return `\`${String(value)}\``;
};

const toAllowedValuesCell = (allowedValues) => {
  if (!Array.isArray(allowedValues) || allowedValues.length === 0) {
    return '-';
  }
  return allowedValues.map((value) => toCellLiteral(value)).join(', ');
};

const toSchemaDetailsBlock = (propPath, schema) => {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return '';
  }

  return [
    `:::details title="Schema: ${propPath}"`,
    '```json',
    JSON.stringify(schema, null, 2),
    '```',
    ':::',
    ''
  ].join('\n');
};

const buildStaticPropsSectionFromProps = (props) => {
  const rows = [];

  const collectRows = (name, meta, basePath = '') => {
    const fullPath = basePath ? `${basePath}.${name}` : name;

    if (meta?.type === 'object' && meta.schema && typeof meta.schema === 'object') {
      rows.push({ path: fullPath, meta, isObjectRoot: true });
      const keys = Object.keys(meta.schema);
      if (keys.length === 0) {
        return;
      }
      keys.forEach((key) => collectRows(key, meta.schema[key], fullPath));
      return;
    }

    if (meta?.type === 'array' && meta.items && typeof meta.items === 'object') {
      rows.push({ path: fullPath, meta, isArrayRoot: true });
      if (meta.items.type === 'object' && meta.items.schema && typeof meta.items.schema === 'object') {
        Object.keys(meta.items.schema).forEach((key) => collectRows(key, meta.items.schema[key], `${fullPath}[]`));
        return;
      }
      rows.push({ path: `${fullPath}[]`, meta: meta.items });
      return;
    }

    rows.push({ path: fullPath, meta: meta || {} });
  };

  Object.keys(props || {}).forEach((propName) => {
    collectRows(propName, props[propName]);
  });

  if (rows.length === 0) {
    return '';
  }

  const propsData = rows.map(({ path: propPath, meta }) => ({
    path: propPath,
    type: meta.type || 'any',
    required: meta.required === true,
    default: meta.default !== undefined ? String(meta.default) : null,
    allowedValues: Array.isArray(meta.allowedValues) && meta.allowedValues.length > 0
      ? meta.allowedValues.map(v => String(v))
      : []
  }));

  const propsJson = JSON.stringify({ props: propsData });

  const lines = [];
  lines.push(':::component name="PropsTable"');
  lines.push(propsJson);
  lines.push(':::');

  const schemaDetailsBlocks = rows
    .filter((row) => row.isObjectRoot && row.meta?.schema)
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((row) => toSchemaDetailsBlock(row.path, row.meta.schema))
    .filter(Boolean);

  if (schemaDetailsBlocks.length > 0) {
    lines.push(...schemaDetailsBlocks);
  }

  return lines.join('\n');
};

const buildStaticPropsSectionForFrontMatter = ({ projectRoot, frontMatter }) => {
  const docsComponentName = frontMatter?.component;
  if (!docsComponentName) {
    return '';
  }

  const sourceComponentName = inferSourceComponentName(docsComponentName);
  if (!sourceComponentName || sourceComponentName === docsComponentName) {
    return '';
  }

  const registryPath = path.join(projectRoot, 'src', 'Components', 'components.js');
  const configPath = path.join(projectRoot, 'src', 'sliceConfig.json');

  if (!fs.existsSync(registryPath) || !fs.existsSync(configPath)) {
    return '';
  }

  const registryContent = fs.readFileSync(registryPath, 'utf8');
  const registryMap = parseRegistryObject(registryContent);
  const category = registryMap[sourceComponentName];
  if (!category) {
    return '';
  }

  const categoryPath = readCategoryPathFromConfig(configPath, category);
  if (!categoryPath) {
    return '';
  }

  const componentFile = path.join(projectRoot, 'src', categoryPath, sourceComponentName, `${sourceComponentName}.js`);
  if (!fs.existsSync(componentFile)) {
    return '';
  }

  const source = fs.readFileSync(componentFile, 'utf8');
  const props = extractStaticPropsFromSource(source);
  if (!props) {
    return '';
  }

  return buildStaticPropsSectionFromProps(props);
};

export {
  buildStaticPropsSectionForFrontMatter,
  buildStaticPropsSectionFromProps,
  extractStaticPropsFromSource
};
