#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to fix import paths in a file
function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix @/components imports
  const componentImports = content.match(/@\/components\/[\w\-\/]+/g);
  if (componentImports) {
    componentImports.forEach(importPath => {
      const relativePath = getRelativePath(filePath, importPath.replace('@/', 'client/src/'));
      content = content.replace(importPath, relativePath);
      modified = true;
    });
  }

  // Fix @/hooks imports
  const hookImports = content.match(/@\/hooks\/[\w\-\/]+/g);
  if (hookImports) {
    hookImports.forEach(importPath => {
      const relativePath = getRelativePath(filePath, importPath.replace('@/', 'client/src/'));
      content = content.replace(importPath, relativePath);
      modified = true;
    });
  }

  // Fix @/lib imports
  const libImports = content.match(/@\/lib\/[\w\-\/]+/g);
  if (libImports) {
    libImports.forEach(importPath => {
      const relativePath = getRelativePath(filePath, importPath.replace('@/', 'client/src/'));
      content = content.replace(importPath, relativePath);
      modified = true;
    });
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
}

// Function to calculate relative path
function getRelativePath(fromFile, toPath) {
  const fromDir = path.dirname(fromFile);
  const targetPath = path.resolve(toPath);
  const relativePath = path.relative(fromDir, targetPath);
  
  // Ensure the path starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    return './' + relativePath;
  }
  return relativePath;
}

// Find all TypeScript/React files
const files = [
  ...glob.sync('client/src/**/*.ts'),
  ...glob.sync('client/src/**/*.tsx')
];

console.log(`Processing ${files.length} files...`);

files.forEach(fixImportsInFile);

console.log('Import fixing complete!');