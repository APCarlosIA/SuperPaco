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
 */
import { LevelBuilder } from './LevelBuilder.js';
import { BLOCK_CONTENT } from './tileTypes.js';

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
      const level = new LevelBuilder(206, 'madrid');
      // Inicio: primeros bloques y guiris para aprender a pisar.
      level.addGround(0, 64);
      level.addSign(4, 'KM 0');
      level.addDecoration('farola', 9);
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
      level.addEnemy('turista', 86);
      // Tercer tramo con punto de control.
      level.addGround(96, 138);
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
      level.addGround(141, 205);
      level.addStaircase(141, 4, 'down');
      level.addBarrel(151, 2);
      level.addEnemy('guiri', 155);
      level.addEnemy('guiri', 157);
      level.addBarrel(162, 2);
      level.addBricks(166, 9, 2);
      level.addQuestionBlock(168, 9);
      level.addBricks(169, 9);
      level.addEnemy('paloma', 171);
      level.addStaircase(174, 6, 'up');
      level.addAzulejoBlocks(180, 7, 1, 6);
      level.setGoal(190);
      return level.build();
    }
  },
  {
    name: 'BENIDORM',
    subtitle: 'GUIRIS EVERYWHERE',
    musicName: 'playa',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(202, 'benidorm');
      level.addGround(0, 30);
      level.addSign(4, '1 € LA CAÑA');
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
      level.addEnemy('guiri', 86);
      level.addEnemy('guiri', 88);
      level.addEnemy('gaviota', 93, 7);
      level.setCheckpoint(90);
      level.addStaircase(95, 3, 'up');
      level.addGround(101, 140);
      level.addStaircase(101, 3, 'down');
      level.addEnemy('turista', 110);
      level.addEnemy('turista', 112);
      level.addBricks(116, 9, 5);
      level.addQuestionBlock(118, 9, CHURROS);
      level.addEnemy('gaviota', 124, 8);
      level.addEnemy('gaviota', 131, 6);
      level.addSign(126, 'SE ALQUILA HAMACA');
      level.addMovingPlatform({ column: 141, row: 10, lengthInTiles: 3, axis: 'horizontal', travelInTiles: 7, speed: 1 });
      level.addGround(151, 201);
      level.addEnemy('guiri', 158);
      level.addEnemy('turista', 163);
      level.addBarrel(167, 3);
      level.addBarrel(172, 4);
      level.addEnemy('gaviota', 176, 8);
      level.addStaircase(179, 5, 'up');
      level.setGoal(191);
      return level.build();
    }
  },
  {
    name: 'SEVILLA',
    subtitle: '¡ILLO, QUÉ CALÓ!',
    musicName: 'flamenco',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(198, 'sevilla');
      level.addGround(0, 45);
      level.addSign(4, 'ILLO');
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
      level.addGround(129, 197);
      level.addStaircase(129, 4, 'down');
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
      level.addStaircase(175, 5, 'up');
      level.setGoal(187);
      return level.build();
    }
  },
  {
    name: 'PAMPLONA',
    subtitle: '¡CORRE, QUE TE PILLA EL TORO!',
    musicName: 'feria',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(196, 'pamplona');
      level.addGround(0, 39);
      level.addSign(3, 'CORRE');
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
      level.addEnemy('toro', 97);
      level.addAzulejoBlocks(100, 11, 1, 2);
      level.addQuestionBlock(103, 9, POWER_UP);
      level.addEnemy('toro', 106);
      level.addOneWayPlatform(111, 9, 2);
      level.addGround(114, 137);
      level.addEnemy('guiri', 118);
      level.addEnemy('guiri', 120);
      level.addBricks(124, 9, 4);
      level.addQuestionBlock(125, 5, EXTRA_LIFE);
      level.addEnemy('toro', 131);
      level.addStaircase(134, 4, 'up');
      level.addGround(140, 195);
      level.addStaircase(140, 4, 'down');
      level.addEnemy('toro', 150);
      level.addAzulejoBlocks(154, 11, 1, 2);
      level.addEnemy('toro', 158);
      level.addOneWayPlatform(160, 9, 4);
      level.addEnemy('toro', 166);
      level.addStaircase(170, 6, 'up');
      level.setGoal(184);
      return level.build();
    }
  },
  {
    name: 'METRO',
    subtitle: 'PRÓXIMA ESTACIÓN: SOL',
    musicName: 'metro',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(196, 'metro');
      level.addCeiling(0, 195);
      level.addGround(0, 40);
      level.addSign(3, 'LÍNEA 1');
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
      level.addBricks(50, 9, 2);
      level.addBricks(52, 9, 1, EXTRA_LIFE);
      // Pasillo de ladrillos con pesetas dentro.
      level.addBricks(58, 9, 10);
      level.addBricks(58, 5, 10);
      level.addCoinRow(59, 7, 8);
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
      level.addGround(151, 195);
      level.addEnemy('turista', 156);
      level.addEnemy('ejecutivo', 160);
      level.addEnemy('ejecutivo', 162);
      level.addEnemy('ejecutivo', 164);
      level.addStaircase(168, 4, 'up');
      level.addAzulejoBlocks(172, 9, 2, 4);
      level.setGoal(183);
      return level.build();
    }
  },
  {
    name: 'GALICIA',
    subtitle: '¿SUBES O BAJAS? DEPENDE.',
    musicName: 'muineira',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(200, 'galicia');
      level.addGround(0, 24);
      level.addSign(3, 'DEPENDE');
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
      level.addGround(56, 90);
      level.addEnemy('caracol', 60);
      level.addEnemy('caracol', 62);
      level.addBricks(64, 9, 3);
      level.addQuestionBlock(67, 9);
      level.addBricks(68, 9, 1, MULTI_COIN);
      level.addBarrel(72, 4, { withOctopus: true });
      level.addEnemy('meiga', 76, 6);
      level.setCheckpoint(80);
      level.addSign(82, 'HABERLAS, HAYLAS');
      level.addGround(84, 90, 10);
      level.addMovingPlatform({ column: 91, row: 9, lengthInTiles: 3, axis: 'horizontal', travelInTiles: 3, speed: 0.8 });
      level.addGround(97, 140);
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
      level.addGround(146, 199);
      level.addEnemy('meiga', 150, 7);
      level.addBarrel(154, 3, { withOctopus: true });
      level.addEnemy('meiga', 160, 5);
      level.addStaircase(164, 4, 'up');
      level.addEnemy('caracol', 170);
      level.addStaircase(174, 6, 'up');
      level.setGoal(188);
      return level.build();
    }
  },
  {
    name: 'VALENCIA',
    subtitle: 'MASCLETÀ A LAS 14:00',
    musicName: 'flamenco',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(198, 'valencia');
      level.addGround(0, 50);
      level.addSign(3, 'MASCLETÀ');
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
      level.addQuestionBlock(108, 9);
      level.addQuestionBlock(109, 9, CHURROS);
      level.addQuestionBlock(110, 9);
      level.addFirecrackerZone(106, 146);
      level.addEnemy('cucaracha', 114);
      level.addEnemy('cucaracha', 116);
      level.addOneWayPlatform(118, 9, 3);
      level.addOneWayPlatform(122, 6, 3);
      level.addCoinRow(122, 5, 3);
      level.addEnemy('madre', 125);
      level.addBarrel(130, 2);
      level.addBarrel(136, 3);
      level.addEnemy('madre', 136, 9);
      level.addEnemy('cucavol', 142, 7);
      level.addGround(154, 197);
      level.addEnemy('guiri', 160);
      level.addEnemy('guiri', 162);
      level.addEnemy('madre', 168);
      level.addStaircase(172, 6, 'up');
      level.setGoal(184);
      return level.build();
    }
  },
  {
    name: 'LA MANCHA',
    subtitle: 'QUE NO SON GIGANTES, SANCHO',
    musicName: 'night',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(198, 'mancha');
      level.addGround(0, 33);
      level.addSign(3, 'EN UN LUGAR…');
      level.addEnemy('oveja', 12);
      level.addEnemy('oveja', 14);
      level.addQuestionBlock(17, 9, POWER_UP);
      level.addEnemy('murcielago', 24, 6);
      level.addWindmill(30); // Sus aspas barren el hueco que viene después.
      level.addGround(37, 80);
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
      level.addEnemy('oveja', 101);
      level.addEnemy('oveja', 103);
      level.addQuestionBlock(107, 9, POWER_UP);
      level.addBricks(108, 9, 2);
      level.addAzulejoBlocks(112, 11, 1, 2);
      level.addEnemy('toro', 118);
      level.addWindmill(123);
      level.addGround(129, 161);
      level.addEnemy('murcielago', 132, 7);
      level.addEnemy('murcielago', 136, 5);
      level.addSign(138, 'QUE NO SON GIGANTES');
      level.addEnemy('toro', 146);
      level.addEnemy('oveja', 150);
      level.addWindmill(152);
      level.addQuestionBlock(154, 9, MULTI_COIN);
      level.addStaircase(158, 4, 'up');
      level.addGround(164, 197);
      level.addStaircase(164, 4, 'down');
      level.addEnemy('murcielago', 172, 6);
      level.addStaircase(176, 5, 'up');
      level.setGoal(186);
      return level.build();
    }
  },
  {
    name: 'CANARIAS',
    subtitle: '¡CHACHO, QUE QUEMA!',
    musicName: 'playa',
    timeLimit: 400,
    build() {
      const level = new LevelBuilder(200, 'canarias');
      level.addGround(0, 20);
      level.addSign(3, 'CHACHO');
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
      level.addGround(161, 199);
      level.addEnemy('lagarto', 166);
      level.addEnemy('murcielago', 170, 6);
      level.addStaircase(174, 6, 'up');
      level.setGoal(186);
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
      level.addQuestionBlock(10, 9, POWER_UP);
      level.addLavaBubble(20);
      level.addGround(23, 40);
      level.addAzulejoBlocks(28, 9);
      level.addFireBar(28, 9, 6, 0.04);
      level.addEnemy('ejecutivo', 34);
      level.addEnemy('ejecutivo', 36);
      level.addMovingPlatform({ column: 41, row: 10, lengthInTiles: 2, axis: 'horizontal', travelInTiles: 4, speed: 0.9 });
      level.addLavaBubble(43);
      level.addGround(47, 70);
      level.addAzulejoBlocks(52, 8);
      level.addFireBar(52, 8, 6, -0.05);
      level.addEnemy('ejecutivo', 58);
      level.addAzulejoBlocks(62, 11, 1, 2);
      level.addFireBar(62, 11, 5, 0.05);
      level.setCheckpoint(66);
      level.addMovingPlatform({ column: 71, row: 10, lengthInTiles: 3, axis: 'horizontal', travelInTiles: 5, speed: 1 });
      level.addLavaBubble(73);
      level.addLavaBubble(77);
      level.addGround(79, 110);
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
