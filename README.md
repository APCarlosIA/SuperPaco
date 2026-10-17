# Súper Paco: La Tortilla Perdida

Juego de plataformas ambientado en España con un acabado gráfico moderno en
alta resolución: 10 niveles (de Madrid al castillo de Hacienda), memes
españoles, música chiptune original y un final que responde a la gran
pregunta: ¿la tortilla lleva cebolla?

Todo el arte, la música y los niveles son originales y se generan con código:
no hay imágenes ni sonidos externos.

## Cómo jugar

Abre **`dist/SuperPaco.html`** con doble clic. Funciona en cualquier navegador
moderno de Mac o Windows, sin instalar nada y sin conexión a internet.

| Acción | Teclado | Mando |
| --- | --- | --- |
| Moverse | ◀ ▶ o A / D | Cruceta o palanca |
| Saltar (mantén para saltar más) | Espacio o Z | A |
| Correr / lanzar pimientos | Shift o X | B / X |
| Agacharse | ↓ o S | Abajo |
| Pausa ("siesta") | P o Esc | Select |
| Silenciar / pantalla completa | M / F | — |

## ¿Por qué JavaScript y no el lenguaje del juego original?

El Super Mario Bros original (NES, 1985) se programó en **ensamblador del
procesador 6502**, específico de esa consola. No existe un lenguaje "oficial"
para este tipo de juegos. Aquí se usa **HTML + JavaScript** porque el navegador
es la plataforma que funciona igual en Mac y en Windows sin instalar ni
compilar nada. El dibujado usa `<canvas>` y el sonido se sintetiza con la
Web Audio API, imitando los canales de sonido de las consolas de 8 bits.

## Estructura del proyecto

```
SpanishMario/
├── dist/SuperPaco.html      ← juego final en un solo archivo (generado, no editar)
├── src/                     ← código fuente (módulos ES)
│   ├── main.js              ← punto de entrada: prepara todo y arranca el bucle
│   ├── page.html            ← plantilla HTML (canvas y botones táctiles)
│   ├── styles.css
│   ├── config/
│   │   └── constants.js     ← resolución, física de Paco, reglas de puntuación
│   ├── core/                ← servicios genéricos, sin nada específico del juego
│   │   ├── canvas.js        ← primitivas de dibujo y creación de lienzos
│   │   ├── screen.js        ← canvas visible (alta resolución), escalado y pantalla completa
│   │   ├── input.js         ← teclado, mando y táctil → botones lógicos
│   │   ├── gameLoop.js      ← bucle de paso fijo (60 pasos/s en cualquier pantalla)
│   │   ├── math.js          ← aleatorios con semilla, clamp, colisión de rectángulos
│   │   └── storage.js       ← guardado del récord y niveles desbloqueados
│   ├── audio/
│   │   ├── musicNotation.js ← notación "A4:2 C5:2" → notas y frecuencias
│   │   ├── songs.js         ← partituras (datos)
│   │   └── soundEngine.js   ← sintetizador, efectos de sonido y reproductor
│   ├── graphics/
│   │   ├── hd.js            ← de pixel art a alta resolución: Scale3x, luz, contorno
│   │   ├── palette.js, spriteData.js  ← pixel art de enemigos y objetos como texto (datos)
│   │   ├── sprites.js       ← convierte los datos en sprites HD y los dibuja (estirar/aplastar)
│   │   ├── pacoArt.js       ← Paco dibujado con formas vectoriales y ciclos de animación
│   │   ├── fontGlyphs.js, font.js     ← fuente 5×7 con ¡ ¿ Ñ y tildes, texto HD con contorno
│   │   ├── tileImages.js    ← baldosas HD de cada tema (adoquines, arena, bloques, azulejos…)
│   │   ├── backgroundKit.js, cityBackgrounds.js, backgroundImages.js ← fondos HD con parallax
│   │   ├── backgroundConstants.js     ← anchura de las capas y velocidades de parallax
│   │   ├── decorationImages.js ← plantas, farolas y el bar de la meta (vectoriales)
│   │   ├── shapes.js        ← formas con contorno, degradado y resplandor compartidas
│   │   ├── uiKit.js         ← paneles, fondos animados, cinta de la bandera, iris
│   │   ├── screenFx.js      ← estado de temblor, destellos, zoom y congelación de golpes
│   │   ├── postProcess.js   ← resplandor, contraste, tono de color y viñeta
│   │   └── themeAssets.js   ← caché de gráficos por tema
│   ├── world/               ← descripción de los niveles (datos + reglas del mapa)
│   │   ├── tileTypes.js     ← tipos de baldosa y contenidos de bloques
│   │   ├── TileMap.js       ← rejilla de baldosas
│   │   ├── LevelBuilder.js  ← API legible para construir niveles
│   │   ├── levels.js        ← los 10 niveles
│   │   ├── themes.js        ← colores y efectos de cada ciudad
│   │   ├── texts.js         ← memes, historia y textos del final
│   │   └── tileCollision.js ← movimiento con colisiones contra el mapa
│   ├── entities/            ← todo lo que se mueve
│   │   ├── Entity.js        ← clase base y contrato con el mundo
│   │   ├── Player.js        ← Paco
│   │   ├── PlayerFireball.js, PowerUpItem.js, MovingPlatform.js
│   │   ├── effects/VisualEffect.js
│   │   ├── enemies/         ← Enemy (base), catálogo y un archivo por comportamiento
│   │   └── hazards/         ← chanclas, facturas, petardos, explosiones, barras giratorias
│   └── game/                ← reglas de la partida y pantallas
│       ├── Game.js          ← decide qué pantalla está activa y las transiciones
│       ├── GameSession.js   ← puntos, vidas y pesetas de la partida
│       ├── World.js         ← un nivel en juego: actualización, contactos, cámara
│       ├── blockInteractions.js ← qué pasa al golpear bloques
│       ├── GoalSequence.js  ← escena de la cucaña y el bar
│       ├── entityFactory.js ← crea enemigos y plataformas a partir de los niveles
│       ├── worldRenderer.js, hud.js
│       └── screens/         ← título, controles, historia, intro de nivel, fin, final
├── tests/                   ← tests automáticos (se ejecutan en Node, sin navegador)
│   ├── gameData.test.js     ← datos: sprites, fuente, canciones y diseño de niveles
│   ├── graphics.test.js     ← efectos de pantalla, posturas de Paco y fondos por ciudad
│   ├── player.test.js       ← saltos, paredes, fosos, lava, tiempo, agacharse, pimientos
│   ├── blocks.test.js       ← bloques ¿?, ladrillos, bloques ocultos y pesetas
│   ├── enemies.test.js      ← pisotones, daño, caparazones, churros, toro, pulpo, madre
│   ├── boss.test.js         ← combate contra Don Hacienda
│   ├── levelFlow.test.js    ← meta, punto de control, vidas y paso entre pantallas
│   ├── levelsPlaythrough.test.js ← un piloto automático completa los 10 niveles
│   └── support/             ← controles simulados, kit de escenarios y piloto automático
├── tools/
│   ├── build.js             ← empaqueta los módulos en dist/SuperPaco.html
│   └── devServer.js         ← servidor local para desarrollar sin compilar
└── eslint.config.js         ← reglas del análisis estático
```

## Desarrollo

Requisito: [Node.js](https://nodejs.org) 20.19 o superior (solo para desarrollar;
para jugar basta el navegador). La única dependencia es ESLint, para desarrollo:

```bash
npm install     # instala ESLint (solo la primera vez)
npm run dev     # servidor en http://localhost:8080 (recarga el navegador tras editar)
npm run lint    # análisis estático: variables sin definir, importaciones sin usar…
npm test        # 99 tests automáticos (tardan menos de un segundo)
npm run build   # genera dist/SuperPaco.html
npm run check   # todo lo anterior seguido: úsalo antes de dar un cambio por bueno
```

Añade `?debug` a la dirección del servidor de desarrollo
(`http://localhost:8080/?debug`) para acceder al juego desde la consola del
navegador mediante `window.superPacoDebug`.

Con `?quality=0|1|2` se fuerza la calidad del acabado de imagen (0 = completo,
1 = sin resplandor ni contraste, 2 = solo viñeta). Si no se indica, el juego
baja de nivel solo cuando el equipo no llega a 40 fotogramas por segundo.

## Tests

Todos los tests se ejecutan en Node, sin navegador, porque la lógica del juego
no depende de la pantalla (ver la arquitectura más abajo).

- **Tests de lógica:** montan escenarios pequeños a medida ("un guiri en la
  columna 8 y Paco cayendo encima") con `tests/support/worldTestKit.js` y
  pulsan botones con `ScriptedControls`, la misma interfaz que el teclado real.
- **Recorrido completo:** `Autopilot` juega cada nivel como una persona: sube
  escalones, salta huecos, espera las plataformas móviles y pisa al jefe. Se
  repite con varias semillas aleatorias. Para aislar el recorrido del combate,
  Paco es invencible en ese test; el combate se prueba aparte.
- **Reproducibles:** los tests fijan la semilla de los números aleatorios
  (`seedGameplayRandom`), así un fallo se repite siempre igual.

Lo que **no** comprueban los tests (hay que mirarlo a mano): el dibujo en
pantalla, el sonido, la sensación de control, el táctil y el mando, y otros
navegadores.

## Cómo se dibuja

El juego razona en coordenadas de 320×240, pero pinta sobre un lienzo de
alta resolución (3 veces mayor, 960×720) y lo escala a la ventana con
suavizado. Cada fotograma pasa por estas capas:

1. **Escena** (`worldRenderer.js`, `World.draw`): cielo, nubes, tres capas de
   fondo con parallax, decorados, baldosas con contorno, sombras suaves,
   personajes, efectos, luz y marcador.
2. **Acabado** (`postProcess.js`): temblor y "golpe" de zoom, resplandor,
   contraste, tono de color de la ciudad, viñeta y destellos. La lógica del
   juego pide efectos con `screenFx` (`shake`, `flash`, `hitStop`…).
3. **Arte:** Paco y los fondos, decorados y bloques se pintan con formas
   vectoriales; los enemigos y objetos siguen siendo pixel art como texto,
   que `hd.js` convierte en sprites HD (ampliación Scale3x, luz de borde,
   degradado y contorno grueso).

## Arquitectura en pocas palabras

- **Bucle de paso fijo.** La física siempre avanza 60 veces por segundo, sea
  cual sea la frecuencia de la pantalla (`core/gameLoop.js`).
- **Pantallas intercambiables.** `Game` tiene una pantalla activa con
  `update()` y `draw()`; el nivel en juego (`World`) es una pantalla más.
- **Las entidades no conocen el juego.** Cada enemigo recibe el mundo como
  parámetro (`update(world)`) y usa su API (`world.awardPoints`,
  `world.showFloatingText`…). Así no hay variables globales ni dependencias
  circulares, y cada clase se entiende por sí sola.
- **Datos separados de la lógica.** Sprites, niveles, canciones y textos son
  datos puros; los tests de Node los validan sin necesidad de navegador.
- **Dependencias inyectadas.** Solo `main.js` toca el navegador: crea la
  pantalla y pasa los controles al juego. Cada `draw(context)` recibe dónde
  dibujar y el mundo recibe los controles (`controls`), por eso los tests
  pueden sustituir el teclado por controles simulados.

## Convenciones de código

- **Nombres en inglés, comentarios en español.** Los identificadores siguen el
  idioma de JavaScript y sus APIs. Los comentarios explican el porqué.
  Los nombres propios del juego (guiri, chancla, peseta…) se mantienen.
- **Nombres descriptivos:** `velocityX` en lugar de `vx`, `isOnGround` en lugar
  de `onGround`, `stepsUntilNextFirecracker` en lugar de `petT`.
- **Constantes con nombre** en `MAYÚSCULAS_CON_GUIONES`; ningún número mágico
  suelto en la lógica.
- **JSDoc** en todas las clases y funciones públicas; cabecera `@file` en cada módulo.
- **Módulos ES con importaciones con nombre** (`import { a } from './x.js'`),
  sin `default`, sin alias `as` y sin dependencias circulares. El build lo comprueba.

## Cómo ampliar el juego

- **Nuevo nivel:** añade una entrada a `LEVELS` en `src/world/levels.js`
  usando los métodos de `LevelBuilder` y ejecuta `npm test`, que avisa si
  queda algún hueco imposible de saltar.
- **Nuevo enemigo con un comportamiento existente:** añade sus sprites en
  `spriteData.js` (`<id>_frame1`, `<id>_frame2`, `<id>_squashed`) y una entrada
  en `enemyCatalog.js`. El acabado HD (contorno, luz) se aplica solo.
- **Nueva ciudad o retocar un fondo:** el dibujo de cada ciudad está en
  `CITY_PAINTERS` (`cityBackgrounds.js`); sus colores y efectos (tono, luz,
  viñeta) en `themes.js`.
- **Nuevo comportamiento:** crea una clase que herede de `Enemy` en
  `src/entities/enemies/`, regístrala en `entityFactory.js` y añade sus
  tests en `tests/enemies.test.js`.
- **Nueva canción:** escríbela en `songs.js` con la notación de
  `musicNotation.js`; el test comprueba que las pistas duran lo mismo.

## Licencia

[MIT](LICENSE): puedes usar, modificar y compartir el código libremente.
