/**
 * @file Director de las maravillas: lo que pasa cuando Paco toca una Flor
 * Maravilla. Cada nivel tiene una que transforma el tramo hasta `endColumn`:
 *
 *   - moon: gravedad lunar (saltos enormes y caídas lentas).
 *   - rain: llueven pesetas del cielo.
 *   - rhythm: las plataformas al ritmo se alternan con la música.
 *   - dark: apagón; solo se ve alrededor de Paco.
 *   - stampede: un toro gigante persigue a Paco.
 *   - parade: los enemigos del tramo bailan y se vuelven inofensivos.
 *
 * Al llegar al final del tramo aparece la Semilla Maravilla.
 */
import { TILE_SIZE, SCREEN_WIDTH } from '../config/constants.js';
import { randomBetween, rectanglesOverlap } from '../core/math.js';
import { soundEngine, SOUND_EFFECT } from '../audio/soundEngine.js';
import { screenFx } from '../graphics/screenFx.js';
import { TILE, isBeatTile, toggleBeatTile } from '../world/tileTypes.js';
import { GAMEPLAY_MESSAGES } from '../world/texts.js';
import { FallingCoin } from '../entities/wonder/FallingCoin.js';
import { StampedeBull } from '../entities/wonder/StampedeBull.js';
import { WonderSeed } from '../entities/wonder/WonderSeed.js';

/** Gravedad de Paco durante la maravilla lunar (1 = normal). */
const MOON_GRAVITY_SCALE = 0.38;
/** Pasos entre pulsos de las plataformas al ritmo. */
const BEAT_PERIOD_STEPS = 56;
/** Pasos antes del pulso en los que las plataformas que van a cambiar parpadean. */
const BEAT_WARNING_STEPS = 16;
/** Pasos entre pesetas de la lluvia. */
const RAIN_INTERVAL_STEPS = 5;
/** Oscuridad del apagón. */
const DARK_LIGHTING = Object.freeze({ darkness: 0.9, color: '#02010a', playerLightRadius: 52 });
/** Distancia a la que nace el toro de la estampida, por detrás de Paco. */
const STAMPEDE_SPAWN_GAP = 150;
/** Música de cada tipo de maravilla. */
const WONDER_MUSIC = Object.freeze({ dark: 'maravillaSombra', stampede: 'maravillaSombra' });

export class WonderDirector {
  /** @param {import('./World.js').World} world */
  constructor(world) {
    this.world = world;
    /** @type {{kind: string, startX: number, endX: number, steps: number}|null} */
    this.active = null;
    this.hasTriggered = false;
    this.beatTiles = [];
    this.beatCountdown = BEAT_PERIOD_STEPS;
    this.rainCountdown = RAIN_INTERVAL_STEPS;
    this.putBeatTilesToSleep();
  }

  /** @private Al empezar el nivel, las plataformas al ritmo están "dormidas" (fantasma). */
  putBeatTilesToSleep() {
    const tileMap = this.world.tileMap;
    this.beatTiles = [];
    for (let row = 0; row < tileMap.heightInTiles; row++) {
      for (let column = 0; column < tileMap.widthInTiles; column++) {
        const tile = tileMap.getTile(column, row);
        if (!isBeatTile(tile)) continue;
        this.beatTiles.push({ column, row, group: tile === TILE.BEAT_A_ON || tile === TILE.BEAT_A_OFF ? 'A' : 'B' });
        tileMap.setTile(column, row, tile === TILE.BEAT_A_ON || tile === TILE.BEAT_A_OFF ? TILE.BEAT_A_OFF : TILE.BEAT_B_OFF);
      }
    }
  }

  /** ¿Hay una maravilla en marcha? */
  get isActive() {
    return this.active !== null;
  }

  /** ¿Parpadean ahora las plataformas al ritmo (aviso de cambio)? */
  get isBeatWarning() {
    return this.isActive && this.active.kind === 'rhythm' && this.beatCountdown <= BEAT_WARNING_STEPS;
  }

  /** Iluminación especial de la maravilla (o null si no hay). */
  get lighting() {
    return this.isActive && this.active.kind === 'dark' ? DARK_LIGHTING : null;
  }

  /**
   * Paco ha tocado una Flor Maravilla.
   * @param {{eventKind: string, endColumn: number, centerX: number, centerY: number}} flower
   */
  trigger(flower) {
    if (this.hasTriggered) return;
    const world = this.world;
    this.hasTriggered = true;
    this.active = { kind: flower.eventKind, startX: flower.centerX, endX: flower.endColumn * TILE_SIZE, steps: 0 };
    soundEngine.playSoundEffect(SOUND_EFFECT.WONDER_START);
    soundEngine.playMusic(WONDER_MUSIC[flower.eventKind] || 'maravilla', { restart: true });
    world.showBanner(GAMEPLAY_MESSAGES.wonderBanner[flower.eventKind] || GAMEPLAY_MESSAGES.wonderBanner.default, 150);
    screenFx.flash('#ffffff', 0.8);
    screenFx.punch(0.08);
    screenFx.shake(2, 14);
    world.spawnImpact(flower.centerX, flower.centerY, '#ff9aff');
    for (let ring = 0; ring < 3; ring++) world.spawnImpact(flower.centerX + (ring - 1) * 10, flower.centerY - ring * 4, ring % 2 ? '#7ad8ff' : '#ffe45a');

    switch (flower.eventKind) {
      case 'moon':
        world.player.gravityScale = MOON_GRAVITY_SCALE;
        break;
      case 'rhythm':
        for (const beat of this.beatTiles) world.tileMap.setTile(beat.column, beat.row, beat.group === 'A' ? TILE.BEAT_A_ON : TILE.BEAT_B_OFF);
        this.beatCountdown = BEAT_PERIOD_STEPS;
        break;
      case 'stampede':
        world.addEntity(new StampedeBull(world.player.x - STAMPEDE_SPAWN_GAP));
        break;
      case 'parade':
        for (const entity of world.entities) this.applyToEntity(entity);
        break;
      default:
        break;
    }
  }

  /**
   * Aplica el efecto del desfile a un enemigo recién aparecido o ya presente.
   * @param {import('../entities/Entity.js').Entity} entity
   */
  applyToEntity(entity) {
    if (!this.isActive || this.active.kind !== 'parade' || !entity.isEnemy || entity.isDefeated) return;
    if (entity.x < this.active.startX - TILE_SIZE * 4 || entity.x > this.active.endX) return;
    entity.isDancing = true;
    entity.isHarmful = false;
  }

  /** Avanza la maravilla un paso. */
  update() {
    const world = this.world;
    world.player.gravityScale = this.isActive && this.active.kind === 'moon' ? MOON_GRAVITY_SCALE : 1;
    screenFx.wonderTarget = this.isActive ? 1 : 0;
    if (!this.isActive) return;
    const wonder = this.active;
    wonder.steps++;

    if (wonder.kind === 'rain' && --this.rainCountdown <= 0) {
      this.rainCountdown = RAIN_INTERVAL_STEPS;
      world.addEntity(new FallingCoin(world.player.centerX + randomBetween(-110, SCREEN_WIDTH * 0.5), -8));
    }
    if (wonder.kind === 'rhythm') this.updateBeat();

    const reachedEnd = world.player.x > wonder.endX;
    if (reachedEnd) this.end();
  }

  /** @private Cuenta atrás del pulso y cambio de plataformas. */
  updateBeat() {
    const tileMap = this.world.tileMap;
    if (--this.beatCountdown > 0) return;
    this.beatCountdown = BEAT_PERIOD_STEPS;
    soundEngine.playSoundEffect(SOUND_EFFECT.BEAT);
    const player = this.world.player;
    for (const beat of this.beatTiles) {
      const tile = tileMap.getTile(beat.column, beat.row);
      const next = toggleBeatTile(tile);
      const isBecomingSolid = next === TILE.BEAT_A_ON || next === TILE.BEAT_B_ON;
      const tileBox = { x: beat.column * TILE_SIZE, y: beat.row * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE };
      // Si Paco está dentro, la plataforma espera al siguiente pulso.
      if (isBecomingSolid && rectanglesOverlap(player, tileBox)) continue;
      tileMap.setTile(beat.column, beat.row, next);
    }
  }

  /** Termina la maravilla: todo vuelve a la normalidad y aparece la semilla. */
  end() {
    const world = this.world;
    const wonder = this.active;
    this.active = null;
    world.player.gravityScale = 1;
    soundEngine.playSoundEffect(SOUND_EFFECT.WONDER_END);
    world.restoreLevelMusic();
    world.entities = world.entities.filter(entity => !(entity instanceof StampedeBull) && !(entity instanceof FallingCoin));
    for (const entity of world.entities) entity.isDancing = false;
    screenFx.flash('#ffffff', 0.5);
    const seedColumn = Math.floor(wonder.endX / TILE_SIZE) + 3;
    world.addEntity(new WonderSeed(seedColumn, 9));
    world.showBanner(GAMEPLAY_MESSAGES.wonderSeedAppears, 120);
    world.spawnImpact(seedColumn * TILE_SIZE + 8, 9 * TILE_SIZE + 8, '#ffe45a');
  }
}
