/**
 * @file Catálogo de enemigos: qué comportamiento tiene cada uno y sus ajustes.
 *
 * Varios enemigos comparten comportamiento y solo cambian su aspecto y
 * velocidad (un guiri y una oveja caminan igual). Así, añadir un enemigo nuevo
 * suele ser solo añadir una entrada aquí y sus sprites.
 */

/** Tipos de comportamiento disponibles. */
export const ENEMY_BEHAVIOR = Object.freeze({
  /** Camina y se da la vuelta al chocar. Se aplasta al pisarlo. */
  WALKER: 'walker',
  /** Camina; al pisarlo se esconde en su caparazón (maleta, concha), que se puede patear. */
  SHELLED: 'shelled',
  /** Vuela haciendo ondas y no le afectan las baldosas. */
  FLYER: 'flyer',
  /** Toro: embiste cuando ve a Paco. */
  CHARGER: 'charger',
  /** Pulpo: asoma de los toneles cada cierto tiempo. */
  POP_UP: 'popUp',
  /** Madre: lanza chanclas en arco. */
  THROWER: 'thrower',
  /** Chispa de lava: salta desde los fosos. */
  LAVA_BUBBLE: 'lavaBubble',
  /** Don Hacienda, el jefe final. */
  BOSS: 'boss'
});

/**
 * @typedef {Object} EnemyProfile
 * @property {string} behavior Uno de {@link ENEMY_BEHAVIOR}.
 * @property {string} [spriteName] Prefijo de sus sprites (`<spriteName>_frame1`…).
 * @property {string} [shellSpriteName] Sprite del caparazón (solo SHELLED).
 * @property {number} [walkSpeed] Píxeles por paso al caminar.
 * @property {number} [walkingHeight] Altura de la caja de colisión al caminar (solo SHELLED).
 * @property {boolean} [turnsAtEdges] Si se da la vuelta en los bordes en vez de caerse.
 * @property {number} [flySpeed] Píxeles por paso al volar (solo FLYER).
 * @property {number} [waveAmplitude] Altura de las ondas al volar (solo FLYER).
 * @property {string[]} [catchphrases] Frases al ser derrotado.
 */

/** @type {Object<string, EnemyProfile>} */
export const ENEMY_CATALOG = Object.freeze({
  guiri: { behavior: ENEMY_BEHAVIOR.WALKER, spriteName: 'guiri', walkSpeed: 0.5, catchphrases: ['¡SANGRÍA!', '¡PAELLA!', '¡SORRY!', '¡OLÉ, OLÉ!'] },
  paloma: { behavior: ENEMY_BEHAVIOR.WALKER, spriteName: 'paloma', walkSpeed: 0.45, catchphrases: ['¡CRUUU!'] },
  ejecutivo: { behavior: ENEMY_BEHAVIOR.WALKER, spriteName: 'ejecutivo', walkSpeed: 0.85, catchphrases: ['¡LLEGO TARDE!', '¡TENGO REUNIÓN!'] },
  cucaracha: { behavior: ENEMY_BEHAVIOR.WALKER, spriteName: 'cucaracha', walkSpeed: 0.75, catchphrases: ['¡AAAAH!'] },
  oveja: { behavior: ENEMY_BEHAVIOR.WALKER, spriteName: 'oveja', walkSpeed: 0.4, catchphrases: ['¡BEEE!'] },
  lagarto: { behavior: ENEMY_BEHAVIOR.WALKER, spriteName: 'lagarto', walkSpeed: 0.8, turnsAtEdges: true },

  turista: { behavior: ENEMY_BEHAVIOR.SHELLED, spriteName: 'turista', shellSpriteName: 'maleta', walkSpeed: 0.45, walkingHeight: 22, turnsAtEdges: true, catchphrases: ['¡MI MALETA!'] },
  caracol: { behavior: ENEMY_BEHAVIOR.SHELLED, spriteName: 'caracol', shellSpriteName: 'concha', walkSpeed: 0.3, walkingHeight: 14 },

  gaviota: { behavior: ENEMY_BEHAVIOR.FLYER, spriteName: 'gaviota', flySpeed: 0.7, waveAmplitude: 18 },
  mosquito: { behavior: ENEMY_BEHAVIOR.FLYER, spriteName: 'mosquito', flySpeed: 0.5, waveAmplitude: 12, catchphrases: ['¡BZZZ!'] },
  meiga: { behavior: ENEMY_BEHAVIOR.FLYER, spriteName: 'meiga', flySpeed: 0.6, waveAmplitude: 22, catchphrases: ['¡HABERLAS, HAYLAS!'] },
  murcielago: { behavior: ENEMY_BEHAVIOR.FLYER, spriteName: 'murcielago', flySpeed: 0.8, waveAmplitude: 20 },
  cucavol: { behavior: ENEMY_BEHAVIOR.FLYER, spriteName: 'cucavol', flySpeed: 0.9, waveAmplitude: 14, catchphrases: ['¡VUELAAA!'] },

  toro: { behavior: ENEMY_BEHAVIOR.CHARGER },
  pulpo: { behavior: ENEMY_BEHAVIOR.POP_UP },
  madre: { behavior: ENEMY_BEHAVIOR.THROWER },
  hacienda: { behavior: ENEMY_BEHAVIOR.BOSS }
});
