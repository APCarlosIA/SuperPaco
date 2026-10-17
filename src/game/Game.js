/**
 * @file Orquestador del juego: decide qué pantalla está activa y gestiona las
 * transiciones entre ellas.
 *
 * Flujo:
 *   Título → (Historia) → Presentación del nivel → Nivel → …
 *     · Al perder una vida: Presentación (o Fin de partida si no quedan vidas).
 *     · Al superar un nivel: Presentación del siguiente (o Final tras el décimo).
 *
 * Todas las pantallas cumplen la misma interfaz: `update()` y `draw(context)`.
 *
 * Los controles se reciben desde fuera (inyección de dependencias): en el
 * navegador son el teclado y el mando; en los tests, controles simulados.
 */
import { BUTTON } from '../core/input.js';
import { toggleFullscreen } from '../core/screen.js';
import { recordAchievement } from '../core/storage.js';
import { soundEngine } from '../audio/soundEngine.js';
import { screenFx } from '../graphics/screenFx.js';
import { LEVELS } from '../world/levels.js';
import { GameSession } from './GameSession.js';
import { World } from './World.js';
import { TitleScreen } from './screens/TitleScreen.js';
import { ControlsScreen } from './screens/ControlsScreen.js';
import { StoryScreen } from './screens/StoryScreen.js';
import { LevelIntroScreen } from './screens/LevelIntroScreen.js';
import { GameOverScreen } from './screens/GameOverScreen.js';
import { EndingScreen } from './screens/EndingScreen.js';

export class Game {
  /**
   * @param {Object} options
   * @param {import('../core/input.js').Controls} options.controls Controles del jugador.
   */
  constructor({ controls }) {
    this.controls = controls;
    this.session = new GameSession();
    /** Pantalla activa: cualquier objeto con `update()` y `draw(context)`. */
    this.activeScreen = null;
    /** Pantalla del paso anterior, para reiniciar los efectos al cambiar de pantalla. */
    this.previousScreen = null;
  }

  /** Muestra la pantalla de título. */
  start() {
    this.showTitleScreen();
  }

  /** Avanza un paso: atajos globales y después la pantalla activa. */
  update() {
    if (this.controls.wasPressed(BUTTON.MUTE)) soundEngine.toggleMute();
    if (this.controls.wasPressed(BUTTON.FULLSCREEN)) toggleFullscreen();
    if (this.activeScreen !== this.previousScreen) {
      screenFx.reset();
      this.previousScreen = this.activeScreen;
    }
    screenFx.update();
    // Los golpes fuertes congelan la simulación unos fotogramas para dar peso.
    if (screenFx.consumeHitStop()) return;
    this.activeScreen.update();
  }

  /**
   * Dibuja la pantalla activa.
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   */
  draw(context) {
    this.activeScreen.draw(context);
  }

  /* ---------------- Transiciones ---------------- */

  showTitleScreen() {
    this.activeScreen = new TitleScreen(this);
  }

  showControlsScreen() {
    this.activeScreen = new ControlsScreen(this);
  }

  /**
   * Empieza una partida nueva. Desde Madrid se cuenta antes la historia.
   * @param {number} levelIndex
   */
  startNewGame(levelIndex) {
    this.session.startNewGame(levelIndex);
    if (levelIndex === 0) this.activeScreen = new StoryScreen(this);
    else this.showLevelIntro();
  }

  showLevelIntro() {
    this.activeScreen = new LevelIntroScreen(this, this.session);
  }

  /** Crea el mundo del nivel actual y lo pone como pantalla activa. */
  startCurrentLevel() {
    this.activeScreen = new World({
      levelDefinition: LEVELS[this.session.levelIndex],
      levelIndex: this.session.levelIndex,
      session: this.session,
      controls: this.controls,
      callbacks: {
        onLevelCompleted: world => this.handleLevelCompleted(world),
        onPlayerDeathFinished: () => this.handlePlayerDeathFinished()
      }
    });
  }

  /** @private Resta una vida; si no quedan, fin de la partida. */
  handlePlayerDeathFinished() {
    const livesLeft = this.session.loseLife();
    if (livesLeft > 0) {
      this.showLevelIntro();
      return;
    }
    recordAchievement({ score: this.session.score });
    this.activeScreen = new GameOverScreen(this, this.session.score);
  }

  /**
   * @private
   * Guarda el progreso y pasa al siguiente nivel (o al final del juego).
   * @param {World} world
   */
  handleLevelCompleted(world) {
    this.session.advanceToNextLevel(world.player.powerLevel);
    const isGameFinished = this.session.levelIndex >= LEVELS.length;
    recordAchievement({
      unlockedLevel: Math.min(this.session.levelIndex, LEVELS.length - 1),
      score: this.session.score
    });
    if (isGameFinished) this.activeScreen = new EndingScreen(this, this.session.score);
    else this.showLevelIntro();
  }
}
