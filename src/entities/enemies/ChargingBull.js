/**
 * @file Toro de San Fermín. Pasea despacio y, cuando ve a Paco delante a su
 * misma altura, escarba el suelo y embiste a toda velocidad. Si choca con una
 * pared se queda aturdido un momento. Se le puede saltar encima.
 */
import { TILE_SIZE } from '../../config/constants.js';
import { soundEngine, SOUND_EFFECT } from '../../audio/soundEngine.js';
import { moveHorizontally, moveVertically } from '../../world/tileCollision.js';
import { Enemy } from './Enemy.js';

/** Estados del toro. */
export const BULL_STATE = Object.freeze({ WANDERING: 'wandering', PREPARING: 'preparing', CHARGING: 'charging', STUNNED: 'stunned' });
const WANDER_SPEED = 0.4;
const CHARGE_SPEED = 2.9;
/** Distancia horizontal (px) a la que el toro detecta a Paco. */
const SIGHT_DISTANCE = 200;
/** Diferencia de altura (px) máxima para verle. */
const SIGHT_HEIGHT_TOLERANCE = 40;
const PREPARE_STEPS = 36;
const CHARGE_STEPS = 160;
const STUN_STEPS = 50;
/** Cada cuántos pasos mira hacia donde está Paco mientras pasea. */
const LOOK_AROUND_INTERVAL = 90;

export class ChargingBull extends Enemy {
  /**
   * @param {number} column
   * @param {number} row Fila que pisa.
   */
  constructor(column, row) {
    super(column * TILE_SIZE, (row + 1) * TILE_SIZE - 15, 22, 15);
    this.state = BULL_STATE.WANDERING;
    this.stateStepsLeft = 0;
    this.catchphrases = ['¡OLÉ!', '¡TORERO!'];
  }

  /** @param {import('../../game/World.js').World} world */
  update(world) {
    if (this.updateDefeatAnimation()) return;
    this.ageInSteps++;
    this.applyGravity();

    switch (this.state) {
      case BULL_STATE.WANDERING: this.wander(world); break;
      case BULL_STATE.PREPARING: this.prepareCharge(world); break;
      case BULL_STATE.CHARGING: this.charge(world); break;
      case BULL_STATE.STUNNED:
        this.velocityX = 0;
        if (--this.stateStepsLeft <= 0) this.state = BULL_STATE.WANDERING;
        break;
    }

    if (moveHorizontally(this, world.tileMap)) {
      if (this.state === BULL_STATE.CHARGING) {
        this.state = BULL_STATE.STUNNED;
        this.stateStepsLeft = STUN_STEPS;
        if (world.isVisible(this)) soundEngine.playSoundEffect(SOUND_EFFECT.BUMP);
      }
      this.facing *= -1;
    }
    moveVertically(this, world.tileMap);
    this.removeIfOutsideWorld(world);
  }

  /** @private Pasea y vigila si Paco está delante. */
  wander(world) {
    const player = world.player;
    this.velocityX = this.facing * WANDER_SPEED;
    const horizontalDistance = player.centerX - this.centerX;
    const verticalDistance = player.bottom - this.bottom;
    const seesPlayer = !player.isDead && world.isVisible(this, -8) &&
      Math.abs(horizontalDistance) < SIGHT_DISTANCE && Math.abs(verticalDistance) < SIGHT_HEIGHT_TOLERANCE &&
      Math.sign(horizontalDistance) === this.facing;
    if (seesPlayer) {
      this.state = BULL_STATE.PREPARING;
      this.stateStepsLeft = PREPARE_STEPS;
      soundEngine.playSoundEffect(SOUND_EFFECT.BULL_SNORT);
    } else if (this.ageInSteps % LOOK_AROUND_INTERVAL === 0 && Math.abs(horizontalDistance) < SIGHT_DISTANCE + 60 && horizontalDistance) {
      this.facing = Math.sign(horizontalDistance);
    }
  }

  /** @private Escarba el suelo antes de embestir. */
  prepareCharge(world) {
    this.velocityX = 0;
    if (this.ageInSteps % 8 === 0) world.spawnDust(this.facing > 0 ? this.x : this.x + this.width, this.bottom);
    if (--this.stateStepsLeft <= 0) {
      this.state = BULL_STATE.CHARGING;
      this.stateStepsLeft = CHARGE_STEPS;
    }
  }

  /** @private Corre en línea recta levantando polvo. */
  charge(world) {
    this.velocityX = this.facing * CHARGE_SPEED;
    if (this.ageInSteps % 5 === 0) world.spawnDust(this.facing > 0 ? this.x : this.x + this.width, this.bottom);
    if (--this.stateStepsLeft <= 0) this.state = BULL_STATE.WANDERING;
  }

  /** Al pisarlo, el toro cae derrotado y el público grita "¡Olé!". */
  onStomped(player, world) {
    this.knockOut(0);
    world.rewardStomp(this, player, '¡OLÉ!');
    soundEngine.playSoundEffect(SOUND_EFFECT.STOMP);
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    let spriteName = 'toro_frame1';
    let shakeOffset = 0;
    if (this.state === BULL_STATE.PREPARING) {
      spriteName = (this.ageInSteps >> 2) & 1 ? this.getFrameName('toro_angry', 4) : 'toro_frame1';
      shakeOffset = this.ageInSteps & 1 ? 1 : -1;
    } else if (this.velocityX) {
      const isCharging = this.state === BULL_STATE.CHARGING;
      spriteName = this.getFrameName(isCharging ? 'toro_angry' : 'toro', isCharging ? 3 : 7);
    }
    this.drawCenteredSprite(context, spriteName, cameraX, { mirrored: this.facing > 0, offsetX: shakeOffset });
  }
}
