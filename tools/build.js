#!/usr/bin/env node
/**
 * @file Empaqueta el juego en un único archivo HTML: `dist/SuperPaco.html`.
 *
 * ¿Por qué hace falta? El código está repartido en módulos ES (`import`/`export`),
 * pero los navegadores no cargan módulos al abrir un archivo con doble clic
 * (protocolo file://). Este script los une en un solo `<script>` para que el
 * juego funcione sin servidor en cualquier Mac o PC con Windows.
 *
 * Cómo funciona (sin dependencias externas):
 *   1. Parte de `src/main.js` y sigue los `import` para encontrar todos los módulos.
 *   2. Los ordena para que cada módulo vaya después de los que usa.
 *   3. Envuelve cada módulo en una función aislada que devuelve lo que exporta,
 *      y cambia cada `import { a } from './x.js'` por una lectura de ese objeto.
 *   4. Inserta el resultado y los estilos en la plantilla `src/page.html`.
 *
 * Convenciones que exige (y comprueba) el empaquetador:
 *   - Solo importaciones con nombre: `import { a, b } from './ruta.js';`
 *     (sin `import x from`, sin `import * as` y sin alias `as`).
 *   - Solo exportaciones en la declaración: `export const/function/class Nombre`.
 *   - Sin dependencias circulares.
 *
 * Uso:
 *   node tools/build.js                          → genera dist/SuperPaco.html
 *   node tools/build.js --fragment salida.html   → además, una versión sin
 *                                                  <html>/<head> para incrustar
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY_MODULE_PATH = join(PROJECT_ROOT, 'src', 'main.js');
const PAGE_TEMPLATE_PATH = join(PROJECT_ROOT, 'src', 'page.html');
const STYLESHEET_PATH = join(PROJECT_ROOT, 'src', 'styles.css');
const OUTPUT_PATH = join(PROJECT_ROOT, 'dist', 'SuperPaco.html');

const STYLES_PLACEHOLDER = /<!-- @styles[^>]*-->/;
const SCRIPT_PLACEHOLDER = /<!-- @script[^>]*-->/;
const NAMED_IMPORT_STATEMENT = /^import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?[ \t]*$/gm;
const ANY_IMPORT_STATEMENT = /^import\s/gm;
const EXPORTED_DECLARATION = /^export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/gm;
const EXPORT_KEYWORD_AT_LINE_START = /^export\s+/gm;

/**
 * @typedef {Object} SourceModule
 * @property {string} absolutePath
 * @property {string} relativePath Ruta respecto a la raíz del proyecto (para mensajes).
 * @property {string} source Código original.
 * @property {{names: string[], absolutePath: string}[]} imports
 * @property {string[]} exportedNames
 */

/**
 * Lanza un error con la ruta del módulo para que sea fácil de localizar.
 * @param {string} relativePath
 * @param {string} message
 */
function failInModule(relativePath, message) {
  throw new Error(`[build] ${relativePath}: ${message}`);
}

/**
 * Lee un módulo y analiza sus importaciones y exportaciones.
 * @param {string} absolutePath
 * @returns {SourceModule}
 */
function readSourceModule(absolutePath) {
  const relativePath = relative(PROJECT_ROOT, absolutePath);
  const source = readFileSync(absolutePath, 'utf8');

  const imports = [];
  for (const match of source.matchAll(NAMED_IMPORT_STATEMENT)) {
    const names = match[1].split(',').map(name => name.trim()).filter(Boolean);
    if (names.some(name => /\sas\s/.test(name))) failInModule(relativePath, `alias "as" no soportado en: ${match[0]}`);
    imports.push({ names, absolutePath: resolve(dirname(absolutePath), match[2]) });
  }
  const importStatementCount = (source.match(ANY_IMPORT_STATEMENT) || []).length;
  if (importStatementCount !== imports.length) failInModule(relativePath, 'solo se admiten importaciones con nombre: import { a } from "./x.js"');
  if (/^export\s+(default|\{|\*)/m.test(source)) failInModule(relativePath, 'solo se admite "export const/function/class Nombre"');

  const exportedNames = [...source.matchAll(EXPORTED_DECLARATION)].map(match => match[1]);
  return { absolutePath, relativePath, source, imports, exportedNames };
}

/**
 * Recorre las importaciones desde el módulo de entrada y devuelve todos los
 * módulos ordenados de forma que cada uno aparece después de sus dependencias.
 * @param {string} entryPath
 * @returns {SourceModule[]}
 */
function collectModulesInDependencyOrder(entryPath) {
  const orderedModules = [];
  const modulesByPath = new Map();
  const pathsBeingVisited = new Set();

  function visit(absolutePath, importChain) {
    if (modulesByPath.has(absolutePath)) return;
    if (pathsBeingVisited.has(absolutePath)) {
      const cycle = importChain.concat(absolutePath).map(path => relative(PROJECT_ROOT, path)).join(' → ');
      throw new Error(`[build] Dependencia circular: ${cycle}`);
    }
    pathsBeingVisited.add(absolutePath);
    const sourceModule = readSourceModule(absolutePath);
    for (const dependency of sourceModule.imports) visit(dependency.absolutePath, importChain.concat(absolutePath));
    pathsBeingVisited.delete(absolutePath);
    modulesByPath.set(absolutePath, sourceModule);
    orderedModules.push(sourceModule);
  }

  visit(entryPath, []);
  checkImportedNamesExist(orderedModules, modulesByPath);
  return orderedModules;
}

/**
 * Comprueba que todo lo que se importa existe en el módulo de origen.
 * Detecta errores de nombres antes de abrir el juego.
 */
function checkImportedNamesExist(orderedModules, modulesByPath) {
  for (const sourceModule of orderedModules) {
    for (const dependency of sourceModule.imports) {
      const exported = new Set(modulesByPath.get(dependency.absolutePath).exportedNames);
      for (const name of dependency.names) {
        if (!exported.has(name)) failInModule(sourceModule.relativePath, `importa "${name}", pero ${relative(PROJECT_ROOT, dependency.absolutePath)} no lo exporta`);
      }
    }
  }
}

/**
 * Nombre de la variable que guarda las exportaciones de un módulo en el paquete.
 * @param {string} absolutePath
 * @returns {string}
 */
function moduleVariableName(absolutePath) {
  return '__module_' + relative(PROJECT_ROOT, absolutePath).replace(/[^A-Za-z0-9]/g, '_');
}

/**
 * Convierte un módulo en un bloque aislado que devuelve sus exportaciones.
 * @param {SourceModule} sourceModule
 * @returns {string}
 */
function wrapModule(sourceModule) {
  const bodyWithoutImports = sourceModule.source.replace(NAMED_IMPORT_STATEMENT, (statement, names, specifier) => {
    const dependencyPath = resolve(dirname(sourceModule.absolutePath), specifier);
    return `const { ${names.split(',').map(name => name.trim()).filter(Boolean).join(', ')} } = ${moduleVariableName(dependencyPath)};`;
  });
  const body = bodyWithoutImports.replace(EXPORT_KEYWORD_AT_LINE_START, '');
  return [
    `// ─── ${sourceModule.relativePath} ───`,
    `const ${moduleVariableName(sourceModule.absolutePath)} = (() => {`,
    body.trimEnd(),
    `return { ${sourceModule.exportedNames.join(', ')} };`,
    '})();'
  ].join('\n');
}

/**
 * Une todos los módulos en un único script.
 * @returns {{script: string, moduleCount: number}}
 */
function bundleScript() {
  const modules = collectModulesInDependencyOrder(ENTRY_MODULE_PATH);
  const header = `'use strict';\n/* Súper Paco — archivo generado por tools/build.js. No editar: los fuentes están en src/. */`;
  return { script: [header, ...modules.map(wrapModule)].join('\n\n'), moduleCount: modules.length };
}

/**
 * Inserta estilos y código en la plantilla de la página.
 * @param {string} script
 * @returns {string} Contenido de la página (sin <html> ni <head>).
 */
function renderPageContent(script) {
  const template = readFileSync(PAGE_TEMPLATE_PATH, 'utf8');
  const styles = readFileSync(STYLESHEET_PATH, 'utf8');
  // Evita que un "</script>" dentro del código cierre la etiqueta antes de tiempo.
  const safeScript = script.replace(/<\/script/gi, '<\\/script');
  return template
    .replace(STYLES_PLACEHOLDER, () => `<style>\n${styles}</style>`)
    .replace(SCRIPT_PLACEHOLDER, () => `<script>\n${safeScript}\n</script>`);
}

/**
 * Envuelve el contenido en un documento HTML completo.
 * @param {string} pageContent
 * @returns {string}
 */
function wrapInHtmlDocument(pageContent) {
  return [
    '<!doctype html>',
    '<html lang="es">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    pageContent,
    '</html>',
    ''
  ].join('\n');
}

/** Lee la ruta indicada tras `--fragment`, si la hay. */
function readFragmentOutputPath(argumentsList) {
  const flagIndex = argumentsList.indexOf('--fragment');
  return flagIndex >= 0 ? resolve(argumentsList[flagIndex + 1]) : null;
}

function main() {
  const { script, moduleCount } = bundleScript();
  const pageContent = renderPageContent(script);
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, wrapInHtmlDocument(pageContent));
  console.log(`✔ ${moduleCount} módulos empaquetados en ${relative(PROJECT_ROOT, OUTPUT_PATH)}`);

  const fragmentPath = readFragmentOutputPath(process.argv.slice(2));
  if (fragmentPath) {
    mkdirSync(dirname(fragmentPath), { recursive: true });
    writeFileSync(fragmentPath, pageContent);
    console.log(`✔ Versión incrustable en ${fragmentPath}`);
  }
}

main();
