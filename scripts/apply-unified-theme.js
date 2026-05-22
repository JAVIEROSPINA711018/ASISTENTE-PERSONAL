// scripts/apply-unified-theme.js
import fs from 'fs';
import path from 'path';

const viewsDir = './src/views';
const appFile = './src/App.jsx';

// 1. Process src/App.jsx
console.log('Processing src/App.jsx...');
let appContent = fs.readFileSync(appFile, 'utf8');

// We want to replace the local const LIGHT and const DARK definitions in src/App.jsx
// It starts around "const LIGHT = {" and ends after "const DARK = { ... };"
const appThemeRegex = /const LIGHT\s*=\s*\{[\s\S]*?\};\s*const DARK\s*=\s*\{[\s\S]*?\};/;
if (appThemeRegex.test(appContent)) {
  appContent = appContent.replace(appThemeRegex, 'import { LIGHT, DARK } from "./lib/theme.js";');
  fs.writeFileSync(appFile, appContent, 'utf8');
  console.log('Successfully updated src/App.jsx to use unified theme!');
} else {
  console.log('Could not find theme block in src/App.jsx, skipping or manually check');
}

// 2. Process all view files in src/views
const files = fs.readdirSync(viewsDir);
files.forEach(file => {
  if (!file.endsWith('.jsx') || file.endsWith('.bak')) return;
  const filePath = path.join(viewsDir, file);
  console.log(`Processing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');

  // We want to match:
  // const LIGHT_X = { ... };
  // const DARK_X = { ... };
  // or const LIGHT = { ... };
  // const DARK = { ... };
  const themeRegex = /const (LIGHT(_[A-Z])?)\s*=\s*\{[\s\S]*?\};\s*const (DARK(_[A-Z])?)\s*=\s*\{[\s\S]*?\};/;
  
  const match = content.match(themeRegex);
  if (match) {
    const lightVar = match[1]; // e.g. LIGHT, LIGHT_C, LIGHT_F
    const darkVar = match[3];  // e.g. DARK, DARK_C, DARK_F
    console.log(`Found theme variables: ${lightVar} / ${darkVar}`);

    // Generate replacement import statement
    let importStmt = '';
    if (lightVar === 'LIGHT' && darkVar === 'DARK') {
      importStmt = 'import { LIGHT, DARK } from "../lib/theme.js";';
    } else {
      importStmt = `import { LIGHT as ${lightVar}, DARK as ${darkVar} } from "../lib/theme.js";`;
    }

    content = content.replace(themeRegex, importStmt);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully updated ${file} to import unified theme!`);
  } else {
    console.log(`Could not find theme pattern in ${file}`);
  }
});

console.log('Unified theme application script complete!');
