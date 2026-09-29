/**
 * @file Constantes globales del juego.
 *
 * Aquí viven todos los "números mágicos": resolución, tamaño de las baldosas,
 * física de Paco y reglas de puntuación. Tenerlos juntos permite ajustar la
 * sensación del juego (lo alto que salta, lo rápido que corre…) sin tener que
 * buscar valores repartidos por el código.
 */

/** Ancho de la pantalla interna en píxeles. Después se escala a la ventana. */
export const SCREEN_WIDTH = 320;

/** Alto de la pantalla interna en píxeles. */
export const SCREEN_HEIGHT = 240;

/** Lado de una baldosa (tile) en píxeles. Todo el mapa es una rejilla de baldosas. */
export const TILE_SIZE = 16;

/** Número de filas de baldosas de cada nivel (15 filas × 16 px = 240 px). */
export const LEVEL_ROWS = 15;

/** Fila en la que empieza el suelo normal. Los personajes pisan la fila anterior (la 12). */
export const GROUND_TOP_ROW = 13;

/** Coordenada Y (en píxeles) de la superficie del suelo normal. */
export const GROUND_SURFACE_Y = GROUND_TOP_ROW * TILE_SIZE;

/** Pasos de simulación por segundo. La física siempre avanza a este ritmo fijo. */
export const SIMULATION_STEPS_PER_SECOND = 60;

/** A cuántos píxeles del borde izquierdo mantiene la cámara a Paco al avanzar. */
export const CAMERA_PLAYER_SCREEN_X = 150;

/**
 * Física del protagonista. Las velocidades están en píxeles por paso de
 * simulación y las aceleraciones en píxeles por paso al cuadrado.
 */
export const PLAYER_PHYSICS = Object.freeze({
  hitboxWidth: 12,
  smallHitboxHeight: 15,
  bigHitboxHeight: 28,
  crouchingHitboxHeight: 18,

  walkMaxSpeed: 1.5,
  runMaxSpeed: 2.6,
  /** Velocidad con la que Paco camina solo durante las escenas automáticas. */
  autoWalkSpeed: 1.2,
  walkAcceleration: 0.075,
  runAcceleration: 0.1,
  airAcceleration: 0.07,
  /** Frenada extra al pulsar la dirección contraria estando en el suelo (derrape). */
  turnAroundDeceleration: 0.22,
  /** Frenado al soltar las flechas estando en el suelo. */
  groundFriction: 0.1,
  /** Cuánto se reduce la velocidad cuando supera el máximo (p. ej. al soltar "correr"). */
  overSpeedSlowdown: 0.06,

  jumpBaseSpeed: 5.6,
  /** Cuanto más rápido corre Paco, más alto salta: se suma velocidad × este factor. */
  jumpSpeedPerRunSpeed: 0.2,
  /** Gravedad mientras sube con el botón de salto pulsado (salto largo). */
  gravityWhileHoldingJump: 0.24,
  gravity: 0.55,
  maxFallSpeed: 6.5,
  /** Pasos en los que aún se puede saltar tras salir de un borde ("coyote time"). */
  coyoteTimeSteps: 6,
  /** Pasos durante los que se recuerda un salto pulsado justo antes de aterrizar. */
  jumpBufferSteps: 7,

  stompBounceSpeed: 4.2,
  stompBounceSpeedHoldingJump: 6.4,
  fireballCooldownSteps: 12
});

/** Física común de los enemigos que caminan por el suelo. */
export const ENEMY_PHYSICS = Object.freeze({
  gravity: 0.35,
  maxFallSpeed: 6
});

/** Reglas del cronómetro de cada nivel. */
export const LEVEL_TIMER = Object.freeze({
  /** Pasos de simulación que dura cada unidad de tiempo del marcador. */
  stepsPerTimeUnit: 24,
  /** Al llegar a este tiempo aparece el aviso de prisa y la música se acelera. */
  hurryWarningTime: 100,
  hurryMusicTempo: 1.25
});

/** Reglas de puntuación, vidas y duración de los potenciadores. */
export const GAME_RULES = Object.freeze({
  startingLives: 3,
  coinsPerExtraLife: 100,
  pointsPerCoin: 200,
  pointsPerPowerUp: 1000,
  pointsPerBrokenBrick: 50,
  pointsPerTimeUnitLeft: 50,
  pointsForKickingShell: 400,
  pointsForEnemyKnockedFromBelow: 100,
  pointsForEnemyDefeatedByFire: 200,
  pointsForBossDefeat: 5000,
  /** Puntos por pisar enemigos seguidos sin tocar el suelo; después de la lista, vida extra. */
  stompComboPoints: [100, 200, 400, 500, 800, 1000, 2000, 4000, 5000, 8000],
  /** Puntos según la altura a la que Paco se agarra a la cucaña (de arriba a abajo). */
  goalPolePoints: [
    { minimumHeightFraction: 0.9, points: 5000 },
    { minimumHeightFraction: 0.7, points: 2000 },
    { minimumHeightFraction: 0.45, points: 800 },
    { minimumHeightFraction: 0.2, points: 400 },
    { minimumHeightFraction: 0, points: 100 }
  ],
  invulnerableStepsAfterHit: 120,
  churrosInvincibilitySteps: 600,
  maxPlayerFireballsOnScreen: 2,
  coinsInMultiCoinBlock: 8
});
