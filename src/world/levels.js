/**
 * @file Los 10 niveles del juego, cada uno en una ciudad de España.
 *
 * Cada nivel se describe con los métodos de {@link LevelBuilder}. Recordatorio
 * de coordenadas: la columna 0 es el principio del nivel, la fila 12 es la que
 * pisan los personajes sobre el suelo normal y la fila 9 es la altura típica
 * de los bloques (4 baldosas por encima del suelo).
 *
 * Reglas de diseño que se han respetado para que todo sea alcanzable:
 *   - Paco sube hasta 4 baldosas de altura con carrerilla (3 desde parado).
 *   - Los huecos sin plataforma miden como mucho 4 baldosas.
 *   - Los tramos largos de agua o lava siempre tienen una plataforma móvil.
 *
 * Cada nivel, además, tiene:
 *   - una Flor Maravilla que transforma un tramo (y deja una Semilla al final),
 *   - tres monedas gigantes (dos a la vista pero difíciles y una en una sala secreta),
 *   - una sala secreta (alcantarilla o puerta) y flores cotillas con pistas y chistes.
 */
import { LevelBuilder } from './LevelBuilder.js';
import { BLOCK_CONTENT } from './tileTypes.js';
import { createCoinRoom, createShopRoom, createChallengeRoom } from './rooms.js';

const { MULTI_COIN, POWER_UP, CHURROS, EXTRA_LIFE } = BLOCK_CONTENT;

/**
 * @typedef {Object} LevelDefinition
 * @property {string} name Nombre de la ciudad que aparece en el marcador.
 * @property {string} subtitle Frase (meme) que aparece antes de empezar.
 * @property {string} musicName Canción de fondo (clave de SONGS).
 * @property {number} timeLimit Tiempo disponible en unidades del marcador.
 * @property {() => import('./LevelBuilder.js').LevelData} build Construye el nivel desde cero.
 */

/** @type {LevelDefinition[]} */
export const LEVELS = [
  {
    name: 'MADRID',
    subtitle: 'DE MADRID AL CIELO',
    musicName: 'feria',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(254, 'madrid');
      // Inicio: primeros bloques y guiris para aprender a pisar.
      level.addGround(0, 64);
      level.addSign(4, 'KM 0');
      level.addDecoration('farola', 9);
      level.addTalker(7, ['¡HOLA! SOY UNA FLOR COTILLA.\nSALTA SOBRE LOS GUIRIS: NO PICAN.', 'MANTÉN SALTAR PARA\nSALTAR MÁS ALTO.']);
      level.addTalker(41, ['SOY EL MADROÑO.\nEL OSO ES MI AMIGO.', 'EN MADRID NO HAY MAR,\nPERO HAY CAÑAS.'], { look: 'oso' });
      // Alcantarilla secreta: sala con pesetas y la primera moneda gigante.
      level.addDoor({ column: 31, look: 'manhole', roomId: 'taberna' });
      level.addRoom('taberna', createCoinRoom({
        themeName: 'taberna',
        bigCoinNumber: level.reserveBigCoin(),
        lines: ['¡PSST! ESTA TABERNA\nNO EXISTE. SHHH.', '¡LA ÚLTIMA CAÑA\nES PARA TI!', '¿TE HAS FIJADO EN LA\nMONEDA GIGANTE ARRIBA?']
      }));
      level.addQuestionBlock(13, 9);
      level.addBricks(17, 9);
      level.addQuestionBlock(18, 9, POWER_UP);
      level.addBricks(19, 9);
      level.addQuestionBlock(20, 9);
      level.addBricks(21, 9);
      level.addQuestionBlock(19, 5);
      level.addEnemy('guiri', 24);
      // Toneles cada vez más altos.
      level.addBarrel(28, 2);
      level.addEnemy('paloma', 34);
      level.addBarrel(38, 3);
      level.addEnemy('guiri', 43);
      level.addEnemy('guiri', 45);
      level.addBarrel(49, 4);
      level.addOneWayPlatform(53, 9, 4);
      level.addCoinRow(53, 8, 4);
      level.addEnemy('guiri', 57);
      level.addHiddenBlock(60, 9, EXTRA_LIFE);
      // Segundo tramo tras un hueco de 2.
      level.addGround(67, 92);
      level.addBricks(70, 9);
      level.addQuestionBlock(71, 9, MULTI_COIN);
      level.addBricks(72, 9, 2);
      level.addBricks(75, 5, 7);
      level.addEnemy('paloma', 77, 4);
      level.addEnemy('paloma', 80, 4);
      level.addBigCoin(78, 3);
      level.addEnemy('turista', 86);
      // Tercer tramo con punto de control. ¡Y la Flor Maravilla del desfile!
      level.addGround(96, 138);
      level.addTalker(94, ['¡UNA FLOR BRILLANTE!\n¿A QUE NO TE ATREVES A TOCARLA?']);
      level.addWonder({ column: 97, kind: 'parade', endColumn: 132 });
      level.addEnemy('ejecutivo', 114);
      level.addEnemy('guiri', 118);
      level.addEnemy('paloma', 122);
      level.addEnemy('guiri', 124);
      level.addEnemy('ejecutivo', 128);
      level.addOneWayPlatform(98, 10, 3);
      level.addOneWayPlatform(102, 8, 3);
      level.addCoinRow(102, 7, 3);
      level.setCheckpoint(106);
      level.addQuestionBlock(108, 9);
      level.addQuestionBlock(111, 9);
      level.addQuestionBlock(111, 5, POWER_UP);
      level.addQuestionBlock(114, 9);
      level.addEnemy('guiri', 110);
      level.addEnemy('guiri', 112);
      level.addSign(117, 'OJO CUIDAO');
      level.addBricks(120, 9);
      level.addBricks(121, 9, 1, CHURROS);
      level.addBricks(122, 9);
      level.addEnemy('turista', 126);
      level.addEnemy('paloma', 130);
      level.addEnemy('paloma', 132);
      level.addStaircase(135, 4, 'up');
      // Hueco entre escaleras y recta final.
      level.addGround(141, 253);
      level.addStaircase(141, 4, 'down');
      level.addBarrel(151, 2);
      level.addEnemy('guiri', 155);
      level.addEnemy('guiri', 157);
      level.addBarrel(162, 2);
      level.addBricks(166, 9, 2);
      level.addQuestionBlock(168, 9);
      level.addBricks(169, 9);
      // Ruta alta: escalera de balcones hasta la moneda gigante de los tejados.
      level.addOneWayPlatform(153, 10, 2);
      level.addOneWayPlatform(156, 8, 2);
      level.addOneWayPlatform(159, 6, 2);
      level.addOneWayPlatform(164, 4, 2);
      level.addCoinArc(153, 9, 4, 1);
      level.addBigCoin(165, 2);
      level.addTalker(147, ['¿VES ESOS BALCONES?\nSUBE, SUBE... ¡HAY TESORO!']);
      level.addEnemy('paloma', 171);
      // Sector final: las azoteas. Cornisas con pasillo por debajo, colinas y torres.
      level.addTalker(176, ['¡LA RECTA FINAL!\nPERO ANTES... UN PASEO POR LAS AZOTEAS.']);
      level.addLedge(180, 10);
      level.addCoinRow(181, 11, 8);
      level.addEnemy('cucaracha', 184);
      level.addEnemy('guiri', 187);
      level.addQuestionBlock(184, 6, POWER_UP);
      level.addCoinRow(182, 7, 6);
      level.addEnemy('paloma', 189, 6);
      level.addHill(194, 201, 2);
      level.addEnemy('paloma', 197, 8);
      level.addCoinArc(194, 9, 8, 2);
      level.addBricks(196, 6, 3, EXTRA_LIFE);
      level.addBarrel(205, 3);
      level.addEnemy('guiri', 208);
      level.addBarrel(212, 2, { withOctopus: true });
      level.addLedge(216, 7);
      level.addEnemy('ejecutivo', 219);
      level.addCoinRow(217, 11, 5);
      level.addAzulejoBlocks(224, 9, 1, 4);
      level.addOneWayPlatform(221, 6, 4);
      level.addCoinRow(221, 5, 4);
      level.addStaircase(228, 6, 'up');
      level.addAzulejoBlocks(234, 7, 1, 6);
      level.setGoal(244);
      return level.build();
    }
  },
  {
    name: 'BENIDORM',
    subtitle: 'GUIRIS EVERYWHERE',
    musicName: 'playa',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(254, 'benidorm');
      level.addGround(0, 30);
      level.addSign(4, '1 € LA CAÑA');
      level.addTalker(7, ['¡ESTO ES BENIDORM!\nAQUÍ TODO ES ALTO... MENOS EL SUELDO.', 'EL SOL SALE PARA TODOS.\nLA SOMBRA, SOLO PARA LOS DEL HOTEL.']);
      level.addTalker(27, ['MIAU. ¿HAY PESCADITO\nEN ESTE CHIRINGUITO?'], { look: 'gato' });
      // Puerta del chiringuito secreto: tienda de premios.
      level.addDoor({ column: 19, look: 'door', roomId: 'chiringuito' });
      level.addRoom('chiringuito', createShopRoom({
        themeName: 'taberna',
        bigCoinNumber: level.reserveBigCoin(),
        lines: ['BIENVENIDO AL CHIRINGUITO.\nELIGE UN REGALO... ¡Y SIN COLA!', 'LA PAELLA ES DE BOTE.\nLOS BLOQUES, DE VERDAD.']
      }));
      level.addQuestionBlock(10, 9);
      level.addQuestionBlock(11, 9, POWER_UP);
      level.addQuestionBlock(12, 9);
      level.addEnemy('guiri', 16);
      level.addEnemy('turista', 22);
      level.addOneWayPlatform(24, 9, 4);
      level.addCoinRow(24, 8, 4);
      level.addGround(34, 60);
      level.addBarrel(38, 2);
      level.addEnemy('gaviota', 46, 8);
      level.addBricks(46, 9, 4);
      level.addQuestionBlock(48, 5);
      level.addEnemy('turista', 51);
      level.addEnemy('guiri', 56);
      // Colchoneta hinchable sobre el mar.
      level.addMovingPlatform({ column: 61, row: 10, lengthInTiles: 3, axis: 'horizontal', travelInTiles: 2, speed: 0.8 });
      level.addGround(66, 97);
      level.addOneWayPlatform(70, 10, 3);
      level.addOneWayPlatform(74, 8, 3);
      level.addOneWayPlatform(78, 6, 3);
      level.addCoinRow(78, 5, 3);
      level.addQuestionBlock(83, 9, POWER_UP);
      level.addOneWayPlatform(82, 4, 3);
      level.addBigCoin(83, 2);
      level.addEnemy('guiri', 86);
      level.addEnemy('guiri', 88);
      level.addEnemy('gaviota', 93, 7);
      level.setCheckpoint(90);
      level.addStaircase(95, 3, 'up');
      level.addGround(101, 140);
      level.addStaircase(101, 3, 'down');
      // Maravilla lunar: plataformas altísimas solo alcanzables con gravedad baja.
      level.addTalker(104, ['¿SIENTES ESA BRISA?\nTOCA LA FLOR Y VERÁS... ¡QUE FLOTAS!']);
      level.addWonder({ column: 105, kind: 'moon', endColumn: 138 });
      level.addOneWayPlatform(107, 7, 3);
      level.addCoinRow(107, 6, 3);
      level.addOneWayPlatform(112, 4, 3);
      level.addCoinRow(112, 3, 3);
      level.addOneWayPlatform(117, 2, 3);
      level.addCoinRow(117, 1, 3);
      level.addBigCoin(121, 1);
      level.addOneWayPlatform(124, 5, 3);
      level.addCoinArc(124, 4, 3, 1);
      level.addOneWayPlatform(130, 3, 3);
      level.addCoinRow(130, 2, 3);
      level.addEnemy('turista', 110);
      level.addEnemy('turista', 112);
      level.addBricks(116, 9, 5);
      level.addQuestionBlock(118, 9, CHURROS);
      level.addEnemy('gaviota', 124, 8);
      level.addEnemy('gaviota', 131, 6);
      level.addSign(126, 'SE ALQUILA HAMACA');
      level.addMovingPlatform({ column: 141, row: 10, lengthInTiles: 3, axis: 'horizontal', travelInTiles: 7, speed: 1 });
      level.addGround(151, 185);
      level.addEnemy('guiri', 158);
      level.addEnemy('turista', 163);
      level.addBarrel(167, 3);
      level.addBarrel(172, 4);
      level.addEnemy('gaviota', 176, 8);
      // Sector final: la piscina, la terraza del hotel y las dunas.
      level.addTalker(178, ['¡PISCINA PARA TODOS!\n(MENOS PARA TI: CAERÁS).']);
      level.addHill(181, 184, 1);
      level.addMovingPlatform({ column: 186, row: 10, lengthInTiles: 3, axis: 'horizontal', travelInTiles: 2, speed: 0.9 });
      level.addGround(191, 253);
      level.addLedge(196, 9);
      level.addCoinRow(197, 11, 7);
      level.addEnemy('turista', 200);
      level.addQuestionBlock(199, 6, CHURROS);
      level.addCoinRow(198, 7, 6);
      level.addEnemy('gaviota', 203, 6);
      level.addHill(208, 215, 2);
      level.addCoinArc(208, 9, 8, 2);
      level.addEnemy('guiri', 211, 10);
      level.addBarrel(220, 3);
      level.addEnemy('turista', 224);
      level.addOneWayPlatform(227, 9, 3);
      level.addOneWayPlatform(231, 7, 3);
      level.addCoinRow(231, 6, 3);
      level.addStaircase(236, 5, 'up');
      level.setGoal(244);
      return level.build();
    }
  },
  {
    name: 'SEVILLA',
    subtitle: '¡ILLO, QUÉ CALÓ!',
    musicName: 'flamenco',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(252, 'sevilla');
      level.addGround(0, 45);
      level.addSign(4, 'ILLO');
      level.addTalker(6, ['¡ILLO! AQUÍ SE VIVE A 40 GRADOS\nY SIN NINGUNA PRISA.', 'SI SUENAN PALMAS,\nEL SUELO SE MUEVE. ¡FÍJATE!']);
      level.addTalker(26, ['¡OLÉ! TÚ BAILAS MEJOR\nQUE UN GUIRI.', 'LAS PALMAS MANDAN.\nBUSCA UNA FLOR CON DUENDE.'], { look: 'bailaora' });
      // Alcantarilla del patio: sala de pruebas en la bodega.
      level.addDoor({ column: 38, look: 'manhole', roomId: 'bodega' });
      level.addRoom('bodega', createChallengeRoom({
        themeName: 'bodega',
        bigCoinNumber: level.reserveBigCoin(),
        lines: ['LA BODEGA DEL ABUELO.\nEL VINO, ¡AL OTRO LADO DEL FOSO!', '¿TIENES BUEN PULSO?\nPUES SALTA, SALTA...']
      }));
      level.addDecoration('farola', 7);
      // Toldos de las casetas de feria.
      level.addOneWayPlatform(9, 10, 4);
      level.addOneWayPlatform(15, 8, 4);
      level.addCoinRow(15, 7, 4);
      level.addEnemy('caracol', 13);
      level.addEnemy('mosquito', 20, 9);
      level.addQuestionBlock(22, 9, POWER_UP);
      level.addBricks(23, 9);
      level.addQuestionBlock(24, 9);
      level.addEnemy('guiri', 28);
      level.addEnemy('guiri', 30);
      level.addBarrel(34, 2);
      level.addEnemy('madre', 41);
      level.addGround(49, 85);
      level.addOneWayPlatform(52, 9, 5);
      level.addOneWayPlatform(58, 6, 5);
      level.addQuestionBlock(60, 2, EXTRA_LIFE);
      level.addBigCoin(64, 3);
      level.addEnemy('mosquito', 64, 8);
      level.addEnemy('caracol', 68);
      level.addEnemy('caracol', 70);
      level.addBricks(72, 9, 3);
      level.addBricks(73, 9, 1, MULTI_COIN);
      level.addBarrel(79, 3);
      level.addEnemy('madre', 79, 9); // Madre subida encima del tonel.
      level.addGround(89, 125);
      level.setCheckpoint(92);
      level.addSign(95, 'AQUÍ NO SE TRABAJA');
      level.addQuestionBlock(98, 9);
      level.addQuestionBlock(99, 9, POWER_UP);
      level.addQuestionBlock(100, 9);
      level.addEnemy('guiri', 102);
      level.addEnemy('guiri', 104);
      level.addEnemy('caracol', 107);
      level.addOneWayPlatform(109, 9, 3);
      level.addOneWayPlatform(113, 7, 3);
      level.addOneWayPlatform(117, 5, 3);
      level.addCoinRow(117, 4, 3);
      level.addEnemy('mosquito', 114, 4);
      level.addStaircase(122, 4, 'up');
      level.addGround(129, 251);
      level.addStaircase(129, 4, 'down');
      // Maravilla al compás: plataformas que se alternan con las palmas.
      level.addTalker(133, ['ESCUCHA... TACATÁ, TACATÁ.\nLAS PLATAFORMAS SIGUEN EL COMPÁS.']);
      level.addWonder({ column: 135, kind: 'rhythm', endColumn: 170 });
      level.addBeatPlatforms(138, 8, 3, 'A');
      level.addBeatPlatforms(142, 8, 3, 'B');
      level.addCoinRow(138, 7, 3);
      level.addCoinRow(142, 7, 3);
      level.addBeatPlatforms(153, 7, 3, 'A');
      level.addBeatPlatforms(157, 7, 3, 'B');
      level.addCoinRow(153, 6, 3);
      level.addCoinRow(157, 6, 3);
      level.addBeatPlatforms(161, 5, 3, 'A');
      level.addBeatPlatforms(165, 5, 3, 'B');
      level.addBigCoin(166, 3);
      level.addEnemy('madre', 137);
      level.addEnemy('guiri', 141);
      level.addEnemy('guiri', 143);
      level.addBricks(146, 9, 6);
      level.addQuestionBlock(148, 9, CHURROS);
      level.addEnemy('mosquito', 151, 7);
      level.addEnemy('caracol', 155);
      level.addBarrel(159, 2);
      level.addBarrel(165, 3);
      level.addEnemy('madre', 171);
      // Sector final: soportales con túnel, el escenario de la feria y las casetas.
      level.addTalker(173, ['¡LOS SOPORTALES! TIENEN TÚNEL\nY TODO. QUÉ LUJO.']);
      level.addLedge(177, 10);
      level.addCoinRow(178, 11, 8);
      level.addEnemy('guiri', 181);
      level.addEnemy('caracol', 185);
      level.addQuestionBlock(182, 6, POWER_UP);
      level.addEnemy('madre', 186, 8);
      level.addHill(191, 198, 2);
      level.addCoinArc(191, 9, 8, 2);
      level.addEnemy('mosquito', 195, 7);
      level.addBarrel(202, 4);
      level.addEnemy('guiri', 205);
      level.addLedge(212, 8);
      level.addCoinRow(213, 11, 6);
      level.addEnemy('caracol', 215);
      level.addOneWayPlatform(222, 9, 3);
      level.addOneWayPlatform(226, 7, 3);
      level.addCoinRow(226, 6, 3);
      level.addStaircase(232, 5, 'up');
      level.setGoal(242);
      return level.build();
    }
  },
  {
    name: 'PAMPLONA',
    subtitle: '¡CORRE, QUE TE PILLA EL TORO!',
    musicName: 'feria',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(252, 'pamplona');
      level.addGround(0, 39);
      level.addSign(3, 'CORRE');
      level.addTalker(6, ['¡CUIDADO CON LOS TOROS!\nSE SABEN TU CARA.', 'LOS BALCONES SON TUS AMIGOS.\nLOS TOROS, NO.']);
      level.addTalker(22, ['SANFERMINES: DEL 6 AL 14\nDE JULIO... DE CADA AÑO.'], { look: 'sancho' });
      // Puerta de la bodega de la peña.
      level.addDoor({ column: 12, look: 'door', roomId: 'pena' });
      level.addRoom('pena', createCoinRoom({
        themeName: 'bodega',
        bigCoinNumber: level.reserveBigCoin(),
        lines: ['LA PEÑA ESTÁ DE FIESTA.\n¡ENTRA, QUE HAY CHISTORRA!', '¡VIVA SAN FERMÍN!\n¡GORA SAN FERMÍN!']
      }));
      level.addOneWayPlatform(8, 9, 3);
      level.addEnemy('guiri', 14);
      level.addQuestionBlock(16, 9, POWER_UP);
      level.addAzulejoBlocks(20, 12);
      // Balcones para refugiarse de los toros.
      level.addOneWayPlatform(24, 9, 4);
      level.addEnemy('toro', 30);
      level.addOneWayPlatform(32, 9, 4);
      level.addAzulejoBlocks(37, 11, 2, 2);
      level.addGround(43, 73);
      level.addOneWayPlatform(46, 9, 3);
      level.addQuestionBlock(47, 5);
      level.addOneWayPlatform(52, 8, 3);
      level.addEnemy('toro', 56);
      level.addBricks(58, 9, 3);
      level.addQuestionBlock(61, 9, MULTI_COIN);
      level.addEnemy('guiri', 63);
      level.addAzulejoBlocks(66, 10, 1, 3);
      level.addEnemy('toro', 70);
      level.addGround(77, 109);
      level.setCheckpoint(80);
      level.addOneWayPlatform(82, 10, 3);
      level.addOneWayPlatform(86, 8, 3);
      level.addOneWayPlatform(90, 6, 3);
      level.addCoinRow(90, 5, 3);
      level.addOneWayPlatform(94, 3, 3);
      level.addBigCoin(95, 1);
      level.addEnemy('toro', 97);
      level.addAzulejoBlocks(100, 11, 1, 2);
      level.addQuestionBlock(103, 9, POWER_UP);
      level.addEnemy('toro', 106);
      level.addOneWayPlatform(111, 9, 2);
      level.addGround(114, 137);
      // ¡El encierro! Un toro gigante persigue a Paco; las escaleras sirven de refugio.
      level.addTalker(115, ['¿OYES ESE RUMOR?\n¡ES EL ENCIERRO! ¡CORRE O SUBE!']);
      level.addWonder({ column: 116, kind: 'stampede', endColumn: 146 });
      level.addEnemy('guiri', 118);
      level.addEnemy('guiri', 120);
      level.addBricks(124, 9, 4);
      level.addQuestionBlock(125, 5, EXTRA_LIFE);
      level.addStaircase(134, 4, 'up');
      level.addGround(140, 251);
      level.addStaircase(140, 4, 'down');
      level.addEnemy('toro', 150);
      level.addAzulejoBlocks(154, 11, 1, 2);
      level.addEnemy('toro', 158);
      level.addOneWayPlatform(160, 9, 4);
      level.addOneWayPlatform(164, 6, 2);
      level.addBigCoin(165, 4);
      level.addEnemy('toro', 166);
      // Sector final: calle Estafeta, con balcones-túnel y colinas.
      level.addTalker(173, ['CALLE ESTAFETA: ¡POR AQUÍ\nPASAN LOS TOROS (Y LOS TURISTAS)!']);
      level.addLedge(177, 11);
      level.addCoinRow(178, 11, 9);
      level.addEnemy('toro', 183);
      level.addQuestionBlock(184, 6, POWER_UP);
      level.addCoinRow(182, 7, 6);
      level.addHill(192, 199, 2);
      level.addEnemy('guiri', 196, 10);
      level.addEnemy('toro', 204);
      level.addAzulejoBlocks(208, 11, 1, 2);
      level.addEnemy('toro', 214);
      level.addOneWayPlatform(216, 9, 4);
      level.addCoinRow(217, 8, 3);
      level.addLedge(222, 7);
      level.addCoinRow(223, 11, 5);
      level.addEnemy('guiri', 225);
      level.addStaircase(232, 6, 'up');
      level.setGoal(242);
      return level.build();
    }
  },
  {
    name: 'METRO',
    subtitle: 'PRÓXIMA ESTACIÓN: SOL',
    musicName: 'metro',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(252, 'metro');
      level.addCeiling(0, 251);
      level.addGround(0, 40);
      level.addSign(3, 'LÍNEA 1');
      level.addTalker(6, ['ESTE METRO TIENE MÁS RETRASOS\nQUE UN VERANO.', 'NO SE APOYEN EN LAS PUERTAS.\nYA, ESO LO SÉ.']);
      level.addTalker(12, ['MIAU. SOLO VEO LÍNEA 1\nEN MI DESTINO.'], { look: 'gato' });
      // Alcantarilla secreta: túnel de cristales.
      level.addDoor({ column: 38, look: 'manhole', roomId: 'cristales' });
      level.addRoom('cristales', createChallengeRoom({
        themeName: 'gruta',
        bigCoinNumber: level.reserveBigCoin(),
        lines: ['UN TÚNEL QUE NO ESTÁ\nEN NINGÚN PLANO.', 'CUIDADO CON EL MOSQUITO...\nSE COLÓ POR LAS VÍAS.']
      }));
      level.addBricks(8, 9, 6);
      level.addQuestionBlock(10, 9, POWER_UP);
      level.addEnemy('cucaracha', 15);
      level.addEnemy('ejecutivo', 20);
      level.addEnemy('ejecutivo', 22);
      level.addBarrel(26, 3);
      level.addBricks(30, 8, 4, MULTI_COIN);
      level.addEnemy('cucavol', 34, 8);
      // Vagón que cruza las vías.
      level.addMovingPlatform({ column: 41, row: 10, lengthInTiles: 3, axis: 'horizontal', travelInTiles: 3, speed: 1 });
      level.addGround(47, 90);
      // Maravilla en la oscuridad: se funden los plomos y solo se ve con la luz de Paco.
      level.addTalker(48, ['¿HAS OÍDO ESE ZUMBIDO?\nCREO QUE SE VA LA LUZ...']);
      level.addWonder({ column: 49, kind: 'dark', endColumn: 86 });
      level.addBricks(50, 9, 2);
      level.addBricks(52, 9, 1, EXTRA_LIFE);
      // Pasillo de ladrillos con pesetas dentro.
      level.addBricks(58, 9, 10);
      level.addBricks(58, 5, 10);
      level.addCoinRow(59, 7, 8);
      level.addBigCoin(63, 6);
      level.addEnemy('ejecutivo', 64);
      level.addEnemy('turista', 71);
      level.addEnemy('cucaracha', 75);
      level.addEnemy('cucaracha', 77);
      level.setCheckpoint(80);
      level.addSign(84, 'NO SE APOYEN');
      level.addGround(94, 140);
      level.addBarrel(96, 2);
      level.addBarrel(101, 3);
      level.addBarrel(106, 4);
      level.addEnemy('cucaracha', 99);
      level.addEnemy('ejecutivo', 110);
      level.addEnemy('ejecutivo', 113);
      level.addQuestionBlock(116, 9);
      level.addQuestionBlock(117, 9, POWER_UP);
      level.addQuestionBlock(118, 9);
      level.addEnemy('cucavol', 120, 7);
      level.addEnemy('cucavol', 126, 9);
      level.addBricks(128, 9, 8);
      level.addCoinRow(128, 8, 8);
      level.addMovingPlatform({ column: 141, row: 10, lengthInTiles: 3, axis: 'horizontal', travelInTiles: 7, speed: 1.1 });
      level.addGround(151, 251);
      level.addEnemy('turista', 156);
      level.addEnemy('ejecutivo', 160);
      level.addEnemy('ejecutivo', 162);
      level.addEnemy('ejecutivo', 164);
      // Sector final: el andén de la última estación.
      level.addTalker(172, ['ÚLTIMA ESTACIÓN... ¡CASI!\nLOS TRENES AQUÍ SON DE PLATAFORMAS.']);
      level.addLedge(176, 10);
      level.addCoinRow(177, 11, 8);
      level.addEnemy('cucaracha', 180);
      level.addEnemy('cucaracha', 183);
      level.addQuestionBlock(181, 6, POWER_UP);
      level.addEnemy('cucavol', 186, 6);
      level.addHill(192, 199, 2);
      level.addEnemy('ejecutivo', 196, 10);
      level.addBricks(204, 9, 6);
      level.addCoinRow(204, 8, 6);
      level.addEnemy('ejecutivo', 207);
      level.addEnemy('ejecutivo', 210);
      level.addLedge(214, 8);
      level.addCoinRow(215, 11, 6);
      level.addEnemy('turista', 218);
      level.addBigCoin(218, 6);
      level.addStaircase(226, 4, 'up');
      level.addAzulejoBlocks(230, 9, 2, 4);
      level.setGoal(241);
      return level.build();
    }
  },
  {
    name: 'GALICIA',
    subtitle: '¿SUBES O BAJAS? DEPENDE.',
    musicName: 'muineira',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(250, 'galicia');
      level.addGround(0, 24);
      level.addSign(3, 'DEPENDE');
      level.addTalker(6, ['¿SUBES O BAJAS? DEPENDE.\n¿LLUEVE? SIEMPRE.', 'AQUÍ EL SOL ES UNA LEYENDA\nURBANA.']);
      // Puerta del pazo: tienda de premios en la bodega.
      level.addDoor({ column: 22, look: 'door', roomId: 'pazo' });
      level.addRoom('pazo', createShopRoom({
        themeName: 'bodega',
        bigCoinNumber: level.reserveBigCoin(),
        lines: ['EL PAZO DE LAS MEIGAS.\nCOGE LO QUE QUIERAS... SIN RESPONDER.', '¿ES UN POLTERGEIST\nO UN PULPO? NON SEI.']
      }));
      level.addQuestionBlock(9, 9);
      level.addQuestionBlock(10, 9, POWER_UP);
      level.addBarrel(14, 2, { withOctopus: true });
      level.addEnemy('caracol', 19);
      level.addGround(28, 50);
      level.addGround(34, 40, 11); // Pequeña colina.
      level.addEnemy('meiga', 38, 6);
      level.addBarrel(44, 3, { withOctopus: true });
      level.addOneWayPlatform(47, 9, 3);
      level.addOneWayPlatform(52, 10, 2); // Batea de mejillones sobre la ría.
      level.addOneWayPlatform(53, 7, 2);
      level.addBigCoin(54, 5);
      level.addGround(56, 90);
      level.addEnemy('caracol', 60);
      level.addEnemy('caracol', 62);
      level.addBricks(64, 9, 3);
      level.addQuestionBlock(67, 9);
      level.addBricks(68, 9, 1, MULTI_COIN);
      level.addBarrel(72, 4, { withOctopus: true });
      level.addEnemy('meiga', 76, 6);
      level.addTalker(78, ['¡QUE NON, QUE NON!\n¿ESTO É UN PULPO Ó UN PERIFÉRICO?'], { look: 'sancho' });
      level.setCheckpoint(80);
      level.addSign(82, 'HABERLAS, HAYLAS');
      level.addGround(84, 90, 10);
      level.addMovingPlatform({ column: 91, row: 9, lengthInTiles: 3, axis: 'horizontal', travelInTiles: 3, speed: 0.8 });
      level.addGround(97, 140);
      // Lluvia de pesetas: el orballo se vuelve dinero.
      level.addTalker(98, ['ORBALLO, ORBALLO...\n¡HOY LLUEVEN PESETAS!']);
      level.addWonder({ column: 99, kind: 'rain', endColumn: 136 });
      level.addBarrel(100, 2, { withOctopus: true });
      level.addBarrel(106, 3, { withOctopus: true });
      level.addBarrel(112, 2, { withOctopus: true });
      level.addEnemy('caracol', 104);
      level.addEnemy('meiga', 110, 5);
      level.addQuestionBlock(116, 9, POWER_UP);
      level.addBricks(117, 9, 2);
      level.addQuestionBlock(119, 5, EXTRA_LIFE);
      level.addEnemy('caracol', 122);
      level.addEnemy('caracol', 124);
      level.addEnemy('caracol', 126);
      level.addOneWayPlatform(142, 10, 2);
      level.addGround(146, 249);
      level.addOneWayPlatform(168, 9, 2);
      level.addOneWayPlatform(171, 7, 2);
      level.addBigCoin(172, 5);
      level.addEnemy('meiga', 150, 7);
      level.addBarrel(154, 3, { withOctopus: true });
      level.addEnemy('meiga', 160, 5);
      level.addStaircase(164, 4, 'up');
      level.addEnemy('caracol', 170);
      // Sector final: hórreos-túnel, colinas con caracoles y pulpos de feria.
      level.addTalker(177, ['ÚLTIMO TRAMO...\n¡CUIDADO CON LOS PULPOS DE FERIA!']);
      level.addBarrel(180, 3, { withOctopus: true });
      level.addEnemy('meiga', 184, 6);
      level.addHill(187, 194, 2);
      level.addEnemy('caracol', 191, 10);
      level.addLedge(198, 9);
      level.addCoinRow(199, 11, 7);
      level.addEnemy('caracol', 202);
      level.addQuestionBlock(201, 6, POWER_UP);
      level.addBarrel(209, 2, { withOctopus: true });
      level.addEnemy('meiga', 212, 5);
      level.addHill(216, 222, 1);
      level.addOneWayPlatform(224, 9, 3);
      level.addCoinRow(224, 8, 3);
      level.addStaircase(230, 6, 'up');
      level.setGoal(240);
      return level.build();
    }
  },
  {
    name: 'VALENCIA',
    subtitle: 'MASCLETÀ A LAS 14:00',
    musicName: 'flamenco',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(250, 'valencia');
      level.addGround(0, 50);
      level.addSign(3, 'MASCLETÀ');
      level.addTalker(6, ['¡ES LA MASCLETÀ!\nTAPA LOS OÍDOS... O NO.', 'LOS PETARDOS CAEN DEL CIELO.\nNO ES UN MENÚ.']);
      level.addTalker(13, ['¡UNA PAELLA CON CEBOLLA\nES UNA OFENSA!'], { look: 'bailaora' });
      // Puerta de la falla: sala de pesetas.
      level.addDoor({ column: 26, look: 'door', roomId: 'falla' });
      level.addRoom('falla', createCoinRoom({
        themeName: 'taberna',
        bigCoinNumber: level.reserveBigCoin(),
        lines: ['EL TALLER DE LA FALLA.\nTODO ESTO SE QUEMARÁ EL 19.', '¡NINOT INDULTAT!\n(EL TUYO, NO.)']
      }));
      level.addQuestionBlock(10, 9, POWER_UP);
      level.addBricks(11, 9, 3);
      level.addEnemy('guiri', 16);
      level.addEnemy('cucaracha', 20);
      level.addFirecrackerZone(22, 48);
      level.addEnemy('madre', 30);
      level.addOneWayPlatform(34, 9, 4);
      level.addCoinRow(34, 8, 4);
      level.addEnemy('cucaracha', 40);
      level.addEnemy('cucaracha', 42);
      level.addBarrel(46, 3);
      level.addGround(54, 100);
      level.addEnemy('madre', 60);
      level.addBricks(62, 9, 1, EXTRA_LIFE);
      level.addBricks(63, 9, 3);
      level.addEnemy('cucavol', 66, 8);
      level.addEnemy('cucavol', 72, 6);
      level.addFirecrackerZone(64, 90);
      level.addStaircase(76, 3, 'up');
      level.addAzulejoBlocks(79, 10, 3, 3);
      level.addStaircase(82, 3, 'down');
      level.setCheckpoint(88);
      level.addEnemy('guiri', 92);
      level.addEnemy('guiri', 94);
      level.addEnemy('madre', 98);
      level.addGround(104, 150);
      // Desfile de ninots: los enemigos bailan y se vuelven inofensivos.
      level.addTalker(105, ['ESA FLOR TIENE ALGO RARO...\n¡UN DESFILE DE NINOTS!']);
      level.addWonder({ column: 106, kind: 'parade', endColumn: 146 });
      level.addQuestionBlock(108, 9);
      level.addQuestionBlock(109, 9, CHURROS);
      level.addQuestionBlock(110, 9);
      level.addFirecrackerZone(106, 146);
      level.addEnemy('cucaracha', 114);
      level.addEnemy('cucaracha', 116);
      level.addOneWayPlatform(118, 9, 3);
      level.addOneWayPlatform(122, 6, 3);
      level.addCoinRow(122, 5, 3);
      level.addOneWayPlatform(127, 4, 2);
      level.addBigCoin(128, 2);
      level.addEnemy('madre', 125);
      level.addBarrel(130, 2);
      level.addBarrel(136, 3);
      level.addEnemy('madre', 136, 9);
      level.addEnemy('cucavol', 142, 7);
      level.addGround(154, 249);
      level.addEnemy('guiri', 160);
      level.addEnemy('guiri', 162);
      level.addEnemy('madre', 168);
      // Sector final: la plaza de la cremà, con cornisas y torres de azulejos.
      level.addTalker(173, ['¡LA CREMÀ SE ACERCA!\nCORRE HASTA LA META.']);
      level.addFirecrackerZone(176, 226);
      level.addLedge(178, 10);
      level.addCoinRow(179, 11, 8);
      level.addEnemy('cucaracha', 182);
      level.addEnemy('madre', 186, 8);
      level.addHill(192, 199, 2);
      level.addEnemy('cucavol', 196, 6);
      level.addAzulejoBlocks(204, 9, 1, 4);
      level.addAzulejoBlocks(206, 11, 2, 2);
      level.addEnemy('guiri', 209);
      level.addEnemy('madre', 212);
      level.addLedge(216, 8);
      level.addCoinRow(217, 11, 6);
      level.addEnemy('cucaracha', 219);
      level.addBigCoin(220, 6);
      level.addStaircase(228, 6, 'up');
      level.setGoal(238);
      return level.build();
    }
  },
  {
    name: 'LA MANCHA',
    subtitle: 'QUE NO SON GIGANTES, SANCHO',
    musicName: 'night',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(252, 'mancha');
      level.addGround(0, 33);
      level.addSign(3, 'EN UN LUGAR…');
      level.addTalker(6, ['¡MOLINOS! ¡QUE NO, SANCHO,\nQUE NO SON GIGANTES!', 'SI LAS ASPAS TE DAN,\nTE DAN: SALTA.']);
      // Alcantarilla secreta de la venta: sala de pruebas.
      level.addDoor({ column: 22, look: 'manhole', roomId: 'venta' });
      level.addRoom('venta', createChallengeRoom({
        themeName: 'bodega',
        bigCoinNumber: level.reserveBigCoin(),
        lines: ['LA VENTA DEL TÍO PACO.\nSOLO SIRVEN VINO Y VALOR.', 'EN UN LUGAR DE LA MANCHA...\nHAY UN FOSO ENORME.']
      }));
      level.addEnemy('oveja', 12);
      level.addEnemy('oveja', 14);
      level.addQuestionBlock(17, 9, POWER_UP);
      level.addEnemy('murcielago', 24, 6);
      level.addWindmill(30); // Sus aspas barren el hueco que viene después.
      level.addGround(37, 80);
      level.addTalker(39, ['¡FORTUNA GUÍA NUESTROS PASOS,\nSANCHO AMIGO!'], { look: 'quijote' });
      level.addTalker(41, ['¡PERO MI SEÑOR, SI ESTO ES UN\nPOLÍGONO INDUSTRIAL!'], { look: 'sancho' });
      level.addEnemy('oveja', 44);
      level.addBricks(50, 9, 3);
      level.addQuestionBlock(53, 9);
      level.addQuestionBlock(53, 5, EXTRA_LIFE);
      level.addOneWayPlatform(57, 9, 3);
      level.addEnemy('toro', 62);
      level.addWindmill(66);
      level.addQuestionBlock(68, 9, MULTI_COIN);
      level.addEnemy('murcielago', 72, 5);
      level.addEnemy('oveja', 76);
      level.setCheckpoint(79);
      level.addMovingPlatform({ column: 81, row: 10, lengthInTiles: 3, axis: 'horizontal', travelInTiles: 5, speed: 0.9 });
      level.addGround(89, 125);
      level.addWindmill(93);
      level.addOneWayPlatform(95, 9, 3);
      level.addCoinRow(95, 8, 3);
      level.addOneWayPlatform(98, 6, 3);
      level.addBigCoin(99, 4);
      level.addEnemy('oveja', 101);
      level.addEnemy('oveja', 103);
      level.addQuestionBlock(107, 9, POWER_UP);
      level.addBricks(108, 9, 2);
      level.addAzulejoBlocks(112, 11, 1, 2);
      level.addEnemy('toro', 118);
      level.addWindmill(123);
      level.addGround(129, 161);
      // Luna llena: la gravedad se afloja y las plataformas del cielo se vuelven alcanzables.
      level.addTalker(130, ['¡QUÉ LUNA, SANCHO!\nCREO QUE HOY PESAMOS MENOS.']);
      level.addWonder({ column: 131, kind: 'moon', endColumn: 156 });
      level.addOneWayPlatform(135, 8, 3);
      level.addCoinRow(135, 7, 3);
      level.addOneWayPlatform(140, 5, 3);
      level.addCoinRow(140, 4, 3);
      level.addOneWayPlatform(145, 2, 3);
      level.addCoinRow(145, 1, 3);
      level.addBigCoin(150, 1);
      level.addEnemy('murcielago', 132, 7);
      level.addEnemy('murcielago', 136, 5);
      level.addSign(138, 'QUE NO SON GIGANTES');
      level.addEnemy('toro', 146);
      level.addEnemy('oveja', 150);
      level.addWindmill(152);
      level.addQuestionBlock(154, 9, MULTI_COIN);
      level.addStaircase(158, 4, 'up');
      level.addGround(164, 251);
      level.addStaircase(164, 4, 'down');
      level.addEnemy('murcielago', 172, 6);
      // Sector final: molinos, cerros y una venta con pasillo.
      level.addWindmill(178);
      level.addEnemy('oveja', 184);
      level.addEnemy('oveja', 186);
      level.addHill(190, 197, 2);
      level.addEnemy('murcielago', 194, 6);
      level.addLedge(201, 10);
      level.addCoinRow(202, 11, 8);
      level.addEnemy('oveja', 205);
      level.addQuestionBlock(206, 6, POWER_UP);
      level.addEnemy('toro', 214);
      level.addWindmill(218);
      level.addOneWayPlatform(222, 9, 3);
      level.addCoinRow(222, 8, 3);
      level.addStaircase(232, 5, 'up');
      level.setGoal(242);
      return level.build();
    }
  },
  {
    name: 'CANARIAS',
    subtitle: '¡CHACHO, QUE QUEMA!',
    musicName: 'playa',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(252, 'canarias');
      level.addGround(0, 20);
      level.addSign(3, 'CHACHO');
      level.addTalker(6, ['CHACHO, QUE ESTO ES UN VOLCÁN...\nPERO SIN ESTRÉS.', 'LA LAVA QUEMA.\nEL GOFIO, ENGORDA.']);
      // Puerta de la cueva: sala de cristales.
      level.addDoor({ column: 38, look: 'door', roomId: 'cueva' });
      level.addRoom('cueva', createCoinRoom({
        themeName: 'gruta',
        bigCoinNumber: level.reserveBigCoin(),
        lines: ['LA CUEVA DE LOS GUANCHES.\nSHHH... ESTÁN DURMIENDO.', 'ESTOS CRISTALES NO SE VENDEN.\nPERO SE ADMIRAN.']
      }));
      level.addQuestionBlock(8, 9, POWER_UP);
      level.addEnemy('lagarto', 14);
      level.addLavaBubble(22);
      level.addGround(25, 40);
      level.addEnemy('lagarto', 30);
      level.addEnemy('lagarto', 32);
      level.addOneWayPlatform(34, 9, 3);
      // Plataforma que sube y baja, y un roque volcánico en mitad de la lava.
      level.addMovingPlatform({ column: 41, row: 11, lengthInTiles: 3, axis: 'vertical', travelInTiles: -3, speed: 0.6 });
      level.addGround(46, 48, 9);
      level.addOneWayPlatform(47, 6, 3);
      level.addBigCoin(48, 4);
      level.addLavaBubble(44);
      level.addLavaBubble(49);
      level.addGround(51, 65);
      level.addEnemy('lagarto', 56);
      level.addBricks(60, 9, 3);
      level.addQuestionBlock(63, 9, MULTI_COIN);
      level.addLavaBubble(67);
      level.addGround(70, 90);
      level.addBarrel(72, 3);
      level.addEnemy('lagarto', 77);
      level.setCheckpoint(80);
      level.addEnemy('lagarto', 84);
      level.addEnemy('lagarto', 86);
      level.addMovingPlatform({ column: 91, row: 10, lengthInTiles: 3, axis: 'horizontal', travelInTiles: 11, speed: 1.1 });
      level.addLavaBubble(98);
      level.addGround(105, 124);
      // Maravilla al compás sobre la lava: plataformas que laten con el volcán.
      level.addTalker(106, ['EL VOLCÁN TIENE RITMO.\n¡TOCA LA FLOR Y BAILA!']);
      level.addWonder({ column: 107, kind: 'rhythm', endColumn: 146 });
      level.addBeatPlatforms(113, 8, 3, 'A');
      level.addBeatPlatforms(117, 8, 3, 'B');
      level.addCoinRow(113, 7, 3);
      level.addCoinRow(117, 7, 3);
      level.addBeatPlatforms(125, 10, 2, 'A');
      level.addBeatPlatforms(127, 10, 2, 'B');
      level.addBeatPlatforms(133, 8, 3, 'A');
      level.addBeatPlatforms(137, 8, 3, 'B');
      level.addCoinRow(133, 7, 3);
      level.addCoinRow(137, 7, 3);
      level.addBeatPlatforms(141, 6, 3, 'A');
      level.addBeatPlatforms(145, 6, 3, 'B');
      level.addBigCoin(146, 4);
      level.addQuestionBlock(108, 9, POWER_UP);
      level.addQuestionBlock(109, 9);
      level.addEnemy('lagarto', 112);
      level.addEnemy('murcielago', 118, 7);
      level.addStaircase(122, 3, 'up');
      level.addLavaBubble(126);
      level.addGround(129, 150);
      level.addStaircase(129, 3, 'down');
      level.addEnemy('lagarto', 136);
      level.addEnemy('lagarto', 138);
      level.addEnemy('lagarto', 140);
      level.addOneWayPlatform(142, 9, 3);
      level.addOneWayPlatform(146, 6, 3);
      level.addQuestionBlock(147, 2, EXTRA_LIFE);
      level.addMovingPlatform({ column: 151, row: 10, lengthInTiles: 3, axis: 'horizontal', travelInTiles: 7, speed: 1 });
      level.addLavaBubble(154);
      level.addLavaBubble(158);
      level.addGround(161, 185);
      level.addEnemy('lagarto', 166);
      level.addEnemy('murcielago', 170, 6);
      // Sector final: último foso de lava, cornisas de roca y colinas volcánicas.
      level.addTalker(176, ['EL ÚLTIMO SALTO:\nLA LAVA NO PERDONA, CHACHO.']);
      level.addHill(178, 183, 2);
      level.addLavaBubble(188);
      level.addMovingPlatform({ column: 186, row: 10, lengthInTiles: 3, axis: 'horizontal', travelInTiles: 3, speed: 1 });
      level.addGround(192, 251);
      level.addLedge(196, 9);
      level.addCoinRow(197, 11, 7);
      level.addEnemy('lagarto', 200);
      level.addQuestionBlock(199, 6, CHURROS);
      level.addEnemy('murcielago', 203, 6);
      level.addHill(208, 215, 2);
      level.addEnemy('lagarto', 211, 10);
      level.addOneWayPlatform(220, 9, 3);
      level.addOneWayPlatform(224, 7, 3);
      level.addCoinRow(224, 6, 3);
      level.addStaircase(232, 6, 'up');
      level.setGoal(242);
      return level.build();
    }
  },
  {
    name: 'HACIENDA',
    subtitle: 'HACIENDA SOMOS TODOS',
    musicName: 'castle',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(162, 'hacienda');
      level.addCeiling(0, 161);
      level.addGround(0, 18);
      level.addSign(3, 'BORRADOR DE LA RENTA');
      level.addTalker(6, ['AQUÍ SE DECLARA TODO...\nINCLUSO LAS FLORES.', 'EL FISCO NO PERDONA.\nPERO LA TIENDA DE ABAJO, SÍ.']);
      // Alcantarilla del archivo: la tienda de premios antes del jefe.
      level.addDoor({ column: 14, look: 'manhole', roomId: 'archivo' });
      level.addRoom('archivo', createShopRoom({
        themeName: 'bodega',
        bigCoinNumber: level.reserveBigCoin(),
        lines: ['EL ARCHIVO SECRETO.\nAQUÍ SE GUARDAN LAS DEDUCCIONES.', 'COGE LO QUE NECESITES.\nTE VA A HACER FALTA.'],
        contents: [POWER_UP, CHURROS, POWER_UP]
      }));
      level.addQuestionBlock(10, 9, POWER_UP);
      level.addLavaBubble(20);
      level.addGround(23, 40);
      level.addAzulejoBlocks(28, 9);
      level.addFireBar(28, 9, 6, 0.04);
      level.addEnemy('ejecutivo', 34);
      level.addEnemy('ejecutivo', 36);
      level.addOneWayPlatform(33, 7, 3);
      level.addBigCoin(34, 5);
      level.addMovingPlatform({ column: 41, row: 10, lengthInTiles: 2, axis: 'horizontal', travelInTiles: 4, speed: 0.9 });
      level.addLavaBubble(43);
      level.addGround(47, 70);
      level.addAzulejoBlocks(52, 8);
      level.addFireBar(52, 8, 6, -0.05);
      level.addEnemy('ejecutivo', 58);
      level.addAzulejoBlocks(62, 11, 1, 2);
      level.addFireBar(62, 11, 5, 0.05);
      level.addOneWayPlatform(64, 7, 3);
      level.addBigCoin(65, 5);
      level.setCheckpoint(66);
      level.addMovingPlatform({ column: 71, row: 10, lengthInTiles: 3, axis: 'horizontal', travelInTiles: 5, speed: 1 });
      level.addLavaBubble(73);
      level.addLavaBubble(77);
      level.addGround(79, 110);
      // Devolución de Hacienda: llueven pesetas (por una vez, sin letra pequeña).
      level.addTalker(80, ['¡DEVOLUCIÓN DE HACIENDA!\nPOR UNA VEZ, EL DINERO VUELVE.']);
      level.addWonder({ column: 81, kind: 'rain', endColumn: 106 });
      level.addAzulejoBlocks(84, 9);
      level.addFireBar(84, 9, 6, 0.035);
      level.addAzulejoBlocks(92, 9);
      level.addFireBar(92, 9, 6, -0.035);
      level.addEnemy('ejecutivo', 88);
      level.addEnemy('ejecutivo', 97);
      level.addEnemy('madre', 101);
      level.addQuestionBlock(104, 9, POWER_UP);
      level.addLavaBubble(112);
      level.addGround(115, 121);
      // Batalla final sobre un puente y sala de la abuela con la receta.
      level.addBossBridge(122, 141);
      level.setBossArena(122, 141);
      level.addEnemy('hacienda', 136);
      level.addGround(142, 161);
      level.addDecoration('abuela', 150);
      level.addDecoration('recipePedestal', 154);
      return level.build();
    }
  }
];

/** Columna a la que Paco camina solo tras vencer al jefe (donde espera la abuela). */
export const FINAL_ROOM_END_COLUMN = 147;
