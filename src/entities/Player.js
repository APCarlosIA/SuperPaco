/**
 * @file Paco, el protagonista.
 *
 * Tres niveles de poder:
 *   - SMALL: Paco normal. Si le tocan, pierde una vida.
 *   - BIG: tras comer un bocadillo. Rompe ladrillos y aguanta un golpe.
 *   - SPICY: tras un pimiento de Padrón. Además lanza pimientos picantes.
 *
 * El salto tiene los trucos habituales de los buenos plataformas:
 *   - Salto variable: si se mantiene el botón, la gravedad es menor y salta más.
 *   - "Coyote time": se puede saltar unos pasos después de salir de un borde.
 *   - "Jump buffer": si se pulsa saltar justo antes de aterrizar, se recuerda.
 */
import { PLAYER_PHYSICS, GAME_RULES, SCREEN_HEIGHT, TILE_SIZE } from '../config/constants.js';
import { BUTTON } from '../core/input.js';
import { randomBetween } from '../core/math.js';
import { soundEngine, SOUND_EFFECT } from '../audio/soundEngine.js';
import { SPRITES, drawSprite } from '../graphics/sprites.js';
import { pacoSpriteName } from '../graphics/spriteData.js';
import { screenFx } from '../graphics/screenFx.js';
import { TILE } from '../world/tileTypes.js';
import { GAMEPLAY_MESSAGES } from '../world/texts.js';
import { moveHorizontally, moveVertically, isAreaFree, pixelToTile } from '../world/tileCollision.js';
import { Entity } from './Entity.js';
import { PlayerFireball } from './PlayerFireball.js';

/** Niveles de poder de Paco. */
export const POWER_LEVEL = Object.freeze({ SMALL: 0, BIG: 1, SPICY: 2 });

/** Orden en que parpadean los colores durante el subidón de churros. */
const SUGAR_RUSH_COLOR_CYCLE = ['normal', 'sugarRushGold', 'spicy', 'sugarRushWhite'];
/** Pasos que se congela el juego cuando Paco recibe un golpe siendo grande. */
const FREEZE_STEPS_WHEN_SHRINKING = 18;
/** Margen (px) por debajo de la pantalla a partir del cual Paco ha caído a un foso. */
const FALL_DEATH_MARGIN = 8;
/** Profundidad (px) a la que hay que meter los pies en la lava para quemarse. */
const LAVA_DEPTH_TOLERANCE = 5;

export class Player extends Entity {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    super(x, y, PLAYER_PHYSICS.hitboxWidth, PLAYER_PHYSICS.smallHitboxHeight);
    this.facing = 1;
    this.powerLevel = POWER_LEVEL.SMALL;
    /** Pasos de parpadeo tras recibir un golpe, en los que no puede volver a ser herido. */
    this.invulnerableSteps = 0;
    /** Pasos restantes del subidón de churros (invencible y destruye enemigos al tocarlos). */
    this.invincibleSteps = 0;
    this.fireballCooldownSteps = 0;
    this.coyoteStepsLeft = 0;
    this.jumpBufferStepsLeft = 0;
    /** Avanza al caminar para alternar los fotogramas de las piernas. */
    this.walkAnimationProgress = 0;
    /** Aplastamiento al aterrizar (0 = normal); se recupera solo con el tiempo. */
    this.landingSquash = 0;
    /** Multiplicador de la gravedad (la maravilla lunar lo reduce). */
    this.gravityScale = 1;
    /** Truco del cocinero: Paco lleva gorro de chef. */
    this.isChef = false;
    /** Estiramiento al despegar (0 = normal). */
    this.takeOffStretch = 0;
    /** Últimas posiciones, para dibujar la estela al correr. */
    this.trail = [];
    this.isCrouching = false;
    /** Plataforma móvil sobre la que está de pie (o null). */
    this.ridingPlatform = null;
    /** Enemigos pisados seguidos sin tocar el suelo (dan cada vez más puntos). */
    this.stompCombo = 0;
    this.isHidden = false;
    this.isDead = false;
    /** Si es false, Paco se mueve solo (escenas de final de nivel). */
    this.hasControl = true;
    /** Velocidad a la que camina solo cuando no tiene el control. */
    this.autoWalkSpeed = 0;
    this.isHoldingGoalPole = false;
    /** Pasos del parpadeo entre tamaños al crecer. */
    this.growAnimationSteps = 0;
    /** Si el botón de saltar estaba pulsado en este paso (hace más alto el rebote al pisar). */
    this.isHoldingJump = false;
  }

  /** ¿Está bajo el efecto de los churros? */
  get isInvincible() {
    return this.invincibleSteps > 0;
  }

  /** ¿Es grande (con o sin poder picante)? */
  get isBig() {
    return this.powerLevel > POWER_LEVEL.SMALL;
  }

  /**
   * Cambia el nivel de poder manteniendo los pies en el mismo sitio.
   * @param {number} powerLevel Uno de {@link POWER_LEVEL}.
   */
  setPowerLevel(powerLevel) {
    const feetY = this.bottom;
    this.powerLevel = powerLevel;
    this.isCrouching = false;
    this.height = this.isBig ? PLAYER_PHYSICS.bigHitboxHeight : PLAYER_PHYSICS.smallHitboxHeight;
    this.y = feetY - this.height;
  }

  /**
   * Rebote al pisar a un enemigo. Si se mantiene saltar, el rebote es más alto.
   * @param {number} [customSpeed] Velocidad vertical concreta (negativa = hacia arriba).
   */
  bounceOffEnemy(customSpeed) {
    const bounceSpeed = this.isHoldingJump ? PLAYER_PHYSICS.stompBounceSpeedHoldingJump : PLAYER_PHYSICS.stompBounceSpeed;
    this.velocityY = customSpeed || -bounceSpeed;
    this.isOnGround = false;
  }

  /**
   * Paco recibe un golpe: si es grande, encoge; si es pequeño, pierde una vida.
   * @param {import('../game/World.js').World} world
   */
  takeHit(world) {
    const isProtected = this.invulnerableSteps > 0 || this.isInvincible || this.isDead || !world.isPlayerControllable();
    if (isProtected) return;
    if (this.isBig) {
      this.setPowerLevel(this.powerLevel === POWER_LEVEL.SPICY ? POWER_LEVEL.BIG : POWER_LEVEL.SMALL);
      this.invulnerableSteps = GAME_RULES.invulnerableStepsAfterHit;
      world.freezeGameplay(FREEZE_STEPS_WHEN_SHRINKING);
      soundEngine.playSoundEffect(SOUND_EFFECT.HURT);
      world.showFloatingText(GAMEPLAY_MESSAGES.hurt, this.centerX, this.y - 6, '#fc7c7c');
    } else {
      world.killPlayer({ fellIntoPit: false });
    }
  }

  /**
   * Avanza un paso: lee los controles, aplica la física y resuelve colisiones.
   * @param {import('../game/World.js').World} world
   */
  update(world) {
    this.ageInSteps++;
    this.updateTimers(world);
    if (this.ridingPlatform) {
      this.x += this.ridingPlatform.deltaX;
      this.y += this.ridingPlatform.deltaY;
    }
    const controls = this.readControls(world.controls);
    this.isHoldingJump = controls.jumpHeld;
    this.updateCrouching(controls.down, world.tileMap);
    this.updateHorizontalSpeed(controls);
    this.updateJumpAndGravity(controls);
    this.tryThrowFireball(controls, world);
    const wasOnGround = this.isOnGround;
    const fallSpeed = this.velocityY;
    this.moveAndCollide(world);
    this.updateVisualFeedback(world, wasOnGround, fallSpeed);
    if (this.isDead) return;

    if (this.isOnGround && Math.abs(this.velocityX) > 0.1) this.walkAnimationProgress += Math.abs(this.velocityX) * 0.13;
    if (this.isInvincible && this.ageInSteps % 5 === 0) {
      world.spawnSpark(this.centerX + randomBetween(-6, 6), this.y + randomBetween(0, this.height), '#fcfcfc');
    }
  }

  /** @private Descuenta los temporizadores de invulnerabilidad, subidón, etc. */
  updateTimers(world) {
    if (this.invulnerableSteps > 0) this.invulnerableSteps--;
    if (this.growAnimationSteps > 0) this.growAnimationSteps--;
    if (this.fireballCooldownSteps > 0) this.fireballCooldownSteps--;
    if (this.invincibleSteps > 0) {
      this.invincibleSteps--;
      if (this.invincibleSteps === 0) world.restoreLevelMusic();
    }
  }

  /**
   * @private
   * Lee los controles que le pasa el mundo (teclado y mando en el juego, o
   * controles simulados en los tests). Si Paco no tiene el control (escenas
   * automáticas), simula que se pulsa "derecha" cuando debe caminar solo.
   * @param {import('../core/input.js').Controls} controls
   */
  readControls(controls) {
    if (!this.hasControl) {
      return { left: false, right: this.autoWalkSpeed > 0, run: false, down: false, jumpPressed: false, jumpHeld: false, runPressed: false };
    }
    return {
      left: controls.isHeld(BUTTON.LEFT),
      right: controls.isHeld(BUTTON.RIGHT),
      run: controls.isHeld(BUTTON.RUN),
      down: controls.isHeld(BUTTON.DOWN),
      jumpPressed: controls.wasPressed(BUTTON.JUMP),
      jumpHeld: controls.isHeld(BUTTON.JUMP),
      runPressed: controls.wasPressed(BUTTON.RUN)
    };
  }

  /** @private Agacharse (solo siendo grande y en el suelo). No se levanta si hay techo encima. */
  updateCrouching(wantsToCrouch, tileMap) {
    const shouldCrouch = wantsToCrouch && this.isOnGround && this.isBig;
    if (shouldCrouch === this.isCrouching) return;
    const feetY = this.bottom;
    if (shouldCrouch) {
      this.isCrouching = true;
      this.height = PLAYER_PHYSICS.crouchingHitboxHeight;
    } else if (isAreaFree(tileMap, this.x, feetY - PLAYER_PHYSICS.bigHitboxHeight, this.width, PLAYER_PHYSICS.bigHitboxHeight)) {
      this.isCrouching = false;
      this.height = PLAYER_PHYSICS.bigHitboxHeight;
    }
    this.y = feetY - this.height;
  }

  /** @private Acelerar, derrapar al cambiar de sentido y frenar al soltar. */
  updateHorizontalSpeed(controls) {
    let { left, right } = controls;
    if (this.isCrouching && this.isOnGround) left = right = false;
    const maxSpeed = this.autoWalkSpeed || (controls.run ? PLAYER_PHYSICS.runMaxSpeed : PLAYER_PHYSICS.walkMaxSpeed);
    const acceleration = !this.isOnGround ? PLAYER_PHYSICS.airAcceleration : controls.run ? PLAYER_PHYSICS.runAcceleration : PLAYER_PHYSICS.walkAcceleration;

    if (left && !right) {
      if (this.velocityX > 0 && this.isOnGround) this.velocityX -= PLAYER_PHYSICS.turnAroundDeceleration;
      else if (this.velocityX > -maxSpeed) this.velocityX = Math.max(-maxSpeed, this.velocityX - acceleration);
      this.facing = -1;
    } else if (right && !left) {
      if (this.velocityX < 0 && this.isOnGround) this.velocityX += PLAYER_PHYSICS.turnAroundDeceleration;
      else if (this.velocityX < maxSpeed) this.velocityX = Math.min(maxSpeed, this.velocityX + acceleration);
      this.facing = 1;
    } else if (this.isOnGround) {
      if (Math.abs(this.velocityX) <= PLAYER_PHYSICS.groundFriction) this.velocityX = 0;
      else this.velocityX -= Math.sign(this.velocityX) * PLAYER_PHYSICS.groundFriction;
    }
    // Si va más rápido que el máximo (p. ej. al soltar "correr"), frena poco a poco.
    if (Math.abs(this.velocityX) > maxSpeed) {
      this.velocityX = Math.sign(this.velocityX) * Math.max(maxSpeed, Math.abs(this.velocityX) - PLAYER_PHYSICS.overSpeedSlowdown);
    }
  }

  /** @private Salto con "coyote time", "jump buffer" y altura variable. */
  updateJumpAndGravity(controls) {
    if (controls.jumpPressed) this.jumpBufferStepsLeft = PLAYER_PHYSICS.jumpBufferSteps;
    else if (this.jumpBufferStepsLeft > 0) this.jumpBufferStepsLeft--;

    if (this.isOnGround) this.coyoteStepsLeft = PLAYER_PHYSICS.coyoteTimeSteps;
    else if (this.coyoteStepsLeft > 0) this.coyoteStepsLeft--;

    if (this.jumpBufferStepsLeft > 0 && this.coyoteStepsLeft > 0) {
      this.velocityY = -(PLAYER_PHYSICS.jumpBaseSpeed + Math.abs(this.velocityX) * PLAYER_PHYSICS.jumpSpeedPerRunSpeed);
      this.jumpBufferStepsLeft = 0;
      this.coyoteStepsLeft = 0;
      this.isOnGround = false;
      this.ridingPlatform = null;
      soundEngine.playSoundEffect(this.isBig ? SOUND_EFFECT.JUMP_BIG : SOUND_EFFECT.JUMP_SMALL);
    }
    const isRisingWithJumpHeld = this.velocityY < 0 && controls.jumpHeld;
    this.velocityY += (isRisingWithJumpHeld ? PLAYER_PHYSICS.gravityWhileHoldingJump : PLAYER_PHYSICS.gravity) * this.gravityScale;
    const maxFallSpeed = PLAYER_PHYSICS.maxFallSpeed * (this.gravityScale < 1 ? 0.55 : 1);
    if (this.velocityY > maxFallSpeed) this.velocityY = maxFallSpeed;
  }

  /** @private Lanza un pimiento picante si tiene el poder y no hay demasiados en pantalla. */
  tryThrowFireball(controls, world) {
    const canThrow = this.powerLevel === POWER_LEVEL.SPICY && controls.runPressed && this.fireballCooldownSteps === 0 &&
      world.countEntities(entity => entity.isPlayerFireball) < GAME_RULES.maxPlayerFireballsOnScreen;
    if (!canThrow) return;
    const spawnX = this.facing > 0 ? this.x + this.width : this.x - 8;
    world.addEntity(new PlayerFireball(spawnX, this.y + 6, this.facing));
    this.fireballCooldownSteps = PLAYER_PHYSICS.fireballCooldownSteps;
    soundEngine.playSoundEffect(SOUND_EFFECT.FIREBALL);
  }

  /** @private Mueve a Paco, resuelve choques y comprueba pesetas, lava y fosos. */
  moveAndCollide(world) {
    if (moveHorizontally(this, world.tileMap)) this.velocityX = 0;

    // La cámara solo avanza: Paco no puede volver a la parte ya recorrida.
    if (this.x < world.cameraX) {
      this.x = world.cameraX;
      if (this.velocityX < 0) this.velocityX = 0;
    }
    const maximumX = world.getPlayerMaximumX(this);
    if (this.x > maximumX) {
      this.x = maximumX;
      if (this.velocityX > 0) this.velocityX = 0;
    }

    const feetYBeforeMoving = this.bottom;
    const headBump = moveVertically(this, world.tileMap, { isPlayer: true });
    if (headBump) world.handlePlayerHeadBump(this, headBump);

    this.landOnMovingPlatforms(world.platforms, feetYBeforeMoving);
    if (this.isOnGround) this.stompCombo = 0;

    this.collectTouchedCoins(world);
    if (this.isTouchingLava(world.tileMap)) {
      world.killPlayer({ fellIntoPit: false, burned: true });
      return;
    }
    if (this.y > SCREEN_HEIGHT + FALL_DEATH_MARGIN) world.killPlayer({ fellIntoPit: true });
  }

  /**
   * @private
   * Las plataformas móviles solo sostienen desde arriba: hay que venir cayendo
   * y tener los pies por encima de su superficie en el paso anterior.
   */
  landOnMovingPlatforms(platforms, feetYBeforeMoving) {
    this.ridingPlatform = null;
    if (this.velocityY < 0) return;
    for (const platform of platforms) {
      const overlapsHorizontally = this.x + this.width > platform.x && this.x < platform.x + platform.width;
      const wasAbove = feetYBeforeMoving <= platform.y + 3;
      const reachesSurface = this.bottom >= platform.y;
      if (overlapsHorizontally && wasAbove && reachesSurface) {
        this.y = platform.y - this.height;
        this.velocityY = 0;
        this.isOnGround = true;
        this.ridingPlatform = platform;
      }
    }
  }

  /** @private Recoge las pesetas sueltas que toque con el cuerpo. */
  collectTouchedCoins(world) {
    const firstColumn = pixelToTile(this.x);
    const lastColumn = pixelToTile(this.x + this.width - 0.01);
    const firstRow = pixelToTile(this.y);
    const lastRow = pixelToTile(this.y + this.height - 0.01);
    for (let row = firstRow; row <= lastRow; row++) {
      for (let column = firstColumn; column <= lastColumn; column++) {
        if (world.tileMap.getTile(column, row) === TILE.COIN) {
          world.tileMap.setTile(column, row, TILE.EMPTY);
          world.collectCoin();
        }
      }
    }
  }

  /** @private ¿Tiene los pies metidos en la lava? */
  isTouchingLava(tileMap) {
    const feetRow = pixelToTile(this.bottom - LAVA_DEPTH_TOLERANCE);
    const firstColumn = pixelToTile(this.x);
    const lastColumn = pixelToTile(this.x + this.width - 0.01);
    for (let column = firstColumn; column <= lastColumn; column++) {
      if (tileMap.getTile(column, feetRow) === TILE.LAVA && this.bottom > feetRow * TILE_SIZE + LAVA_DEPTH_TOLERANCE) return true;
    }
    return false;
  }

  /**
   * @private
   * Efectos puramente visuales: aplastamiento al caer, estiramiento al saltar,
   * polvo, estela al correr y el temblor de los aterrizajes fuertes.
   */
  updateVisualFeedback(world, wasOnGround, fallSpeed) {
    this.landingSquash *= 0.82;
    this.takeOffStretch *= 0.85;
    if (!wasOnGround && this.isOnGround && fallSpeed > 1.5) {
      this.landingSquash = Math.min(0.42, fallSpeed * 0.06);
      for (let puff = 0; puff < 4; puff++) world.spawnDust(this.centerX + (puff - 1.5) * 3, this.bottom - 1);
      if (fallSpeed > 5.2) screenFx.shake(0.8, 6);
    }
    if (wasOnGround && !this.isOnGround && this.velocityY < -2) {
      this.takeOffStretch = 0.2;
      world.spawnDust(this.centerX, this.bottom - 1);
    }
    // Estela: solo cuando va rápido.
    const isFast = Math.abs(this.velocityX) > 2.3 || this.isInvincible;
    if (isFast && this.ageInSteps % 2 === 0) {
      this.trail.push({ x: this.centerX, bottom: this.bottom, facing: this.facing, life: 9 });
    }
    for (const ghost of this.trail) ghost.life--;
    this.trail = this.trail.filter(ghost => ghost.life > 0);
    // Polvo al derrapar o al arrancar a correr.
    if (this.isOnGround && Math.abs(this.velocityX) > 1.0 && this.velocityX * this.facing < -0.6 && this.ageInSteps % 3 === 0) {
      world.spawnDust(this.centerX - this.facing * 4, this.bottom - 1);
    }
  }

  /** @private Elige la postura según lo que esté haciendo. */
  choosePose(isDrawnBig) {
    if (this.isDead) return 'dead';
    if (this.isHoldingGoalPole) return 'pole';
    if (!this.isOnGround) return this.velocityY < 0.4 ? 'jumpUp' : 'jumpDown';
    if (this.isCrouching && isDrawnBig) return 'crouch';
    const speed = Math.abs(this.velocityX);
    if (speed > 1.0 && this.velocityX * this.facing < -0.6) return 'skid';
    if (speed > 0.1) {
      const frame = (Math.floor(this.walkAnimationProgress * 2) % 8) + 1;
      return `${speed > 2.0 ? 'run' : 'walk'}${frame}`;
    }
    return Math.floor(this.ageInSteps / 28) % 2 ? 'stand2' : 'stand';
  }

  /** @private Elige los colores: parpadeo de churros, verde picante o normal. */
  chooseColorVariant() {
    if (this.isInvincible) return SUGAR_RUSH_COLOR_CYCLE[(this.ageInSteps >> 2) % SUGAR_RUSH_COLOR_CYCLE.length];
    if (this.powerLevel === POWER_LEVEL.SPICY) return 'spicy';
    return this.isChef ? 'chef' : 'normal';
  }

  /**
   * @param {CanvasRenderingContext2D} context Dónde dibujar.
   * @param {number} cameraX
   */
  draw(context, cameraX) {
    if (this.isHidden) return;
    // Parpadeo tras un golpe: se salta algunos fotogramas.
    if (this.invulnerableSteps > 0 && (this.invulnerableSteps >> 2) % 2 === 0 && !this.isDead) return;

    let isDrawnBig = this.isBig && !this.isDead;
    if (this.growAnimationSteps > 0) isDrawnBig = (this.growAnimationSteps >> 2) % 2 === 0;
    const size = isDrawnBig ? 'big' : 'small';
    const variant = this.chooseColorVariant();
    const sprite = SPRITES[pacoSpriteName(size, this.choosePose(isDrawnBig), variant)];
    const stretch = this.takeOffStretch + Math.min(0.14, Math.abs(this.velocityY) * 0.018) * (this.isOnGround ? 0 : 1);
    const squash = this.landingSquash;
    const scaleY = 1 + stretch - squash * 0.9;
    const scaleX = 1 - stretch * 0.6 + squash * 0.7;

    // Estela de imágenes fantasma al correr rápido.
    for (const ghost of this.trail) {
      drawSprite(context, sprite, ghost.x - 8 - cameraX, ghost.bottom - sprite.height, { mirrored: ghost.facing < 0, alpha: ghost.life / 26 });
    }
    drawSprite(context, sprite, this.centerX - 8 - cameraX, this.bottom - sprite.height, { mirrored: this.facing < 0, scaleX, scaleY });
  }
}
