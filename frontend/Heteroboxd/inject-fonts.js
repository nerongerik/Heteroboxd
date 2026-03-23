#!/usr/bin/env node
/**
 * inject-fonts.js — run after: npx expo export --platform web
 *
 * 1. Copies all TTF files to dist/fonts/ (no node_modules/@-scoped paths)
 * 2. Injects @font-face CSS pointing to /fonts/ into every dist HTML file
 * 3. Injects favicon <link> tags
 */

const fs   = require('fs');
const path = require('path');

const DIST      = path.join(__dirname, 'dist');
const FONTS_DIR = path.join(DIST, 'fonts');

function findTTF(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? findTTF(full) : e.name.endsWith('.ttf') ? [full] : [];
  });
}

function face(family, file, weight = 'normal', style = 'normal') {
  return `  @font-face {\n    font-family: '${family}';\n    src: url('/fonts/${file}') format('truetype');\n    font-weight: ${weight};\n    font-style: ${style};\n    font-display: swap;\n  }`;
}

const ICON_FAMILY = {
  AntDesign:'AntDesign', Entypo:'Entypo', EvilIcons:'EvilIcons',
  Feather:'Feather', FontAwesome:'FontAwesome',
  FontAwesome5_Brands:'FontAwesome5Brands-Regular',
  FontAwesome5_Regular:'FontAwesome5Free-Regular',
  FontAwesome5_Solid:'FontAwesome5Free-Solid',
  FontAwesome6_Brands:'FontAwesome6Brands-Regular',
  FontAwesome6_Regular:'FontAwesome6Free-Regular',
  FontAwesome6_Solid:'FontAwesome6Free-Solid',
  Fontisto:'Fontisto', Foundation:'Foundation', Ionicons:'Ionicons',
  MaterialCommunityIcons:'MaterialCommunityIcons', MaterialIcons:'MaterialIcons',
  Octicons:'Octicons', SimpleLineIcons:'SimpleLineIcons', Zocial:'Zocial',
};

const INTER_META = {
  '100Thin':              { family:'Inter_100Thin',              weight:100, style:'normal' },
  '100Thin_Italic':       { family:'Inter_100Thin_Italic',       weight:100, style:'italic' },
  '200ExtraLight':        { family:'Inter_200ExtraLight',        weight:200, style:'normal' },
  '200ExtraLight_Italic': { family:'Inter_200ExtraLight_Italic', weight:200, style:'italic' },
  '300Light':             { family:'Inter_300Light',             weight:300, style:'normal' },
  '300Light_Italic':      { family:'Inter_300Light_Italic',      weight:300, style:'italic' },
  '400Regular':           { family:'Inter_400Regular',           weight:400, style:'normal' },
  '400Regular_Italic':    { family:'Inter_400Regular_Italic',    weight:400, style:'italic' },
  '500Medium':            { family:'Inter_500Medium',            weight:500, style:'normal' },
  '500Medium_Italic':     { family:'Inter_500Medium_Italic',     weight:500, style:'italic' },
  '600SemiBold':          { family:'Inter_600SemiBold',          weight:600, style:'normal' },
  '600SemiBold_Italic':   { family:'Inter_600SemiBold_Italic',   weight:600, style:'italic' },
  '700Bold':              { family:'Inter_700Bold',              weight:700, style:'normal' },
  '700Bold_Italic':       { family:'Inter_700Bold_Italic',       weight:700, style:'italic' },
  '800ExtraBold':         { family:'Inter_800ExtraBold',         weight:800, style:'normal' },
  '800ExtraBold_Italic':  { family:'Inter_800ExtraBold_Italic',  weight:800, style:'italic' },
  '900Black':             { family:'Inter_900Black',             weight:900, style:'normal' },
  '900Black_Italic':      { family:'Inter_900Black_Italic',      weight:900, style:'italic' },
};

if (!fs.existsSync(DIST)) { console.error('✖ dist/ not found'); process.exit(1); }

console.log('🔤 inject-fonts: copying fonts to dist/fonts/...');
fs.mkdirSync(FONTS_DIR, { recursive: true });

const blocks = [];

// Inter
const interBase = path.join(DIST,'assets','node_modules','@expo-google-fonts','inter');
let n = 0;
for (const [dir, meta] of Object.entries(INTER_META)) {
  const files = findTTF(path.join(interBase, dir));
  if (!files.length) continue;
  const filename = path.basename(files[0]);
  fs.copyFileSync(files[0], path.join(FONTS_DIR, filename));
  blocks.push(face(meta.family, filename, meta.weight, meta.style));
  n++;
}
console.log(`  ✔ Inter: ${n} weights`);

// Vector icons
const iconBase = path.join(DIST,'assets','node_modules','@expo','vector-icons','build','vendor','react-native-vector-icons','Fonts');
let m = 0;
for (const file of findTTF(iconBase)) {
  const basename = path.basename(file);
  const family   = ICON_FAMILY[basename.split('.')[0]];
  if (!family) continue;
  fs.copyFileSync(file, path.join(FONTS_DIR, basename));
  blocks.push(face(family, basename));
  m++;
}
console.log(`  ✔ Icons: ${m} families`);

if (!blocks.length) { console.error('✖ No fonts found'); process.exit(1); }

const FONT_STYLE = `<style id="expo-font-injection">\n${blocks.join('\n')}\n</style>`;
const FAVICONS   = [
  `  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />`,
  `  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />`,
  `  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />`,
  `  <link rel="manifest" href="/site.webmanifest" />`,
].join('\n');

// Patch all HTML files in dist/
function findHTML(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !['assets','fonts','_expo'].includes(e.name)) return findHTML(full);
    return e.name.endsWith('.html') ? [full] : [];
  });
}

let patched = 0;
for (const f of findHTML(DIST)) {
  let html = fs.readFileSync(f, 'utf8');
  if (html.includes('expo-font-injection')) continue;
  html = html.replace('</head>', `${FONT_STYLE}\n</head>`);
  html = html.replace('<head>', `<head>\n${FAVICONS}`);
  fs.writeFileSync(f, html, 'utf8');
  patched++;
}
console.log(`✔ Patched ${patched} HTML files. Fonts served from /fonts/ — no @-scoped paths.`);