#!/usr/bin/env node
/**
 * @file Servidor web mínimo para desarrollar sin tener que compilar.
 *
 * Sirve la página cargando `src/main.js` como módulo ES, de modo que al editar
 * cualquier archivo basta con recargar el navegador. (Los módulos ES no
 * funcionan abriendo el archivo con doble clic; por eso hace falta un servidor.)
 *
 * Uso: node tools/devServer.js   →   http://localhost:8080
 *      PORT=3000 node tools/devServer.js  (para usar otro puerto)
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 8080;

const CONTENT_TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
});

/**
 * Página de desarrollo: la plantilla con los estilos enlazados y el código como módulo.
 * @returns {Promise<string>}
 */
async function renderDevelopmentPage() {
  const template = await readFile(join(PROJECT_ROOT, 'src', 'page.html'), 'utf8');
  const pageContent = template
    .replace(/<!-- @styles[^>]*-->/, '<link rel="stylesheet" href="/src/styles.css">')
    .replace(/<!-- @script[^>]*-->/, '<script type="module" src="/src/main.js"></script>');
  return `<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n${pageContent}\n</html>\n`;
}

/**
 * Convierte la ruta pedida en un archivo del proyecto, impidiendo salir de él
 * con rutas del tipo "../../".
 * @param {string} urlPath
 * @returns {string|null}
 */
function resolveProjectFile(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const absolutePath = normalize(join(PROJECT_ROOT, decodedPath));
  return absolutePath.startsWith(PROJECT_ROOT + sep) ? absolutePath : null;
}

const server = createServer(async (request, response) => {
  try {
    if (request.url === '/' || request.url.startsWith('/?')) {
      response.writeHead(200, { 'Content-Type': CONTENT_TYPES['.html'], 'Cache-Control': 'no-store' });
      response.end(await renderDevelopmentPage());
      return;
    }
    const filePath = resolveProjectFile(request.url);
    if (!filePath) {
      response.writeHead(403).end('Acceso denegado');
      return;
    }
    const content = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(content);
  } catch (error) {
    response.writeHead(404).end('No encontrado');
  }
});

server.listen(PORT, () => {
  console.log(`Súper Paco en modo desarrollo: http://localhost:${PORT}`);
  console.log(`Con herramientas de depuración:  http://localhost:${PORT}/?debug`);
});
