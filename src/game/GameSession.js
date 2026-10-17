/**
 * @file Datos de la partida en curso que se conservan entre niveles:
 * puntos, pesetas, vidas, nivel actual y el poder con el que acabó Paco.
 */
import { GAME_RULES } from '../config/constants.js';

export class GameSession {
  constructor() {
    /** Truco del cocinero descubierto (se conserva entre partidas). */
    this.chefMode = false;
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
    /** Semillas Maravilla conseguidas (índices de nivel). */
    this.seeds = new Set();
    /** Monedas gigantes conseguidas, con clave "nivel:número". */
    this.bigCoins = new Set();
  }

  /**
   * Anota la Semilla Maravilla de un nivel.
   * @param {number} levelIndex
   * @returns {boolean} true si es la primera vez que se consigue.
   */
  collectSeed(levelIndex) {
    const isNew = !this.seeds.has(levelIndex);
    this.seeds.add(levelIndex);
    this.score += 2000;
    return isNew;
  }

  /**
   * Anota una moneda gigante.
   * @param {number} levelIndex
   * @param {number} coinNumber
   * @returns {boolean} true si es la primera vez que se consigue.
   */
  collectBigCoin(levelIndex, coinNumber) {
    const key = `${levelIndex}:${coinNumber}`;
    const isNew = !this.bigCoins.has(key);
    this.bigCoins.add(key);
    this.score += 500;
    return isNew;
  }

  /**
   * Monedas gigantes conseguidas en un nivel.
   * @param {number} levelIndex
   * @returns {number}
   */
  countBigCoinsInLevel(levelIndex) {
    let count = 0;
    for (const key of this.bigCoins) if (key.startsWith(`${levelIndex}:`)) count++;
    return count;
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
