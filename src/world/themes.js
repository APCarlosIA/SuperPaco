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
    hasClouds: true, groundPlant: 'arbusto', pitFilling: null
  },
  benidorm: {
    name: 'benidorm',
    skyColors: ['#58b8f8', '#7cc8fc', '#a4dcfc'],
    ground: { pattern: 'speckled', baseColor: '#e8c880', lightColor: '#fce8b0', darkColor: '#c09850', mortarColor: '#a88040', topLayer: 'sand' },
    brickColors: { base: '#d88048', mortar: '#7c3c18', highlight: '#f8b078' },
    oneWayPlatform: { kind: 'awning', primaryColor: '#fc4c4c', secondaryColor: '#fcfcfc', edgeColor: '#a01818' },
    movingPlatformLook: 'inflatable',
    hasClouds: true, groundPlant: 'sombrilla', pitFilling: 'water',
    sun: { x: 270, y: 40, radius: 14, color: '#fcf8d0' }
  },
  sevilla: {
    name: 'sevilla',
    skyColors: ['#f8a040', '#f8bc60', '#fcd88c'],
    ground: { pattern: 'speckled', baseColor: '#e0a048', lightColor: '#f8c870', darkColor: '#b87028', mortarColor: '#985818', topLayer: 'albero' },
    brickColors: { base: '#c84c28', mortar: '#6c200c', highlight: '#f08058' },
    oneWayPlatform: { kind: 'awning', primaryColor: '#00a844', secondaryColor: '#fcfcfc', edgeColor: '#006020' },
    movingPlatformLook: 'wood',
    hasClouds: false, groundPlant: 'chumbera', pitFilling: null,
    sun: { x: 64, y: 50, radius: 18, color: '#fcf4b0' }
  },
  pamplona: {
    name: 'pamplona',
    skyColors: ['#6ca0f0', '#84b4f4', '#a4c8f8'],
    ground: { pattern: 'stoneBlocks', baseColor: '#9c8c78', lightColor: '#c4b4a0', darkColor: '#6c5c48', mortarColor: '#4c4034' },
    brickColors: { base: '#b85030', mortar: '#5c2010', highlight: '#e08060' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#a06030', secondaryColor: '#6c3810', edgeColor: '#3c1c08' },
    movingPlatformLook: 'wood',
    hasClouds: true, groundPlant: 'arbusto', pitFilling: null
  },
  metro: {
    name: 'metro',
    skyColors: ['#101018', '#101018', '#101018'],
    ground: { pattern: 'floorTiles', baseColor: '#5c6478', lightColor: '#8c94a8', darkColor: '#3c4458', mortarColor: '#2c3040' },
    brickColors: { base: '#b84c2c', mortar: '#4c1808', highlight: '#e07c58' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#8c94a8', secondaryColor: '#4c5468', edgeColor: '#2c3040' },
    movingPlatformLook: 'metroCar',
    hasClouds: false, groundPlant: null, pitFilling: null, hasCeiling: true
  },
  galicia: {
    name: 'galicia',
    skyColors: ['#8494a4', '#94a4b4', '#a8b8c4'],
    ground: { pattern: 'stoneBlocks', baseColor: '#8c8c90', lightColor: '#b0b0b4', darkColor: '#5c5c64', mortarColor: '#44444c', topLayer: 'grass' },
    brickColors: { base: '#a85838', mortar: '#4c2010', highlight: '#d08868' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#7c6048', secondaryColor: '#4c3828', edgeColor: '#2c2018' },
    movingPlatformLook: 'wood',
    hasClouds: false, groundPlant: 'arbusto', pitFilling: 'water', hasRain: true
  },
  valencia: {
    name: 'valencia',
    skyColors: ['#2c2458', '#6c3c78', '#d0686c'],
    ground: { pattern: 'stoneBlocks', baseColor: '#c86c3c', lightColor: '#f09460', darkColor: '#8c4420', mortarColor: '#5c2c14' },
    brickColors: { base: '#d8903c', mortar: '#6c3c10', highlight: '#fcc070' },
    oneWayPlatform: { kind: 'awning', primaryColor: '#fc8c00', secondaryColor: '#fcfcfc', edgeColor: '#a05000' },
    movingPlatformLook: 'wood',
    hasClouds: false, groundPlant: 'naranjo', pitFilling: null, hasFireworks: true
  },
  mancha: {
    name: 'mancha',
    skyColors: ['#0c1030', '#141c44', '#1c2858'],
    ground: { pattern: 'speckled', baseColor: '#8c6038', lightColor: '#b08050', darkColor: '#5c3c20', mortarColor: '#3c2410', topLayer: 'dryGrass' },
    brickColors: { base: '#a05030', mortar: '#401808', highlight: '#c87850' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#a07040', secondaryColor: '#6c4420', edgeColor: '#3c2410' },
    movingPlatformLook: 'wood',
    hasClouds: false, groundPlant: 'chumbera', pitFilling: null, isNight: true
  },
  canarias: {
    name: 'canarias',
    skyColors: ['#e86040', '#f88c58', '#fcbc80'],
    ground: { pattern: 'speckled', baseColor: '#3c3440', lightColor: '#5c5060', darkColor: '#201c24', mortarColor: '#140c14', topLayer: 'rock' },
    brickColors: { base: '#8c3c2c', mortar: '#3c1008', highlight: '#c86c50' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#6c5c6c', secondaryColor: '#403444', edgeColor: '#201820' },
    movingPlatformLook: 'stone',
    hasClouds: false, groundPlant: 'drago', pitFilling: 'lava'
  },
  hacienda: {
    name: 'hacienda',
    skyColors: ['#100c14', '#100c14', '#100c14'],
    ground: { pattern: 'stoneBlocks', baseColor: '#6c6474', lightColor: '#948c9c', darkColor: '#443c4c', mortarColor: '#241c2c' },
    brickColors: { base: '#7c6c84', mortar: '#302838', highlight: '#a898b0' },
    oneWayPlatform: { kind: 'plank', primaryColor: '#8c8494', secondaryColor: '#4c4454', edgeColor: '#241c2c' },
    movingPlatformLook: 'stone',
    hasClouds: false, groundPlant: null, pitFilling: 'lava', hasCeiling: true
  }
});
