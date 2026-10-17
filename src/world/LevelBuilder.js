/**
 * @file Constructor de niveles con métodos legibles.
 *
 * En lugar de dibujar los niveles como enormes bloques de texto, se describen
 * con llamadas del estilo "pon suelo de la columna 0 a la 64" o "pon un bloque
 * con premio en la columna 18, fila 9". Así es fácil leerlos y modificarlos.
 *
 * Sistema de coordenadas: columnas y filas de baldosas (no píxeles).
 * La fila 0 está arriba y la 14 abajo. El suelo normal ocupa las filas 13 y 14,
 * de modo que los personajes pisan la fila 12.
 */
import { LEVEL_ROWS, GROUND_TOP_ROW, TILE_SIZE } from '../config/constants.js';
import { createSeededRandom } from '../core/math.js';
import { TileMap } from './TileMap.js';
import { TILE, BLOCK_CONTENT } from './tileTypes.js';
import { THEMES } from './themes.js';

/** Fila en la que pisan los personajes sobre el suelo normal. */
const STANDING_ROW = GROUND_TOP_ROW - 1;
/** Filas que ocupa el techo en los niveles cerrados (metro y castillo). */
const CEILING_ROWS = 2;
/** Fila del eje de las aspas de los molinos. */
const WINDMILL_HUB_ROW = 7;
/** Fila más alta de la cucaña de la meta. */
export const GOAL_POLE_TOP_ROW = 3;

/**
 * @typedef {Object} SpawnPoint Algo que aparece cuando la cámara se acerca.
 * @property {'enemy'|'movingPlatform'|'fireBar'|'windmillBlades'|'lavaBubble'|'wonderFlower'|'bigCoin'|'talker'|'door'} kind
 * @property {number} column
 * @property {number} row
 * @property {string} [enemyId] Tipo de enemigo (clave del catálogo de enemigos).
 * @property {Object} [settings] Ajustes específicos (recorrido, velocidad…).
 */

/**
 * @typedef {Object} Decoration Elemento decorativo sin colisión.
 * @property {string} type 'cloud', 'sign', 'checkpoint', 'goalPole', 'bar', 'windmillTower'…
 * @property {number} column
 * @property {number} [row]
 * @property {string} [text] Texto de los carteles.
 */

/**
 * @typedef {Object} LevelData Resultado de construir un nivel.
 * @property {string} themeName
 * @property {TileMap} tileMap
 * @property {Map<string, string>} blockContents Contenido de los bloques, con clave "columna,fila".
 * @property {SpawnPoint[]} spawnPoints
 * @property {Decoration[]} decorations
 * @property {{startX: number, endX: number}[]} firecrackerZones Tramos (en píxeles) donde caen petardos.
 * @property {number|null} checkpointColumn
 * @property {number|null} goalColumn
 * @property {{firstColumn: number, lastColumn: number}|null} bossArena
 * @property {{kind: string, startColumn: number, endColumn: number}|null} wonder Flor Maravilla del nivel.
 * @property {Object<string, () => LevelData>} roomBuilders Salas secretas, que se construyen al entrar.
 * @property {number} bigCoinCount Cuántas monedas gigantes tiene el nivel.
 * @property {boolean} isRoom true si es una sala secreta y no un nivel entero.
 */

/**
 * Clave con la que se guarda el contenido de un bloque.
 * @param {number} column
 * @param {number} row
 * @returns {string}
 */
export function blockKey(column, row) {
  return `${column},${row}`;
}

export class LevelBuilder {
  /**
   * @param {number} widthInTiles Ancho del nivel en columnas.
   * @param {string} themeName Clave de THEMES.
   */
  constructor(widthInTiles, themeName) {
    this.themeName = themeName;
    this.tileMap = new TileMap(widthInTiles, LEVEL_ROWS);
    this.blockContents = new Map();
    /** @type {SpawnPoint[]} */
    this.spawnPoints = [];
    /** @type {Decoration[]} */
    this.decorations = [];
    this.firecrackerZones = [];
    this.checkpointColumn = null;
    this.goalColumn = null;
    this.bossArena = null;
    this.wonder = null;
    this.roomBuilders = {};
    this.bigCoinCount = 0;
    /** Las salas secretas no tienen meta ni nubes ni plantas automáticas. */
    this.isRoom = false;
  }

  /* ---------------- Terreno ---------------- */

  /**
   * Rellena de suelo un tramo de columnas desde `topRow` hasta el fondo.
   * @param {number} fromColumn
   * @param {number} toColumn Incluida.
   * @param {number} [topRow] Fila superior del suelo (menor = más alto).
   */
  addGround(fromColumn, toColumn, topRow = GROUND_TOP_ROW) {
    for (let column = fromColumn; column <= toColumn; column++) {
      for (let row = topRow; row < LEVEL_ROWS; row++) this.tileMap.setTile(column, row, TILE.GROUND);
    }
  }

  /**
   * Colina de suelo con las esquinas escalonadas.
   * @param {number} fromColumn
   * @param {number} toColumn Incluida.
   * @param {number} height Altura máxima en baldosas sobre el suelo normal (1 a 3).
   */
  addHill(fromColumn, toColumn, height) {
    for (let column = fromColumn; column <= toColumn; column++) {
      const isEdge = column === fromColumn || column === toColumn;
      const columnHeight = isEdge ? Math.max(1, height - 1) : height;
      this.addGround(column, column, GROUND_TOP_ROW - columnHeight);
    }
  }

  /**
   * Cornisa flotante con un pasillo por debajo: se puede pasar por debajo (fácil)
   * o saltar encima (4 baldosas, con carrerilla) para llegar a premios y plataformas.
   * @param {number} fromColumn
   * @param {number} length Columnas de largo.
   */
  addLedge(fromColumn, length) {
    for (let column = fromColumn; column < fromColumn + length; column++) {
      this.tileMap.setTile(column, 9, TILE.GROUND);
      this.tileMap.setTile(column, 10, TILE.GROUND);
    }
  }

  /** Pone techo (dos filas) sobre un tramo de columnas; se usa en el metro y el castillo. */
  addCeiling(fromColumn, toColumn) {
    for (let column = fromColumn; column <= toColumn; column++) {
      for (let row = 0; row < CEILING_ROWS; row++) this.tileMap.setTile(column, row, TILE.GROUND);
    }
  }

  /**
   * Coloca un rectángulo de azulejos (bloques sólidos indestructibles).
   * @param {number} column Columna de la esquina superior izquierda.
   * @param {number} row Fila de la esquina superior izquierda.
   * @param {number} [width]
   * @param {number} [height]
   */
  addAzulejoBlocks(column, row, width = 1, height = 1) {
    for (let offsetX = 0; offsetX < width; offsetX++) {
      for (let offsetY = 0; offsetY < height; offsetY++) this.tileMap.setTile(column + offsetX, row + offsetY, TILE.AZULEJO);
    }
  }

  /**
   * Construye una escalera de azulejos apoyada en el suelo.
   * @param {number} firstColumn Primera columna de la escalera.
   * @param {number} steps Número de escalones (y altura máxima).
   * @param {'up'|'down'} direction 'up' sube hacia la derecha; 'down' baja hacia la derecha.
   */
  addStaircase(firstColumn, steps, direction) {
    for (let step = 0; step < steps; step++) {
      const stepHeight = direction === 'up' ? step + 1 : steps - step;
      for (let level = 0; level < stepHeight; level++) this.tileMap.setTile(firstColumn + step, STANDING_ROW - level, TILE.AZULEJO);
    }
  }

  /**
   * Coloca un tonel de vino de 2 columnas de ancho apoyado en el suelo.
   * @param {number} leftColumn
   * @param {number} heightInTiles
   * @param {{withOctopus?: boolean}} [options] Si `withOctopus`, un pulpo asomará por arriba.
   */
  addBarrel(leftColumn, heightInTiles, { withOctopus = false } = {}) {
    const topRow = GROUND_TOP_ROW - heightInTiles;
    this.tileMap.setTile(leftColumn, topRow, TILE.BARREL_TOP_LEFT);
    this.tileMap.setTile(leftColumn + 1, topRow, TILE.BARREL_TOP_RIGHT);
    for (let row = topRow + 1; row <= STANDING_ROW; row++) {
      this.tileMap.setTile(leftColumn, row, TILE.BARREL_BODY_LEFT);
      this.tileMap.setTile(leftColumn + 1, row, TILE.BARREL_BODY_RIGHT);
    }
    if (withOctopus) this.spawnPoints.push({ kind: 'enemy', enemyId: 'pulpo', column: leftColumn, row: topRow });
  }

  /**
   * Plataforma que se atraviesa desde abajo (balcón, toldo, tablón).
   * @param {number} column
   * @param {number} row
   * @param {number} length Número de columnas.
   */
  addOneWayPlatform(column, row, length) {
    for (let offset = 0; offset < length; offset++) this.tileMap.setTile(column + offset, row, TILE.ONE_WAY_PLATFORM);
  }

  /** Puente de madera sobre lava para la batalla final. */
  addBossBridge(fromColumn, toColumn) {
    for (let column = fromColumn; column <= toColumn; column++) {
      this.tileMap.setTile(column, GROUND_TOP_ROW, TILE.BRIDGE);
      this.tileMap.setTile(column, GROUND_TOP_ROW + 1, TILE.LAVA);
    }
  }

  /* ---------------- Bloques y premios ---------------- */

  /**
   * Bloque "¿?" que da un premio al golpearlo desde abajo.
   * @param {number} column
   * @param {number} row
   * @param {string} [content] Uno de BLOCK_CONTENT (por defecto, una peseta).
   */
  addQuestionBlock(column, row, content = BLOCK_CONTENT.COIN) {
    this.tileMap.setTile(column, row, TILE.QUESTION_BLOCK);
    this.blockContents.set(blockKey(column, row), content);
  }

  /**
   * Fila de ladrillos. Paco grande los rompe; si el primero lleva premio, lo da.
   * @param {number} column
   * @param {number} row
   * @param {number} [count]
   * @param {string|null} [contentOfFirstBrick] Premio escondido en el primer ladrillo.
   */
  addBricks(column, row, count = 1, contentOfFirstBrick = null) {
    for (let offset = 0; offset < count; offset++) this.tileMap.setTile(column + offset, row, TILE.BRICK);
    if (contentOfFirstBrick) this.blockContents.set(blockKey(column, row), contentOfFirstBrick);
  }

  /** Bloque invisible con premio (normalmente una vida extra). */
  addHiddenBlock(column, row, content = BLOCK_CONTENT.EXTRA_LIFE) {
    this.tileMap.setTile(column, row, TILE.HIDDEN_BLOCK);
    this.blockContents.set(blockKey(column, row), content);
  }

  /** Fila de pesetas sueltas en el aire. */
  addCoinRow(column, row, count) {
    for (let offset = 0; offset < count; offset++) this.tileMap.setTile(column + offset, row, TILE.COIN);
  }

  /* ---------------- Personajes y peligros ---------------- */

  /**
   * Coloca un enemigo.
   * @param {string} enemyId Clave del catálogo de enemigos ('guiri', 'toro'…).
   * @param {number} column
   * @param {number} [row] Fila que pisa (o fila central para los voladores).
   */
  addEnemy(enemyId, column, row = STANDING_ROW) {
    this.spawnPoints.push({ kind: 'enemy', enemyId, column, row });
  }

  /**
   * Plataforma móvil que va y viene.
   * @param {Object} platform
   * @param {number} platform.column Posición inicial (columna izquierda).
   * @param {number} platform.row Posición inicial (fila de su superficie).
   * @param {number} platform.lengthInTiles
   * @param {'horizontal'|'vertical'} platform.axis
   * @param {number} platform.travelInTiles Recorrido; negativo = hacia la izquierda o hacia arriba.
   * @param {number} [platform.speed] Píxeles por paso.
   */
  addMovingPlatform({ column, row, lengthInTiles, axis, travelInTiles, speed = 1 }) {
    this.spawnPoints.push({ kind: 'movingPlatform', column, row, settings: { lengthInTiles, axis, travelInTiles, speed } });
  }

  /**
   * Barra giratoria de churros ardientes anclada en una casilla.
   * @param {number} column
   * @param {number} row
   * @param {number} segments Longitud en tramos de 8 píxeles.
   * @param {number} angularSpeed Radianes por paso (negativo = giro contrario).
   */
  addFireBar(column, row, segments, angularSpeed) {
    this.spawnPoints.push({ kind: 'fireBar', column, row, settings: { segments, angularSpeed } });
  }

  /** Chispa de lava que salta desde el fondo del foso en esa columna. */
  addLavaBubble(column) {
    this.spawnPoints.push({ kind: 'lavaBubble', column, row: LEVEL_ROWS - 1 });
  }

  /**
   * Molino de La Mancha: torre decorativa y cuatro aspas giratorias que hacen daño.
   * @param {number} column Columna izquierda de la torre (ocupa 2 columnas).
   */
  addWindmill(column) {
    this.decorations.push({ type: 'windmillTower', column });
    this.spawnPoints.push({ kind: 'windmillBlades', column: column + 1, row: WINDMILL_HUB_ROW });
  }

  /** Tramo del nivel en el que caen petardos del cielo (Fallas). */
  addFirecrackerZone(fromColumn, toColumn) {
    this.firecrackerZones.push({ startX: fromColumn * TILE_SIZE, endX: toColumn * TILE_SIZE });
  }

  /* ---------------- Maravillas, secretos y salas ---------------- */

  /**
   * Flor Maravilla: al tocarla, el nivel se transforma hasta `endColumn`.
   * Cada nivel tiene como mucho una. Al terminar aparece la Semilla Maravilla.
   * @param {Object} flower
   * @param {number} flower.column Columna de la flor (empieza el efecto).
   * @param {number} [flower.row] Fila que pisa (por defecto, la del suelo normal).
   * @param {'moon'|'rain'|'rhythm'|'dark'|'stampede'|'parade'} flower.kind Qué transformación provoca.
   * @param {number} flower.endColumn Columna donde termina el efecto y aparece la semilla.
   */
  addWonder({ column, row = STANDING_ROW, kind, endColumn }) {
    this.wonder = { kind, startColumn: column, endColumn };
    this.spawnPoints.push({ kind: 'wonderFlower', column, row, settings: { eventKind: kind, endColumn } });
  }

  /**
   * Moneda gigante escondida. Cada nivel debería tener tres.
   * @param {number} column
   * @param {number} row
   */
  addBigCoin(column, row) {
    this.spawnPoints.push({ kind: 'bigCoin', column, row, settings: { number: this.bigCoinCount } });
    this.bigCoinCount++;
  }

  /**
   * Reserva el número de una moneda gigante que se pondrá en una sala secreta.
   * @returns {number} Número de la moneda dentro del nivel.
   */
  reserveBigCoin() {
    return this.bigCoinCount++;
  }

  /**
   * Coloca la moneda gigante de una sala secreta con el número que se reservó en el nivel.
   * @param {number} column
   * @param {number} row
   * @param {number} number Número devuelto por {@link reserveBigCoin}.
   */
  addNumberedBigCoin(column, row, number) {
    this.spawnPoints.push({ kind: 'bigCoin', column, row, settings: { number } });
  }

  /**
   * Arco de pesetas sueltas (sube y baja como un salto).
   * @param {number} column Primera columna.
   * @param {number} row Fila de los extremos.
   * @param {number} count Número de pesetas.
   * @param {number} [height] Cuánto sube el centro del arco, en baldosas.
   */
  addCoinArc(column, row, count, height = 2) {
    for (let index = 0; index < count; index++) {
      const lift = Math.round(Math.sin((index + 0.5) / count * Math.PI) * height);
      this.tileMap.setTile(column + index, row - lift, TILE.COIN);
    }
  }

  /**
   * Personaje que charla cuando Paco se acerca (flores cotillas y cameos).
   * @param {number} column
   * @param {string[]} lines Frases; va diciendo una distinta cada vez.
   * @param {Object} [options]
   * @param {number} [options.row] Fila que pisa.
   * @param {string} [options.look] 'flower' o el nombre de un sprite ('abuela', 'oveja_frame1'…).
   */
  addTalker(column, lines, { row = STANDING_ROW, look = 'flower' } = {}) {
    this.spawnPoints.push({ kind: 'talker', column, row, settings: { lines, look } });
  }

  /**
   * Entrada a una sala secreta. Se usa con ABAJO (alcantarilla) o ARRIBA (puerta).
   * @param {Object} door
   * @param {number} door.column
   * @param {number} [door.row]
   * @param {'manhole'|'door'} door.look
   * @param {string} door.roomId Clave de una sala añadida con {@link addRoom}.
   */
  addDoor({ column, row = STANDING_ROW, look, roomId }) {
    this.spawnPoints.push({ kind: 'door', column, row, settings: { look, roomId, direction: 'enter' } });
  }

  /**
   * Define una sala secreta, que se construye al entrar en ella.
   * @param {string} roomId
   * @param {() => LevelData} buildRoom Debe devolver `room.build()` de otro LevelBuilder.
   */
  addRoom(roomId, buildRoom) {
    this.roomBuilders[roomId] = buildRoom;
  }

  /**
   * Plataformas "al ritmo" (se alternan con el pulso de la Flor Maravilla del compás).
   * @param {number} column
   * @param {number} row
   * @param {number} length
   * @param {'A'|'B'} group Los del grupo A empiezan sólidos y los del B, fantasma.
   */
  addBeatPlatforms(column, row, length, group) {
    for (let offset = 0; offset < length; offset++) {
      this.tileMap.setTile(column + offset, row, group === 'A' ? TILE.BEAT_A_ON : TILE.BEAT_B_OFF);
    }
  }

  /** Marca la sala como tal y le pone una puerta de salida en `column`. */
  setRoomExit(column, { row = STANDING_ROW, look = 'door' } = {}) {
    this.isRoom = true;
    this.spawnPoints.push({ kind: 'door', column, row, settings: { look, roomId: null, direction: 'exit' } });
  }

  /* ---------------- Decorados y puntos clave ---------------- */

  /** Cartel de madera con un texto (memes, señales…). */
  addSign(column, text) {
    this.decorations.push({ type: 'sign', column, text });
  }

  /** Decoración sin colisión ('farola', 'abuela', 'recipePedestal'…). */
  addDecoration(type, column, row) {
    this.decorations.push({ type, column, row });
  }

  /** Punto de control: si Paco lo pasa y pierde una vida, reaparece aquí. */
  setCheckpoint(column) {
    this.checkpointColumn = column;
    this.decorations.push({ type: 'checkpoint', column });
  }

  /** Meta: cucaña con un jamón y, a continuación, el bar de Paco. */
  setGoal(column) {
    this.goalColumn = column;
    this.addAzulejoBlocks(column, STANDING_ROW);
    this.decorations.push({ type: 'goalPole', column });
    this.decorations.push({ type: 'bar', column: column + 4 });
  }

  /** Zona de la batalla final: la cámara se bloquea aquí hasta vencer al jefe. */
  setBossArena(firstColumn, lastColumn) {
    this.bossArena = { firstColumn, lastColumn };
  }

  /* ---------------- Resultado ---------------- */

  /**
   * @private
   * Rellena el fondo de los fosos con agua o lava según el tema.
   * Un foso es una columna sin nada en las dos filas de suelo.
   */
  fillPits(pitFilling) {
    if (!pitFilling) return;
    const liquid = pitFilling === 'lava' ? TILE.LAVA : TILE.WATER;
    for (let column = 0; column < this.tileMap.widthInTiles; column++) {
      const isPit = this.tileMap.getTile(column, GROUND_TOP_ROW) === TILE.EMPTY && this.tileMap.getTile(column, GROUND_TOP_ROW + 1) === TILE.EMPTY;
      if (isPit) {
        this.tileMap.setTile(column, GROUND_TOP_ROW, liquid);
        this.tileMap.setTile(column, GROUND_TOP_ROW + 1, liquid);
      }
    }
  }

  /**
   * @private
   * Añade nubes y plantas repartidas "al azar" (con semilla, siempre igual).
   * Las plantas solo se ponen donde hay suelo libre y lejos de la meta.
   */
  addAutomaticScenery(theme) {
    const randomSource = createSeededRandom(this.tileMap.widthInTiles * 7 + this.themeName.length);
    const width = this.tileMap.widthInTiles;
    const autoDecorations = [];
    if (theme.hasClouds) {
      for (let column = 4; column < width; column += 9 + Math.floor(randomSource() * 8)) {
        autoDecorations.push({ type: 'cloud', column, row: 2 + Math.floor(randomSource() * 4) });
      }
    }
    if (theme.groundPlant) {
      for (let column = 3; column < width - 4; column += 7 + Math.floor(randomSource() * 9)) {
        if (this.isFreeGroundForPlant(column)) autoDecorations.push({ type: theme.groundPlant, column });
      }
    }
    // Van al principio de la lista para dibujarse detrás de carteles y metas.
    this.decorations.unshift(...autoDecorations);
  }

  /** @private ¿Hay suelo despejado de 2 columnas de ancho para poner una planta? */
  isFreeGroundForPlant(column) {
    if (this.goalColumn !== null && column > this.goalColumn - 3) return false;
    for (let offset = 0; offset < 2; offset++) {
      const hasGround = this.tileMap.getTile(column + offset, GROUND_TOP_ROW) === TILE.GROUND;
      const isClearAbove = this.tileMap.getTile(column + offset, STANDING_ROW) === TILE.EMPTY &&
        this.tileMap.getTile(column + offset, STANDING_ROW - 1) === TILE.EMPTY;
      if (!hasGround || !isClearAbove) return false;
    }
    return true;
  }

  /**
   * Termina el nivel (rellena fosos y decorados) y devuelve sus datos.
   * @returns {LevelData}
   */
  build() {
    const theme = THEMES[this.themeName];
    this.fillPits(theme.pitFilling);
    if (!this.isRoom) this.addAutomaticScenery(theme);
    return {
      themeName: this.themeName,
      tileMap: this.tileMap,
      blockContents: this.blockContents,
      spawnPoints: this.spawnPoints,
      decorations: this.decorations,
      firecrackerZones: this.firecrackerZones,
      checkpointColumn: this.checkpointColumn,
      goalColumn: this.goalColumn,
      bossArena: this.bossArena,
      wonder: this.wonder,
      roomBuilders: this.roomBuilders,
      bigCoinCount: this.bigCoinCount,
      isRoom: this.isRoom
    };
  }
}
