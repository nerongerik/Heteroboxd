#!/usr/bin/env node

const fs   = require('fs');
const path = require('path');

const DIST       = path.join(__dirname, 'dist');
const INDEX_HTML = path.join(DIST, 'index.html');

function findTTF(baseDir) {
  const results = [];
  if (!fs.existsSync(baseDir)) return results;
  for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
    const full = path.join(baseDir, entry.name);
    if (entry.isDirectory()) results.push(...findTTF(full));
    else if (entry.name.endsWith('.ttf')) results.push(full);
  }
  return results;
}

function toURL(absPath) {
  return '/' + path.relative(DIST, absPath).replace(/\\/g, '/');
}

const ICON_FAMILY = {
  AntDesign:                  'AntDesign',
  Entypo:                     'Entypo',
  EvilIcons:                  'EvilIcons',
  Feather:                    'Feather',
  FontAwesome:                'FontAwesome',
  FontAwesome5_Brands:        'FontAwesome5Brands-Regular',
  FontAwesome5_Regular:       'FontAwesome5Free-Regular',
  FontAwesome5_Solid:         'FontAwesome5Free-Solid',
  FontAwesome6_Brands:        'FontAwesome6Brands-Regular',
  FontAwesome6_Regular:       'FontAwesome6Free-Regular',
  FontAwesome6_Solid:         'FontAwesome6Free-Solid',
  Fontisto:                   'Fontisto',
  Foundation:                 'Foundation',
  Ionicons:                   'Ionicons',
  MaterialCommunityIcons:     'MaterialCommunityIcons',
  MaterialIcons:              'MaterialIcons',
  Octicons:                   'Octicons',
  SimpleLineIcons:            'SimpleLineIcons',
  Zocial:                     'Zocial',
};

const INTER_META = {
  '100Thin':              { family: 'Inter_100Thin',              weight: 100, style: 'normal' },
  '100Thin_Italic':       { family: 'Inter_100Thin_Italic',       weight: 100, style: 'italic' },
  '200ExtraLight':        { family: 'Inter_200ExtraLight',        weight: 200, style: 'normal' },
  '200ExtraLight_Italic': { family: 'Inter_200ExtraLight_Italic', weight: 200, style: 'italic' },
  '300Light':             { family: 'Inter_300Light',             weight: 300, style: 'normal' },
  '300Light_Italic':      { family: 'Inter_300Light_Italic',      weight: 300, style: 'italic' },
  '400Regular':           { family: 'Inter_400Regular',           weight: 400, style: 'normal' },
  '400Regular_Italic':    { family: 'Inter_400Regular_Italic',    weight: 400, style: 'italic' },
  '500Medium':            { family: 'Inter_500Medium',            weight: 500, style: 'normal' },
  '500Medium_Italic':     { family: 'Inter_500Medium_Italic',     weight: 500, style: 'italic' },
  '600SemiBold':          { family: 'Inter_600SemiBold',          weight: 600, style: 'normal' },
  '600SemiBold_Italic':   { family: 'Inter_600SemiBold_Italic',   weight: 600, style: 'italic' },
  '700Bold':              { family: 'Inter_700Bold',              weight: 700, style: 'normal' },
  '700Bold_Italic':       { family: 'Inter_700Bold_Italic',       weight: 700, style: 'italic' },
  '800ExtraBold':         { family: 'Inter_800ExtraBold',         weight: 800, style: 'normal' },
  '800ExtraBold_Italic':  { family: 'Inter_800ExtraBold_Italic',  weight: 800, style: 'italic' },
  '900Black':             { family: 'Inter_900Black',             weight: 900, style: 'normal' },
  '900Black_Italic':      { family: 'Inter_900Black_Italic',      weight: 900, style: 'italic' },
};


function buildFontFace(family, url, weight = 'normal', style = 'normal') {
  return [
    `  @font-face {`,
    `    font-family: '${family}';`,
    `    src: url('${url}') format('truetype');`,
    `    font-weight: ${weight};`,
    `    font-style: ${style};`,
    `    font-display: swap;`,
    `  }`,
  ].join('\n');
}

function buildCSS() {
  const blocks = [];

  const interBase = path.join(
    DIST, 'assets', 'node_modules', '@expo-google-fonts', 'inter'
  );
  let interFound = 0;
  for (const [dir, meta] of Object.entries(INTER_META)) {
    const files = findTTF(path.join(interBase, dir));
    if (files.length === 0) continue;
    blocks.push(buildFontFace(meta.family, toURL(files[0]), meta.weight, meta.style));
    interFound++;
  }
  if (interFound) console.log(`Inter: ${interFound} weights injected`);

  const iconBase = path.join(
    DIST, 'assets', 'node_modules', '@expo', 'vector-icons',
    'build', 'vendor', 'react-native-vector-icons', 'Fonts'
  );
  const iconFiles = findTTF(iconBase);
  let iconFound = 0;
  for (const file of iconFiles) {
    const basename = path.basename(file);
    const prefix   = basename.split('.')[0];
    const family   = ICON_FAMILY[prefix];
    if (!family) {
      console.warn(`Unknown icon font skipped: ${basename}`);
      continue;
    }
    blocks.push(buildFontFace(family, toURL(file)));
    iconFound++;
  }
  if (iconFound) console.log(`Vector icons: ${iconFound} families injected`);

  if (blocks.length === 0) {
    console.error('No font files found — did you run expo export first?');
    process.exit(1);
  }

  return `<style id="expo-font-injection">\n${blocks.join('\n')}\n</style>`;
}

const FAVICON_HTML = [
  `  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />`,
  `  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />`,
  `  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />`,
  `  <link rel="manifest" href="/site.webmanifest" />`,
].join('\n');

if (!fs.existsSync(INDEX_HTML)) {
  console.error(`${INDEX_HTML} not found — run "npx expo export --platform web" first.`);
  process.exit(1);
}

let html = fs.readFileSync(INDEX_HTML, 'utf8');

// Guard: don't double-inject
if (html.includes('expo-font-injection')) {
  console.log('Font injection already present — skipping (delete dist/ to re-inject).');
  process.exit(0);
}

console.log('inject-fonts: scanning dist/assets/...');

const css = buildCSS();

// Inject fonts just before </head>
if (!html.includes('</head>')) {
  console.error('Could not find </head> in dist/index.html');
  process.exit(1);
}
html = html.replace('</head>', `${css}\n</head>`);

// Inject favicons just after <head>
html = html.replace('<head>', `<head>\n${FAVICON_HTML}`);

fs.writeFileSync(INDEX_HTML, html, 'utf8');
console.log(`dist/index.html patched successfully.`);
console.log(`fonts + favicons injected`);