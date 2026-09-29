/**
 * @file Escena automática al llegar a la meta de un nivel.
 *
 * Fases:
 *   1. Paco se agarra a la cucaña y baja resbalando junto al jamón.
 *   2. Espera un instante abajo.
 *   3. Camina solo hasta la puerta del bar y entra ("¡Una caña, por favor!").
 *   4. El tiempo que sobraba se convierte en puntos.
 *   5. Pausa final; después el nivel se da por completado.
 */
import { TILE_SIZE, GAME_RULES, GROUND_TOP_ROW, PLAYER_PHYSICS } from '../config/constants.js';
import { soundEngine, SOUND_EFFECT } from '../audio/soundEngine.js';
import { GOAL_POLE_TOP_ROW } from '../world/LevelBuilder.js';
import { GAMEPLAY_MESSAGES } from '../world/texts.js';
import { BAR_SIZE } from '../graphics/decorationImages.js';

const PHASE = Object.freeze({
  SLIDING_DOWN_POLE: 'slidingDownPole',
  WAITING_AT_BOTTOM: 'waitingAtBottom',
  WALKING_TO_BAR: 'walkingToBar',
  COUNTING_TIME_BONUS: 'countingTimeBonus',
  FINISHED: 'finished'
});

const SLIDE_SPEED = 2;
/** Altura inicial (px) del jamón colgado en lo alto de la cucaña. */
export const HAM_START_Y = 52;
const HAM_HEIGHT = 14;
const WAIT_AT_BOTTOM_STEPS = 20;
const PAUSE_BEFORE_COUNTING_STEPS = 30;
/** Unidades de tiempo que se convierten en puntos en cada paso. */
const TIME_UNITS_PER_STEP = 3;
const FINAL_PAUSE_STEPS = 80;
/** Distancia (px) desde el borde izquierdo del bar hasta su columna. */
const BAR_COLUMN_OFFSET = 4;

export class GoalSequence {
  /**
   * Empieza la escena en el momento en que Paco toca la cucaña.
   * @param {import('./World.js').World} world
   */
  constructor(world) {
    this.world = world;
    const goalColumn = world.level.goalColumn;
    this.poleX = goalColumn * TILE_SIZE + TILE_SIZE / 2;
    this.poleTopY = GOAL_POLE_TOP_ROW * TILE_SIZE;
    this.poleBottomY = (GROUND_TOP_ROW - 1) * TILE_SIZE;
    this.barDoorX = (goalColumn + BAR_COLUMN_OFFSET) * TILE_SIZE + BAR_SIZE.doorCenterX;
    this.hamY = HAM_START_Y;
    this.phase = PHASE.SLIDING_DOWN_POLE;
    this.stepsInPhase = 0;
    this.isComplete = false;

    this.awardPolePoints();
    this.grabPole();
    soundEngine.stopMusic();
    soundEngine.playSoundEffect(SOUND_EFFECT.POLE_SLIDE);
  }

  /** @private Cuanto más arriba se agarra Paco, más puntos gana. */
  awardPolePoints() {
    const player = this.world.player;
    const heightFraction = (this.poleBottomY - player.y) / (this.poleBottomY - this.poleTopY);
    const { points } = GAME_RULES.goalPolePoints.find(tier => heightFraction > tier.minimumHeightFraction) ||
      GAME_RULES.goalPolePoints[GAME_RULES.goalPolePoints.length - 1];
    this.world.awardPoints(points, this.poleX + 14, player.y);
    if (points === GAME_RULES.goalPolePoints[0].points) {
      this.world.showFloatingText(GAMEPLAY_MESSAGES.topOfPole, this.poleX, player.y - 14, '#fcd800', 90);
    }
  }

  /** @private Coloca a Paco agarrado a la cucaña y le quita el control. */
  grabPole() {
    const player = this.world.player;
    player.x = this.poleX - player.width + 2;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isHoldingGoalPole = true;
    player.facing = 1;
    player.hasControl = false;
    player.ridingPlatform = null;
  }

  /** @private */
  changePhase(newPhase) {
    this.phase = newPhase;
    this.stepsInPhase = 0;
  }

  /** Avanza la escena un paso. */
  update() {
    const player = this.world.player;
    this.stepsInPhase++;
    switch (this.phase) {
      case PHASE.SLIDING_DOWN_POLE: {
        const hamBottomY = this.poleBottomY - HAM_HEIGHT;
        this.hamY = Math.min(this.hamY + SLIDE_SPEED, hamBottomY);
        if (player.bottom < this.poleBottomY) player.y = Math.min(player.y + SLIDE_SPEED, this.poleBottomY - player.height);
        else if (this.hamY >= hamBottomY) this.changePhase(PHASE.WAITING_AT_BOTTOM);
        break;
      }
      case PHASE.WAITING_AT_BOTTOM:
        if (this.stepsInPhase > WAIT_AT_BOTTOM_STEPS) {
          player.isHoldingGoalPole = false;
          player.autoWalkSpeed = PLAYER_PHYSICS.autoWalkSpeed;
          soundEngine.playMusic('levelClear', { restart: true });
          this.changePhase(PHASE.WALKING_TO_BAR);
        }
        break;
      case PHASE.WALKING_TO_BAR:
        player.update(this.world);
        if (player.centerX >= this.barDoorX) {
          player.isHidden = true;
          player.velocityX = 0;
          this.world.showBanner(GAMEPLAY_MESSAGES.levelClear, 150);
          this.changePhase(PHASE.COUNTING_TIME_BONUS);
        }
        break;
      case PHASE.COUNTING_TIME_BONUS:
        if (this.stepsInPhase <= PAUSE_BEFORE_COUNTING_STEPS) break;
        if (this.world.timeRemaining > 0) {
          const unitsConverted = Math.min(this.world.timeRemaining, TIME_UNITS_PER_STEP);
          this.world.timeRemaining -= unitsConverted;
          this.world.session.addPoints(GAME_RULES.pointsPerTimeUnitLeft * unitsConverted);
          if (this.stepsInPhase % 3 === 0) soundEngine.playSoundEffect(SOUND_EFFECT.TIME_TICK);
        } else {
          this.changePhase(PHASE.FINISHED);
        }
        break;
      case PHASE.FINISHED:
        if (this.stepsInPhase > FINAL_PAUSE_STEPS) this.isComplete = true;
        break;
    }
  }
}
