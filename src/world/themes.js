/**
 * @file Temas visuales de cada ciudad: colores del cielo, del suelo, de los
 * ladrillos y de las plataformas, además de qué efectos tiene el escenario
 * (lluvia, fuegos artificiales, techo…).
 *
 * Es un módulo solo de datos: la forma de dibujar cada cosa está en
 * `graphics/tileImages.js`, `graphics/backgroundImages.js` y `graphics/decorationImages.js`.
 */

/**
 * @typedef {Object} GroundStyle
 * @property {'cobblestone'|'stoneBlocks'|'floorTiles'|'speckled'} pattern Dibujo del suelo.
 * @property {string} baseColor
 * @property {string} lightColor
 * @property {string} darkColor
 * @property {string} mortarColor Color de las juntas.
 * @property {'grass'|'sand'|'albero'|'dryGrass'|'rock'} [topLayer] Capa superior (hierba, arena…).
 */

/**
 * @typedef {Object} Theme
 * @property {string} name Identificador (coincide con la clave).
 * @property {string[]} skyColors Tres franjas de cielo, de arriba a abajo.
 * @property {GroundStyle} ground
 * @property {{base:string, mortar:string, highlight:string}} brickColors
 * @property {{kind:'balcony'|'awning'|'plank', primaryColor:string, secondaryColor:string, edgeColor:string}} oneWayPlatform
 * @property {'wood'|'inflatable'|'metroCar'|'stone'} movingPlatformLook Aspecto de las plataformas móviles.
 * @property {boolean} hasClouds
 * @property {string|null} groundPlant Decoración que crece en el suelo.
 * @property {'water'|'lava'|null} pitFilling Qué se ve al fondo de los fosos.
 * @property {boolean} [hasCeiling] Nivel cerrado con techo (metro, castillo).
 * @property {boolean} [hasRain]
 * @property {boolean} [hasFireworks]
 * @property {boolean} [isNight]
 * @property {{x:number, y:number, radius:number, color:string}} [sun] Sol fijo en el cielo.
 * @property {{color:string, alpha:number, mode:string}} [grade] Corrección de color del nivel.
 * @property {number} [vignette] Oscurecimiento de los bordes (0 a 1).
 * @property {number} [bloom] Resplandor de las zonas brillantes (0 a 1).
 * @property {{darkness:number, color:string, playerLightRadius:number}} [lighting] Nivel con poca luz: solo se ve alrededor de las fuentes de luz.
 */

/** @type {Object<string, Theme>} */
export const THEMES = Object.freeze({
  madrid: {
    name: 'madrid',
    skyColors: ['#5c94fc', '#74a8fc', '#94bcfc'],
    ground: { pattern: 'cobblestone', baseColor: '#a09888', lightColor: '#cac2b2', darkColor: '#6c6458', mortarColor: '#4c463e' },
    brickColors: { base: '#c85a2c', mortar: '#6c2410', highlight: '#ec8c64' },
    oneWayPlatform: { kind: 'balcony', primaryColor: '#e0d8c8', secondaryColor: '#6c6458', edgeColor: '#282828' },
    movingPlatformLook: 'wood',
    hasClouds: true, groundPlant: 'arbusto', pitFilling: null,
    grade: { color: '#ffd9a0', alpha: 0.1, mode: 'soft-light' }
  },
  benidorm: {
    name: 'benidorm',
    skyColors: ['#58b8f8', '#7cc8fc', '#a4dcfc'],
    ground: { pattern: 'speckled', baseColor: '#e8c880', lightColor: '#fce8b0', darkColor: '#c09850', mortarColor: '#a88040', topLayer: 'sand' },
    brickColors: { base: '#d88048', mortar: '#7c3c18', highlight: '#f8b078' },
    oneWayPlatform: { kind: 'awning', primaryColor: '#fc4c4c', secondaryColor: '#fcfcfc', edgeColor: '#a01818' },
    movingPlatformLook: 'inflatable',
    hasClouds: true, groundPlant: 'sombrilla', pitFilling: 'water',
    sun: { x: 270, y: 40, radius: 14, color: '#fcf8d0' },
    grade: { color: '#7fd0ff', alpha: 0.08, mode: 'soft-light' }, bloom: 0.2
  },
  sevilla: {
    name: 'sevilla',
    skyColors: ['#e5683a', '#f2924e', '#f9c47e'],
    ground: { pattern: 'speckled', baseColor: '#e0a048', lightColor: '#f8c870', darkColor: '#b87028', mortarColor: '#985818', topLayer: 'albero' },
    brickColors: { base: '#c84c28', mortar: '#6c200c', highlight: '#f08058' },
    oneWayPlatform: { kind: 'awning', primaryColor: '#00a844', secondaryColor: '#fcfcfc', edgeColor: '#006020' },
    movingPlatformLook: 'wood',
    hasClouds: false, groundPlant: 'chumbera', pitFilling: null,
    sun: { x: 64, y: 50, radius: 18, color: '#fcf4b0' },
    grade: { color: '#ff9a50', alpha: 0.16, mode: 'soft-light' }, bloom: 0.2
  },
  pamplona: {
    name: 'pamplona',
    skyColors: ['#6ca0f0', '#84b4f4', '#a4c8f8'],
    ground: { pattern: 'stoneBlocks', baseColor: '#9c8c78', lightColor: '#c4b4a0', darkColor: '#6c5c48', mortarColor: '#4c4034' },
    brickColors: { base: '#b85030', mortar: '#5c2010', highlight: '#e08060' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#a06030', secondaryColor: '#6c3810', edgeColor: '#3c1c08' },
    movingPlatformLook: 'wood',
    hasClouds: true, groundPlant: 'arbusto', pitFilling: null,
    grade: { color: '#ffe8c0', alpha: 0.06, mode: 'soft-light' }
  },
  metro: {
    name: 'metro',
    skyColors: ['#101018', '#101018', '#101018'],
    ground: { pattern: 'floorTiles', baseColor: '#5c6478', lightColor: '#8c94a8', darkColor: '#3c4458', mortarColor: '#2c3040' },
    brickColors: { base: '#b84c2c', mortar: '#4c1808', highlight: '#e07c58' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#8c94a8', secondaryColor: '#4c5468', edgeColor: '#2c3040' },
    movingPlatformLook: 'metroCar',
    hasClouds: false, groundPlant: null, pitFilling: null, hasCeiling: true,
    grade: { color: '#4a68ff', alpha: 0.2, mode: 'soft-light' }, vignette: 0.6,
    lighting: { darkness: 0.3, color: '#04061a', playerLightRadius: 110 }
  },
  galicia: {
    name: 'galicia',
    skyColors: ['#8494a4', '#94a4b4', '#a8b8c4'],
    ground: { pattern: 'stoneBlocks', baseColor: '#8c8c90', lightColor: '#b0b0b4', darkColor: '#5c5c64', mortarColor: '#44444c', topLayer: 'grass' },
    brickColors: { base: '#a85838', mortar: '#4c2010', highlight: '#d08868' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#7c6048', secondaryColor: '#4c3828', edgeColor: '#2c2018' },
    movingPlatformLook: 'wood',
    hasClouds: false, groundPlant: 'arbusto', pitFilling: 'water', hasRain: true,
    grade: { color: '#8aa0b8', alpha: 0.22, mode: 'soft-light' }, vignette: 0.55
  },
  valencia: {
    name: 'valencia',
    skyColors: ['#2c2458', '#6c3c78', '#d0686c'],
    ground: { pattern: 'stoneBlocks', baseColor: '#c86c3c', lightColor: '#f09460', darkColor: '#8c4420', mortarColor: '#5c2c14' },
    brickColors: { base: '#d8903c', mortar: '#6c3c10', highlight: '#fcc070' },
    oneWayPlatform: { kind: 'awning', primaryColor: '#fc8c00', secondaryColor: '#fcfcfc', edgeColor: '#a05000' },
    movingPlatformLook: 'wood',
    hasClouds: false, groundPlant: 'naranjo', pitFilling: null, hasFireworks: true,
    grade: { color: '#ff4a9a', alpha: 0.16, mode: 'soft-light' }, bloom: 0.34
  },
  mancha: {
    name: 'mancha',
    skyColors: ['#0c1030', '#141c44', '#1c2858'],
    ground: { pattern: 'speckled', baseColor: '#8c6038', lightColor: '#b08050', darkColor: '#5c3c20', mortarColor: '#3c2410', topLayer: 'dryGrass' },
    brickColors: { base: '#a05030', mortar: '#401808', highlight: '#c87850' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#a07040', secondaryColor: '#6c4420', edgeColor: '#3c2410' },
    movingPlatformLook: 'wood',
    hasClouds: false, groundPlant: 'chumbera', pitFilling: null, isNight: true,
    grade: { color: '#3a4aff', alpha: 0.26, mode: 'soft-light' }, vignette: 0.6, bloom: 0.34,
    lighting: { darkness: 0.28, color: '#02041a', playerLightRadius: 120 }
  },
  canarias: {
    name: 'canarias',
    skyColors: ['#e86040', '#f88c58', '#fcbc80'],
    ground: { pattern: 'speckled', baseColor: '#3c3440', lightColor: '#5c5060', darkColor: '#201c24', mortarColor: '#140c14', topLayer: 'rock' },
    brickColors: { base: '#8c3c2c', mortar: '#3c1008', highlight: '#c86c50' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#6c5c6c', secondaryColor: '#403444', edgeColor: '#201820' },
    movingPlatformLook: 'stone',
    hasClouds: false, groundPlant: 'drago', pitFilling: 'lava',
    grade: { color: '#ff5a20', alpha: 0.18, mode: 'soft-light' }, bloom: 0.34
  },
  hacienda: {
    name: 'hacienda',
    skyColors: ['#100c14', '#100c14', '#100c14'],
    ground: { pattern: 'stoneBlocks', baseColor: '#6c6474', lightColor: '#948c9c', darkColor: '#443c4c', mortarColor: '#241c2c' },
    brickColors: { base: '#7c6c84', mortar: '#302838', highlight: '#a898b0' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#8c8494', secondaryColor: '#4c4454', edgeColor: '#241c2c' },
    movingPlatformLook: 'stone',
    hasClouds: false, groundPlant: null, pitFilling: 'lava', hasCeiling: true,
    grade: { color: '#6a3aff', alpha: 0.2, mode: 'soft-light' }, vignette: 0.68, bloom: 0.34,
    lighting: { darkness: 0.52, color: '#04020c', playerLightRadius: 96 }
  },
  /* ---- Salas secretas (no son ciudades; se entra por puertas y alcantarillas) ---- */
  taberna: {
    name: 'taberna',
    skyColors: ['#2a160c', '#3c2012', '#5a3018'],
    ground: { pattern: 'floorTiles', baseColor: '#8a5a34', lightColor: '#c8905a', darkColor: '#5a3a20', mortarColor: '#2c1a0e' },
    brickColors: { base: '#b8662a', mortar: '#4a2410', highlight: '#e8a060' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#a8683a', secondaryColor: '#6a3c1a', edgeColor: '#2c1a0e' },
    movingPlatformLook: 'wood',
    hasClouds: false, groundPlant: null, pitFilling: null, hasCeiling: true,
    grade: { color: '#ffb060', alpha: 0.18, mode: 'soft-light' }, vignette: 0.55, bloom: 0.34
  },
  bodega: {
    name: 'bodega',
    skyColors: ['#14081c', '#201030', '#2c1840'],
    ground: { pattern: 'stoneBlocks', baseColor: '#6a5a78', lightColor: '#9484a4', darkColor: '#40344c', mortarColor: '#1c1428' },
    brickColors: { base: '#8a4a5a', mortar: '#3a1c28', highlight: '#c0809a' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#7a5a48', secondaryColor: '#4a3428', edgeColor: '#1c1428' },
    movingPlatformLook: 'wood',
    hasClouds: false, groundPlant: null, pitFilling: null, hasCeiling: true,
    grade: { color: '#a04aff', alpha: 0.2, mode: 'soft-light' }, vignette: 0.62, bloom: 0.34,
    lighting: { darkness: 0.3, color: '#08020e', playerLightRadius: 100 }
  },
  gruta: {
    name: 'gruta',
    skyColors: ['#04141c', '#082838', '#0c3a4c'],
    ground: { pattern: 'speckled', baseColor: '#2c4a5c', lightColor: '#5a8aa0', darkColor: '#162c3a', mortarColor: '#0a1822', topLayer: 'rock' },
    brickColors: { base: '#3a6a80', mortar: '#102430', highlight: '#78b0c8' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#4a7a90', secondaryColor: '#2c4c5c', edgeColor: '#0a1822' },
    movingPlatformLook: 'stone',
    hasClouds: false, groundPlant: null, pitFilling: null, hasCeiling: true,
    grade: { color: '#3affd0', alpha: 0.18, mode: 'soft-light' }, vignette: 0.6, bloom: 0.5
  }
});