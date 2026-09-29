/**
 * @file Primitivas de dibujo sobre canvas.
 *
 * Todas las funciones dibujan con píxeles "duros" (sin suavizado) para mantener
 * el aspecto de 8 bits. Reciben el contexto de dibujo como parámetro, así sirven
 * tanto para la pantalla como para imágenes generadas fuera de ella.
 */

/**
 * Crea un canvas fuera de pantalla y, opcionalmente, dibuja en él.
 *
 * @param {number} width Ancho en píxeles.
 * @param {number} height Alto en píxeles.
 * @param {(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void} [drawContent]
 *   Función que pinta el contenido inicial.
 * @returns {HTMLCanvasElement}
 */
export function createCanvas(width, height, drawContent) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  if (drawContent) drawContent(context, canvas);
  return canvas;
}

/**
 * Rellena un rectángulo redondeando las coordenadas a píxeles enteros.
 * @param {CanvasRenderingContext2D} context
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {string} color Color CSS.
 */
export function fillRectangle(context, x, y, width, height, color) {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

/**
 * Rellena un círculo pixelado dibujándolo línea a línea.
 * @param {CanvasRenderingContext2D} context
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius Radio en píxeles.
 * @param {string} color Color CSS.
 */
export function fillCircle(context, centerX, centerY, radius, color) {
  context.fillStyle = color;
  for (let offsetY = -radius; offsetY <= radius; offsetY++) {
    // El pequeño margen (radius * 0.6) redondea mejor los bordes en radios pequeños.
    const halfWidth = Math.floor(Math.sqrt(radius * radius - offsetY * offsetY + radius * 0.6));
    context.fillRect(Math.round(centerX - halfWidth), Math.round(centerY + offsetY), halfWidth * 2 + 1, 1);
  }
}

/**
 * Rellena un triángulo isósceles con la punta hacia arriba.
 * @param {CanvasRenderingContext2D} context
 * @param {number} left Borde izquierdo de la base.
 * @param {number} baseY Coordenada Y de la base.
 * @param {number} width Ancho de la base.
 * @param {number} height Altura del triángulo.
 * @param {string} color Color CSS.
 */
export function fillTriangle(context, left, baseY, width, height, color) {
  context.fillStyle = color;
  for (let line = 0; line < height; line++) {
    const lineWidth = Math.max(1, Math.round(width * (line + 1) / height));
    context.fillRect(Math.round(left + (width - lineWidth) / 2), Math.round(baseY - height + line), lineWidth, 1);
  }
}
