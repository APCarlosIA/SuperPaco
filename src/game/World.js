/**
 * @file El mundo de un nivel en juego.
 *
 * Coordina todo lo que ocurre mientras se juega un nivel:
 *   - Crea el nivel, a Paco y la cámara.
 *   - Hace aparecer enemigos y plataformas cuando entran en pantalla.
 *   - Actualiza entidades, resuelve contactos con Paco y lleva el cronómetro.
 *   - Gestiona la pausa, la muerte, la meta y la batalla final.
 *   - Dibuja la escena completa.
 *
 * Además ofrece a las entidades una pequeña API (sumar puntos, mostrar textos,
 * crear efectos…) para que no necesiten conocer el resto del juego.
 *
 * Cuando termina el nivel o la animación de muerte, avisa al juego mediante
 * los "callbacks" que recibe al crearse.
 */
import {
  SCREEN_WIDTH, SCREEN_HEIGHT, TILE_SIZE, GAME_RULES, LEVEL_TIMER, CAMERA_PLAYER_SCREEN_X, PLAYER_PHYSICS
} from '../config/constants.js';
import { BUTTON } from '../core/input.js';
import { random, randomBetween, randomInteger, randomItem, rectanglesOverlap, clamp } from '../core/math.js';
import { soundEngine, SOUND_EFFECT } from '../audio/soundEngine.js';
import { screenFx } from '../graphics/screenFx.js';
import { drawText, measureTextWidth } from '../graphics/font.js';
import { getThemeAssets } from '../graphics/themeAssets.js';
import { FINAL_ROOM_END_COLUMN } from '../world/levels.js';
import { THEMES } from '../world/themes.js';
import { LIFE_LOST_MESSAGES, BURNED_MESSAGES, STOMP_EXCLAMATIONS, GAMEPLAY_MESSAGES } from '../world/texts.js';
import { Player, POWER_LEVEL } from '../entities/Player.js';
import { POWER_UP_KIND } from '../entities/PowerUpItem.js';
import { VisualEffect, EFFECT_KIND } from '../entities/effects/VisualEffect.js';
import { FallingFirecracker } from '../entities/hazards/FallingFirecracker.js';
import { TaxInvoice } from '../entities/hazards/TaxInvoice.js';
import { FallingCoin } from '../entities/wonder/FallingCoin.js';
import { createEntityForSpawnPoint, spawnsAheadOfCamera, isEnemySpawn } from './entityFactory.js';
import { handlePlayerHeadBump } from './blockInteractions.js';
import { GoalSequence } from './GoalSequence.js';
import { drawBackground, drawDecorations, drawTileLayer, drawRain, drawShadows, drawLighting, drawTorches } from './worldRenderer.js';
import { drawHud } from './hud.js';
import { WonderDirector } from './WonderDirector.js';
import { AreaManager } from './AreaManager.js';
import { drawIrisOpening } from '../graphics/uiKit.js';

/** Fases del mundo. */
export const WORLD_PHASE = Object.freeze({ PLAYING: 'playing', PLAYER_DYING: 'playerDying' });

/** Cuántos píxeles antes de entrar en pantalla aparecen las plataformas y peligros giratorios. */
const EARLY_SPAWN_DISTANCE = 96;
/** Margen (px) a la derecha de la pantalla en el que ya aparecen los enemigos. */
const SPAWN_MARGIN = 32;
/** Al empezar, no aparecen enemigos a menos de esta distancia de Paco. */
const SAFE_START_DISTANCE = 64;
/** Pasos que tarda la animación de muerte antes de poder continuar. */
const DEATH_MINIMUM_STEPS = 90;
const DEATH_MAXIMUM_STEPS = 200;
/** Pasos que Paco se queda quieto antes de saltar al morir. */
const DEATH_JUMP_DELAY = 30;
const DEATH_JUMP_SPEED = 6;
const DEATH_GRAVITY = 0.3;
/** Pasos de celebración tras vencer al jefe antes de caminar hacia la abuela. */
const BOSS_VICTORY_PAUSE_STEPS = 150;
/** Límite de efectos visuales simultáneos (para no saturar con chispas). */
const MAX_VISUAL_EFFECTS = 220;
/** Desplazamiento vertical de un bloque golpeado en cada paso de su animación. */
const BLOCK_BUMP_OFFSETS = [3, 5, 6, 6, 5, 4, 2, 1];
const RAIN_DROP_COUNT = 80;
const FIREWORK_PROBABILITY_PER_STEP = 0.03;
const FIREWORK_PARTICLES = 18;
const FIREWORK_LIFETIME = 45;
const FIRECRACKER_INTERVAL = { min: 45, max: 90 };
const GROW_FREEZE_STEPS = 30;

/**
 * @typedef {Object} WorldCallbacks
 * @property {(world: World) => void} onLevelCompleted Se ha superado el nivel.
 * @property {(world: World) => void} onPlayerDeathFinished Ha terminado la animación de muerte.
 */

export class World {
  /**
   * @param {Object} options
   * @param {import('../world/levels.js').LevelDefinition} options.levelDefinition Nivel a jugar.
   * @param {number} options.levelIndex Posición del nivel (0 = Madrid); solo se usa en el marcador.
   * @param {import('./GameSession.js').GameSession} options.session Datos de la partida.
   * @param {import('../core/input.js').Controls} options.controls Controles del jugador
   *   (teclado y mando en el juego; controles simulados en los tests).
   * @param {WorldCallbacks} options.callbacks
   */
  constructor({ levelDefinition, levelIndex, session, controls, callbacks }) {
    this.levelDefinition = levelDefinition;
    this.levelIndex = levelIndex;
    this.session = session;
    this.controls = controls;
    this.callbacks = callbacks;

    this.level = this.levelDefinition.build();
    this.tileMap = this.level.tileMap;
    /** Monedas gigantes del nivel principal (para el marcador, aunque Paco esté en una sala). */
    this.levelBigCoinTotal = this.level.bigCoinCount;
    // Solo los datos del tema: las imágenes se piden al dibujar, así la lógica
    // del mundo funciona sin navegador (en los tests).
    this.theme = THEMES[this.level.themeName];

    /** @type {import('../entities/Entity.js').Entity[]} Enemigos, objetos y peligros activos. */
    this.entities = [];
    /** @type {import('../entities/MovingPlatform.js').MovingPlatform[]} */
    this.platforms = [];
    /** @type {VisualEffect[]} */
    this.visualEffects = [];
    /** Bloques que están botando tras un golpe: { column, row, stepsElapsed }. */
    this.blockBumps = [];
    /** Desplazamiento vertical actual de cada bloque que bota, por clave "columna,fila". */
    this.blockBumpOffsets = new Map();
    /** Pesetas que quedan en cada bloque de varias pesetas. */
    this.remainingCoinsInBlocks = new Map();

    this.phase = WORLD_PHASE.PLAYING;
    this.stepsInPhase = 0;
    this.stepCounter = 0;
    this.isPaused = false;
    this.freezeStepsLeft = 0;
    this.shakeStepsLeft = 0;
    this.banner = { text: '', stepsLeft: 0 };
    this.timeRemaining = this.levelDefinition.timeLimit;
    this.stepsUntilNextTimeUnit = LEVEL_TIMER.stepsPerTimeUnit;
    this.stepsUntilNextFirecracker = 60;
    /** @type {GoalSequence|null} */
    this.goalSequence = null;
    this.isBossFightActive = false;
    this.isBossDefeated = false;
    this.stepsSinceBossDefeated = 0;
    this.lifeLostMessage = '';
    this.didFallIntoPit = false;

    this.createPlayer();
    /** Director de la Flor Maravilla del nivel y gestor de las salas secretas. */
    this.wonder = new WonderDirector(this);
    this.areas = new AreaManager(this);
    this.placeCameraOnPlayer();
    this.prepareSpawnQueue();
    this.createWeather();
    soundEngine.playMusic(this.levelDefinition.musicName, { restart: true });
    if (this.isRespawningAtCheckpoint) this.showBanner(GAMEPLAY_MESSAGES.checkpoint, 80);
  }

  /* ================================================================ */
  /* Preparación                                                      */
  /* ================================================================ */

  /** @private Crea a Paco al principio del nivel o en el punto de control. */
  createPlayer() {
    this.isRespawningAtCheckpoint = this.session.hasReachedCheckpoint && this.level.checkpointColumn !== null;
    const startColumn = this.isRespawningAtCheckpoint ? this.level.checkpointColumn : 2;
    this.player = new Player(startColumn * TILE_SIZE + 2, 0);
    this.player.setPowerLevel(this.session.carriedPowerLevel);
    this.player.isChef = this.session.chefMode;
    const groundRow = this.tileMap.findFirstSolidRow(startColumn);
    this.player.y = groundRow * TILE_SIZE - this.player.height;
    this.playerStartX = this.player.x;
  }

  /** @private */
  placeCameraOnPlayer() {
    this.cameraX = clamp(this.player.x - 100, 0, this.levelWidthInPixels - SCREEN_WIDTH);
  }

  /**
   * @private
   * Ordena los puntos de aparición por la X a la que deben activarse y salta
   * los que ya quedan detrás de la cámara (al reaparecer en el punto de control).
   */
  prepareSpawnQueue() {
    this.spawnQueue = this.level.spawnPoints
      .map(spawnPoint => ({
        spawnPoint,
        activationX: spawnPoint.column * TILE_SIZE - (spawnsAheadOfCamera(spawnPoint) ? EARLY_SPAWN_DISTANCE : 0)
      }))
      .sort((first, second) => first.activationX - second.activationX);
    this.nextSpawnIndex = 0;
    while (this.nextSpawnIndex < this.spawnQueue.length && this.spawnQueue[this.nextSpawnIndex].activationX < this.cameraX - 16) {
      this.nextSpawnIndex++;
    }
  }

  /** @private Lluvia (Galicia) y fuegos artificiales (Valencia). */
  createWeather() {
    this.rainDrops = [];
    this.fireworkParticles = [];
    if (!this.theme.hasRain) return;
    for (let drop = 0; drop < RAIN_DROP_COUNT; drop++) {
      this.rainDrops.push({ x: randomBetween(0, SCREEN_WIDTH + 60), y: randomBetween(0, SCREEN_HEIGHT), speed: randomBetween(4, 6) });
    }
  }

  /** Ancho del nivel en píxeles. */
  get levelWidthInPixels() {
    return this.tileMap.widthInTiles * TILE_SIZE;
  }

  /* ================================================================ */
  /* API para las entidades                                           */
  /* ================================================================ */

  /** Añade una entidad al mundo (las plataformas van en su propia lista). */
  addEntity(entity) {
    if (!entity) return;
    if (entity.isMovingPlatform) this.platforms.push(entity);
    else this.entities.push(entity);
  }

  /**
   * Cuenta las entidades que cumplen una condición.
   * @param {(entity: import('../entities/Entity.js').Entity) => boolean} predicate
   */
  countEntities(predicate) {
    return this.entities.filter(predicate).length;
  }

  /**
   * ¿Está la entidad dentro de la pantalla (con un margen opcional)?
   * @param {{x:number, width:number}} entity
   * @param {number} [margin] Positivo = un poco fuera todavía cuenta; negativo = tiene que estar bien dentro.
   */
  isVisible(entity, margin = 16) {
    return entity.x + entity.width > this.cameraX - margin && entity.x < this.cameraX + SCREEN_WIDTH + margin;
  }

  /** ¿Puede Paco recibir daño y moverse ahora mismo? (no durante la meta ni la muerte). */
  isPlayerControllable() {
    return this.phase === WORLD_PHASE.PLAYING && !this.goalSequence;
  }

  /**
   * Suma puntos y muestra la cifra flotando. El valor especial '1UP' da una vida.
   * @param {number|'1UP'} points
   * @param {number} [x] Posición del texto (si no se indica, no se muestra).
   * @param {number} [y]
   */
  awardPoints(points, x, y) {
    if (points === '1UP') {
      this.session.gainExtraLife();
      soundEngine.playSoundEffect(SOUND_EFFECT.EXTRA_LIFE);
      if (x !== undefined) this.showFloatingText('1UP', x, y, '#8cfc8c');
      return;
    }
    this.session.addPoints(points);
    if (x !== undefined) this.showFloatingText(String(points), x, y);
  }

  /**
   * Puntos por el enésimo enemigo derrotado seguido (pisotones o caparazón).
   * @param {number} comboCount Empieza en 1.
   * @returns {number|'1UP'}
   */
  getComboPoints(comboCount) {
    const table = GAME_RULES.stompComboPoints;
    return comboCount - 1 < table.length ? table[comboCount - 1] : '1UP';
  }

  /**
   * Recompensa por pisar a un enemigo: puntos en cadena y, a veces, un meme.
   * @param {import('../entities/enemies/Enemy.js').Enemy} enemy
   * @param {Player} player
   * @param {string} [exclamation] Frase fija (p. ej. "¡OLÉ!" con los toros).
   */
  rewardStomp(enemy, player, exclamation) {
    player.stompCombo++;
    this.spawnImpact(enemy.centerX, enemy.y + enemy.height * 0.5);
    if (enemy.isDancing) {
      for (let coin = 0; coin < 4; coin++) this.addEntity(new FallingCoin(enemy.centerX + (coin - 1.5) * 7, enemy.y - 14 - coin * 4));
    }
    screenFx.hitStop(2 + Math.min(3, player.stompCombo));
    screenFx.shake(0.7 + player.stompCombo * 0.15, 8);
    this.awardPoints(this.getComboPoints(player.stompCombo), enemy.centerX, enemy.y - 4);
    let message = exclamation || null;
    if (!message && enemy.catchphrases && random() < 0.4) message = randomItem(enemy.catchphrases);
    if (!message && (player.stompCombo >= 2 || random() < 0.2)) message = randomItem(STOMP_EXCLAMATIONS);
    if (message) this.showFloatingText(message, enemy.centerX, enemy.y - 16, '#fcd800');
  }

  /** Texto que sube flotando desde un punto del mundo. */
  showFloatingText(text, x, y, color = '#fcfcfc', lifetime = 44) {
    this.visualEffects.push(new VisualEffect(EFFECT_KIND.FLOATING_TEXT, x, y, { text, color, lifetime }));
  }

  /** Mensaje grande en la parte superior de la pantalla. */
  showBanner(text, durationSteps = 120) {
    this.banner = { text, stepsLeft: durationSteps };
  }

  /** @private Añade un efecto si no se ha alcanzado el límite. */
  addVisualEffect(effect) {
    if (this.visualEffects.length < MAX_VISUAL_EFFECTS) this.visualEffects.push(effect);
  }

  spawnPuff(x, y) {
    this.addVisualEffect(new VisualEffect(EFFECT_KIND.PUFF, x, y));
  }

  /** Impacto vistoso: onda expansiva, estrellitas y chispas (pisotones, golpes). */
  spawnImpact(x, y, color = '#ffffff') {
    this.addVisualEffect(new VisualEffect(EFFECT_KIND.RING, x, y, { color, size: 14 }));
    for (let star = 0; star < 5; star++) {
      const angle = (star / 5) * Math.PI * 2 + randomBetween(-0.3, 0.3);
      this.addVisualEffect(new VisualEffect(EFFECT_KIND.STAR, x, y, {
        velocityX: Math.cos(angle) * randomBetween(1.1, 2), velocityY: Math.sin(angle) * randomBetween(1.1, 2) - 0.6,
        color: star % 2 ? '#ffe45a' : '#ffffff', lifetime: 22, size: 3.4
      }));
    }
  }

  spawnSpark(x, y, color = '#fcd800') {
    this.addVisualEffect(new VisualEffect(EFFECT_KIND.SPARK, x, y, { velocityX: randomBetween(-0.6, 0.6), velocityY: randomBetween(-1.2, -0.2), color, lifetime: 20 }));
  }

  spawnDust(x, y) {
    this.addVisualEffect(new VisualEffect(EFFECT_KIND.DUST, x, y, { velocityX: randomBetween(-0.3, 0.3), velocityY: -0.3, lifetime: 22 }));
  }

  spawnBrickDebris(x, y, velocityX, velocityY) {
    this.addVisualEffect(new VisualEffect(EFFECT_KIND.BRICK_DEBRIS, x, y, { velocityX, velocityY, color: this.theme.brickColors.base }));
  }

  /** Destello brillante (monedas, flores, semillas). */
  spawnSparkle(x, y) {
    this.addVisualEffect(new VisualEffect(EFFECT_KIND.STAR, x, y, {
      velocityX: randomBetween(-0.4, 0.4), velocityY: randomBetween(-0.8, -0.2), color: '#ffffff', lifetime: 26, size: 2.6
    }));
  }

  /** Paco toca una Flor Maravilla. */
  triggerWonder(flower) {
    this.wonder.trigger(flower);
  }

  /** Paco coge la Semilla Maravilla del nivel. */
  collectSeed(seed) {
    this.session.collectSeed(this.levelIndex);
    soundEngine.playSoundEffect(SOUND_EFFECT.SEED);
    this.showBanner(GAMEPLAY_MESSAGES.seedCollected, 140);
    this.showFloatingText('+2000', seed.centerX, seed.y - 6, '#ffe45a', 70);
    this.spawnImpact(seed.centerX, seed.centerY, '#ffe45a');
    screenFx.flash('#fff2a0', 0.5);
    screenFx.punch(0.06);
  }

  /** Paco coge una moneda gigante escondida. */
  collectBigCoin(coin) {
    this.session.collectBigCoin(this.levelIndex, coin.coinNumber);
    soundEngine.playSoundEffect(SOUND_EFFECT.BIG_COIN);
    this.showFloatingText('+500', coin.centerX, coin.y - 6, '#ff9aff', 60);
    this.spawnImpact(coin.centerX, coin.centerY, '#ff9aff');
  }

  /** Paco usa una puerta o alcantarilla (entra o sale de una sala secreta). */
  useDoor(door) {
    this.areas.useDoor(door);
  }

  /** Hace temblar la pantalla unos pasos (explosiones, golpes al jefe). */
  shakeScreen(steps) {
    this.shakeStepsLeft = Math.max(this.shakeStepsLeft, steps);
    screenFx.shake(1.4 + steps * 0.18, steps * 2);
    screenFx.flash('#ffffff', 0.18);
  }

  /** Congela la acción unos pasos (al crecer o al recibir un golpe). */
  freezeGameplay(steps) {
    this.freezeStepsLeft = steps;
  }

  /** Paco recoge una peseta suelta o de un bloque. */
  collectCoin() {
    soundEngine.playSoundEffect(SOUND_EFFECT.COIN);
    for (let star = 0; star < 3; star++) {
      this.addVisualEffect(new VisualEffect(EFFECT_KIND.STAR, this.player.centerX + randomBetween(-5, 5), this.player.y + randomBetween(0, 8), {
        velocityX: randomBetween(-0.8, 0.8), velocityY: randomBetween(-1.4, -0.4), color: '#ffe45a', lifetime: 20, size: 2.8
      }));
    }
    if (this.session.addCoin()) {
      soundEngine.playSoundEffect(SOUND_EFFECT.EXTRA_LIFE);
      this.showBanner(GAMEPLAY_MESSAGES.hundredCoins, 100);
    }
  }

  /** Una peseta sale disparada de un bloque golpeado. */
  popCoinOutOfBlock(column, row) {
    this.collectCoin();
    const x = column * TILE_SIZE + 8;
    const y = row * TILE_SIZE - 6;
    this.visualEffects.push(new VisualEffect(EFFECT_KIND.BLOCK_COIN, x, y, {
      velocityY: -5,
      onFinished: effect => this.showFloatingText(String(GAME_RULES.pointsPerCoin), effect.x, effect.y)
    }));
  }

  /** Un bloque golpeado bota hacia arriba unos píxeles. */
  startBlockBumpAnimation(column, row) {
    this.blockBumps.push({ column, row, stepsElapsed: 0 });
  }

  /** Paco ha golpeado algo con la cabeza. */
  handlePlayerHeadBump(player, headBump) {
    handlePlayerHeadBump(this, player, headBump);
  }

  /**
   * Paco recoge un objeto.
   * @param {import('../entities/PowerUpItem.js').PowerUpItem} item
   */
  collectPowerUp(item) {
    const player = this.player;
    const messageY = item.y - 14;
    switch (item.kind) {
      case POWER_UP_KIND.BOCADILLO:
        if (player.powerLevel === POWER_LEVEL.SMALL) this.growPlayer(POWER_LEVEL.BIG);
        this.awardPoints(GAME_RULES.pointsPerPowerUp, item.centerX, item.y);
        soundEngine.playSoundEffect(SOUND_EFFECT.POWER_UP);
        this.showFloatingText(GAMEPLAY_MESSAGES.bocadillo, item.centerX, messageY, '#fcd800');
        break;
      case POWER_UP_KIND.PIMIENTO:
        if (player.powerLevel < POWER_LEVEL.SPICY) this.growPlayer(POWER_LEVEL.SPICY);
        this.awardPoints(GAME_RULES.pointsPerPowerUp, item.centerX, item.y);
        soundEngine.playSoundEffect(SOUND_EFFECT.POWER_UP);
        this.showFloatingText(GAMEPLAY_MESSAGES.pimiento, item.centerX, messageY, '#8cfc8c');
        break;
      case POWER_UP_KIND.CHURROS:
        player.invincibleSteps = GAME_RULES.churrosInvincibilitySteps;
        this.awardPoints(GAME_RULES.pointsPerPowerUp, item.centerX, item.y);
        soundEngine.playMusic('sugarRush', { restart: true });
        this.showFloatingText(GAMEPLAY_MESSAGES.churros, item.centerX, messageY, '#fcb8d8');
        break;
      case POWER_UP_KIND.LOTERIA:
        this.session.gainExtraLife();
        soundEngine.playSoundEffect(SOUND_EFFECT.EXTRA_LIFE);
        this.showFloatingText(GAMEPLAY_MESSAGES.loteria, item.centerX, item.y - 6, '#8cfc8c');
        break;
    }
  }

  /** @private Paco crece con una breve pausa y parpadeo entre tamaños. */
  growPlayer(powerLevel) {
    this.player.setPowerLevel(powerLevel);
    this.player.growAnimationSteps = GROW_FREEZE_STEPS;
    this.freezeGameplay(GROW_FREEZE_STEPS);
  }

  /** Vuelve a sonar la música del nivel (al acabar los churros o la pausa). */
  restoreLevelMusic() {
    if (this.player.isInvincible) return;
    soundEngine.playMusic(this.isBossFightActive && !this.isBossDefeated ? 'boss' : this.levelDefinition.musicName);
    if (this.timeRemaining <= LEVEL_TIMER.hurryWarningTime) soundEngine.setTempoMultiplier(LEVEL_TIMER.hurryMusicTempo);
  }

  /** ¿Está la cámara bloqueada en la arena del jefe (combate sin terminar)? */
  isBossArenaLocked() {
    return Boolean(this.level.bossArena) && !this.isBossDefeated;
  }

  /** ¿Ha llegado la cámara a la arena del jefe? */
  isCameraAtBossArena() {
    return Boolean(this.level.bossArena) && this.cameraX >= this.level.bossArena.firstColumn * TILE_SIZE - 1;
  }

  /** El jefe anuncia el comienzo del combate. */
  startBossFight() {
    this.isBossFightActive = true;
    soundEngine.playMusic('boss');
    this.showBanner(GAMEPLAY_MESSAGES.bossIntro, 150);
  }

  /** El jefe ha caído a la lava: Paco ha recuperado la receta. */
  onBossFallen() {
    this.isBossDefeated = true;
    this.entities = this.entities.filter(entity => !(entity instanceof TaxInvoice));
    soundEngine.playMusic('fanfare', { restart: true });
    this.showBanner(GAMEPLAY_MESSAGES.recipeRecovered, 220);
    this.stepsSinceBossDefeated = 0;
  }

  /**
   * Posición X máxima de Paco: el final del nivel o, durante la batalla final,
   * el borde derecho de la pantalla.
   */
  getPlayerMaximumX(player) {
    return this.isBossArenaLocked() ? this.cameraX + SCREEN_WIDTH - player.width : this.levelWidthInPixels - player.width;
  }

  /**
   * Paco pierde una vida.
   * @param {{fellIntoPit?: boolean, burned?: boolean}} cause
   */
  killPlayer({ fellIntoPit = false, burned = false } = {}) {
    const player = this.player;
    if (player.isDead || this.phase !== WORLD_PHASE.PLAYING) return;
    player.isDead = true;
    player.invincibleSteps = 0;
    player.invulnerableSteps = 0;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isHidden = false;
    if (player.isBig) player.setPowerLevel(POWER_LEVEL.SMALL);
    this.phase = WORLD_PHASE.PLAYER_DYING;
    this.stepsInPhase = 0;
    screenFx.flash(burned ? '#ff7a30' : '#ff3a3a', 0.55);
    screenFx.hitStop(10);
    screenFx.shake(2.6, 22);
    this.spawnImpact(player.centerX, player.centerY, '#ff5a5a');
    this.didFallIntoPit = fellIntoPit;
    this.isPaused = false;
    this.lifeLostMessage = randomItem(burned ? BURNED_MESSAGES : LIFE_LOST_MESSAGES);
    soundEngine.stopMusic();
    soundEngine.playMusic('lifeLost', { restart: true });
  }

  /* ================================================================ */
  /* Actualización                                                    */
  /* ================================================================ */

  /** Avanza el mundo un paso de simulación. */
  update() {
    this.stepCounter++;
    this.stepsInPhase++;
    if (this.banner.stepsLeft > 0) this.banner.stepsLeft--;
    if (this.phase === WORLD_PHASE.PLAYING) this.updatePlaying();
    else this.updatePlayerDying();
  }

  /** @private Un paso de juego normal. */
  updatePlaying() {
    if (this.controls.wasPressed(BUTTON.PAUSE) && !this.goalSequence) this.togglePause();
    if (this.isPaused) return;
    if (this.freezeStepsLeft > 0) {
      this.freezeStepsLeft--;
      if (this.player.growAnimationSteps > 0) this.player.growAnimationSteps--;
      return;
    }
    if (this.shakeStepsLeft > 0) this.shakeStepsLeft--;

    if (this.areas.update()) {
      for (const effect of this.visualEffects) effect.update();
      return;
    }
    this.updateLevelTimer();
    if (this.phase !== WORLD_PHASE.PLAYING) return;
    this.activateSpawnPointsEnteringView();

    for (const platform of this.platforms) platform.update(this);
    if (this.goalSequence) this.goalSequence.update();
    else this.player.update(this);
    if (this.phase !== WORLD_PHASE.PLAYING) return;
    this.wonder.update();

    for (const entity of this.entities) if (!entity.shouldBeRemoved) entity.update(this);
    this.turnAroundEnemiesThatCollide();
    this.resolvePlayerContacts();
    if (this.phase !== WORLD_PHASE.PLAYING) return;

    this.dropFirecrackersNearPlayer();
    this.checkGoalReached();
    this.checkCheckpointReached();
    if (this.updateBossVictoryWalk()) return;
    if (this.goalSequence && this.goalSequence.isComplete) {
      this.callbacks.onLevelCompleted(this);
      return;
    }

    this.removeFinishedObjects();
    this.updateEffectsAndScenery();
    this.updateCamera();
  }

  /** @private La siesta: detiene el juego y la música. */
  togglePause() {
    this.isPaused = !this.isPaused;
    soundEngine.playSoundEffect(SOUND_EFFECT.PAUSE);
    if (this.isPaused) soundEngine.stopMusic();
    else this.restoreLevelMusic();
  }

  /** @private Cuenta atrás; al llegar a 100 avisa y acelera la música; al llegar a 0, Paco pierde una vida. */
  updateLevelTimer() {
    if (this.goalSequence || this.isBossDefeated) return;
    if (--this.stepsUntilNextTimeUnit > 0) return;
    this.stepsUntilNextTimeUnit = LEVEL_TIMER.stepsPerTimeUnit;
    this.timeRemaining--;
    if (this.timeRemaining === LEVEL_TIMER.hurryWarningTime) {
      this.showBanner(GAMEPLAY_MESSAGES.hurry, 120);
      soundEngine.setTempoMultiplier(LEVEL_TIMER.hurryMusicTempo);
    }
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.killPlayer();
    }
  }

  /** @private Crea las entidades cuya posición está a punto de entrar en pantalla. */
  activateSpawnPointsEnteringView() {
    const activationLimit = this.cameraX + SCREEN_WIDTH + SPAWN_MARGIN;
    const isLevelStart = this.stepsInPhase <= 2;
    while (this.nextSpawnIndex < this.spawnQueue.length && this.spawnQueue[this.nextSpawnIndex].activationX < activationLimit) {
      const { spawnPoint } = this.spawnQueue[this.nextSpawnIndex++];
      // Nada de enemigos pegados a Paco justo al empezar o reaparecer.
      const isTooCloseToStart = isLevelStart && isEnemySpawn(spawnPoint) && Math.abs(spawnPoint.column * TILE_SIZE - this.playerStartX) < SAFE_START_DISTANCE;
      if (isTooCloseToStart) continue;
      const entity = createEntityForSpawnPoint(spawnPoint, this.level, this.theme);
      this.addEntity(entity);
      if (entity) this.wonder.applyToEntity(entity);
    }
  }

  /** @private Los enemigos que caminan se dan la vuelta al chocar entre ellos. */
  turnAroundEnemiesThatCollide() {
    const walkers = this.entities.filter(entity => entity.turnsAroundOnEnemyContact && !entity.isDefeated);
    for (let first = 0; first < walkers.length; first++) {
      for (let second = first + 1; second < walkers.length; second++) {
        const enemyA = walkers[first];
        const enemyB = walkers[second];
        if (!rectanglesOverlap(enemyA, enemyB)) continue;
        const aWalksTowardsB = (enemyA.x < enemyB.x && enemyA.facing > 0) || (enemyA.x > enemyB.x && enemyA.facing < 0);
        const bWalksTowardsA = (enemyB.x < enemyA.x && enemyB.facing > 0) || (enemyB.x > enemyA.x && enemyB.facing < 0);
        if (aWalksTowardsB) enemyA.facing *= -1;
        if (bWalksTowardsA) enemyB.facing *= -1;
      }
    }
  }

  /** @private Avisa a cada entidad que esté tocando a Paco. */
  resolvePlayerContacts() {
    const player = this.player;
    if (player.isDead || this.goalSequence) return;
    for (const entity of this.entities) {
      if (entity.shouldBeRemoved || entity.isDefeated || !entity.onPlayerContact) continue;
      const isTouching = entity.collidesWithPlayer ? entity.collidesWithPlayer(player) : rectanglesOverlap(player, entity.getHitbox());
      if (!isTouching) continue;
      entity.onPlayerContact(player, this);
      if (this.phase !== WORLD_PHASE.PLAYING) return;
    }
  }

  /** @private En las zonas de mascletà caen petardos cerca de Paco. */
  dropFirecrackersNearPlayer() {
    if (this.goalSequence) return;
    const playerX = this.player.x;
    const isInZone = this.level.firecrackerZones.some(zone => playerX > zone.startX && playerX < zone.endX);
    if (!isInZone || --this.stepsUntilNextFirecracker > 0) return;
    this.stepsUntilNextFirecracker = randomInteger(FIRECRACKER_INTERVAL.min, FIRECRACKER_INTERVAL.max);
    this.addEntity(new FallingFirecracker(playerX + randomBetween(-40, 160)));
  }

  /** @private ¿Ha tocado Paco la cucaña? */
  checkGoalReached() {
    if (this.goalSequence || this.level.goalColumn === null) return;
    const poleTouchX = this.level.goalColumn * TILE_SIZE + 6;
    if (this.player.x + this.player.width >= poleTouchX) this.goalSequence = new GoalSequence(this);
  }

  /** @private ¿Ha pasado Paco el punto de control? */
  checkCheckpointReached() {
    const checkpointColumn = this.level.checkpointColumn;
    if (checkpointColumn === null || this.session.hasReachedCheckpoint) return;
    if (this.player.x < checkpointColumn * TILE_SIZE) return;
    this.session.hasReachedCheckpoint = true;
    soundEngine.playSoundEffect(SOUND_EFFECT.CHECKPOINT);
    this.showFloatingText(GAMEPLAY_MESSAGES.checkpoint, checkpointColumn * TILE_SIZE + 12, 150, '#8cfc8c', 70);
  }

  /**
   * @private
   * Tras vencer al jefe, Paco celebra y luego camina solo hasta la abuela.
   * @returns {boolean} true si el nivel se ha completado en este paso.
   */
  updateBossVictoryWalk() {
    if (!this.isBossDefeated) return false;
    this.stepsSinceBossDefeated++;
    if (this.stepsSinceBossDefeated > BOSS_VICTORY_PAUSE_STEPS) {
      this.player.hasControl = false;
      this.player.autoWalkSpeed = PLAYER_PHYSICS.autoWalkSpeed;
    }
    if (this.player.x >= FINAL_ROOM_END_COLUMN * TILE_SIZE) {
      this.callbacks.onLevelCompleted(this);
      return true;
    }
    return false;
  }

  /** @private Quita de las listas lo que ya ha terminado. */
  removeFinishedObjects() {
    this.entities = this.entities.filter(entity => !entity.shouldBeRemoved);
    this.platforms = this.platforms.filter(platform => !platform.shouldBeRemoved);
  }

  /** @private Efectos, bloques que botan, lluvia y fuegos artificiales. */
  updateEffectsAndScenery() {
    for (const effect of this.visualEffects) effect.update();
    this.visualEffects = this.visualEffects.filter(effect => !effect.shouldBeRemoved);

    this.blockBumpOffsets.clear();
    for (const bump of this.blockBumps) {
      bump.stepsElapsed++;
      if (bump.stepsElapsed < BLOCK_BUMP_OFFSETS.length) this.blockBumpOffsets.set(`${bump.column},${bump.row}`, BLOCK_BUMP_OFFSETS[bump.stepsElapsed]);
    }
    this.blockBumps = this.blockBumps.filter(bump => bump.stepsElapsed < BLOCK_BUMP_OFFSETS.length);

    for (const drop of this.rainDrops) {
      drop.y += drop.speed;
      drop.x -= drop.speed * 0.3;
      if (drop.y > SCREEN_HEIGHT) {
        drop.y = -6;
        drop.x = randomBetween(0, SCREEN_WIDTH + 60);
      }
    }
    if (this.theme.hasFireworks) this.updateFireworks();
  }

  /** @private Estallidos de colores en el cielo de Valencia. */
  updateFireworks() {
    if (random() < FIREWORK_PROBABILITY_PER_STEP) {
      const centerX = randomBetween(20, SCREEN_WIDTH - 20);
      const centerY = randomBetween(20, 110);
      const color = randomItem(['#fc5c5c', '#fcd800', '#8cfc8c', '#8cc8fc', '#fcb8fc']);
      for (let particle = 0; particle < FIREWORK_PARTICLES; particle++) {
        const angle = particle / FIREWORK_PARTICLES * Math.PI * 2;
        this.fireworkParticles.push({ x: centerX, y: centerY, velocityX: Math.cos(angle) * 1.3, velocityY: Math.sin(angle) * 1.3, color, ageInSteps: 0 });
      }
    }
    for (const particle of this.fireworkParticles) {
      particle.ageInSteps++;
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityY += 0.02;
      particle.velocityX *= 0.97;
    }
    this.fireworkParticles = this.fireworkParticles.filter(particle => particle.ageInSteps < FIREWORK_LIFETIME);
  }

  /**
   * @private
   * La cámara solo avanza hacia la derecha y mantiene a Paco cerca del centro.
   * En la batalla final se detiene en la arena hasta vencer al jefe.
   */
  updateCamera() {
    const cameraLimit = this.isBossArenaLocked() ? this.level.bossArena.firstColumn * TILE_SIZE : this.levelWidthInPixels - SCREEN_WIDTH;
    const desiredCameraX = this.player.centerX - CAMERA_PLAYER_SCREEN_X;
    if (desiredCameraX > this.cameraX) this.cameraX = Math.min(desiredCameraX, cameraLimit);
    this.cameraX = clamp(this.cameraX, 0, this.levelWidthInPixels - SCREEN_WIDTH);
  }

  /** @private Paco da un salto y cae fuera de la pantalla; después se avisa al juego. */
  updatePlayerDying() {
    const player = this.player;
    if (!this.didFallIntoPit && this.stepsInPhase > DEATH_JUMP_DELAY) {
      if (this.stepsInPhase === DEATH_JUMP_DELAY + 1) player.velocityY = -DEATH_JUMP_SPEED;
      player.velocityY += DEATH_GRAVITY;
      player.y += player.velocityY;
    }
    this.updateEffectsAndScenery();
    const canSkip = this.stepsInPhase > DEATH_MINIMUM_STEPS && this.controls.wasConfirmPressed();
    if (this.stepsInPhase > DEATH_MAXIMUM_STEPS || canSkip) this.callbacks.onPlayerDeathFinished(this);
  }

  /* ================================================================ */
  /* Dibujo                                                           */
  /* ================================================================ */

  /**
   * Dibuja la escena completa del nivel.
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   */
  draw(context) {
    const { tileImages, backgroundImages } = getThemeAssets(this.level.themeName);
    const shakeOffset = this.shakeStepsLeft > 0 ? (this.stepCounter % 2 ? 2 : -2) : 0;
    const cameraX = Math.round(this.cameraX) + shakeOffset;

    drawBackground(context, backgroundImages, this.theme, cameraX, this.fireworkParticles, this.stepCounter);
    drawDecorations(context, {
      decorations: this.level.decorations,
      theme: this.theme,
      isCheckpointReached: this.session.hasReachedCheckpoint,
      hamY: this.goalSequence ? this.goalSequence.hamY : null,
      stepCounter: this.stepCounter
    }, cameraX);
    for (const entity of this.entities) if (entity.drawsBehindTiles) entity.draw(context, cameraX);
    drawTileLayer(context, {
      tileMap: this.tileMap,
      tileImages,
      theme: this.theme,
      blockBumpOffsets: this.blockBumpOffsets,
      stepCounter: this.stepCounter,
      isBeatWarning: this.wonder.isBeatWarning
    }, cameraX);
    for (const platform of this.platforms) platform.draw(context, cameraX);
    drawShadows(context, { tileMap: this.tileMap, entities: this.entities, player: this.player }, cameraX);
    for (const entity of this.entities) if (!entity.drawsBehindTiles) entity.draw(context, cameraX);
    this.player.draw(context, cameraX);
    for (const effect of this.visualEffects) effect.draw(context, cameraX);
    if (this.theme.hasRain) drawRain(context, this.rainDrops);
    this.drawAtmosphere(context, cameraX);

    drawHud(context, {
      session: this.session,
      levelNumber: this.levelIndex + 1,
      levelName: this.levelDefinition.name,
      timeRemaining: this.timeRemaining,
      stepCounter: this.stepCounter,
      hasSeed: this.session.seeds.has(this.levelIndex),
      bigCoins: this.session.countBigCoinsInLevel(this.levelIndex),
      bigCoinTotal: this.levelBigCoinTotal
    });
    this.drawMessages(context);
    if (this.isPaused) this.drawPauseOverlay(context);
    drawIrisOpening(context, this.areas.irisOpenness);
  }

  /**
   * @private Iluminación y tono de color del nivel (luz de Paco, antorchas, oscuridad).
   * @param {CanvasRenderingContext2D} context
   * @param {number} cameraX
   */
  drawAtmosphere(context, cameraX) {
    const theme = this.theme;
    screenFx.grade = theme.grade || { color: '#000000', alpha: 0, mode: 'soft-light' };
    screenFx.vignette = theme.vignette === undefined ? 0.5 : theme.vignette;
    screenFx.bloom = theme.bloom === undefined ? 0.28 : theme.bloom;
    // Las maravillas tiñen el nivel de colores que van cambiando.
    if (screenFx.wonder > 0.02) {
      screenFx.grade = { color: `hsl(${(this.stepCounter * 3) % 360}, 95%, 60%)`, alpha: 0.3 * screenFx.wonder, mode: 'soft-light' };
      screenFx.bloom = Math.max(screenFx.bloom, 0.5 * screenFx.wonder);
    }
    const lighting = this.wonder.lighting || theme.lighting;
    if (!lighting) return;
    const lights = [];
    if (theme.name === 'hacienda') lights.push(...drawTorches(context, cameraX, this.stepCounter));
    if (!this.player.isDead) lights.push({ x: this.player.centerX - cameraX, y: this.player.centerY, radius: lighting.playerLightRadius });
    for (const entity of this.entities) {
      if (entity.isWonderLight && this.isVisible(entity)) lights.push({ x: entity.centerX - cameraX, y: entity.centerY, radius: 34 });
    }
    drawLighting(context, lighting, lights);
  }

  /**
   * @private Mensaje grande superior y meme al perder una vida.
   * @param {CanvasRenderingContext2D} context
   */
  drawMessages(context) {
    if (this.banner.stepsLeft > 0) {
      drawText(context, this.banner.text, SCREEN_WIDTH / 2, 44, '#fcd800', { align: 'center', outlineColor: '#000000' });
    }
    if (this.phase === WORLD_PHASE.PLAYER_DYING && this.stepsInPhase > 20) {
      const message = this.lifeLostMessage;
      const scale = measureTextWidth(message, 2) <= 300 ? 2 : 1;
      drawText(context, message, SCREEN_WIDTH / 2, 96, '#fcfcfc', { align: 'center', outlineColor: '#000000', scale });
    }
  }

  /**
   * @private Pantalla de "SIESTA" (pausa).
   * @param {CanvasRenderingContext2D} context
   */
  drawPauseOverlay(context) {
    context.fillStyle = 'rgba(8,6,20,0.72)';
    context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    drawText(context, 'SIESTA', SCREEN_WIDTH / 2, 84, '#fcd800', { align: 'center', outlineColor: '#000000', scale: 3 });
    const snoreLength = 1 + Math.floor(this.stepCounter / 32) % 3;
    drawText(context, 'Z'.repeat(snoreLength), SCREEN_WIDTH / 2 + 70, 72 - snoreLength * 4, '#8cc8fc');
    drawText(context, 'PULSA P PARA DESPERTAR', SCREEN_WIDTH / 2, 124, '#fcfcfc', { align: 'center' });
    drawText(context, 'M: SONIDO   F: PANTALLA COMPLETA', SCREEN_WIDTH / 2, 142, '#9c9cb0', { align: 'center' });
  }
}
