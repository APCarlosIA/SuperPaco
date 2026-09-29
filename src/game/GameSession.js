/**
 * @file Datos de la partida en curso que se conservan entre niveles:
 * puntos, pesetas, vidas, nivel actual y el poder con el que acabó Paco.
 */
import { GAME_RULES } from '../config/constants.js';

export class GameSession {
  constructor() {
    this.startNewGame(0);
  }

  /**
   * Reinicia la partida.
   * @param {number} startingLevelIndex Nivel por el que se empieza (0 = Madrid).
   */
  startNewGame(startingLevelIndex) {
    this.score = 0;
    this.coins = 0;
    this.lives = GAME_RULES.startingLives;
    this.levelIndex = startingLevelIndex;
    /** Si es true, al perder una vida se reaparece en el punto de control. */
    this.hasReachedCheckpoint = false;
    /** Poder con el que Paco empezará el siguiente nivel (se conserva al superar uno). */
    this.carriedPowerLevel = 0;
  }

  /** @param {number} points */
  addPoints(points) {
    this.score += points;
  }

  /**
   * Suma una peseta y sus puntos. Cada 100 pesetas se gana una vida.
   * @returns {boolean} true si se ha ganado una vida extra.
   */
  addCoin() {
    this.coins++;
    this.score += GAME_RULES.pointsPerCoin;
    if (this.coins < GAME_RULES.coinsPerExtraLife) return false;
    this.coins -= GAME_RULES.coinsPerExtraLife;
    this.lives++;
    return true;
  }

  gainExtraLife() {
    this.lives++;
  }

  /**
   * Resta una vida. Al perderla se pierde también el poder acumulado.
   * @returns {number} Vidas restantes.
   */
  loseLife() {
    this.lives--;
    this.carriedPowerLevel = 0;
    return this.lives;
  }

  /**
   * Pasa al siguiente nivel conservando el poder de Paco.
   * @param {number} powerLevelAtGoal Poder con el que Paco ha llegado a la meta.
   */
  advanceToNextLevel(powerLevelAtGoal) {
    this.carriedPowerLevel = powerLevelAtGoal;
    this.hasReachedCheckpoint = false;
    this.levelIndex++;
  }
}
