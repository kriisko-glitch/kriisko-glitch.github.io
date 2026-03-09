class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.speedMultiplier = 1;
    this.displayLevel = 1;
    this.level = 1;
    this.currentZone = 0;
    this.lastCheckpoint = { x: 100, y: 500 };
    this.lastJumpPressedTime = -9999;
    this.lastGroundedTime = -9999;
    this.jumpsUsed = 0;
    this.wasOnGround = false;
    this.playerFacing = 1;
    this.invulnerableUntil = 0;
    this.playerDisabled = false;
    this.isTransitioning = false;
  }

  init(data) {
    const config = window.Platformer.CONFIG;

    if (data?.resetRun || !this.registry.get("runInitialized")) {
      this.registry.set("runInitialized", true);
      this.registry.set("score", 0);
      this.registry.set("coins", 0);
      this.registry.set("lives", config.GAMEPLAY.START_LIVES);
      this.registry.set("level", 1);
      this.registry.set("doubleJumpUnlocked", false);
    }

    this.level = this.registry.get("level") || 1;
    this.displayLevel = ((this.level - 1) % config.GAME.LEVEL_COUNT) + 1;
    this.loopCount = Math.floor((this.level - 1) / config.GAME.LEVEL_COUNT);
    this.speedMultiplier = 1 + this.loopCount * config.GAMEPLAY.LOOP_SPEED_INCREMENT;
  }

  create() {
    const config = window.Platformer.CONFIG;
    this.audio = window.Platformer.AUDIO;

    this.physics.world.setBounds(0, 0, config.GAME.WORLD_WIDTH, config.GAME.WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, config.GAME.WORLD_WIDTH, config.GAME.WORLD_HEIGHT);
    this.cameras.main.roundPixels = false;

    this.ensureTextures();
    this.createBackground();
    this.createGroups();
    this.buildLevel();
    this.createPlayer();
    this.createColliders();
    this.setupInput();

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.registry.set("level", this.level);

    if (!this.scene.isActive("HUDScene")) {
      this.scene.launch("HUDScene");
    }

    this.input.keyboard.on("keydown", () => this.audio.unlock());
    this.input.on("pointerdown", () => this.audio.unlock());
  }

  ensureTextures() {
    const config = window.Platformer.CONFIG;

    if (!this.textures.exists("sky-gradient")) {
      const gradient = this.textures.createCanvas("sky-gradient", config.GAME.WIDTH, config.GAME.HEIGHT);
      const ctx = gradient.getContext();
      const fill = ctx.createLinearGradient(0, 0, 0, config.GAME.HEIGHT);
      fill.addColorStop(0, "#0d0d1a");
      fill.addColorStop(1, "#1a1a4e");
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, config.GAME.WIDTH, config.GAME.HEIGHT);
      gradient.refresh();
    }

    if (!this.textures.exists("pixel")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 2, 2);
      g.generateTexture("pixel", 2, 2);
      g.destroy();
    }

    if (!this.textures.exists("player")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(config.COLORS.WHITE, 1);
      g.fillRoundedRect(2, 2, 28, 36, 9);
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(11, 14, 2);
      g.fillCircle(21, 14, 2);
      g.fillStyle(config.COLORS.ACCENT, 1);
      g.fillRect(8, 22, 16, 4);
      g.fillTriangle(7, 24, 2, 29, 7, 32);
      g.generateTexture("player", 32, 40);
      g.destroy();
    }

    if (!this.textures.exists("platform")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(config.COLORS.GROUND, 1);
      g.fillRoundedRect(0, 0, 128, 22, 7);
      g.fillStyle(config.COLORS.GROUND_EDGE, 1);
      g.fillRect(0, 0, 128, 4);
      g.generateTexture("platform", 128, 22);
      g.destroy();
    }

    if (!this.textures.exists("oneway-platform")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x2b6844, 1);
      g.fillRoundedRect(0, 0, 128, 18, 6);
      g.fillStyle(0x86c68c, 1);
      g.fillRect(0, 0, 128, 3);
      g.generateTexture("oneway-platform", 128, 18);
      g.destroy();
    }

    if (!this.textures.exists("moving-platform")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xc7812d, 1);
      g.fillRoundedRect(0, 0, 128, 20, 6);
      g.fillStyle(0xf5b55a, 1);
      g.fillRect(0, 0, 128, 3);
      g.generateTexture("moving-platform", 128, 20);
      g.destroy();
    }

    if (!this.textures.exists("coin")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(config.COLORS.COIN, 1);
      g.fillCircle(8, 8, 8);
      g.lineStyle(2, 0xffe082, 1);
      g.strokeCircle(8, 8, 6);
      g.generateTexture("coin", 16, 16);
      g.destroy();
    }

    if (!this.textures.exists("gem")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(config.COLORS.GEM, 1);
      g.fillTriangle(10, 0, 20, 10, 10, 20);
      g.fillTriangle(10, 0, 10, 20, 0, 10);
      g.generateTexture("gem", 20, 20);
      g.destroy();
    }

    if (!this.textures.exists("spike")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(config.COLORS.ACCENT, 1);
      g.fillTriangle(12, 0, 24, 16, 0, 16);
      g.generateTexture("spike", 24, 16);
      g.destroy();
    }

    if (!this.textures.exists("enemy-wanderer")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xdb4242, 1);
      g.fillRect(0, 0, 24, 24);
      g.fillStyle(0x290707, 1);
      g.fillRect(4, 6, 4, 4);
      g.fillRect(16, 6, 4, 4);
      g.generateTexture("enemy-wanderer", 24, 24);
      g.destroy();
    }

    if (!this.textures.exists("enemy-jumper")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xf08a24, 1);
      g.fillTriangle(12, 0, 24, 22, 0, 22);
      g.generateTexture("enemy-jumper", 24, 22);
      g.destroy();
    }

    if (!this.textures.exists("enemy-spitter")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x8640c9, 1);
      g.fillPoints([
        new Phaser.Geom.Point(13, 0),
        new Phaser.Geom.Point(24, 6),
        new Phaser.Geom.Point(24, 18),
        new Phaser.Geom.Point(13, 24),
        new Phaser.Geom.Point(2, 18),
        new Phaser.Geom.Point(2, 6)
      ], true);
      g.generateTexture("enemy-spitter", 26, 24);
      g.destroy();
    }

    if (!this.textures.exists("projectile")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xd08cff, 1);
      g.fillCircle(6, 6, 6);
      g.generateTexture("projectile", 12, 12);
      g.destroy();
    }

    if (!this.textures.exists("checkpoint")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xcccccc, 1);
      g.fillRect(2, 0, 4, 52);
      g.fillStyle(config.COLORS.ACCENT, 1);
      g.fillTriangle(6, 6, 18, 11, 6, 16);
      g.generateTexture("checkpoint", 20, 54);
      g.destroy();
    }

    if (!this.textures.exists("flagpole")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xdadada, 1);
      g.fillRect(6, 0, 4, 120);
      g.fillStyle(config.COLORS.ACCENT, 1);
      g.fillTriangle(10, 8, 24, 14, 10, 20);
      g.generateTexture("flagpole", 26, 120);
      g.destroy();
    }
  }

  createBackground() {
    const config = window.Platformer.CONFIG;
    this.add.image(0, 0, "sky-gradient").setOrigin(0).setScrollFactor(0).setDepth(-100);

    this.createMountainLayer(0x25345c, 560, 80, 170, 180, 0.22, 0.45, -90);
    this.createMountainLayer(0x1a2747, 590, 70, 150, 130, 0.4, 0.72, -85);

    this.zoneOverlay = this.add.rectangle(
      config.GAME.WIDTH / 2,
      config.GAME.HEIGHT / 2,
      config.GAME.WIDTH,
      config.GAME.HEIGHT,
      config.ZONES[0].tint,
      config.ZONES[0].alpha
    ).setScrollFactor(0).setDepth(-70);

    this.cameras.main.setBackgroundColor(config.ZONES[0].background);
    this.currentZone = 0;
  }

  createMountainLayer(color, baseY, minHeight, maxHeight, step, scrollFactor, alpha, depth) {
    const config = window.Platformer.CONFIG;
    const g = this.add.graphics();
    g.setScrollFactor(scrollFactor);
    g.setDepth(depth);
    g.fillStyle(color, alpha);

    let x = -300;
    const maxX = config.GAME.WORLD_WIDTH + 300;
    while (x < maxX) {
      const peakX = x + step * 0.5;
      const peakY = baseY - Phaser.Math.Between(minHeight, maxHeight);
      g.fillTriangle(x, baseY, x + step, baseY, peakX, peakY);
      x += step;
    }
  }

  createGroups() {
    this.grounds = this.physics.add.staticGroup();
    this.platforms = this.physics.add.staticGroup();
    this.oneWayPlatforms = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.checkpoints = this.physics.add.staticGroup();

    this.movingPlatforms = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.coins = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.gems = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.enemies = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group({ allowGravity: false });

    this.platformSurfaces = [];
  }

  buildLevel() {
    const config = window.Platformer.CONFIG;
    const rng = new Phaser.Math.RandomDataGenerator([`level-${this.level}`]);

    this.createGroundAndPits();
    this.createFloatingPlatforms(rng);
    this.createCheckpoints();

    this.flagPole = this.physics.add.staticImage(config.GAME.WORLD_WIDTH - 200, config.PLATFORM.GROUND_Y - 60, "flagpole");
    this.flagPole.refreshBody();

    this.spawnCollectibles(rng);
    this.spawnEnemies(rng);
  }

  createGroundAndPits() {
    const config = window.Platformer.CONFIG;
    const groundY = config.PLATFORM.GROUND_Y;
    const height = config.GAME.WORLD_HEIGHT - groundY;
    const pitRanges = [
      { start: 860, end: 1020 },
      { start: 2060, end: 2230 },
      { start: 3260, end: 3420 }
    ];

    let cursor = 0;
    for (const pit of pitRanges) {
      this.createGroundSegment(cursor, pit.start, groundY, height);
      cursor = pit.end;
    }
    this.createGroundSegment(cursor, config.GAME.WORLD_WIDTH, groundY, height);

    for (const pit of pitRanges) {
      const width = pit.end - pit.start;
      this.createSpikeStrip(pit.start + 16, groundY + height - 8, width - 32);
    }
  }

  createGroundSegment(startX, endX, groundY, height) {
    const width = endX - startX;
    if (width <= 0) {
      return;
    }
    const segment = this.grounds.create(startX + width * 0.5, groundY + height * 0.5, "platform");
    segment.setDisplaySize(width, height);
    segment.refreshBody();

    this.add.rectangle(startX + width * 0.5, groundY + 1, width, 3, window.Platformer.CONFIG.COLORS.GROUND_EDGE)
      .setOrigin(0.5, 0.5)
      .setDepth(2);

    this.platformSurfaces.push({
      x1: startX,
      x2: endX,
      y: groundY,
      type: "ground"
    });
  }

  createFloatingPlatforms(rng) {
    const config = window.Platformer.CONFIG;
    let xCursor = 190;
    let prevY = 430;

    while (xCursor < config.GAME.WORLD_WIDTH - 380) {
      xCursor += rng.between(config.PLATFORM.MIN_GAP, config.PLATFORM.MAX_GAP);
      if (xCursor >= config.GAME.WORLD_WIDTH - 320) {
        break;
      }

      const width = rng.between(config.PLATFORM.MIN_WIDTH, config.PLATFORM.MAX_WIDTH);
      const y = Phaser.Math.Clamp(prevY + rng.between(-120, 120), 260, 500);
      const centerX = xCursor + width * 0.5;
      const typeRoll = rng.frac();

      if (typeRoll < 0.18) {
        const oneWay = this.oneWayPlatforms.create(centerX, y, "oneway-platform");
        oneWay.setDisplaySize(width, 18);
        oneWay.refreshBody();
        this.platformSurfaces.push({ x1: xCursor, x2: xCursor + width, y: y - 8, type: "oneway", ref: oneWay });
      } else if (typeRoll < 0.34) {
        const moving = this.movingPlatforms.create(centerX, y, "moving-platform");
        moving.setDisplaySize(width, 20);
        moving.body.setSize(width, 20, true);
        moving.body.setAllowGravity(false);
        moving.body.setImmovable(true);
        moving.baseX = centerX;
        moving.minX = centerX - rng.between(40, 110);
        moving.maxX = centerX + rng.between(40, 120);
        moving.moveSpeed = rng.between(55, 95) * this.speedMultiplier;
        moving.setVelocityX(moving.moveSpeed * (rng.frac() > 0.5 ? 1 : -1));
      } else {
        const platform = this.platforms.create(centerX, y, "platform");
        platform.setDisplaySize(width, 22);
        platform.refreshBody();
        this.platformSurfaces.push({ x1: xCursor, x2: xCursor + width, y: y - 10, type: "platform", ref: platform });

        if (rng.frac() < 0.22 && width >= 96) {
          const stripWidth = rng.between(48, width - 16);
          const spikeStart = Phaser.Math.Clamp(centerX - stripWidth * 0.5, xCursor + 6, xCursor + width - stripWidth - 6);
          this.createSpikeStrip(spikeStart, y - 11, stripWidth);
        }
      }

      xCursor += width;
      prevY = y;
    }
  }

  createSpikeStrip(startX, baselineY, width) {
    const count = Math.max(1, Math.floor(width / 24));
    for (let i = 0; i < count; i += 1) {
      const spike = this.spikes.create(startX + i * 24 + 12, baselineY, "spike");
      spike.setOrigin(0.5, 1);
      spike.refreshBody();
    }
  }

  createCheckpoints() {
    const positions = [1200, 2400, 3600];
    const groundY = window.Platformer.CONFIG.PLATFORM.GROUND_Y;

    this.lastCheckpoint = { x: 100, y: 500 };

    positions.forEach((x) => {
      const checkpoint = this.checkpoints.create(x, groundY - 26, "checkpoint");
      checkpoint.setAlpha(0.55);
      checkpoint.activated = false;
      checkpoint.refreshBody();
    });
  }

  spawnCollectibles(rng) {
    const config = window.Platformer.CONFIG;
    const validSurfaces = this.platformSurfaces.filter((surface) => surface.type !== "ground");

    for (let i = 0; i < config.GAMEPLAY.COINS_PER_LEVEL; i += 1) {
      const surface = rng.pick(validSurfaces);
      const x = rng.realInRange(surface.x1 + 12, surface.x2 - 12);
      const y = surface.y - 18;
      const coin = this.coins.create(x, y, "coin");
      coin.body.setAllowGravity(false);
      coin.body.setImmovable(true);
      coin.setDepth(4);
    }

    for (let i = 0; i < config.GAMEPLAY.GEMS_PER_LEVEL; i += 1) {
      const surface = rng.pick(validSurfaces);
      const x = rng.realInRange(surface.x1 + 16, surface.x2 - 16);
      const y = surface.y - 24;
      const gem = this.gems.create(x, y, "gem");
      gem.body.setAllowGravity(false);
      gem.body.setImmovable(true);
      gem.setDepth(4);
    }
  }

  spawnEnemies(rng) {
    const walkSurfaces = this.platformSurfaces.filter((surface) => surface.type === "platform" && surface.x2 - surface.x1 > 90);
    const groundSurfaces = this.platformSurfaces.filter((surface) => surface.type === "ground" && surface.x2 - surface.x1 > 220);

    for (let i = 0; i < 10; i += 1) {
      const surface = rng.pick(walkSurfaces);
      const x = rng.realInRange(surface.x1 + 16, surface.x2 - 16);
      const enemy = this.enemies.create(x, surface.y - 14, "enemy-wanderer");
      enemy.enemyType = "wanderer";
      enemy.platformSurface = surface;
      enemy.baseSpeed = rng.between(65, 100) * this.speedMultiplier;
      enemy.setVelocityX(enemy.baseSpeed * (rng.frac() > 0.5 ? 1 : -1));
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(false);
    }

    for (let i = 0; i < 6; i += 1) {
      const surface = rng.pick(walkSurfaces);
      const x = rng.realInRange(surface.x1 + 16, surface.x2 - 16);
      const enemy = this.enemies.create(x, surface.y - 12, "enemy-jumper");
      enemy.enemyType = "jumper";
      enemy.platformSurface = surface;
      enemy.nextHop = this.time.now + rng.between(350, 900);
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(false);
    }

    for (let i = 0; i < 4; i += 1) {
      const surface = rng.pick(groundSurfaces);
      const x = rng.realInRange(surface.x1 + 20, surface.x2 - 20);
      const enemy = this.enemies.create(x, surface.y - 16, "enemy-spitter");
      enemy.enemyType = "spitter";
      enemy.setCollideWorldBounds(false);
      enemy.body.setAllowGravity(false);
      enemy.body.setImmovable(true);
      enemy.nextShot = this.time.now + rng.between(900, 2100);
    }
  }

  createPlayer() {
    this.player = this.physics.add.sprite(this.lastCheckpoint.x, this.lastCheckpoint.y, "player");
    this.player.body.setSize(24, 34, true);
    this.player.body.setOffset(4, 3);
    this.player.setDepth(10);
    this.player.setMaxVelocity(420, 1000);
    this.player.setDragX(1800);
    this.player.setCollideWorldBounds(false);

    this.scarfParticles = this.add.particles(0, 0, "pixel", {
      lifespan: 220,
      speedX: { min: -30, max: 30 },
      speedY: { min: -6, max: 20 },
      scale: { start: 1.9, end: 0.1 },
      alpha: { start: 0.8, end: 0.0 },
      tint: window.Platformer.CONFIG.COLORS.ACCENT,
      quantity: 0
    });
    this.scarfParticles.setDepth(8);
  }

  createColliders() {
    this.physics.add.collider(this.player, this.grounds);
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.movingPlatforms);
    this.physics.add.collider(
      this.player,
      this.oneWayPlatforms,
      null,
      (player, platform) => {
        const body = player.body;
        const platformBody = platform.body;
        if (!body || !platformBody) {
          return false;
        }
        if (body.velocity.y < 0) {
          return false;
        }
        return body.bottom <= platformBody.top + 8;
      }
    );

    this.physics.add.collider(this.enemies, this.grounds);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.movingPlatforms);

    this.physics.add.collider(this.enemyProjectiles, this.grounds, (projectile) => projectile.destroy());
    this.physics.add.collider(this.enemyProjectiles, this.platforms, (projectile) => projectile.destroy());

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.gems, this.collectGem, null, this);
    this.physics.add.overlap(this.player, this.spikes, () => this.hurtPlayer("spike"), null, this);
    this.physics.add.overlap(this.player, this.checkpoints, this.activateCheckpoint, null, this);
    this.physics.add.overlap(this.player, this.flagPole, this.completeLevel, null, this);
    this.physics.add.overlap(this.player, this.enemyProjectiles, this.hitProjectile, null, this);

    this.physics.add.collider(this.player, this.enemies, this.handleEnemyCollision, null, this);
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jumpW: Phaser.Input.Keyboard.KeyCodes.W,
      jumpSpace: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    const jumpKeys = [this.cursors.up, this.cursors.space, this.keys.jumpW, this.keys.jumpSpace];
    jumpKeys.forEach((key) => key.on("down", () => {
      this.lastJumpPressedTime = this.time.now;
      this.audio.jump();
    }));
  }

  update(time, delta) {
    if (!this.player || !this.player.body) {
      return;
    }

    this.updateZoneTint();
    this.updateMovingPlatforms();
    this.updateEnemies(time);
    this.updateProjectiles(time);

    if (!this.playerDisabled) {
      this.updatePlayerMovement(time);
    }

    if (this.player.y > window.Platformer.CONFIG.GAME.WORLD_HEIGHT + 120) {
      this.hurtPlayer("pit");
    }

    const movingHorizontally = Math.abs(this.player.body.velocity.x) > 25;
    if (movingHorizontally) {
      const trailX = this.player.x - this.playerFacing * 10;
      this.scarfParticles.emitParticleAt(trailX, this.player.y + 6, 1);
    }

    const invulnerable = time < this.invulnerableUntil;
    if (invulnerable) {
      this.player.setAlpha(Math.sin(time * 0.04) > 0 ? 0.35 : 1);
    } else {
      this.player.setAlpha(1);
    }

    this.player.flipX = this.playerFacing < 0;
  }

  updatePlayerMovement(time) {
    const config = window.Platformer.CONFIG;
    const body = this.player.body;
    const leftPressed = this.cursors.left.isDown || this.keys.left.isDown;
    const rightPressed = this.cursors.right.isDown || this.keys.right.isDown;
    const onGround = body.blocked.down || body.touching.down;

    if (leftPressed && !rightPressed) {
      body.setVelocityX(-config.PLAYER.MOVE_SPEED);
      this.playerFacing = -1;
    } else if (rightPressed && !leftPressed) {
      body.setVelocityX(config.PLAYER.MOVE_SPEED);
      this.playerFacing = 1;
    } else {
      body.setVelocityX(0);
    }

    if (onGround) {
      if (!this.wasOnGround && body.velocity.y > 20) {
        this.audio.land();
      }
      this.lastGroundedTime = time;
      this.jumpsUsed = 0;
    }

    const onWall = (body.blocked.left || body.blocked.right) && !onGround;
    const wallSliding = onWall && body.velocity.y > 0;
    if (wallSliding && body.velocity.y > config.PLAYER.WALL_SLIDE_SPEED) {
      body.setVelocityY(config.PLAYER.WALL_SLIDE_SPEED);
    }

    const jumpBuffered = time - this.lastJumpPressedTime <= config.PLAYER.JUMP_BUFFER_MS;
    if (jumpBuffered) {
      const withinCoyote = time - this.lastGroundedTime <= config.PLAYER.COYOTE_MS;
      const doubleJumpUnlocked = !!this.registry.get("doubleJumpUnlocked");

      if (onGround || (withinCoyote && this.jumpsUsed === 0)) {
        body.setVelocityY(config.PLAYER.JUMP_VELOCITY);
        this.jumpsUsed = 1;
        this.lastJumpPressedTime = -9999;
      } else if (wallSliding) {
        const push = body.blocked.left ? 1 : -1;
        body.setVelocityX(config.PLAYER.WALL_JUMP_X * push);
        body.setVelocityY(config.PLAYER.WALL_JUMP_Y);
        this.jumpsUsed = 1;
        this.lastJumpPressedTime = -9999;
      } else if (doubleJumpUnlocked && this.jumpsUsed < 2) {
        body.setVelocityY(config.PLAYER.JUMP_VELOCITY);
        this.jumpsUsed += 1;
        this.lastJumpPressedTime = -9999;
      }
    }

    this.wasOnGround = onGround;
  }

  updateMovingPlatforms() {
    this.movingPlatforms.children.iterate((platform) => {
      if (!platform || !platform.active) {
        return;
      }
      if (platform.x <= platform.minX) {
        platform.body.setVelocityX(Math.abs(platform.moveSpeed));
      } else if (platform.x >= platform.maxX) {
        platform.body.setVelocityX(-Math.abs(platform.moveSpeed));
      }
    });
  }

  updateEnemies(time) {
    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.active) {
        return;
      }

      if (enemy.y > 720) {
        enemy.destroy();
        return;
      }

      if (enemy.enemyType === "wanderer") {
        const surface = enemy.platformSurface;
        if (surface) {
          const margin = 12;
          if (enemy.x <= surface.x1 + margin) {
            enemy.setVelocityX(Math.abs(enemy.baseSpeed));
          } else if (enemy.x >= surface.x2 - margin) {
            enemy.setVelocityX(-Math.abs(enemy.baseSpeed));
          }
        }
        if (enemy.body.blocked.left) {
          enemy.setVelocityX(Math.abs(enemy.baseSpeed));
        } else if (enemy.body.blocked.right) {
          enemy.setVelocityX(-Math.abs(enemy.baseSpeed));
        }
      } else if (enemy.enemyType === "jumper") {
        if (time >= enemy.nextHop) {
          const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
          if (distance <= 200 && enemy.body.blocked.down) {
            const dir = Math.sign(this.player.x - enemy.x) || 1;
            enemy.setVelocityX(dir * 145 * this.speedMultiplier);
            enemy.setVelocityY(-420);
          }
          enemy.nextHop = time + Phaser.Math.Between(760, 1200);
        }
      } else if (enemy.enemyType === "spitter") {
        enemy.setVelocity(0, 0);
        if (time >= enemy.nextShot && Math.abs(this.player.x - enemy.x) < 420) {
          this.fireProjectile(enemy);
          enemy.nextShot = time + window.Platformer.CONFIG.GAMEPLAY.ENEMY_PROJECTILE_COOLDOWN;
        }
      }
    });
  }

  fireProjectile(enemy) {
    const projectile = this.enemyProjectiles.create(enemy.x, enemy.y - 4, "projectile");
    projectile.body.setAllowGravity(false);
    projectile.body.setCircle(6);
    const direction = new Phaser.Math.Vector2(this.player.x - enemy.x, this.player.y - enemy.y).normalize();
    const speed = 220 * this.speedMultiplier;
    projectile.setVelocity(direction.x * speed, direction.y * speed);
    projectile.spawnTime = this.time.now;
  }

  updateProjectiles(time) {
    this.enemyProjectiles.children.iterate((projectile) => {
      if (!projectile || !projectile.active) {
        return;
      }
      if (time - projectile.spawnTime > 3400) {
        projectile.destroy();
      }
    });
  }

  updateZoneTint() {
    const config = window.Platformer.CONFIG;
    const x = this.cameras.main.midPoint.x;
    let nextZone = 0;
    if (x >= config.ZONES[2].x) {
      nextZone = 2;
    } else if (x >= config.ZONES[1].x) {
      nextZone = 1;
    }

    if (nextZone !== this.currentZone) {
      this.currentZone = nextZone;
      const zone = config.ZONES[nextZone];
      this.zoneOverlay.setFillStyle(zone.tint, zone.alpha);
      this.cameras.main.setBackgroundColor(zone.background);
    }
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    this.audio.coin();
    this.addScore(window.Platformer.CONFIG.GAMEPLAY.COIN_SCORE);

    const totalCoins = (this.registry.get("coins") || 0) + 1;
    this.registry.set("coins", totalCoins);

    if (totalCoins >= 10 && !this.registry.get("doubleJumpUnlocked")) {
      this.registry.set("doubleJumpUnlocked", true);
      this.flashMessage("DOUBLE JUMP UNLOCKED!", "#e94560", 1050);
    }
  }

  collectGem(player, gem) {
    gem.disableBody(true, true);
    this.audio.gem();
    this.addScore(window.Platformer.CONFIG.GAMEPLAY.GEM_SCORE);
    this.sparkle(gem.x, gem.y, window.Platformer.CONFIG.COLORS.GEM);
  }

  sparkle(x, y, tint) {
    const particles = this.add.particles(0, 0, "pixel", {
      lifespan: 420,
      speed: { min: 30, max: 170 },
      scale: { start: 1.7, end: 0.0 },
      alpha: { start: 1, end: 0 },
      tint,
      quantity: 0
    });
    particles.explode(22, x, y);
    this.time.delayedCall(500, () => particles.destroy());
  }

  activateCheckpoint(player, checkpoint) {
    if (checkpoint.activated) {
      return;
    }
    checkpoint.activated = true;
    checkpoint.setTint(window.Platformer.CONFIG.COLORS.ACCENT);
    checkpoint.setAlpha(1);
    this.lastCheckpoint = { x: checkpoint.x, y: checkpoint.y - 48 };
    this.flashMessage("CHECKPOINT", "#ffffff", 700);
  }

  handleEnemyCollision(player, enemy) {
    if (this.playerDisabled || !enemy.active) {
      return;
    }

    const fromAbove = player.body.velocity.y > 60 && player.body.bottom <= enemy.body.top + 12;
    if (fromAbove) {
      enemy.disableBody(true, true);
      player.body.setVelocityY(-300);
      this.audio.stomp();
      this.addScore(window.Platformer.CONFIG.GAMEPLAY.STOMP_SCORE);
      this.sparkle(enemy.x, enemy.y, 0xff9955);
      return;
    }

    this.hurtPlayer("enemy");
  }

  hitProjectile(player, projectile) {
    projectile.destroy();
    this.hurtPlayer("projectile");
  }

  hurtPlayer() {
    if (this.isTransitioning || this.playerDisabled || this.time.now < this.invulnerableUntil) {
      return;
    }

    const lives = Math.max(0, (this.registry.get("lives") || 0) - 1);
    this.registry.set("lives", lives);
    this.audio.hurt();

    this.playerDisabled = true;
    this.player.setVisible(false);
    this.player.body.stop();
    this.player.body.enable = false;

    if (lives <= 0) {
      this.time.delayedCall(450, () => this.gameOver());
      return;
    }

    this.time.delayedCall(320, () => this.respawnPlayer());
  }

  respawnPlayer() {
    this.player.setPosition(this.lastCheckpoint.x, this.lastCheckpoint.y);
    this.player.setVisible(true);
    this.player.body.enable = true;
    this.player.body.stop();
    this.playerDisabled = false;
    this.invulnerableUntil = this.time.now + 1100;
    this.lastGroundedTime = this.time.now;
    this.jumpsUsed = 0;
  }

  completeLevel() {
    if (this.isTransitioning) {
      return;
    }

    this.isTransitioning = true;
    this.playerDisabled = true;
    this.player.body.stop();
    this.player.body.enable = false;

    this.audio.levelClear();
    this.addScore(500 * this.displayLevel);
    this.flashMessage(`LEVEL ${this.displayLevel} CLEAR!`, "#00bcd4", 1200);

    this.time.delayedCall(1200, () => {
      this.registry.set("level", this.level + 1);
      this.scene.restart();
    });
  }

  gameOver() {
    this.audio.gameOver();
    const score = this.registry.get("score") || 0;
    this.scene.stop("HUDScene");
    this.scene.start("GameOverScene", {
      score,
      highScore: window.Platformer.HIGH_SCORE
    });
  }

  addScore(amount) {
    const config = window.Platformer.CONFIG;
    const nextScore = (this.registry.get("score") || 0) + amount;
    this.registry.set("score", nextScore);

    if (nextScore > window.Platformer.HIGH_SCORE) {
      window.Platformer.HIGH_SCORE = nextScore;
      try {
        localStorage.setItem(config.STORAGE.HIGH_SCORE_KEY, String(nextScore));
      } catch (error) {
        // Ignore storage errors in restricted environments.
      }
    }
  }

  flashMessage(text, color, duration = 900) {
    const msg = this.add.text(window.Platformer.CONFIG.GAME.WIDTH * 0.5, 100, text, {
      fontFamily: "Verdana, Arial, sans-serif",
      fontSize: "24px",
      fontStyle: "bold",
      color
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      y: 74,
      duration,
      ease: "Cubic.easeOut",
      onComplete: () => msg.destroy()
    });
  }
}
