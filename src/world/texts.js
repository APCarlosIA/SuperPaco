/**
 * @file Textos del juego: memes, historia, final y ayuda de controles.
 *
 * Separar los textos de la lógica facilita cambiarlos o traducirlos sin tocar
 * el código que los muestra.
 */

/** Frases que aparecen al perder una vida. */
export const LIFE_LOST_MESSAGES = Object.freeze([
  '¡PA\' HABERNOS MATAO!', '¡NO PUEDOR!', 'HASTA LUEGO, LUCAS', '¿TE DAS CUEN?', '¡COBARDE!',
  'VAYA TELA...', 'ESTO ES UN SINVIVIR', '¡JARL!', 'SE TENÍA QUE DECIR Y SE DIJO', '¿QUÉ HASE?',
  'MUCHO TEXTO', 'MADRE MÍA, WILLY', 'A CASCARLA', 'TE HA FALTAO UN HERVOR', 'AY, MI MADRE',
  'FUISTE A POR LANA Y SALISTE TRASQUILADO', 'NI TAN MAL (MENTIRA)', 'ESTO LO ARREGLO YO CON UN CAFÉ'
]);

/** Frases al caer en la lava. */
export const BURNED_MESSAGES = Object.freeze(['¡QUE QUEMA, CHACHO!', 'VUELTA Y VUELTA', 'AL PUNTO DE SAL']);

/** Exclamaciones al pisar enemigos seguidos. */
export const STOMP_EXCLAMATIONS = Object.freeze([
  '¡OLÉ!', '¡TOMA YA!', '¡QUÉ ARTE!', '¡FISTRO!', '¡AL ATAQUERL!', '¡TOMA CASTAÑA!',
  '¡ZASCA!', '¡EN TODA LA BOCA!', '¡A MÁS VER!', '¡OJO CUIDAO!'
]);

/** Frases que rotan en la pantalla de título. */
export const TITLE_TAGLINES = Object.freeze([
  '¡VAMOS, QUE NOS VAMOS!', 'AHORA CON UN 21% DE IVA', 'APTO PARA CUÑADOS', 'HECHO CON ACEITE DE OLIVA',
  'MÁS ESPAÑOL QUE LA SIESTA', 'EL JUEGO DEL VERANO', '¿QUÉ PASA, CHAVALES?', 'SIN CEBOLLA (O CON)', 'NI TAN MAL'
]);

/** Mensajes emergentes durante la partida. */
export const GAMEPLAY_MESSAGES = Object.freeze({
  hurt: '¡AY, MI MADRE!',
  bocadillo: '¡BOCATA DE JAMÓN!',
  pimiento: '¡UNOS PICAN Y OTROS NO!',
  churros: '¡SUBIDÓN DE AZÚCAR!',
  loteria: '¡EL GORDO! +1 VIDA',
  hundredCoins: '¡100 PELAS! +1 VIDA',
  checkpoint: '¡ESTO YA ES OTRA COSA!',
  hurry: '¡QUE SE HACE TARDE!',
  levelClear: '¡UNA CAÑA, POR FAVOR!',
  topOfPole: '¡EL JAMÓN ES MÍO!',
  brickTooHard: '¡NO PUEDOR!',
  bossIntro: 'DON HACIENDA: ¡PAGUE SUS IMPUESTOS!',
  bossDefeated: '¡ME VUELVO A SUIZA!',
  recipeRecovered: '¡HAS RECUPERADO LA RECETA!',
  /** Cartel al activar cada tipo de Flor Maravilla. */
  wonderBanner: Object.freeze({
    moon: '¡MARAVILLA! ¡LUNA!',
    rain: '¡MARAVILLA! ¡LLUEVEN PESETAS!',
    rhythm: '¡MARAVILLA! ¡AL COMPÁS!',
    dark: '¡MARAVILLA! ¡SE FUNDIERON LOS PLOMOS!',
    stampede: '¡MARAVILLA! ¡ENCIERRO!',
    parade: '¡MARAVILLA! ¡DESFILE!',
    default: '¡MARAVILLA!'
  }),
  wonderSeedAppears: '¡UNA SEMILLA MARAVILLA!',
  seedCollected: '¡SEMILLA MARAVILLA!',
  bigCoinCollected: '¡MONEDA GIGANTE!',
  secretRoom: '¡SALA SECRETA!'
});

/** Historia que se cuenta al empezar una partida nueva. */
export const STORY_LINES = Object.freeze([
  'EL MALVADO DON HACIENDA HA ROBADO',
  'LA RECETA SECRETA DE LA TORTILLA',
  'DE LA ABUELA DE PACO.',
  '',
  '¿LLEVABA CEBOLLA? NADIE LO SABE.',
  '',
  'RECORRE ESPAÑA, ESQUIVA GUIRIS,',
  'TOROS Y CHANCLAS VOLADORAS,',
  'Y RECUPERA LA RECETA.'
]);

/** Textos de la escena final. */
export const ENDING_TEXTS = Object.freeze({
  grandmaThanks: 'ABUELA: ¡AY, MI NIETO! ¡HAS RECUPERADO\nLA RECETA DE LA TORTILLA!\nVEN AQUÍ, QUE TE DOY UN BESO.',
  onionQuestion: 'ABUELA: PERO DIME UNA COSA, PACO...\n¿LA TORTILLA LLEVA CEBOLLA?',
  withOnionOption: 'CON CEBOLLA',
  withoutOnionOption: 'SIN CEBOLLA',
  withOnionAnswer: '¡CORRECTO! LA ABUELA TE DA UN PINCHO\nY UN BESO EN LA FRENTE. LOS\nSINCEBOLLISTAS ECHAN HUMO EN REDES.',
  withoutOnionAnswer: 'RESPETABLE... PERO LA ABUELA TE HA\nDESHEREDADO. (ES BROMA. O NO.)\nLOS CONCEBOLLISTAS YA SE MANIFIESTAN.',
  thanksForPlaying: 'GRACIAS POR JUGAR',
  farewell: '¡HASTA LUEGO, LUCAS!'
});

/** Filas de la pantalla de controles: [teclas, acción]. */
export const CONTROLS_HELP_ROWS = Object.freeze([
  ['◀ ▶  /  A D', 'MOVERSE'],
  ['ESPACIO / Z', 'SALTAR (MANTÉN = MÁS ALTO)'],
  ['SHIFT / X', 'CORRER Y LANZAR PIMIENTOS'],
  ['ABAJO / S', 'AGACHARSE'],
  ['P / ESC', 'SIESTA (PAUSA)'],
  ['M  ·  F', 'SONIDO  ·  PANTALLA COMPLETA'],
  ['MANDO', 'A SALTA · B/X CORRE · START']
]);

/** Objetos que se explican en la pantalla de controles: [sprite, descripción]. */
export const ITEM_HELP_ROWS = Object.freeze([
  ['bocadillo', 'BOCATA: CRECES'],
  ['pimiento', 'PIMIENTO: LANZAS FUEGO'],
  ['churros', 'CHURROS: INVENCIBLE'],
  ['loteria', 'DÉCIMO: +1 VIDA'],
  ['peseta_spin0', '100 PESETAS: +1 VIDA']
]);

