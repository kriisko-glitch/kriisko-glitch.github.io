
(function () {
  function GameScene() {
    Phaser.Scene.call(this, { key: "GameScene" });

    this.cfg = null;
    this.bus = null;

    this.player = null;
    this.keys = null;
    this.cursors = null;

    this.enemies = null;
    this.projectiles = null;
    this.xpGems = null;

    this.floorLayer = null;
    this.starLayer = null;
    this.midLayer = null;

    this.trailParticles = null;
    this.trailEmitter = null;
    this.projectileParticles = null;
    this.projectileEmitter = null;
    this.deathParticles = null;
    this.deathEmitter = null;
    this.gemSparkleParticles = null;
    this.gemSparkleEmitter = null;
    this.shieldParticles = null;
    this.shieldEmitter = null;

    this.lightningGraphics = null;

    this.playerMaxHP = 100;
    this.playerHP = 100;
    this.playerSpeed = 180;
    this.regenAmount = 1;
    this.regenIntervalMs = 3000;
    this.nextRegenAt = 0;
    this.invincibleUntil = 0;
    this.lastTrailAt = 0;

    this.damageMultiplier = 1;
    this.cooldownMultiplier = 1;
    this.magnetRadius = 80;
    this.projectileCount = 1;

    this.playerLevel = 1;
    this.playerXP = 0;
    this.xpToNext = 10;

    this.score = 0;
    this.killCount = 0;
    this.elapsedMs = 0;

    this.spawnRatePerSec = 1.4;
    this.nextSpawnAt = 0;
    this.nextSpawnRampAt = 30000;

    this.weaponState = null;

    this.isLevelingUp = false;
    this.levelUpOverlay = null;
    this.levelChoiceLocked = false;
    this.pointerBlockUntil = 0;

    this.isGameOver = false;
    this.hudBroadcastAccumulator = 0;
    this.gemSparkleAccumulator = 0;

    this.movingBobPhase = 0;
    this.breathTween = null;
    this.flashTween = null;

    this.audioCtx = null;
    this.masterGain = null;
    this.audioEnabled = true;
    this.audioUnlocked = false;
    this.lastDeathSoundAt = 0;
  }

  GameScene.prototype = Object.create(Phaser.Scene.prototype);
  GameScene.prototype.constructor = GameScene;

  GameScene.prototype.create = function () {
    this.cfg = window.SurvivorsArena.CONFIG;
    this.bus = this.cfg.BUS;

    this.resetState();
    this.createBackground();
    this.createPlayer();
    this.createGroups();
    this.createParticles();
    this.createCombat();
    this.createInput();

    this.moveDir = { x: 0, y: 0 };

    window.__gameAPI = {
      moveLeft: function() { this.moveDir.x = -1; }.bind(this),
      moveRight: function() { this.moveDir.x = 1; }.bind(this),
      moveUp: function() { this.moveDir.y = -1; }.bind(this),
      moveDown: function() { this.moveDir.y = 1; }.bind(this),
      stopX: function() { this.moveDir.x = 0; }.bind(this),
      stopY: function() { this.moveDir.y = 0; }.bind(this),
      fire: function() { this.manualFire(); }.bind(this),
      attack: function() { this.manualFire(); }.bind(this)
    };

    this.createAudio();

    this.bus.on(this.cfg.EVENTS.AUDIO_TOGGLE_REQUEST, this.toggleAudio, this);
    this.bus.on(this.cfg.EVENTS.HUD_CLICK_CONSUMED, this.onHudClickConsumed, this);

    this.events.on("shutdown", this.onShutdown, this);
    this.events.on("destroy", this.onShutdown, this);

    this.cameras.main.fadeIn(this.cfg.VFX.BOOT_FADE_MS, 0, 0, 0);

    this.emitHudState(true);
  };

  GameScene.prototype.resetState = function () {
    this.playerMaxHP = this.cfg.PLAYER.START_HP;
    this.playerHP = this.cfg.PLAYER.START_HP;
    this.playerSpeed = this.cfg.PLAYER.START_SPEED;
    this.regenAmount = this.cfg.PLAYER.REGEN_AMOUNT;
    this.regenIntervalMs = this.cfg.PLAYER.REGEN_INTERVAL_MS;
    this.nextRegenAt = this.time.now + this.regenIntervalMs;
    this.invincibleUntil = 0;
    this.lastTrailAt = 0;

    this.damageMultiplier = 1;
    this.cooldownMultiplier = 1;
    this.magnetRadius = this.cfg.XP.GEM_MAGNET_RADIUS;
    this.projectileCount = 1;

    this.playerLevel = this.cfg.XP.START_LEVEL;
    this.playerXP = 0;
    this.xpToNext = this.cfg.XP.START_TO_NEXT;

    this.score = 0;
    this.killCount = 0;
    this.elapsedMs = 0;

    this.spawnRatePerSec = this.cfg.ENEMIES.SPAWN_START_PER_SEC;
    this.nextSpawnAt = this.time.now + 450;
    this.nextSpawnRampAt = this.time.now + this.cfg.ENEMIES.SPAWN_GROWTH_EVERY_MS;

    this.weaponState = {
      orb: { owned: true, nextFireAt: this.time.now + 400 },
      slash: { owned: false, nextFireAt: this.time.now + 800 },
      lightning: { owned: false, nextFireAt: this.time.now + 1000 },
      shield: { owned: false, nextFireAt: this.time.now + 1500 }
    };

    this.isLevelingUp = false;
    this.levelChoiceLocked = false;
    this.levelUpOverlay = null;
    this.pointerBlockUntil = 0;

    this.isGameOver = false;
    this.hudBroadcastAccumulator = 0;
    this.gemSparkleAccumulator = 0;

    this.movingBobPhase = 0;

    this.lastDeathSoundAt = 0;
  };

  GameScene.prototype.createBackground = function () {
    var textures = this.cfg.TEXTURES;
    var width = this.cfg.GAME.WIDTH;
    var height = this.cfg.GAME.HEIGHT;
    var cx = width / 2;
    var cy = height / 2;

    this.cameras.main.setBackgroundColor("#0d0d1a");

    this.floorLayer = this.add.tileSprite(cx, cy, width * 2, height * 2, textures.FLOOR_GRID).setScrollFactor(0).setDepth(-15);
    this.starLayer = this.add.tileSprite(cx, cy, width * 2, height * 2, textures.STAR_LAYER).setScrollFactor(0).setDepth(-30).setAlpha(0.8);
    this.midLayer = this.add.tileSprite(cx, cy, width * 2, height * 2, textures.MID_LAYER).setScrollFactor(0).setDepth(-22).setAlpha(0.42);
  };

  GameScene.prototype.createPlayer = function () {
    this.player = this.physics.add.sprite(this.cfg.PLAYER.START_X, this.cfg.PLAYER.START_Y, this.cfg.TEXTURES.PLAYER);
    this.player.setDepth(10);
    this.player.setDrag(900, 900);
    this.player.setMaxVelocity(this.playerSpeed, this.playerSpeed);
    this.player.setCircle(9, 3, 12);

    this.breathTween = this.tweens.add({
      targets: this.player,
      scaleX: 1.04,
      scaleY: 0.96,
      duration: 840,
      yoyo: true,
      repeat: -1,
      paused: false
    });

    this.cameras.main.startFollow(this.player, true, this.cfg.WORLD.CAMERA_LERP, this.cfg.WORLD.CAMERA_LERP);
  };

  GameScene.prototype.createGroups = function () {
    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: this.cfg.ENEMIES.MAX_ACTIVE,
      runChildUpdate: false
    });

    this.projectiles = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 160,
      runChildUpdate: false
    });

    this.xpGems = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 320,
      runChildUpdate: false
    });
  };
  GameScene.prototype.createParticles = function () {
    var textures = this.cfg.TEXTURES;

    this.trailEmitter = this.add.particles(0, 0, textures.TRAIL_DOT, {
      emitting: false,
      lifespan: 260,
      speed: { min: 8, max: 20 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.36, end: 0 },
      blendMode: "ADD"
    });

    this.projectileEmitter = this.add.particles(0, 0, textures.TRAIL_DOT, {
      emitting: false,
      lifespan: 190,
      scale: { start: 0.42, end: 0 },
      alpha: { start: 0.5, end: 0 },
      speed: { min: 4, max: 16 },
      tint: [0x4f83ff, 0xaed0ff],
      blendMode: "ADD"
    });

    this.deathEmitter = this.add.particles(0, 0, textures.POP_PARTICLE, {
      emitting: false,
      lifespan: 320,
      speed: { min: 80, max: 185 },
      angle: { min: 0, max: 360 },
      rotate: { min: 0, max: 360 },
      quantity: 8,
      alpha: { start: 1, end: 0 },
      scale: { start: 0.9, end: 0.1 },
      blendMode: "ADD"
    });

    this.gemSparkleEmitter = this.add.particles(0, 0, textures.POP_PARTICLE, {
      emitting: false,
      lifespan: 220,
      speed: { min: 10, max: 40 },
      quantity: 2,
      alpha: { start: 0.75, end: 0 },
      scale: { start: 0.5, end: 0 },
      tint: [0x9cff9f, 0xffffff],
      blendMode: "ADD"
    });

    this.shieldEmitter = this.add.particles(0, 0, this.cfg.TEXTURES.RING_PARTICLE, {
      emitting: false,
      lifespan: 320,
      speed: { min: 70, max: 140 },
      quantity: 10,
      alpha: { start: 0.7, end: 0 },
      scale: { start: 0.8, end: 0.15 },
      blendMode: "ADD",
      tint: [0x00bcd4, 0xa6f2ff]
    });

    this.lightningGraphics = this.add.graphics();
    this.lightningGraphics.setDepth(26);
  };

  GameScene.prototype.createCombat = function () {
    this.physics.add.overlap(this.projectiles, this.enemies, this.onProjectileHitsEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerEnemyOverlap, null, this);
    this.physics.add.overlap(this.player, this.xpGems, this.onPlayerCollectGem, null, this);
  };

  GameScene.prototype.createInput = function () {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
  };

  GameScene.prototype.createAudio = function () {
    var AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      this.audioEnabled = false;
      return;
    }

    this.audioCtx = new AudioCtor();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = this.cfg.AUDIO.MASTER_GAIN;
    this.masterGain.connect(this.audioCtx.destination);

    this.audioEnabled = true;
    this.audioUnlocked = this.audioCtx.state === "running";

    this.input.on("pointerdown", this.unlockAudio, this);
    this.input.keyboard.on("keydown", this.unlockAudio, this);

    this.bus.emit(this.cfg.EVENTS.AUDIO_STATE, { enabled: this.audioEnabled });
  };

  GameScene.prototype.unlockAudio = function () {
    var self = this;
    if (!this.audioCtx || this.audioCtx.state === "running") {
      this.audioUnlocked = true;
      return;
    }

    this.audioCtx.resume().then(function () {
      self.audioUnlocked = true;
    });
  };

  GameScene.prototype.onHudClickConsumed = function () {
    this.pointerBlockUntil = this.time.now + 120;
  };

  GameScene.prototype.toggleAudio = function () {
    this.audioEnabled = !this.audioEnabled;
    this.bus.emit(this.cfg.EVENTS.AUDIO_STATE, { enabled: this.audioEnabled });
  };

  GameScene.prototype.playOsc = function (startHz, endHz, durationMs, type, gain, delayMs) {
    if (!this.audioCtx || !this.audioEnabled || !this.audioUnlocked || !this.masterGain) {
      return;
    }

    var now = this.audioCtx.currentTime + (delayMs || 0) / 1000;
    var osc = this.audioCtx.createOscillator();
    var env = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startHz, now);
    if (endHz !== startHz) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endHz), now + durationMs / 1000);
    }

    env.gain.setValueAtTime(gain, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);

    osc.connect(env);
    env.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.01);
  };

  GameScene.prototype.playHitSound = function () {
    this.playOsc(400, 320, 60, "sawtooth", 0.5, 0);
  };

  GameScene.prototype.playEnemyDeathSound = function () {
    if (this.time.now - this.lastDeathSoundAt < 35) {
      return;
    }
    this.lastDeathSoundAt = this.time.now;
    this.playOsc(800, 200, 80, "triangle", 0.45, 0);
  };

  GameScene.prototype.playXpSound = function () {
    this.playOsc(1200, 1000, 40, "sine", 0.4, 0);
  };

  GameScene.prototype.playLevelUpSound = function () {
    this.playOsc(523.25, 523.25, 100, "triangle", 0.42, 0);
    this.playOsc(659.25, 659.25, 100, "triangle", 0.42, 100);
    this.playOsc(783.99, 783.99, 100, "triangle", 0.42, 200);
  };

  GameScene.prototype.playPlayerDamageSound = function () {
    this.playOsc(150, 90, 100, "sine", 0.52, 0);
  };

  GameScene.prototype.playGameOverSound = function () {
    this.playOsc(440, 440, 200, "triangle", 0.5, 0);
    this.playOsc(349.23, 349.23, 200, "triangle", 0.5, 200);
    this.playOsc(293.66, 293.66, 200, "triangle", 0.5, 400);
  };
  GameScene.prototype.update = function (_, delta) {
    this.updateBackground();

    if (this.isGameOver) {
      return;
    }

    if (!this.isLevelingUp) {
      this.elapsedMs += delta;
      this.updatePlayerMovement(delta);
      this.updateSpawn();
      this.updateEnemies();
      this.updateWeapons();
      this.updateProjectiles();
      this.updateGems(delta);
      this.updateRegen();
    }

    this.hudBroadcastAccumulator += delta;
    if (this.hudBroadcastAccumulator >= 100) {
      this.hudBroadcastAccumulator = 0;
      this.emitHudState(false);
    }
  };

  GameScene.prototype.updateBackground = function () {
  };

  GameScene.prototype.updatePlayerMovement = function (delta) {
    var vx = 0;
    var vy = 0;

    if (this.keys.left.isDown || this.cursors.left.isDown || this.moveDir.x < 0) {
      vx -= 1;
    }
    if (this.keys.right.isDown || this.cursors.right.isDown || this.moveDir.x > 0) {
      vx += 1;
    }
    if (this.keys.up.isDown || this.cursors.up.isDown || this.moveDir.y < 0) {
      vy -= 1;
    }
    if (this.keys.down.isDown || this.cursors.down.isDown || this.moveDir.y > 0) {
      vy += 1;
    }

    var moving = vx !== 0 || vy !== 0;

    if (moving) {
      var norm = new Phaser.Math.Vector2(vx, vy).normalize();
      this.player.setVelocity(norm.x * this.playerSpeed, norm.y * this.playerSpeed);

      if (this.breathTween && !this.breathTween.isPaused()) {
        this.breathTween.pause();
        this.player.setScale(1, 1);
      }

      this.movingBobPhase += delta * 0.018;
      var bobOffset = Math.sin(this.movingBobPhase) * 2;
      this.player.y = this.player.body.position.y + this.player.body.halfHeight + bobOffset;

      if (this.time.now >= this.lastTrailAt + this.cfg.PLAYER.TRAIL_INTERVAL_MS) {
        this.lastTrailAt = this.time.now;
        this.trailEmitter.emitParticleAt(this.player.x - norm.x * 9, this.player.y - norm.y * 9, 1);
      }

      if (norm.x < 0) {
        this.player.setFlipX(true);
      } else if (norm.x > 0) {
        this.player.setFlipX(false);
      }

      return;
    }

    this.player.setVelocity(0, 0);
    this.player.y = this.player.body.position.y + this.player.body.halfHeight;

    if (this.breathTween && this.breathTween.isPaused()) {
      this.breathTween.resume();
    }
  };

  GameScene.prototype.updateSpawn = function () {
    if (this.time.now >= this.nextSpawnRampAt) {
      this.spawnRatePerSec *= this.cfg.ENEMIES.SPAWN_GROWTH_MULTIPLIER;
      this.nextSpawnRampAt += this.cfg.ENEMIES.SPAWN_GROWTH_EVERY_MS;
    }

    if (this.enemies.countActive(true) >= this.cfg.ENEMIES.MAX_ACTIVE) {
      return;
    }

    if (this.time.now < this.nextSpawnAt) {
      return;
    }

    this.spawnEnemy();
    var intervalMs = 1000 / this.spawnRatePerSec;
    this.nextSpawnAt = this.time.now + intervalMs;
  };

  GameScene.prototype.pickEnemyType = function () {
    var elapsed = this.elapsedMs;
    var canElite = elapsed >= this.cfg.ENEMIES.ELITE_START_MS;
    var roll = Math.random();

    if (canElite && roll > 0.89) {
      return "elite";
    }

    if (roll < 0.38) {
      return "bat";
    }

    if (roll < 0.7) {
      return "ghost";
    }

    return "zombie";
  };

  GameScene.prototype.getOffscreenSpawnPoint = function () {
    var camera = this.cameras.main;
    var view = camera.worldView;
    var pad = this.cfg.ENEMIES.SPAWN_OUTSIDE_PADDING;
    var side = Phaser.Math.Between(0, 3);
    var x;
    var y;

    if (side === 0) {
      x = Phaser.Math.Between(view.left - pad, view.right + pad);
      y = view.top - pad;
    } else if (side === 1) {
      x = view.right + pad;
      y = Phaser.Math.Between(view.top - pad, view.bottom + pad);
    } else if (side === 2) {
      x = Phaser.Math.Between(view.left - pad, view.right + pad);
      y = view.bottom + pad;
    } else {
      x = view.left - pad;
      y = Phaser.Math.Between(view.top - pad, view.bottom + pad);
    }

    return { x: x, y: y };
  };

  GameScene.prototype.spawnEnemy = function () {
    var enemyTypeName = this.pickEnemyType();
    var enemyType = this.cfg.ENEMIES.TYPES[enemyTypeName];
    var spawn = this.getOffscreenSpawnPoint();

    var enemy = this.enemies.get(spawn.x, spawn.y, enemyType.key);
    if (!enemy) {
      return;
    }

    enemy.enableBody(true, spawn.x, spawn.y, true, true);
    enemy.setTexture(enemyType.key);
    enemy.setDepth(8);
    enemy.setData("typeName", enemyTypeName);
    enemy.setData("hp", 1);
    enemy.setData("maxHp", 1);
    enemy.setData("damage", enemyType.damage);
    enemy.setData("xp", enemyType.xp);
    enemy.setData("score", enemyType.score);
    enemy.setData("speed", enemyType.speed);
    enemy.setData("wobbleAmp", enemyType.wobbleAmp);
    enemy.setData("wobbleSpeed", enemyType.wobbleSpeed);
    enemy.setData("spawnSeed", Phaser.Math.FloatBetween(0, Math.PI * 2));

    enemy.setAlpha(enemyType.alpha || 1);
    enemy.setScale(1);
    enemy.clearTint();

    this.tweens.killTweensOf(enemy);
    this.applyEnemyIdleTween(enemy, enemyTypeName);
  };
  GameScene.prototype.applyEnemyIdleTween = function (enemy, typeName) {
    if (typeName === "bat") {
      this.tweens.add({
        targets: enemy,
        scaleY: 0.84,
        duration: 170,
        yoyo: true,
        repeat: -1
      });
      return;
    }

    if (typeName === "zombie") {
      this.tweens.add({
        targets: enemy,
        angle: { from: -2, to: 2 },
        duration: 520,
        yoyo: true,
        repeat: -1
      });
      return;
    }

    if (typeName === "ghost") {
      this.tweens.add({
        targets: enemy,
        alpha: { from: 0.45, to: 0.7 },
        duration: 600,
        yoyo: true,
        repeat: -1
      });
      return;
    }

    if (typeName === "elite") {
      this.tweens.add({
        targets: enemy,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 450,
        yoyo: true,
        repeat: -1
      });
      this.tweens.add({
        targets: enemy,
        tint: { from: 0xffffff, to: 0xff8a80 },
        duration: 300,
        yoyo: true,
        repeat: -1
      });
    }
  };

  GameScene.prototype.updateEnemies = function () {
    var playerX = this.player.x;
    var playerY = this.player.y;
    var now = this.time.now;

    this.enemies.children.each(function (enemy) {
      if (!enemy.active) {
        return;
      }

      var speed = enemy.getData("speed") || 50;
      var wobbleAmp = enemy.getData("wobbleAmp") || 0;
      var wobbleSpeed = enemy.getData("wobbleSpeed") || 0;
      var seed = enemy.getData("spawnSeed") || 0;
      var typeName = enemy.getData("typeName");

      var targetY = playerY;
      if (typeName === "ghost") {
        targetY = playerY + Math.sin(now * wobbleSpeed + seed) * wobbleAmp;
      }

      var angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerX, targetY);
      enemy.body.velocity.x = Math.cos(angle) * speed;
      enemy.body.velocity.y = Math.sin(angle) * speed;

      if (typeName !== "ghost") {
        enemy.y = enemy.body.position.y + enemy.body.halfHeight + Math.sin(now * wobbleSpeed + seed) * wobbleAmp;
      }

      if (enemy.x < playerX) {
        enemy.setFlipX(false);
      } else {
        enemy.setFlipX(true);
      }
    }, this);
  };

  GameScene.prototype.findNearestEnemy = function (x, y) {
    var nearest = null;
    var bestDistSq = Number.MAX_VALUE;

    this.enemies.children.each(function (enemy) {
      if (!enemy.active) {
        return;
      }
      var dx = enemy.x - x;
      var dy = enemy.y - y;
      var distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        nearest = enemy;
      }
    });

    return nearest;
  };

  GameScene.prototype.updateWeapons = function () {
    var now = this.time.now;

    if (this.weaponState.slash.owned && now >= this.weaponState.slash.nextFireAt) {
      this.fireSlash();
      this.weaponState.slash.nextFireAt = now + this.getWeaponCooldown(this.cfg.WEAPONS.SLASH.COOLDOWN_MS);
    }

    if (this.weaponState.lightning.owned && now >= this.weaponState.lightning.nextFireAt) {
      this.fireLightning();
      this.weaponState.lightning.nextFireAt = now + this.getWeaponCooldown(this.cfg.WEAPONS.LIGHTNING.COOLDOWN_MS);
    }

    if (this.weaponState.shield.owned && now >= this.weaponState.shield.nextFireAt) {
      this.fireShieldPulse();
      this.weaponState.shield.nextFireAt = now + this.getWeaponCooldown(this.cfg.WEAPONS.SHIELD.COOLDOWN_MS);
    }
  };

  GameScene.prototype.manualFire = function () {
    if (this.isGameOver || this.isLevelingUp) return;
    var nearest = this.findNearestEnemy(this.player.x, this.player.y);
    if (!nearest) return;
    var baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearest.x, nearest.y);
    var projectileTotal = this.projectileCount;
    var spread = Phaser.Math.DegToRad(this.cfg.WEAPONS.PROJECTILE_SPREAD_DEG);
    for (var i = 0; i < projectileTotal; i += 1) {
      var projectile = this.projectiles.get(this.player.x, this.player.y, this.cfg.TEXTURES.ORB);
      if (!projectile) continue;
      var offsetIndex = i - (projectileTotal - 1) / 2;
      var angle = baseAngle + spread * offsetIndex;
      projectile.enableBody(true, this.player.x, this.player.y, true, true);
      projectile.setTexture(this.cfg.TEXTURES.ORB);
      projectile.setDepth(12);
      projectile.setScale(1);
      projectile.body.allowGravity = false;
      projectile.setData("damage", Math.round(this.cfg.WEAPONS.ORB.DAMAGE * this.damageMultiplier));
      projectile.setData("expiresAt", this.time.now + this.cfg.WEAPONS.ORB.LIFETIME_MS);
      projectile.setData("trailAt", this.time.now);
      projectile.body.velocity.x = Math.cos(angle) * this.cfg.WEAPONS.ORB.SPEED;
      projectile.body.velocity.y = Math.sin(angle) * this.cfg.WEAPONS.ORB.SPEED;
      projectile.rotation = angle;
    }
  };

  GameScene.prototype.getWeaponCooldown = function (baseCooldown) {
    return Math.max(120, baseCooldown * this.cooldownMultiplier);
  };

  GameScene.prototype.fireOrb = function () {
    var nearest = this.findNearestEnemy(this.player.x, this.player.y);
    if (!nearest) {
      return;
    }

    var baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearest.x, nearest.y);
    var projectileTotal = this.projectileCount;
    var spread = Phaser.Math.DegToRad(this.cfg.WEAPONS.PROJECTILE_SPREAD_DEG);

    var i;
    for (i = 0; i < projectileTotal; i += 1) {
      var projectile = this.projectiles.get(this.player.x, this.player.y, this.cfg.TEXTURES.ORB);
      if (!projectile) {
        continue;
      }

      var offsetIndex = i - (projectileTotal - 1) / 2;
      var angle = baseAngle + spread * offsetIndex;

      projectile.enableBody(true, this.player.x, this.player.y, true, true);
      projectile.setTexture(this.cfg.TEXTURES.ORB);
      projectile.setDepth(12);
      projectile.setScale(1);
      projectile.body.allowGravity = false;
      projectile.setData("damage", Math.round(this.cfg.WEAPONS.ORB.DAMAGE * this.damageMultiplier));
      projectile.setData("expiresAt", this.time.now + this.cfg.WEAPONS.ORB.LIFETIME_MS);
      projectile.setData("trailAt", this.time.now);
      projectile.body.velocity.x = Math.cos(angle) * this.cfg.WEAPONS.ORB.SPEED;
      projectile.body.velocity.y = Math.sin(angle) * this.cfg.WEAPONS.ORB.SPEED;
      projectile.rotation = angle;
    }
  };

  GameScene.prototype.fireSlash = function () {
    var radius = this.cfg.WEAPONS.SLASH.RADIUS;
    var damage = Math.round(this.cfg.WEAPONS.SLASH.DAMAGE * this.damageMultiplier);

    var slash = this.add.image(this.player.x, this.player.y, this.cfg.TEXTURES.SLASH).setDepth(25).setAlpha(0.86);
    slash.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
    slash.setScale(0.65);

    this.tweens.add({
      targets: slash,
      scale: 1.08,
      alpha: 0,
      angle: slash.angle + 80,
      duration: 220,
      ease: "Cubic.Out",
      onComplete: function () {
        slash.destroy();
      }
    });

    this.hitEnemiesInRadius(this.player.x, this.player.y, radius, damage);
    this.playHitSound();
  };

  GameScene.prototype.fireLightning = function () {
    var damage = Math.round(this.cfg.WEAPONS.LIGHTNING.DAMAGE * this.damageMultiplier);
    var maxChains = this.cfg.WEAPONS.LIGHTNING.CHAINS;
    var range = this.cfg.WEAPONS.LIGHTNING.RANGE;

    var targets = this.findNearestEnemies(this.player.x, this.player.y, maxChains, range);
    if (targets.length === 0) {
      return;
    }

    this.lightningGraphics.clear();
    this.lightningGraphics.lineStyle(3, 0xffffff, 0.95);

    var i;
    for (i = 0; i < targets.length; i += 1) {
      var target = targets[i];
      this.lightningGraphics.beginPath();
      this.lightningGraphics.moveTo(this.player.x, this.player.y);
      this.lightningGraphics.lineTo(target.x, target.y);
      this.lightningGraphics.strokePath();

      target.setTintFill(0xffffff);
      this.time.delayedCall(40, function (enemy) {
        if (enemy && enemy.active) {
          enemy.clearTint();
        }
      }, [target], this);

      this.damageEnemy(target, damage);
    }

    this.playHitSound();

    this.time.delayedCall(80, function () {
      this.lightningGraphics.clear();
    }, null, this);
  };
  GameScene.prototype.fireShieldPulse = function () {
    var damage = Math.round(this.cfg.WEAPONS.SHIELD.DAMAGE * this.damageMultiplier);
    var maxRadius = this.cfg.WEAPONS.SHIELD.RADIUS;
    var hitMap = {};

    var ring = this.add.image(this.player.x, this.player.y, this.cfg.TEXTURES.SHIELD).setDepth(24).setScale(0.2).setAlpha(0.88);

    this.shieldEmitter.explode(10, this.player.x, this.player.y);

    this.tweens.add({
      targets: ring,
      scale: 1.7,
      alpha: 0,
      duration: 380,
      ease: "Cubic.Out",
      onUpdate: function (tween, target) {
        var pulseRadius = Phaser.Math.Linear(20, maxRadius, tween.progress);
        this.damageShieldRing(target.x, target.y, pulseRadius, damage, hitMap);
      },
      onUpdateScope: this,
      onComplete: function () {
        ring.destroy();
      }
    });

    this.playHitSound();
  };

  GameScene.prototype.damageShieldRing = function (x, y, radius, damage, hitMap) {
    this.enemies.children.each(function (enemy) {
      if (!enemy.active) {
        return;
      }
      var id = enemy.body ? enemy.body.id : enemy.name;
      if (hitMap[id]) {
        return;
      }
      var dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (dist <= radius) {
        hitMap[id] = true;
        this.damageEnemy(enemy, damage);
      }
    }, this);
  };

  GameScene.prototype.hitEnemiesInRadius = function (x, y, radius, damage) {
    this.enemies.children.each(function (enemy) {
      if (!enemy.active) {
        return;
      }
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) {
        this.damageEnemy(enemy, damage);
      }
    }, this);
  };

  GameScene.prototype.findNearestEnemies = function (x, y, maxCount, maxDist) {
    var candidates = [];

    this.enemies.children.each(function (enemy) {
      if (!enemy.active) {
        return;
      }
      var dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (dist <= maxDist) {
        candidates.push({ enemy: enemy, dist: dist });
      }
    });

    candidates.sort(function (a, b) {
      return a.dist - b.dist;
    });

    var out = [];
    var i;
    for (i = 0; i < Math.min(maxCount, candidates.length); i += 1) {
      out.push(candidates[i].enemy);
    }
    return out;
  };

  GameScene.prototype.updateProjectiles = function () {
    var now = this.time.now;

    this.projectiles.children.each(function (projectile) {
      if (!projectile.active) {
        return;
      }

      if (now >= projectile.getData("expiresAt")) {
        this.recycleProjectile(projectile);
        return;
      }

      var trailAt = projectile.getData("trailAt") || 0;
      if (now >= trailAt + 35) {
        projectile.setData("trailAt", now);
        this.projectileEmitter.emitParticleAt(projectile.x, projectile.y, 1);
      }
    }, this);
  };

  GameScene.prototype.updateGems = function (delta) {
    this.gemSparkleAccumulator += delta;
    var scene = this;
    var physicsActive = !scene.physics.world.isPaused;

    this.xpGems.children.each(function (gem) {
      if (!gem.active) {
        return;
      }

      var dist = Phaser.Math.Distance.Between(gem.x, gem.y, scene.player.x, scene.player.y);
      if (dist <= scene.magnetRadius) {
        gem.setData("magnetized", true);
      }

      if (!physicsActive) {
        gem.setVelocity(0, 0);
      } else if (dist < 80 && !gem.getData("magnetized")) {
        scene.physics.moveToObject(gem, scene.player, 150);
      } else if (gem.getData("magnetized")) {
        var normalized = 1 - Phaser.Math.Clamp(dist / scene.magnetRadius, 0, 1);
        var curve = Phaser.Math.Easing.Cubic.In(normalized);
        var speed = Phaser.Math.Linear(scene.cfg.XP.GEM_SPEED_MIN, scene.cfg.XP.GEM_SPEED_MAX, curve);
        scene.physics.moveToObject(gem, scene.player, speed);
      } else {
        gem.setVelocity(0, 0);
      }

      if (scene.gemSparkleAccumulator >= scene.cfg.XP.GEM_SPARKLE_INTERVAL_MS) {
        if (Math.random() < 0.33) {
          scene.gemSparkleEmitter.emitParticleAt(gem.x, gem.y, 1);
        }
      }
    }, this);

    if (this.gemSparkleAccumulator >= this.cfg.XP.GEM_SPARKLE_INTERVAL_MS) {
      this.gemSparkleAccumulator = 0;
    }
  };

  GameScene.prototype.updateRegen = function () {
    if (this.time.now < this.nextRegenAt) {
      return;
    }

    this.nextRegenAt = this.time.now + this.regenIntervalMs;

    if (this.playerHP >= this.playerMaxHP) {
      return;
    }

    this.playerHP = Math.min(this.playerMaxHP, this.playerHP + this.regenAmount);
    this.emitHudState(false);
  };

  GameScene.prototype.onProjectileHitsEnemy = function (projectile, enemy) {
    if (!projectile.active || !enemy.active) {
      return;
    }

    var damage = projectile.getData("damage") || this.cfg.WEAPONS.ORB.DAMAGE;
    this.damageEnemy(enemy, damage);
    this.recycleProjectile(projectile);
    this.playHitSound();
  };

  GameScene.prototype.onPlayerEnemyOverlap = function (_, enemy) {
    if (!enemy.active || this.isGameOver) {
      return;
    }

    var damage = Math.max(1, Math.floor((enemy.getData("damage") || 1) * 0.5));
    this.damagePlayer(damage);

    if (this.cfg.ENEMIES.CONTACT_KILL) {
      this.killEnemy(enemy);
    }
  };

  GameScene.prototype.onPlayerCollectGem = function (_, gem) {
    if (!gem.active) {
      return;
    }

    var gain = gem.getData("xp") || 1;
    this.collectXP(gain, gem.x, gem.y);
    this.recycleGem(gem);
  };

  GameScene.prototype.collectXP = function (amount, x, y) {
    this.playXpSound();

    this.playerXP += amount;
    this.showScorePopup("+" + amount, x, y);

    while (this.playerXP >= this.xpToNext) {
      this.playerXP -= this.xpToNext;
      this.playerLevel += 1;
      this.xpToNext = Math.ceil(this.xpToNext * this.cfg.XP.NEXT_MULTIPLIER);
      this.startLevelUp();
      if (this.isLevelingUp) {
        break;
      }
    }

    this.emitHudState(false);
  };

  GameScene.prototype.showScorePopup = function (text, x, y) {
    var popup = this.add.text(x, y, text, {
      fontFamily: "Trebuchet MS",
      fontSize: "18px",
      color: "#ffc107",
      fontStyle: "bold"
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: popup,
      y: y - 30,
      alpha: 0,
      duration: this.cfg.VFX.SCORE_POPUP_MS,
      ease: "Cubic.Out",
      onComplete: function () {
        popup.destroy();
      }
    });
  };

  GameScene.prototype.damageEnemy = function (enemy, damage) {
    if (!enemy.active) {
      return;
    }

    var hp = enemy.getData("hp") || 1;
    hp -= damage;
    enemy.setData("hp", hp);

    enemy.setTintFill(0xffffff);
    this.time.delayedCall(40, function (target) {
      if (target && target.active) {
        target.clearTint();
      }
    }, [enemy], this);

    if (hp <= 0) {
      this.killEnemy(enemy);
    }
  };

  GameScene.prototype.killEnemy = function (enemy) {
    if (!enemy.active) {
      return;
    }

    var color = this.getEnemyColor(enemy.getData("typeName"));
    var xp = enemy.getData("xp") || 1;
    var score = enemy.getData("score") || xp;
    var x = enemy.x;
    var y = enemy.y;

    this.spawnEnemyFlash(enemy);

    this.deathEmitter.setParticleTint(color);
    this.deathEmitter.explode(8, x, y);

    this.spawnGem(x, y, xp);
    this.playEnemyDeathSound();

    this.killCount += 1;
    this.score += score;

    this.recycleEnemy(enemy);

    this.emitHudState(false);
  };

  GameScene.prototype.spawnEnemyFlash = function (enemy) {
    var flash = this.add.image(enemy.x, enemy.y, enemy.texture.key).setDepth(15).setTint(0xffffff).setAlpha(0.9);
    flash.setScale(enemy.scaleX, enemy.scaleY);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 60,
      onComplete: function () {
        flash.destroy();
      }
    });
  };
  GameScene.prototype.getEnemyColor = function (typeName) {
    var type = this.cfg.ENEMIES.TYPES[typeName] || this.cfg.ENEMIES.TYPES.bat;
    return type.color;
  };

  GameScene.prototype.spawnGem = function (x, y, xpValue) {
    var gem = this.xpGems.get(x, y, this.cfg.TEXTURES.GEM);
    if (!gem) {
      return;
    }

    gem.enableBody(true, x, y, true, true);
    if (!gem.body) {
      this.physics.world.enable(gem);
    }
    gem.setTexture(this.cfg.TEXTURES.GEM);
    gem.setDepth(7);
    gem.setData("xp", xpValue);
    gem.setData("magnetized", false);
    gem.setScale(1);
    gem.body.setAllowGravity(false);
    gem.body.setImmovable(false);
    gem.body.setCircle(12, Math.max(0, (gem.width - 24) * 0.5), Math.max(0, (gem.height - 24) * 0.5));
    gem.body.reset(x, y);

    this.tweens.killTweensOf(gem);
    this.tweens.add({
      targets: gem,
      scaleY: 1.12,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut"
    });
  };

  GameScene.prototype.damagePlayer = function (amount) {
    if (this.time.now < this.invincibleUntil || this.isGameOver) {
      return;
    }

    this.invincibleUntil = this.time.now + this.cfg.PLAYER.INVINCIBLE_MS;
    this.playerHP = Math.max(0, this.playerHP - amount);

    this.cameras.main.shake(this.cfg.VFX.DAMAGE_SHAKE_MS, this.cfg.VFX.DAMAGE_SHAKE_INTENSITY);
    this.cameras.main.flash(this.cfg.VFX.DAMAGE_FLASH_MS, 255, 70, 90, false);

    if (this.flashTween) {
      this.flashTween.stop();
    }

    this.flashTween = this.tweens.add({
      targets: this.player,
      alpha: 0.25,
      duration: 70,
      yoyo: true,
      repeat: 4,
      onComplete: function () {
        if (this.player && this.player.active) {
          this.player.alpha = 1;
        }
      },
      onCompleteScope: this
    });

    this.playPlayerDamageSound();
    this.emitHudState(false);

    if (this.playerHP <= 0) {
      this.handleDeath();
    }
  };

  GameScene.prototype.handleDeath = function () {
    if (this.isGameOver) {
      return;
    }

    this.isGameOver = true;

    try { this.physics.world.pause(); } catch (_) {}

    try {
      this.deathEmitter.setParticleTint(0xe94560);
      this.deathEmitter.explode(18, this.player.x, this.player.y);
    } catch (_) {}

    this.cameras.main.flash(130, 255, 40, 40, false);
    this.playGameOverSound();

    var deathZoomMs = (this.cfg.VFX && this.cfg.VFX.DEATH_ZOOM_DURATION_MS) || 800;
    var deathTransitionMs = (this.cfg.VFX && this.cfg.VFX.DEATH_TRANSITION_MS) || 1200;

    this.cameras.main.zoomTo(0.75, deathZoomMs);
    this.cameras.main.fade(deathTransitionMs, 120, 0, 0, false);

    var stats = {
      score: this.score,
      killCount: this.killCount,
      level: this.playerLevel,
      elapsedMs: this.elapsedMs
    };

    try { this.bus.emit(this.cfg.EVENTS.GAME_OVER, stats); } catch (_) {}

    var scene = this;
    this.time.delayedCall(deathTransitionMs + 20, function () {
      try { scene.scene.stop("HUDScene"); } catch (_) {}
      scene.scene.start("GameOverScene", stats);
    }, null, this);
  };

  GameScene.prototype.startLevelUp = function () {
    if (this.isLevelingUp || this.isGameOver) {
      return;
    }

    this.isLevelingUp = true;
    this.levelChoiceLocked = false;

    this.physics.world.pause();
    this.cameras.main.flash(this.cfg.VFX.LEVEL_UP_FLASH_MS, 255, 255, 255, false);

    this.shieldEmitter.explode(16, this.player.x, this.player.y);
    this.playLevelUpSound();
    try {
      this.showLevelUpOverlay();
    } catch (e) {
      console.error("Level up overlay error:", e);
      this.isLevelingUp = false;
      this.physics.world.resume();
    }
  };

  GameScene.prototype.showLevelUpOverlay = function () {
    if (this.levelUpOverlay) {
      this.levelUpOverlay.destroy(true);
      this.levelUpOverlay = null;
    }

    var upgrades = this.rollUpgradeChoices ? this.rollUpgradeChoices() : [];
    if (!upgrades || upgrades.length === 0) {
      this.closeLevelUpOverlay();
      return;
    }

    var camera = this.cameras.main;
    var centerX = camera.worldView.centerX;
    var centerY = camera.worldView.centerY;

    var overlay = this.add.container(centerX, centerY).setDepth(100);

    var dim = this.add.rectangle(0, 0, this.cfg.GAME.WIDTH, this.cfg.GAME.HEIGHT, 0x03030a, 0.72).setOrigin(0.5);
    dim.setScrollFactor(0);

    var title = this.add.text(0, -190, "LEVEL UP", {
      fontFamily: "Trebuchet MS",
      fontSize: "34px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    var subtitle = this.add.text(0, -154, "Choose one upgrade", {
      fontFamily: "Trebuchet MS",
      fontSize: "16px",
      color: "#c4c8dd"
    }).setOrigin(0.5);

    overlay.add([dim, title, subtitle]);

    var i;
    for (i = 0; i < upgrades.length; i += 1) {
      var cardX = (i - 1) * this.cfg.LEVEL_UP.CARD_SPACING;
      var card = this.createUpgradeCard(upgrades[i], cardX, 18);
      overlay.add(card);

      card.y += 200;
      card.scaleX = 0;
      card.scaleY = 0;

      this.tweens.add({
        targets: card,
        y: card.y - 200,
        scaleX: 1,
        scaleY: 1,
        duration: 300,
        delay: i * 90,
        ease: "Back.Out"
      });
    }

    overlay.setScrollFactor(0);
    this.levelUpOverlay = overlay;
  };

  GameScene.prototype.createUpgradeCard = function (upgrade, x, y) {
    var card = this.add.container(x, y);
    var bg = this.add.image(0, 0, this.cfg.TEXTURES.CARD_BG).setInteractive({ useHandCursor: true });
    var icon = this.add.text(-72, -45, upgrade.icon, {
      fontFamily: "Trebuchet MS",
      fontSize: "26px",
      color: "#ffc107"
    }).setOrigin(0.5);

    var title = this.add.text(0, -46, upgrade.title, {
      fontFamily: "Trebuchet MS",
      fontSize: "22px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    var desc = this.add.text(0, 6, upgrade.description, {
      fontFamily: "Trebuchet MS",
      fontSize: "15px",
      color: "#d3d5e7",
      align: "center",
      wordWrap: { width: 180 }
    }).setOrigin(0.5);

    card.add([bg, icon, title, desc]);

    var self = this;
    bg.on("pointerover", function () {
      card.setScale(1.05);
      bg.setTint(0xff90a3);
    });

    bg.on("pointerout", function () {
      card.setScale(1);
      bg.clearTint();
    });

    bg.on("pointerdown", function () {
      if (self.time.now < self.pointerBlockUntil || self.levelChoiceLocked) {
        return;
      }

      self.levelChoiceLocked = true;
      self.applyUpgrade(upgrade.id);
      self.closeLevelUpOverlay();
    });

    return card;
  };
  GameScene.prototype.rollUpgradeChoices = function () {
    var list = [];

    list.push({ id: "damage", title: "+Damage", description: "All weapon damage +20%", icon: "DMG" });
    list.push({ id: "speed", title: "+Speed", description: "Move speed +15%", icon: "SPD" });
    list.push({ id: "hp", title: "+HP", description: "Max HP +25", icon: "HP" });
    list.push({ id: "regen", title: "+Regen", description: "HP regen doubled", icon: "REG" });
    list.push({ id: "fireRate", title: "+Fire Rate", description: "Weapon cooldowns -15%", icon: "FR" });
    list.push({ id: "magnet", title: "+Magnet", description: "Magnet radius +40", icon: "MAG" });
    list.push({ id: "projectile", title: "+Projectile", description: "Orb fires +1 projectile", icon: "ORB" });

    if (!this.weaponState.slash.owned) {
      list.push({ id: "unlockSlash", title: "New: Slash", description: "Add the Slash weapon", icon: "SL" });
    }

    if (!this.weaponState.lightning.owned) {
      list.push({ id: "unlockLightning", title: "New: Lightning", description: "Add Lightning chain", icon: "LT" });
    }

    if (!this.weaponState.shield.owned) {
      list.push({ id: "unlockShield", title: "New: Shield", description: "Add Shield Pulse", icon: "SH" });
    }

    Phaser.Utils.Array.Shuffle(list);
    return list.slice(0, this.cfg.LEVEL_UP.CARD_COUNT);
  };

  GameScene.prototype.applyUpgrade = function (id) {
    var u = this.cfg.UPGRADE_VALUES;

    if (id === "damage") {
      this.damageMultiplier *= u.DAMAGE_MULTIPLIER;
    } else if (id === "speed") {
      this.playerSpeed *= u.SPEED_MULTIPLIER;
    } else if (id === "hp") {
      this.playerMaxHP += u.HP_ADD;
      this.playerHP = Math.min(this.playerMaxHP, this.playerHP + u.HP_ADD);
    } else if (id === "regen") {
      this.regenIntervalMs = Math.max(250, this.regenIntervalMs * u.REGEN_MULTIPLIER);
    } else if (id === "unlockSlash") {
      this.weaponState.slash.owned = true;
      this.weaponState.slash.nextFireAt = this.time.now + 350;
    } else if (id === "unlockLightning") {
      this.weaponState.lightning.owned = true;
      this.weaponState.lightning.nextFireAt = this.time.now + 400;
    } else if (id === "unlockShield") {
      this.weaponState.shield.owned = true;
      this.weaponState.shield.nextFireAt = this.time.now + 450;
    } else if (id === "fireRate") {
      this.cooldownMultiplier *= u.FIRE_RATE_MULTIPLIER;
    } else if (id === "magnet") {
      this.magnetRadius += u.MAGNET_ADD;
    } else if (id === "projectile") {
      this.projectileCount += u.PROJECTILE_ADD;
    }

    this.emitHudState(false);
  };

  GameScene.prototype.closeLevelUpOverlay = function () {
    if (this.levelUpOverlay) {
      this.levelUpOverlay.destroy(true);
      this.levelUpOverlay = null;
    }

    this.isLevelingUp = false;
    this.physics.world.resume();
  };

  GameScene.prototype.recycleEnemy = function (enemy) {
    this.tweens.killTweensOf(enemy);
    enemy.disableBody(true, true);
    enemy.setActive(false);
    enemy.setVisible(false);
    enemy.clearTint();
  };

  GameScene.prototype.recycleProjectile = function (projectile) {
    projectile.disableBody(true, true);
    projectile.setActive(false);
    projectile.setVisible(false);
  };

  GameScene.prototype.recycleGem = function (gem) {
    this.tweens.killTweensOf(gem);
    gem.disableBody(true, true);
    gem.setActive(false);
    gem.setVisible(false);
  };

  GameScene.prototype.emitHudState = function (force) {
    if (!this.bus || !this.scene.isActive()) {
      return;
    }

    if (!force && this.isGameOver) {
      return;
    }

    this.bus.emit(this.cfg.EVENTS.HUD_UPDATE, this.getHudState());
  };

  GameScene.prototype.getHudState = function () {
    return {
      currentHP: this.playerHP,
      maxHP: this.playerMaxHP,
      xp: this.playerXP,
      xpToNext: this.xpToNext,
      level: this.playerLevel,
      timerMs: this.elapsedMs,
      killCount: this.killCount,
      score: this.score,
      audioEnabled: this.audioEnabled
    };
  };

  GameScene.prototype.onShutdown = function () {
    window.__gameAPI = null;

    if (this.bus) {
      this.bus.off(this.cfg.EVENTS.AUDIO_TOGGLE_REQUEST, this.toggleAudio, this);
      this.bus.off(this.cfg.EVENTS.HUD_CLICK_CONSUMED, this.onHudClickConsumed, this);
    }

    if (this.input) {
      this.input.off("pointerdown", this.unlockAudio, this);
      if (this.input.keyboard) {
        this.input.keyboard.off("keydown", this.unlockAudio, this);
      }
    }

    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  };

  window.GameScene = GameScene;
})();
