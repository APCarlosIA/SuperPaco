/**
 * @file Clase base de todo lo que se mueve o interactúa en un nivel.
 *
 * Contrato que usa el mundo (World) con las entidades:
 *   - `update(world)`: avanza un paso de simulación.
 *   - `draw(context, cameraX)`: se dibuja en el contexto recibido, según la cámara.
 *   - `getHitbox()`: rectángulo con el que se comprueban los contactos.
 *
 * Métodos opcionales (si existen, el mundo los usa):
 *   - `onPlayerContact(player, world)`: Paco la ha tocado.
 *   - `collidesWithPlayer(player)`: prueba de contacto personalizada (barras giratorias).
 *   - `onHitByFireball(fireball, world)`: le ha dado un pimiento picante.
 *
 * Las entidades no importan el mundo: lo reciben como parámetro. Así se evitan
 * dependencias circulares entre módulos y cada entidad se puede entender sola.
 */
export class Entity {
  /**
   * @param {number} x Borde izquierdo en píxeles.
   * @param {number} y Borde superior en píxeles.
   * @param {number} width Ancho de la caja de colisión.
   * @param {number} height Alto de la caja de colisión.
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.velocityX = 0;
    this.velocityY = 0;
    /** Hacia dónde mira: -1 izquierda, 1 derecha. */
    this.facing = -1;
    this.isOnGround = false;
    /** Pasos de simulación que lleva viva (sirve para animaciones). */
    this.ageInSteps = 0;
    /** Derrotada: ya no hace daño y está haciendo su animación de salida. */
    this.isDefeated = false;
    /** El mundo la quitará de la lista al final de este paso. */
    this.shouldBeRemoved = false;
    /** Se dibuja por detrás de las baldosas (objetos saliendo de un bloque, pulpos en toneles). */
    this.drawsBehindTiles = false;
  }

  /** Coordenada X del centro de la caja de colisión. */
  get centerX() {
    return this.x + this.width / 2;
  }

  /** Coordenada Y del centro de la caja de colisión. */
  get centerY() {
    return this.y + this.height / 2;
  }

  /** Coordenada Y de los pies (borde inferior). */
  get bottom() {
    return this.y + this.height;
  }

  /**
   * Rectángulo que se usa para detectar contactos.
   * @returns {{x:number, y:number, width:number, height:number}}
   */
  getHitbox() {
    return this;
  }

  /**
   * Avanza un paso de simulación. Las subclases lo sobrescriben.
   * @param {import('../game/World.js').World} world
   */
  update(world) {}

  /**
   * Dibuja la entidad. Las subclases lo sobrescriben.
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX Posición horizontal de la cámara en píxeles.
   */
  draw(context, cameraX) {}
}
