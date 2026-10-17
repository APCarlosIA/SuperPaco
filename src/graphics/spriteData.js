/**
 * @file Datos de todos los sprites (pixel art original).
 *
 * Cada sprite es una lista de filas de texto del mismo ancho. Cada carácter es
 * un píxel cuyo color se busca en `PIXEL_COLORS` (ver palette.js).
 *
 * Convenciones:
 *   - Los enemigos se dibujan mirando a la IZQUIERDA; Paco, a la DERECHA.
 *     Para mirar al otro lado se usa la imagen reflejada.
 *   - `height` (opcional) rellena con filas transparentes por ARRIBA hasta esa
 *     altura, para que los pies queden siempre en la última fila.
 *   - Las animaciones se nombran `<id>_frame1`, `<id>_frame2`…
 *
 * Este módulo no toca el navegador: solo contiene datos, así los tests de Node
 * pueden validar que todas las filas tienen el ancho correcto.
 */
import { TRANSPARENT_PIXEL } from './palette.js';

/**
 * @typedef {Object} SpriteDefinition
 * @property {string[]} rows Filas del mapa de píxeles.
 * @property {Object<string, string>} [colors] Colores que sustituyen a los de la paleta.
 * @property {number} [height] Alto final; se rellena por arriba si hay menos filas.
 */

/**
 * Devuelve una copia de `rows` en la que, a partir de `startIndex`, se sustituyen
 * las filas por `replacementRows`. Sirve para crear el segundo fotograma de una
 * animación cambiando solo las piernas o las alas.
 * @param {string[]} rows
 * @param {number} startIndex
 * @param {string[]} replacementRows
 * @returns {string[]}
 */
export function replaceRows(rows, startIndex, replacementRows) {
  return rows.slice(0, startIndex).concat(replacementRows, rows.slice(startIndex + replacementRows.length));
}

/* ================================================================== */
/* PACO, el protagonista                                               */
/* ================================================================== */

/** Cabeza de Paco pequeño: boina negra, pelo castaño y gafas de sol. */
const PACO_SMALL_HEAD = [
  '......KKKK......',
  '....KKKKKKKK....',
  '...KKKKKKKKKKK..',
  '...bbSSSSSSS....',
  '..bbSSKKKKKKK...',
  '..bbSSKWKKWKK...',
  '...bSSSSSSSSSS..',
  '....SSSSSrrrS...',
  '.....SSSSSSS....'
];

/** Poses de Paco pequeño (16×16): chándal rojo con franja amarilla y chanclas. */
export const PACO_SMALL_POSES = Object.freeze({
  stand: PACO_SMALL_HEAD.concat([
    '....RRRYYRRR....', '...RRRRYYRRRR...', '..SRRRRYYRRRRS..', '..S.RRRYYRRR.S..',
    '....uuuuuuuu....', '....uuu..uuu....', '...BBBB..BBBB...']),
  walk1: PACO_SMALL_HEAD.concat([
    '....RRRYYRRR....', '...RRRRYYRRRR...', '..SRRRRYYRRRRS..', '..S.RRRYYRRR.S..',
    '....uuuuuuuu....', '...uuu....uuu...', '..BBB......BBB..']),
  walk2: PACO_SMALL_HEAD.concat([
    '....RRRYYRRR....', '..SRRRRYYRRRR...', '..SRRRRYYRRRRS..', '....RRRYYRRR.S..',
    '....uuuuuuuu....', '.....uuuuuu.....', '.....BBBBBB.....']),
  jump: PACO_SMALL_HEAD.concat([
    '..S.RRRYYRRR.S..', '..SRRRRYYRRRRS..', '...RRRRYYRRRR...', '....RRRYYRRR....',
    '...uuuuuuuuuu...', '..uuu......uuu..', '.BBB........BBB.']),
  dead: [
    '......KKKK......', '....KKKKKKKK....', '...KKKKKKKKKK...', '...bSSSSSSSSb...',
    '..bSKKKSSKKKSb..', '..bSKKKSSKKKSb..', '...SSSSSSSSSS...', '....SSSKKSSS....',
    '.S...SSSSSS...S.', '.SS.RRRYYRRR.SS.', '..SRRRRYYRRRRS..', '....RRRYYRRR....',
    '....RRRYYRRR....', '....uuuuuuuu....', '....uuu..uuu....', '...BBBB..BBBB...']
});

/** Cabeza de Paco grande (más detallada). */
const PACO_BIG_HEAD = [
  '......KKKK......', '....KKKKKKKK....', '...KKKKKKKKKKK..', '...KKKKKKKKKKKK.',
  '...bbSSSSSSSS...', '..bbbSSSSSSSSS..', '..bbSSKKKKKKKK..', '..bbSSKWKKKWKK..',
  '..bbSSKKKKKKKK..', '...bSSSSSSSSSSS.', '...SSSSSSSSSSSS.', '....SSSSSSrrrS..',
  '....SSSSSSSSSS..', '.....SSSSSSSS...'
];
/** Torso de Paco grande con los brazos abajo. */
const PACO_BIG_TORSO = [
  '....RRRRYYRRR...', '...RRRRRYYRRRR..', '..RRRRRRYYRRRRR.', '..RRRRRRYYRRRRR.',
  '.RRRRRRRYYRRRRRR', '.RR.RRRRYYRRR.RR', '.RR.RRRRYYRRR.RR', '.RR.RRRRYYRRR.RR',
  '.SS.RRRRYYRRR.SS', '.SS.RRRRRRRRR.SS'
];
/** Torso de Paco grande con los brazos levantados (salto). */
const PACO_BIG_TORSO_ARMS_UP = [
  'S...RRRRYYRRR..S', 'SS.RRRRRYYRRRRSS', '.RRRRRRRYYRRRRR.', '..RRRRRRYYRRRR..',
  '..RRRRRRYYRRRR..', '...RRRRRYYRRR...', '...RRRRRYYRRR...', '...RRRRRYYRRR...',
  '...RRRRRYYRRR...', '...RRRRRRRRRR...'
];
/** Piernas de Paco grande en cada postura. */
const PACO_BIG_LEGS = {
  stand: ['....uuuuuuuuu...', '....uuuuuuuuu...', '....uuuu.uuuu...', '....uuuu.uuuu...',
    '....uuu...uuu...', '....uuu...uuu...', '...BBBB...BBBB..', '...BBBBB..BBBBB.'],
  walk1: ['....uuuuuuuuu...', '...uuuuu.uuuuu..', '...uuuu...uuuu..', '..uuuu.....uuuu.',
    '..uuu.......uuu.', '.uuu.........uuu', '.BBBB.......BBBB', 'BBBB.........BBB'],
  walk2: ['....uuuuuuuuu...', '....uuuuuuuuu...', '.....uuuuuuu....', '.....uuuuuuu....',
    '......uuuuu.....', '......uuuuu.....', '.....BBBBBBB....', '.....BBBBBBBB...']
};

/** Poses de Paco grande (16×32). */
export const PACO_BIG_POSES = Object.freeze({
  stand: PACO_BIG_HEAD.concat(PACO_BIG_TORSO, PACO_BIG_LEGS.stand),
  walk1: PACO_BIG_HEAD.concat(PACO_BIG_TORSO, PACO_BIG_LEGS.walk1),
  walk2: PACO_BIG_HEAD.concat(PACO_BIG_TORSO, PACO_BIG_LEGS.walk2),
  jump: PACO_BIG_HEAD.concat(PACO_BIG_TORSO_ARMS_UP, PACO_BIG_LEGS.walk1),
  crouch: PACO_BIG_HEAD.concat([
    '..RRRRRRYYRRRRR.', '.SRRRRRRYYRRRRRS', '.SRRRRRRYYRRRRRS', '..uuuuuuuuuuuu..',
    '..uuuuuuuuuuuu..', '..uuuu....uuuu..', '.BBBBB....BBBBB.', '.BBBBB....BBBBB.'])
});

/**
 * Variantes de color de Paco:
 *   - normal: chándal rojo y amarillo.
 *   - chef: el truco del cocinero (colores normales con gorro de chef).
 *   - spicy: tras comer un pimiento de Padrón (chándal verde, puede lanzar fuego).
 *   - sugarRushGold / sugarRushWhite: parpadeo del subidón de churros (invencible).
 */
export const PACO_COLOR_VARIANTS = Object.freeze({
  normal: {},
  chef: {},
  spicy: { R: '#00a844', Y: '#d82800', u: '#1c5020' },
  sugarRushGold: { R: '#fcd800', Y: '#fc7c00', u: '#c85000' },
  sugarRushWhite: { R: '#fcfcfc', Y: '#3cbcfc', u: '#2050e8', K: '#881400' }
});

/**
 * Nombre del sprite de Paco para un tamaño, postura y variante de color.
 * @param {'small'|'big'} size
 * @param {string} pose
 * @param {string} colorVariant Clave de {@link PACO_COLOR_VARIANTS}.
 * @returns {string}
 */
export function pacoSpriteName(size, pose, colorVariant) {
  return `paco_${size}_${pose}_${colorVariant}`;
}

/* ================================================================== */
/* ENEMIGOS                                                            */
/* ================================================================== */

/** Guiri: turista quemado por el sol, con camisa hawaiana, calcetines y sandalias. */
const GUIRI = [
  '................', '.....YYYYYY.....', '....YYYYYYYY....', '....YpppppYY....',
  '...pKKpppKKpp...', '...pppppppppp...', '....ppWWWWpp....', '.....pppppp.....',
  '...LLGLLYLLGL...', '..pLGLLYLLGLLYp.', '..pLLYLLGLLYLLp.', '...LLLGLLYLLGL..',
  '....TTTTTTTT....', '....pp....pp....', '....WW....WW....', '...BBBW..BBBW...'
];
/** Paloma de ciudad. */
const PALOMA = [
  '................', '................', '...kkk..........', '..kkWkk.........',
  '.OkkKkk.........', '...GMkk.........', '...MGkkg........', '...ggwwwgg......',
  '..gwwwwwwwgg....', '..gwwwkkkwwwgk..', '..gwwwwkkkwwwkkk', '...gwwwwwwwwgkk.',
  '....ggwwwwwgg...', '.....O...O......', '.....O...O......', '....OO..OO......'
];
/** Ejecutivo con prisa y maletín (metro). */
const EJECUTIVO = [
  '................', '.....kkkkkk.....', '....kkkkkkkk....', '....kSSSSSkk....',
  '...SKSSSKSSk....', '...SSSSSSSSS....', '....SKKKSSS.....', '.....SSSSS......',
  '...kkkWRWkkk....', '..kkkkWRWkkkk...', '.bkkkkkRkkkkkS..', 'bbbkkkkRkkkkkS..',
  'bbb.kkkkkkkk....', '....kkk..kkk....', '....kkk..kkk....', '...KKKK..KKKK...'
];
const EJECUTIVO_COLORS = { k: '#34344c' };
/** Cucaracha que corretea por el suelo. */
const CUCARACHA = [
  '................', '................', '................', '................',
  '................', '................', '.k..............', '..k....bbbbb....',
  '...kbbbBBBBBbb..', '..kbbBBBBBBBBBb.', '.kbbBBBTBBBBBBBb', '.bbBBBTBBBBBBBBb',
  '..bbBBBBBBBBBBb.', '...bbbbbbbbbbb..', '...k..k...k..k..', '..k..k...k..k...'
];
/** Oveja manchega. */
const OVEJA = [
  '................', '................', '................', '......WWWWWW....',
  '....WWWWWWWWWW..', '.kk.WWWwWWWWwWW.', 'kkkkWWWWWWwWWWW.', 'kWkkWwWWWWWWWWWW',
  'kkkkWWWWWWWWwWWW', '.kk.WWWWwWWWWWW.', '....WWWWWWWWWWW.', '.....WWWWWWWWW..',
  '.....kk....kk...', '.....kk....kk...', '.....kk....kk...', '.....kk....kk...'
];
const OVEJA_COLORS = { w: '#d8d8e0' };
/** Lagarto canario. */
const LAGARTO = [
  '..GGG...........', '.GKGGG..........', 'GGGGGGGGGG......', '.RGLLGGGGGGG....',
  '..GGLGGLGGGGGG..', '...G.G...G.GGGGG', '..GG.GG.GG.GG..G'
];
const LAGARTO_COLORS = { G: '#3c9c3c' };
/** Parte superior del turista con gorra y cámara de fotos. */
const TURISTA_UPPER_BODY = [
  '....RRRRRR......', '...RRRRRRRR.....', 'RRRRRRRRRRR.....', '....ppppppp.....',
  '...pKppKpppp....', '...ppppppppp....', '....ppWWWpp.....', '.....ppppp......',
  '....kCCCCCCk....', '...CCkCCYCCCC...', '..pCCCkkkCCCCp..', '..pCCCkWkCYCCp..',
  '..pCCCCCCCCCCp..', '....CCYCCCCC....', '....TTTTTTTT....', '....TTTTTTTT....'
];
/** Caracol sevillano. */
const CARACOL = [
  '......bbbbb.....', '.....bBBBBBb....', '....bBBbbbBBb...', '....bBbTTTbBBb..',
  '....bBbTbTbBBb..', '....bBbTTbBBBb..', '....bBBbbBBBb...', '.k...bBBBBBb....',
  '..k...bbbbb.....', '.TTTTTTTTTTTTT..', 'TTKTTTTTTTTTTTTT', '.TTTTTTTTTTTTTTT'
];
const CARACOL_COLORS = { T: '#c8b080' };
/** Toro bravo (24×16). */
const TORO = [
  '........................', '.W....W.................', '.WW..WW.................', '..WKKW..................',
  '..KKKKK....KKKKKKKKK....', '.KRKKKKKKKKKKKKKKKKKK...', '.KKKKKKKKKKKKKKKKKKKKK..', 'KKKKKKKKKKKKKKKKKKKKKKK.',
  'KWKKKKKKKKKKKKKKKKKKKKKK', '.KKKKKKKKKKKKKKKKKKKKK.K', '..KKKKKKKKKKKKKKKKKKK..K', '...KKKKkKKKKKKKKKkKKK...',
  '...KK..KK.....KK..KK....', '...KK..KK.....KK..KK....', '...KK..KK.....KK..KK....', '..kkk.kkk....kkk.kkk....'
];
const TORO_COLORS = { K: '#3a2418', k: '#140c08', W: '#fcf0d8' };
/** Cabeza y cuerpo del pulpo que sale de los toneles. */
const PULPO_HEAD = [
  '................', '.....VVVVVV.....', '....VVVVVVVV....', '...VVVVVVVVVV...',
  '...VPVVVVVVPV...', '...VVVVVVVVVV...', '...VWKVVVVWKV...', '...VWKVVVVWKV...',
  '...VVVVVVVVVV...', '....VVVKKVVV....', '....VVVVVVVV....', '...VVVVVVVVVV...'
];
const PULPO_COLORS = { P: '#f080b0' };
/** Madre con rulos, bata y chancla en la mano. */
const MADRE_UPPER_BODY = [
  '....PwPwPw......', '...kkkkkkkk.....', '..PkkkkkkkkP....', '...kSSSSSSk.....',
  '...SKSSSKSS.....', '...SSSSSSSS.....', '....SRRRRS......', '.....SSSS.......',
  '...MMMMMMMM.....', '..MMPMMMMPMM....', '.SMMMMWWWWMMS...', 'BSMMPWWWWWMMS...',
  'BBMMMWWWWWPMM...', 'BB.MMWWWWWMMM...', '...MMWWWWWMMM...', '...MMMMMMMMMM...',
  '...MMPMMMMPMM...', '....MMMMMMMM....'
];
const MADRE_COLORS = { M: '#5c7cd8', k: '#4c2c1c' };
const MADRE_LEGS_TOGETHER = ['.....SS..SS.....', '.....SS..SS.....', '.....SS..SS.....', '....BBB..BBB....'];
/** Don Hacienda, el jefe final (32×32): calvo, gafas, bigote y carpeta de facturas. */
const HACIENDA_UPPER_BODY = [
  '................................', '...........SSSSSSSS.............', '.........SSSSSSSSSSSS...........', '........SSSSSSSSSSSSSS..........',
  '.......SSSSSWSSSSSSSSSk.........', '.......SSSSSSSSSSSSSSkk.........', '......SKKKKKKSKKKKKKSkk.........', '......SKWWWWKSKWWWWKSkk.........',
  '......SKWKKWKKKWKKWKSkk.........', '......SKKKKKKSKKKKKKSSk.........', '.....SSSSSSSSSSSSSSSSSS.........', '.....SSSSSSSsSSSSSSSSSS.........',
  '......SSKKKKKKKKKKSSSS..........', '......SSSKRRRRRRKSSSSS..........', '.......SSSSSSSSSSSSSS...........', '........SSSSSSSSSSSS............',
  '......kkkkkWWRRWWkkkkk..........', '....kkkkkkkWWRRWWkkkkkkk........', '...kkkkkkkkkWRRWkkkkkkkkk.......', '..kkkkkkkkkkWRRWkkkkkkkkkk......',
  '..kkkkkkkkkkkRRkkkkkkkkkkk......', '.SSkkkkkkkkkkRRkkkkkkkkkkkk.....', 'YYYYYYkkkkkkkRRkkkkkkkkkkkkS....', 'YKKKYYkkkkkkkkkkkkkkkkkkkkSS....',
  'YYYYYYkkkkkkkkkkkkkkkkkkkk......', 'YYYYYY.kkkkkkkkkkkkkkkkkkk......', '........kkkkkkkkkkkkkkkk........'
];
const HACIENDA_LEGS_STANDING = ['........kkkkkkk..kkkkkkk........', '........kkkkkk....kkkkkk........', '........kkkkkk....kkkkkk........', '.......KKKKKKK....KKKKKKK.......', '......KKKKKKKK....KKKKKKKK......'];
const HACIENDA_COLORS = { k: '#4c4c64', K: '#101018' };

/* ================================================================== */
/* CATÁLOGO DE SPRITES                                                 */
/* ================================================================== */

/** @type {Object<string, SpriteDefinition>} */
const ENEMY_SPRITES = {
  guiri_frame1: { rows: GUIRI },
  guiri_frame2: { rows: replaceRows(GUIRI, 13, ['.....pp..pp.....', '.....WW..WW.....', '....BBW.BBW.....']) },
  guiri_squashed: { rows: ['....YYYYYYYY....', '...pKKppppKKp...', '...pppWWWWppp...', '..LLGLLYLLGLLL..', '..pLLYLLGLLYLp..', '...TTTTTTTTTT...', '...WW......WW...', '..BBBW....BBBW..'] },

  paloma_frame1: { rows: PALOMA },
  paloma_frame2: { rows: replaceRows(PALOMA, 13, ['......O.O.......', '......O.O.......', '.....OO.OO......']) },
  paloma_squashed: { rows: ['................', '..kkWk..........', '.OkkKkgg........', '..gwwwwwwwwgg...', '..gwwkkkkwwwkkk.', '...gggwwwwggg...', '.....O...O......', '....OO..OO......'] },

  ejecutivo_frame1: { rows: EJECUTIVO, colors: EJECUTIVO_COLORS },
  ejecutivo_frame2: { rows: replaceRows(EJECUTIVO, 13, ['.....kkkkkk.....', '......kkkk......', '.....KKKKKK.....']), colors: EJECUTIVO_COLORS },
  ejecutivo_squashed: { rows: ['....kkkkkkkk....', '...SKSSSSKSSk...', '...kkkkWRWkkk...', 'bbbkkkkkRkkkkk..', 'bbbkkkkkkkkkkk..', '....kkkkkkkk....', '...kkk....kkk...', '..KKKK....KKKK..'], colors: EJECUTIVO_COLORS },

  cucaracha_frame1: { rows: CUCARACHA },
  cucaracha_frame2: { rows: replaceRows(CUCARACHA, 14, ['..k..k...k..k...', '...k..k...k..k..']) },
  cucaracha_squashed: { rows: ['................', '................', '................', '.k.....bbbbb....', '..kbbbBBBBBBbb..', '.bbBBBBBBBBBBBBb', '..bbbbbbbbbbbb..', '.k.k..k..k..k.k.'] },

  cucavol_frame1: { height: 16, rows: [
    '................', '................', '.....ww...ww....', '....wwww.wwww...',
    '....wwwwwwwww...', '.....wwwwwww....', '.k.....www......', '..k..bbbbbbb....',
    '...kbbBBBBBBb...', '..kbBBBTBBBBBb..', '..bbBBTBBBBBBb..', '...bbBBBBBBBb...',
    '....bbbbbbbbb...', '....k.k..k.k....'] },
  cucavol_frame2: { height: 14, rows: [
    '.k..............', '..k..bbbbbbb....', '...kbbBBBBBBb...', '..kbBBBTBBBBBb..',
    '.wbbBBTBBBBBBbw.', 'wwwbbBBBBBBBbwww', '.ww.bbbbbbbbb.ww', '....k.k..k.k....'] },

  mosquito_frame1: { height: 13, rows: [
    '.....ww..ww.....', '....wwwwwwww....', '.....wwwwww.....', '......kkk.......',
    'kkkk.kRkkk......', '......kkkWkWk...', '.......kWkWkWkk.', '......k.k.k.....', '.....k..k..k....'] },
  mosquito_frame2: { height: 13, rows: [
    '................', '...wwww..wwww...', '....www..www....', '......kkk.......',
    'kkkk.kRkkk......', '......kkkWkWk...', '.......kWkWkWkk.', '......k.k.k.....', '.....k..k..k....'] },

  gaviota_frame1: { height: 13, rows: [
    '..W..........W..', '..WW........WW..', '...WW......WW...', '...WWw....wWW...',
    '....WWwWWwWW....', '.OWWWWWWWWWWW...', '..KWWWWWWWWWwk..', '....wwwwwwwkk...', '......O.O.......'] },
  gaviota_frame2: { height: 13, rows: [
    '................', '................', '................', '................',
    '.OWWWWWWWWWWW...', '..KWWWWWWWWWwk..', '...WWwwwwwwkkW..', '..WW..O.O....WW.',
    '.WW..........WW.', '.W............W.'] },

  meiga_frame1: { colors: { L: '#a8d878' }, rows: [
    '.......KK.......', '......KKKK......', '.....KKKKKK.....', '...KKKKKKKKKK...',
    '....kLLLLLk.....', '....kLKLKLk.....', '...kkLLOLLkk....', '...kkkLLLkkk....',
    '..mmmmmmmmmm....', '.mmMmmmmmmMmm...', 'BBBBBBBBBBBBBTTT', '..mmmmmmmmmmyyyy',
    '...LL....LL.yTyT', '............yyyy'] },
  meiga_frame2: { colors: { L: '#a8d878' }, rows: [
    '.......KK.......', '......KKKK......', '.....KKKKKK.....', '...KKKKKKKKKK...',
    '....kLLLLLk.....', '....kLKLKLk.....', '...kkLLOLLkk....', '...kkkLLLkkk....',
    '..mmmmmmmmmm....', '.mmMmmmmmmMmm...', 'BBBBBBBBBBBBBTTT', '..mmmmmmmmmmTyTy',
    '...LL....LL.yyyy', '.............yTy'] },

  murcielago_frame1: { height: 12, colors: { k: '#4c2c6c' }, rows: [
    'kk............kk', 'kkk..........kkk', 'kkkk..k..k..kkkk', '.kkkk.kkkk.kkkk.',
    '..kkkkkkkkkkkk..', '...kkkRkkRkkk...', '......kWWk......', '.......kk.......'] },
  murcielago_frame2: { height: 12, colors: { k: '#4c2c6c' }, rows: [
    '......k..k......', '......kkkk......', '....kkkkkkkk....', '..kkkkRkkRkkkk..',
    '.kkkk.kWWk.kkkk.', 'kkk....kk....kkk', 'kk............kk'] },

  oveja_frame1: { rows: OVEJA, colors: OVEJA_COLORS },
  oveja_frame2: { rows: replaceRows(OVEJA, 12, ['....kk......kk..', '....kk......kk..', '...kk......kk...', '...kk......kk...']), colors: OVEJA_COLORS },
  oveja_squashed: { rows: ['................', '....WWWWWWWWW...', '.kkWWWWwWWWWwWW.', 'kWkkWWWWWWWWWWWW', 'kkkkWWWWWwWWWWWW', '....WWWWWWWWWWW.', '.....kk....kk...', '.....kk....kk...'], colors: OVEJA_COLORS },

  lagarto_frame1: { rows: LAGARTO, colors: LAGARTO_COLORS, height: 16 },
  lagarto_frame2: { rows: replaceRows(LAGARTO, 5, ['..G.G.....G.GGGG', '.GG.GG...GG.GG.G']), colors: LAGARTO_COLORS, height: 16 },
  lagarto_squashed: { rows: ['..GGG...........', '.GKGGGGGGG......', 'GGGGLLGGLGGGGGG.', '.GGGGGGGGGGGGGGG', '..G.G..G.G......'], colors: LAGARTO_COLORS, height: 8 },

  turista_frame1: { height: 24, rows: TURISTA_UPPER_BODY.concat(['....pp....pp....', '....pp....pp....', '....WW....WW....', '....WW....WW....', '...BBBW..BBBW...']) },
  turista_frame2: { height: 24, rows: TURISTA_UPPER_BODY.concat(['.....pp..pp.....', '.....pp..pp.....', '.....WW..WW.....', '.....WW..WW.....', '....BBW.BBW.....']) },
  maleta: { height: 16, rows: [
    '......kkkk......', '......k..k......', '..MMMMMMMMMMMM..', '..MmMMMMMMMMmM..',
    '..MmMMYYYYMMmM..', '..MmMMYKKYMMmM..', '..MmMMYYYYMMmM..', '..MmMMMMMMMMmM..',
    '..MmMMMMMMMMmM..', '..MmMMMMMMMMmM..', '..MMMMMMMMMMMM..', '...k........k...',
    '..kkk......kkk..', '...k........k...'] },

  caracol_frame1: { rows: CARACOL, colors: CARACOL_COLORS, height: 16 },
  caracol_frame2: { rows: replaceRows(CARACOL, 9, ['..TTTTTTTTTTTTT.', '.TKTTTTTTTTTTTTT', 'TTTTTTTTTTTTTTT.']), colors: CARACOL_COLORS, height: 16 },
  concha: { height: 15, rows: [
    '......bbbb......', '....bbBBBBbb....', '...bBBbbbbBBb...', '..bBBbTTTTbBBb..',
    '..bBbTbbbbTbBb..', '..bBbTbTTbTbBb..', '..bBbTbbTTbbBb..', '..bBBbTTTbbBBb..',
    '...bBBbbbbBBb...', '....bbBBBBbb....', '......bbbb......'] },

  toro_frame1: { rows: TORO, colors: TORO_COLORS },
  toro_frame2: { rows: replaceRows(TORO, 12, ['....KK.KK.....KK.KK.....', '....KK..KK...KK...KK....', '...KK....KK.KK.....KK...', '..kkk....kkkkk.....kkk..']), colors: TORO_COLORS },
  toro_angry: { rows: TORO, colors: { ...TORO_COLORS, K: '#7a2c18' } },

  pulpo_frame1: { colors: PULPO_COLORS, rows: PULPO_HEAD.concat([
    '..VV.VV..VV.VV..', '.VV..VV..VV..VV.', '.V..VV....VV..V.', 'VV..V......V..VV',
    'V...V......V...V', '....VV....VV....', '....VV....VV....', '....VV....VV....',
    '....VV....VV....', '....VV....VV....', '....VV....VV....', '....VV....VV....']) },
  pulpo_frame2: { colors: PULPO_COLORS, rows: PULPO_HEAD.concat([
    '.VV.VV....VV.VV.', 'VV...VV..VV...VV', 'V....VV..VV....V', '.....V....V.....',
    '....V......V....', '....VV....VV....', '.....VV..VV.....', '.....VV..VV.....',
    '....VV....VV....', '....VV....VV....', '....VV....VV....', '....VV....VV....']) },

  madre_standing: { height: 24, colors: MADRE_COLORS, rows: MADRE_UPPER_BODY.concat(MADRE_LEGS_TOGETHER) },
  madre_hopping: { height: 24, colors: MADRE_COLORS, rows: MADRE_UPPER_BODY.concat(['....SS....SS....', '....SS....SS....', '....SS....SS....', '...BBB....BBB...']) },
  madre_throwing: { height: 24, colors: MADRE_COLORS, rows: replaceRows(MADRE_UPPER_BODY, 10, ['BSMMMMWWWWMMS...', 'BBMMPWWWWWMMS...']).concat(MADRE_LEGS_TOGETHER) },

  hacienda_frame1: { colors: HACIENDA_COLORS, rows: HACIENDA_UPPER_BODY.concat(HACIENDA_LEGS_STANDING) },
  hacienda_frame2: { colors: HACIENDA_COLORS, rows: HACIENDA_UPPER_BODY.concat(['.......kkkkkk....kkkkkkk........', '......kkkkkk......kkkkkk........', '.....kkkkkk........kkkkkk.......', '....KKKKKKK........KKKKKKK......', '...KKKKKKKK........KKKKKKKK.....']) },
  hacienda_hurt: { colors: { k: '#fcfcfc', K: '#d82800', S: '#fc7858', Y: '#fcfcfc' }, rows: HACIENDA_UPPER_BODY.concat(HACIENDA_LEGS_STANDING) }
};

/** Personajes y objetos que no son enemigos. */
const OTHER_SPRITES = {
  abuela: { height: 24, colors: { K: '#282030', w: '#d8d8e0' }, rows: [
    '......ww........', '.....wwww.......', '....wwwwww......', '...wwwwwwww.....',
    '...wSSSSSSw.....', '...SSSSKSSKS....', '...SSSSSSSSSS...', '....SSSRRSSS....',
    '.....SSSSSS.....', '...KKKKKKKKK....', '..KKKKKKKKKKK...', '..KKWWWWWWWKK...',
    '.SKKWWWWWWWKKS..', '.SKKWWWWWWWKKS..', '..KKWWWWWWWKK...', '..KKKWWWWWKKK...',
    '..KKKKKKKKKKK...', '..KKKKKKKKKKK...', '...KKKKKKKKK....', '....KK...KK.....',
    '....SS...SS.....', '....SS...SS.....', '...kkk...kkk....'] },

  /* Peseta de 25 con agujero, en tres fases de giro. */
  peseta_spin0: { height: 14, rows: [
    '.....yyyyyy.....', '...yyYYYYYYyy...', '..yYYYWYYYYYYy..', '..yYYWYYYYYYYy..',
    '.yYYYYYyyYYYYYy.', '.yYYYYy..yYYYYy.', '.yYYYYy..yYYYYy.', '.yYYYYYyyYYYYYy.',
    '..yYYYYYYYYYYy..', '..yYYYYYYYYYYy..', '...yyYYYYYYyy...', '.....yyyyyy.....'] },
  peseta_spin1: { height: 14, rows: [
    '......yyyy......', '.....yYYYYy.....', '....yYWYYYYy....', '....yYWYYYYy....',
    '....yYYyyYYy....', '....yYy..yYy....', '....yYy..yYy....', '....yYYyyYYy....',
    '....yYYYYYYy....', '....yYYYYYYy....', '.....yYYYYy.....', '......yyyy......'] },
  peseta_spin2: { height: 14, rows: [
    '.......yy.......', '......yYYy......', '......yWYy......', '......yWYy......',
    '......yYYy......', '......yYYy......', '......yYYy......', '......yYYy......',
    '......yYYy......', '......yYYy......', '......yYYy......', '.......yy.......'] },

  bocadillo: { height: 16, colors: { P: '#fcc8c8', t: '#b8783c', T: '#e8b070' }, rows: [
    '...tttttttttt...', '..tTTTTTTTTTTt..', '.tTTTWTTTTWTTTt.', '.tttttttttttttt.',
    'RRRPRRRRPRRRRPRR', '.RRRRRRRRRRRRRR.', '.tTTTTTTTTTTTTt.', '..tttttttttttt..'] },
  pimiento: { height: 16, rows: [
    '......D.........', '.......D........', '......GGG.......', '.....GLLGG......',
    '....GLLGGG......', '....GLGGGGG.....', '....GGGGGGG.....', '.....GGGGGGG....',
    '.....GGGGGGG....', '......GGGGGGG...', '.......GGGGGG...', '........GGGGG...',
    '.........GGG....', '..........G.....'] },
  churros: { height: 16, colors: { T: '#e8b068', t: '#b87830', b: '#4c2410', B: '#6c3418' }, rows: [
    '..T..T..T.......', '.tT.tT.tT.......', '.tT.tT.tT.......', '.TT.TT.TT.......',
    '.tT.tT.tT.......', 'bbbbbbbbbbbb....', 'WbBBBBBBBBbW.WW.', 'WbbbbbbbbbbW..W.',
    'WWWWWWWWWWWW..W.', '.WWWWWWWWWWWWW..', '.WWWWWWWWWWW....', '..WWWWWWWWW.....',
    '...wwwwwww......'] },
  loteria: { height: 14, colors: { W: '#fcf4e0', V: '#3c9c5c' }, rows: [
    'WWWWWWWWWWWWWWWW', 'WVVVVVVVVVVVVVVW', 'WVWWWWWWWWWWWWVW', 'WVWKKWKKWKKWKWVW',
    'WVWWWWWWWWWWWWVW', 'WVWRRRWWWWWYYWVW', 'WVWRRRWWWWWYYWVW', 'WVWWWWWWWWWWWWVW',
    'WVVVVVVVVVVVVVVW', 'WWWWWWWWWWWWWWWW'] },
  /** Pimiento picante que lanza Paco. */
  pimiento_lanzado: { rows: ['...G....', '..RRR...', '.RRRRR..', '.RRWRR..', '.RRRRR..', '..RRRR..', '...RRR..', '....R...'] },
  chancla: { colors: { B: '#3c7cd8', R: '#fcfcfc' }, rows: ['........', '..BBBB..', '.BBBBBB.', 'BBRRRRBB', 'BBBBBBBB', '.BBBBBB.', '..BBBB..', '........'] },
  factura: { rows: ['WWWWWW..', 'WkkkkWW.', 'WWWWWWWW', 'WkkkWkkW', 'WWWWWWWW', 'WkkkkkkW', 'WWWWWWWW', 'WRRRWkkW', 'WWWWWWWW'] },
  petardo: { rows: ['...Y..', '..Y...', '..k...', '.RRRR.', '.RWRR.', '.RRRR.', '.RYYR.', '.RRRR.', '.RRRR.', '.RWRR.', '.RRRR.'] },
  jamon: { colors: { R: '#a8322c', W: '#f8e0d0' }, rows: [
    '....kk......', '....kk......', '...bRRb.....', '..bRRRRb....', '..RRRRRRb...', '.RRRRWRRRb..',
    '.RRRRRWRRRb.', 'RRRRRRRRRRRb', 'RRRRRRRRRRRb', '.RRRRRRRRRb.', '..RRRRRRRb..', '...bbbbbb...'] },
  tortilla: { height: 12, colors: { Y: '#fcd870', y: '#c88c30', O: '#e8a040' }, rows: [
    '................', '....yyyyyyyy....', '..yyYYYYYYYYyy..', '.yYYYYOYYYYYYYy.',
    '.yYYYYYYYYOYYYy.', 'yYYOYYYYYYYYYYYy', 'yYYYYYYYYYYYYYYy', '.yyYYYYYYYYYYyy.',
    '...yyyyyyyyyy...'] },
  receta: { rows: [
    '.TTTTTTTTTT.', 'TtttttttttT.', 'TTTTTTTTTTTT', 'TkkkTkkkkTTT', 'TTTTTTTTTTTT', 'TkkkkkkTkkTT',
    'TTTTTTTTTTTT', 'TkkTkkkkkTTT', 'TTTTTTTTTTTT', 'TkkkkTTRRRTT', '.TTTTTTTTTT.'] }
};

/**
 * Genera las definiciones de todas las combinaciones de Paco
 * (tamaño × postura × variante de color).
 * @returns {Object<string, SpriteDefinition>}
 */
function createPacoSpriteDefinitions() {
  const definitions = {};
  for (const [variantName, colors] of Object.entries(PACO_COLOR_VARIANTS)) {
    for (const [pose, rows] of Object.entries(PACO_SMALL_POSES)) {
      definitions[pacoSpriteName('small', pose, variantName)] = { rows, colors, height: 16 };
    }
    for (const [pose, rows] of Object.entries(PACO_BIG_POSES)) {
      definitions[pacoSpriteName('big', pose, variantName)] = { rows, colors, height: 32 };
    }
  }
  return definitions;
}

/** Todas las definiciones de sprites del juego, indexadas por nombre. */
export const SPRITE_DEFINITIONS = Object.freeze({
  ...createPacoSpriteDefinitions(),
  ...ENEMY_SPRITES,
  ...OTHER_SPRITES
});

/**
 * Busca filas con un ancho distinto al de la primera fila de su sprite o
 * caracteres que no son colores válidos. Lo usan los tests y el arranque del juego.
 * @param {Object<string, string>} palette Colores válidos (letra → color).
 * @returns {string[]} Lista de problemas encontrados (vacía si todo está bien).
 */
export function findSpriteDefinitionProblems(palette) {
  const problems = [];
  for (const [name, definition] of Object.entries(SPRITE_DEFINITIONS)) {
    const expectedWidth = definition.rows[0].length;
    const validColors = { ...palette, ...(definition.colors || {}) };
    definition.rows.forEach((row, rowIndex) => {
      if (row.length !== expectedWidth) problems.push(`${name}: la fila ${rowIndex} mide ${row.length} en vez de ${expectedWidth}`);
      for (const pixel of row) {
        if (pixel !== TRANSPARENT_PIXEL && !validColors[pixel]) problems.push(`${name}: color desconocido "${pixel}" en la fila ${rowIndex}`);
      }
    });
    if (definition.height && definition.rows.length > definition.height) problems.push(`${name}: tiene más filas (${definition.rows.length}) que su altura (${definition.height})`);
  }
  return problems;
}
