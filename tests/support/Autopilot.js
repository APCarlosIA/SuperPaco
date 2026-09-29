/**
 * @file Piloto automático que juega un nivel "como lo haría una persona".
 *
 * Sirve para comprobar que cada nivel se puede terminar. En cada paso mira el
 * terreno que tiene delante y decide qué botones pulsar:
 *   - Escalón, tonel o pared delante → salta apuntando a su parte de arriba.
 *   - Desnivel hacia abajo → baja caminando despacio (sin salir disparado).
 *   - Hueco con tierra alcanzable al otro lado → coge carrerilla y salta hacia ella.
 *   - Hueco que solo se cruza en plataforma móvil → se para en el borde, espera
 *     a que la plataforma llegue, se sube y se baja cuando está cerca del otro lado.
 *   - Jefe final → le persigue y salta para caerle encima.
 * En el aire corrige la dirección para aterrizar donde había apuntado.
 *
 * El piloto solo lee el estado del mundo y pulsa botones: no mueve a Paco
 * directamente, así que todo lo que consigue lo podría conseguir un jugador.
 */
import { BUTTON } from '../../src/core/input.js';
import { TILE_SIZE, LEVEL_ROWS } from '../../src/config/constants.js';
import { TILE, isSolidTile, isLiquidTile } from '../../src/world/tileTypes.js';

/** Pasos que se mantiene el botón de saltar en cada tipo de salto. */
const JUMP_HOLD_STEPS = Object.freeze({ full: 22, platform: 12, shortHop: 8 });
/** Hasta cuántas baldosas de hueco se intenta cruzar de un salto con carrerilla. */
const MAX_DIRECT_JUMP_TILES = 5;
/** Altura máxima (px) que se considera alcanzable de un salto. */
const MAX_REACHABLE_RISE = 60;
/** Distancia (px) al borde a la que se salta un hueco. */
const JUMP_AT_EDGE_DISTANCE = 4;
/** Distancia (px) hacia delante en la que se buscan huecos para frenar a tiempo. */
const GAP_LOOKAHEAD = 40;
/** Distancia máxima (px) desde una plataforma móvil a tierra para bajarse de un salto. */
const DISMOUNT_DISTANCE = 48;
/** Margen (px) al corregir la dirección en el aire. */
const STEERING_TOLERANCE = 3;
/** Pasos sin avanzar tras los que se prueba a saltar. */
const STUCK_STEPS_BEFORE_JUMP = 30;

export class Autopilot {
  /**
   * @param {import('../../src/game/World.js').World} world
   * @param {import('./ScriptedControls.js').ScriptedControls} controls
   */
  constructor(world, controls) {
    this.world = world;
    this.controls = controls;
    /** Pasos que quedan manteniendo el botón de saltar. */
    this.jumpHoldStepsLeft = 0;
    /** A dónde se quiere aterrizar: una X en píxeles o una entidad (plataforma, jefe). */
    this.airTarget = null;
    this.keepRunningInAir = true;
    this.wasJumpHeldLastStep = false;
    this.stepsWithoutProgress = 0;
    this.lastPlayerX = world.player.x;
  }

  /** Decide los botones de este paso. Debe llamarse antes de `controls.update()`. */
  decideButtons() {
    const { world, controls } = this;
    const player = world.player;
    controls.releaseAll();
    if (world.phase !== 'playing' || world.goalSequence || player.isDead || !player.hasControl) {
      this.wasJumpHeldLastStep = false;
      return;
    }
    if (this.isFightingBoss()) this.fightBoss();
    else if (!player.isOnGround) this.steerInAir();
    else if (player.ridingPlatform) this.rideOrDismount();
    else this.walkJumpOrWait();
    this.wasJumpHeldLastStep = controls.buttonsBeingHeld.has(BUTTON.JUMP);
  }

  /* ---------------- Lectura del terreno ---------------- */

  /** @private Fila de baldosas en la que están los pies de Paco. */
  get feetRow() {
    return Math.floor((this.world.player.bottom - 1) / TILE_SIZE);
  }

  /**
   * @private
   * Fila superior de lo que se puede pisar en una columna (suelo, bloque o
   * plataforma de un sentido), buscando desde `fromRow` hacia abajo. Devuelve
   * null si antes hay lava o agua, o si no hay nada.
   */
  findFootingRow(column, fromRow) {
    const tileMap = this.world.tileMap;
    for (let row = Math.max(0, fromRow); row < LEVEL_ROWS; row++) {
      const tile = tileMap.getTile(column, row);
      if (isLiquidTile(tile)) return null;
      const canStandOn = isSolidTile(tile) || tile === TILE.ONE_WAY_PLATFORM;
      const hasRoomAbove = !tileMap.isSolid(column, row - 1) && !tileMap.isSolid(column, row - 2);
      if (canStandOn && hasRoomAbove) return row;
      if (canStandOn) return null;
    }
    return null;
  }

  /**
   * @private
   * Busca dónde aterrizar a partir de una columna. Primero prefiere sitios a la
   * misma altura o más bajos; si no hay, acepta sitios algo más altos.
   * @returns {{column: number, targetX: number}|null}
   */
  findLanding(firstColumn, maxColumns) {
    const feetY = this.world.player.bottom;
    const searchFromRow = this.feetRow - 4;
    const passes = [row => row * TILE_SIZE >= feetY - 8, row => row * TILE_SIZE >= feetY - MAX_REACHABLE_RISE];
    for (const isAcceptableHeight of passes) {
      for (let column = firstColumn; column <= firstColumn + maxColumns; column++) {
        const row = this.findFootingRow(column, searchFromRow);
        if (row === null || !isAcceptableHeight(row)) continue;
        let landingWidth = 1;
        while (landingWidth < 3 && this.findFootingRow(column + landingWidth, searchFromRow) === row) landingWidth++;
        return { column, targetX: column * TILE_SIZE + (landingWidth * TILE_SIZE) / 2 };
      }
    }
    return null;
  }

  /**
   * @private
   * Altura (en baldosas) del obstáculo sólido que hay delante de Paco.
   */
  measureObstacleAhead(column) {
    const tileMap = this.world.tileMap;
    const player = this.world.player;
    const headRow = Math.floor(player.y / TILE_SIZE);
    let height = 0;
    for (let row = this.feetRow; row >= 0 && tileMap.isSolid(column, row); row--) height++;
    if (height === 0 && tileMap.isSolid(column, headRow)) height = 1;
    return height;
  }

  /**
   * @private
   * Plataforma móvil a la que se puede saltar ahora mismo desde el borde.
   */
  findBoardablePlatform() {
    const player = this.world.player;
    const frontX = player.x + player.width;
    return this.world.platforms.find(platform =>
      platform !== player.ridingPlatform &&
      platform.x <= frontX + 16 &&
      platform.x + platform.width >= frontX + 8 &&
      platform.y >= player.bottom - 52 &&
      platform.y <= player.bottom + 64) || null;
  }

  /* ---------------- Acciones ---------------- */

  /** @private Empieza un salto (solo si el botón estaba suelto, para que cuente como pulsación). */
  startJump(holdSteps, { run, target }) {
    if (this.wasJumpHeldLastStep) return;
    this.jumpHoldStepsLeft = holdSteps;
    this.airTarget = target;
    this.keepRunningInAir = run;
    this.controls.hold(BUTTON.JUMP);
    const targetX = target === null ? Infinity : typeof target === 'number' ? target : target.centerX;
    this.controls.hold(targetX < this.world.player.centerX ? BUTTON.LEFT : BUTTON.RIGHT);
    if (run) this.controls.hold(BUTTON.RUN);
  }

  /** @private En el aire: mantener el salto y dirigirse al objetivo. */
  steerInAir() {
    const player = this.world.player;
    if (this.jumpHoldStepsLeft > 0) {
      this.jumpHoldStepsLeft--;
      this.controls.hold(BUTTON.JUMP);
    }
    if (this.keepRunningInAir) this.controls.hold(BUTTON.RUN);
    if (this.airTarget === null) {
      this.controls.hold(BUTTON.RIGHT);
      return;
    }
    const targetX = typeof this.airTarget === 'number' ? this.airTarget : this.airTarget.centerX;
    this.controls.hold(BUTTON.RUN);
    if (player.centerX < targetX - STEERING_TOLERANCE) this.controls.hold(BUTTON.RIGHT);
    else if (player.centerX > targetX + STEERING_TOLERANCE) this.controls.hold(BUTTON.LEFT);
  }

  /** @private En el suelo: avanzar, saltar obstáculos y huecos, o esperar una plataforma. */
  walkJumpOrWait() {
    const player = this.world.player;
    this.airTarget = null;
    this.jumpHoldStepsLeft = 0;
    const frontX = player.x + player.width;

    const obstacleColumn = Math.floor((frontX + JUMP_AT_EDGE_DISTANCE) / TILE_SIZE);
    const obstacleHeight = this.measureObstacleAhead(obstacleColumn);
    if (obstacleHeight > 0) {
      this.jumpOntoObstacle(obstacleColumn, obstacleHeight);
      return;
    }

    const edge = this.findEdgeAhead(frontX);
    if (edge && edge.kind === 'gap') {
      this.handleGapAhead(edge.column, frontX);
      return;
    }
    if (edge && edge.kind === 'drop') {
      // Bajar un desnivel caminando: así no se sale disparado hacia un posible hueco.
      this.controls.hold(BUTTON.RIGHT);
      if (player.velocityX > 1.2) this.controls.hold(BUTTON.LEFT);
      return;
    }

    this.controls.hold(BUTTON.RIGHT);
    this.controls.hold(BUTTON.RUN);
    this.jumpIfStuck();
  }

  /**
   * @private
   * Primer cambio de terreno en los próximos píxeles:
   *   - 'gap': no hay nada que pisar (foso, agua o lava).
   *   - 'drop': el suelo sigue, pero más abajo.
   * @returns {{column: number, kind: 'gap'|'drop'}|null}
   */
  findEdgeAhead(frontX) {
    const firstColumn = Math.floor(frontX / TILE_SIZE);
    const lastColumn = Math.floor((frontX + GAP_LOOKAHEAD) / TILE_SIZE);
    const standingRow = this.feetRow + 1;
    for (let column = firstColumn; column <= lastColumn; column++) {
      const footingRow = this.findFootingRow(column, standingRow);
      if (footingRow === null) return { column, kind: 'gap' };
      if (footingRow > standingRow) return { column, kind: 'drop' };
    }
    return null;
  }

  /**
   * @private
   * Salta un escalón, tonel o pared apuntando a su parte de arriba, a velocidad
   * de paseo para no pasarse de largo y caer a lo que haya detrás.
   */
  jumpOntoObstacle(column, height) {
    const topRow = this.feetRow - height + 1;
    let topWidth = 1;
    while (topWidth < 3 && this.findFootingRow(column + topWidth, topRow) === topRow) topWidth++;
    const targetX = column * TILE_SIZE + (topWidth * TILE_SIZE) / 2;
    this.startJump(height <= 1 ? JUMP_HOLD_STEPS.shortHop : JUMP_HOLD_STEPS.full, { run: false, target: targetX });
  }

  /** @private Decide qué hacer ante un hueco: saltarlo, subir a una plataforma o esperar. */
  handleGapAhead(gapColumn, frontX) {
    const player = this.world.player;
    const distanceToEdge = gapColumn * TILE_SIZE - frontX;
    const landing = this.findLanding(gapColumn, MAX_DIRECT_JUMP_TILES);
    if (landing) {
      // Se puede saltar directamente: carrerilla y salto justo en el borde.
      this.controls.hold(BUTTON.RIGHT);
      this.controls.hold(BUTTON.RUN);
      if (distanceToEdge <= JUMP_AT_EDGE_DISTANCE) this.startJump(JUMP_HOLD_STEPS.full, { run: true, target: landing.targetX });
      return;
    }
    const platform = this.findBoardablePlatform();
    if (platform && distanceToEdge <= 12) {
      this.startJump(JUMP_HOLD_STEPS.platform, { run: false, target: platform });
      return;
    }
    // Acercarse despacio y esperar en el borde a que llegue una plataforma.
    if (distanceToEdge > 6) {
      this.controls.hold(BUTTON.RIGHT);
      if (player.velocityX > 1) this.controls.hold(BUTTON.LEFT);
    } else if (player.velocityX > 0.05) {
      this.controls.hold(BUTTON.LEFT);
    }
  }

  /** @private Sobre una plataforma móvil: quedarse en el centro y saltar cuando la tierra esté cerca. */
  rideOrDismount() {
    const player = this.world.player;
    const platform = player.ridingPlatform;
    const frontX = player.x + player.width;
    const landing = this.findLanding(Math.floor(frontX / TILE_SIZE), 3);
    const landingIsClose = landing && landing.column * TILE_SIZE - frontX <= DISMOUNT_DISTANCE;
    if (landingIsClose) {
      this.startJump(JUMP_HOLD_STEPS.platform, { run: true, target: landing.targetX });
      return;
    }
    const nextPlatform = this.findBoardablePlatform();
    if (nextPlatform && nextPlatform.x > platform.x) {
      this.startJump(JUMP_HOLD_STEPS.platform, { run: false, target: nextPlatform });
      return;
    }
    // Si ya se ve tierra delante, ponerse en la parte delantera; si no, en el centro.
    const waitingX = landing ? platform.x + platform.width - player.width / 2 - 2 : platform.centerX;
    if (player.centerX < waitingX - STEERING_TOLERANCE) this.controls.hold(BUTTON.RIGHT);
    else if (player.centerX > waitingX + STEERING_TOLERANCE) this.controls.hold(BUTTON.LEFT);
  }

  /** @private Si lleva un rato sin avanzar, prueba a saltar. */
  jumpIfStuck() {
    const player = this.world.player;
    this.stepsWithoutProgress = Math.abs(player.x - this.lastPlayerX) < 0.1 ? this.stepsWithoutProgress + 1 : 0;
    this.lastPlayerX = player.x;
    if (this.stepsWithoutProgress > STUCK_STEPS_BEFORE_JUMP) {
      this.stepsWithoutProgress = 0;
      this.startJump(JUMP_HOLD_STEPS.full, { run: true, target: null });
    }
  }

  /* ---------------- Jefe final ---------------- */

  /** @private El jefe que hay que vencer, si el combate está en marcha. */
  findActiveBoss() {
    return this.world.entities.find(entity => entity.receiveDamage && !entity.isDefeated) || null;
  }

  /** @private */
  isFightingBoss() {
    return this.world.isBossFightActive && !this.world.isBossDefeated && this.findActiveBoss() !== null;
  }

  /** @private Perseguir a Don Hacienda y saltar para caerle encima. */
  fightBoss() {
    const player = this.world.player;
    const boss = this.findActiveBoss();
    if (!player.isOnGround) {
      this.airTarget = boss;
      this.steerInAir();
      return;
    }
    const distance = boss.centerX - player.centerX;
    if (Math.abs(distance) < 40) {
      this.startJump(JUMP_HOLD_STEPS.full, { run: true, target: boss });
      return;
    }
    this.controls.hold(distance > 0 ? BUTTON.RIGHT : BUTTON.LEFT);
    this.controls.hold(BUTTON.RUN);
  }
}
