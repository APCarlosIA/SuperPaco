/**
 * @file Genera los sprites de enemigos y objetos a partir de sus dibujos
 * vectoriales (humanos, animales, voladores y objetos).
 *
 * Nombres que produce, para que el resto del juego no cambie:
 *   - `<id>_frame1…N` para cada fotograma del ciclo de animación,
 *   - `<id>_<postura>` (o `<id>_<postura>_frame1…N`) para otras posturas,
 *   - `<id>_squashed` para el enemigo aplastado.
 */
import { createCreatureSprite } from './creatureKit.js';
import { HUMAN_ENEMIES } from './enemyArtHumans.js';
import { ANIMAL_ENEMIES } from './enemyArtAnimals.js';
import { FLYER_ENEMIES } from './enemyArtFlyers.js';
import { ITEM_ART } from './itemArt.js';
import { CAMEO_ART } from './enemyArtCameos.js';

/** Todos los dibujos, por identificador. */
const ALL_ART = { ...HUMAN_ENEMIES, ...ANIMAL_ENEMIES, ...FLYER_ENEMIES, ...ITEM_ART, ...CAMEO_ART };

/**
 * Crea todos los sprites vectoriales.
 * @returns {Object<string, {image: HTMLCanvasElement, padding: number, width: number, height: number}>}
 */
export function createVectorSprites() {
  const sprites = {};
  for (const [id, art] of Object.entries(ALL_ART)) {
    const poses = art.poses || ['frame'];
    for (const pose of poses) {
      const count = (art.poseFrames && art.poseFrames[pose]) || (pose === 'frame' ? art.frames : (art.poseFrames ? 1 : art.frames));
      for (let index = 0; index < count; index++) {
        let name;
        if (art.frameNames) name = art.frameNames(index);
        else if (pose === 'frame') name = art.frames === 1 && !art.poses ? id : `${id}_frame${index + 1}`;
        else name = count === 1 ? `${id}_${pose}` : `${id}_${pose}_frame${index + 1}`;
        sprites[name] = createCreatureSprite(art.width, art.height, context => art.paint(context, index, count, pose));
      }
    }
    if (art.squashed) {
      sprites[`${id}_squashed`] = createCreatureSprite(art.width, Math.min(art.height, 16), context => {
        // El dibujo aplastado se pinta en la mitad inferior de una caja de 16 de alto.
        context.translate(0, Math.min(art.height, 16) - 16);
        art.squashed(context);
      });
    }
  }
  return sprites;
}
