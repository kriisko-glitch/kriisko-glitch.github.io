(function() {
  var SCENE = {
    TILE_INDEX_FLOOR: 1,
    TILE_INDEX_WALL: 2,
    TILE_INDEX_STAIRS: 3,
    FLOOR_SIZE_GROWTH_EVERY: 2,
    ROOM_PLACEMENT_ATTEMPTS: 50,
    CORRIDOR_ORDER_XY: 'XY',
    PLAYER_ARC_ALPHA: 0.72,
    PLAYER_ARC_SCALE: 1.2,
    PLAYER_ARC_DURATION_MS: 120,
    PLAYER_DAMAGE_FLICKER_REPEATS: 4,
    PLAYER_DAMAGE_FLICKER_ALPHA: 0.4,
    PET_BOB_PIXELS: 3,
    PET_BOB_MS: 920,
    PET_CLOSE_FOLLOW_FACTOR: 0.62,
    PET_IDLE_MS: 760,
    PET_ATTACK_RANGE: 82,
    PET_PICKUP_RANGE: 18,
    PET_ENEMY_NEARBY_DIST: 100,
    PET_ITEM_SCAN_DIST: 160,
    PET_ENEMY_ATTACK_DIST: 60,
    PET_CHAT_MAX_CHARS: 140,
    SCRIPTED_EMOTE_CHANCE: 0.3,
    LOW_HP_RATIO: 0.3,
    LOOKUP_RADIUS_ENEMIES: 200,
    LOOKUP_RADIUS_ITEMS: 200,
    THINK_ORBIT_RADIUS: 9,
    THINK_OFFSET_Y: 30,
    SPEECH_OFFSET_Y: 26,
    FLOOR_FADE_MS: 320,
    GAMEOVER_FADE_MS: 450,
    GAMEOVER_FADE_R: 140,
    GAMEOVER_FADE_G: 22,
    GAMEOVER_FADE_B: 22,
    ENEMY_SPAWN_PER_ROOM_MIN: 1,
    ENEMY_SPAWN_PER_ROOM_MAX: 3,
    ITEM_SPAWN_PER_ROOM_MIN: 1,
    ITEM_SPAWN_PER_ROOM_MAX: 3,
    ITEM_LIGHT_BASE_INTENSITY: 0.14,
    ITEM_LIGHT_NEAR_INTENSITY: 0.78,
    ITEM_LIGHT_NEAR_DIST: 120,
    ENEMY_HIT_TINT_MS: 85,
    ATTACK_KNOCKBACK_SPEED: 120,
    XP_ORB_FLOAT_PIXELS: 6,
    XP_ORB_FLOAT_MS: 500,
    LEVELUP_ZOOM_TO: 1.15,
    LEVELUP_ZOOM_MS: 180,
    CHAT_SPEECH_PARTICLES: 6,
    ENEMY_DEATH_PARTICLES: 14,
    ITEM_PICKUP_PARTICLES: 12,
    PLAYER_HIT_PARTICLES: 10,
    LEVELUP_PARTICLES: 18,
    TORCH_SPARK_FREQ_MS: 140,
    TORCH_SPARK_LIFESPAN_MS: 460,
    TORCH_SPARK_SPEED_MIN: 14,
    TORCH_SPARK_SPEED_MAX: 30,
    DUST_FREQ_MS: 220,
    DUST_SPEED_MIN: -4,
    DUST_SPEED_MAX: 4,
    DUST_ALPHA_START: 0.16,
    DUST_ALPHA_END: 0,
    DUST_SCALE_MIN: 0.35,
    DUST_SCALE_MAX: 0.92
  };

  function GameScene() {
    Phaser.Scene.call(this, { key: 'GameScene' });

    this.petName = 'Pip';
    this.floor = 1;
    this.score = 0;

    this.cols = CONFIG.TILE.BASE_COLS;
    this.rows = CONFIG.TILE.BASE_ROWS;
    this.gridData = [];
    this.rooms = [];
    this.entranceRoom = null;
    this.exitRoom = null;
    this.worldWidthPx = CONFIG.GAME.WIDTH;
    this.worldHeightPx = CONFIG.GAME.HEIGHT;

    this.map = null;
    this.worldLayer = null;

    this.player = null;
    this.pet = null;
    this.playerLight = null;
    this.petLight = null;
    this.stairsZone = null;
    this.stairsLight = null;
    this.stairsPulseTween = null;
    this.stairsActive = false;
    this.stairsPos = { x: 0, y: 0 };

    this.playerHP = CONFIG.PLAYER.HP_MAX;
    this.playerMaxHP = CONFIG.PLAYER.HP_MAX;
    this.playerInvincibleUntil = 0;
    this.lastAttackAt = 0;
    this.facing = new Phaser.Math.Vector2(1, 0);

    this.petXP = CONFIG.PET.START_XP;
    this.petLevel = CONFIG.PET.START_LEVEL;
    this.petHP = CONFIG.PET.BASE_HP;
    this.petMaxHP = CONFIG.PET.BASE_HP;
    this.petScaleBase = 1;
    this.petHealReadyAt = 0;
    this.petPowerBuffUntil = 0;
    this.petFollowCloseUntil = 0;

    this.petActionQueue = [];
    this.currentPetAction = null;
    this.petLungeHome = null;

    this.petSpeechText = null;
    this.speechHideTimer = null;
    this.thinkingActive = false;
    this.thinkingOrbitAngle = 0;

    this.enemies = null;
    this.items = null;
    this.xpOrbs = null;
    this.enemiesAlive = 0;

    this.keys = null;

    this.hudTimer = null;
    this.brainTimer = null;
    this.lastPlayerMessage = '';
    this.brainRequestPending = false;
    this.isFloorTransitioning = false;
    this.isGameOver = false;
    this.sceneAlive = false;

    this.enemyDeathEmitter = null;
    this.itemPickupEmitter = null;
    this.playerHitEmitter = null;
    this.levelUpCyanEmitter = null;
    this.levelUpGoldEmitter = null;
    this.thinkingEmitter = null;
    this.speechEmitter = null;
    this.ambientDustEmitter = null;
    this.torchSparkEmitter = null;

    this.pendingPetHealCooldown = 0;
    this.pendingPetPowerBuff = 0;

    this.onChatPlayerMessage = null;
  }

  GameScene.prototype = Object.create(Phaser.Scene.prototype);
  GameScene.prototype.constructor = GameScene;

  GameScene.prototype.init = function(data) {
    var payload = data || {};
    this.petName = payload.petName || 'Pip';
    this.floor = Math.max(1, payload.floor || 1);
    this.score = Math.max(0, payload.score || 0);

    var xpFromHash = CONFIG.Helpers.loadPersistedPetXP();
    if (typeof payload.petXP === 'number') {
      this.petXP = Math.max(0, Math.round(payload.petXP));
    } else {
      this.petXP = Math.max(0, Math.round(xpFromHash));
    }
    this.petLevel = this.calculatePetLevel(this.petXP);
    this.petMaxHP = this.calculatePetMaxHP(this.petLevel);
    this.playerMaxHP = CONFIG.PLAYER.HP_MAX;
    this.playerHP = CONFIG.Helpers.clamp(
      (typeof payload.playerHP === 'number') ? payload.playerHP : this.playerMaxHP,
      0,
      this.playerMaxHP
    );
    this.petHP = CONFIG.Helpers.clamp(
      (typeof payload.petHP === 'number') ? payload.petHP : this.petMaxHP,
      0,
      this.petMaxHP
    );

    this.petScaleBase = 1 + (this.petLevel - CONFIG.PET.START_LEVEL) * CONFIG.PET.LEVEL_SCALE_STEP;

    this.pendingPetHealCooldown = Math.max(0, payload.petHealCooldownRemaining || 0);
    this.pendingPetPowerBuff = Math.max(0, payload.petPowerBuffRemaining || 0);

    this.playerInvincibleUntil = 0;
    this.lastAttackAt = 0;
    this.lastPlayerMessage = '';
    this.brainRequestPending = false;
    this.isFloorTransitioning = false;
    this.isGameOver = false;
    this.sceneAlive = false;
    this.petFollowCloseUntil = 0;
    this.petActionQueue = [];
    this.currentPetAction = null;
    this.enemiesAlive = 0;
  };

  GameScene.prototype.create = function() {
    this.sceneAlive = true;

    CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.HUD_SHOW);
    CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.AI_STATUS, !!GeminiService.online);

    this.cameras.main.setBackgroundColor(CONFIG.COLORS.BG_DARK);

    this.lights.enable().setAmbientColor(CONFIG.VISUAL.AMBIENT_LIGHT);

    this.generateDungeonData();
    this.buildTilemap();
    this.createActors();
    this.createGroupsAndSpawns();
    this.createParticles();
    this.createInput();
    this.createPhysics();
    this.createSpeechBubble();
    this.createTimers();
    this.setupCamera();
    this.setupChatListener();

    this.petHealReadyAt = this.time.now + this.pendingPetHealCooldown;
    this.petPowerBuffUntil = this.time.now + this.pendingPetPowerBuff;

    this.emitHudUpdate();
    if (this.enemiesAlive <= 0) {
      this.activateStairs();
    }

    this.events.once('shutdown', this.shutdown, this);
    var scene = this;
    this.moveDir = { x: 0, y: 0 };
    function sendPetCommand(text) {
      scene.lastPlayerMessage = text;
      scene.runLLMBrain('command');
    }

    var cmdFollow = document.getElementById('cmd-follow');
    var cmdAttack = document.getElementById('cmd-attack');
    var cmdWait = document.getElementById('cmd-wait');

    function bindCommandButton(el, text) {
      if (!el) {
        return;
      }
      el.onclick = function() {
        sendPetCommand(text);
      };
      el.ontouchend = function(e) {
        e.preventDefault();
        sendPetCommand(text);
      };
    }

    bindCommandButton(cmdFollow, 'follow me');
    bindCommandButton(cmdAttack, 'attack the nearest enemy');
    bindCommandButton(cmdWait, 'wait here and stay');

    window.__gameAPI = {
      moveLeft: function() { scene.moveDir.x = -1; },
      moveRight: function() { scene.moveDir.x = 1; },
      moveUp: function() { scene.moveDir.y = -1; },
      moveDown: function() { scene.moveDir.y = 1; },
      stopX: function() { scene.moveDir.x = 0; },
      stopY: function() { scene.moveDir.y = 0; },
      attack: function() { scene.playerAttack(); scene.petAttackNearby(); },
      petFollow: function() { sendPetCommand('follow me'); },
      petAttack: function() { sendPetCommand('attack nearest'); },
      petWait: function() { sendPetCommand('wait here'); }
    };
    this.events.once('destroy', this.shutdown, this);
  };

  GameScene.prototype.generateDungeonData = function() {
    var growthSteps = Math.floor((this.floor - 1) / SCENE.FLOOR_SIZE_GROWTH_EVERY);
    this.cols = CONFIG.Helpers.clamp(CONFIG.TILE.BASE_COLS + growthSteps, CONFIG.TILE.MIN_COLS, CONFIG.TILE.MAX_COLS);
    this.rows = CONFIG.Helpers.clamp(CONFIG.TILE.BASE_ROWS + growthSteps, CONFIG.TILE.MIN_ROWS, CONFIG.TILE.MAX_ROWS);

    var x;
    var y;
    this.gridData = [];
    for (y = 0; y < this.rows; y += 1) {
      var row = [];
      for (x = 0; x < this.cols; x += 1) {
        row.push(SCENE.TILE_INDEX_WALL);
      }
      this.gridData.push(row);
    }

    var targetRooms = CONFIG.Helpers.randRangeInt(CONFIG.TILE.ROOMS_MIN, CONFIG.TILE.ROOMS_MAX);
    var attempts = targetRooms * SCENE.ROOM_PLACEMENT_ATTEMPTS;
    this.rooms = [];

    while (this.rooms.length < targetRooms && attempts > 0) {
      attempts -= 1;
      var roomW = CONFIG.Helpers.randRangeInt(CONFIG.TILE.ROOM_MIN_W, CONFIG.TILE.ROOM_MAX_W);
      var roomH = CONFIG.Helpers.randRangeInt(CONFIG.TILE.ROOM_MIN_H, CONFIG.TILE.ROOM_MAX_H);
      var roomX = CONFIG.Helpers.randRangeInt(1, this.cols - roomW - 2);
      var roomY = CONFIG.Helpers.randRangeInt(1, this.rows - roomH - 2);
      var candidate = {
        x: roomX,
        y: roomY,
        w: roomW,
        h: roomH
      };
      if (!this.roomOverlaps(candidate)) {
        this.carveRoom(candidate);
        candidate.cx = candidate.x + Math.floor(candidate.w / 2);
        candidate.cy = candidate.y + Math.floor(candidate.h / 2);
        this.rooms.push(candidate);
      }
    }

    if (this.rooms.length < 2) {
      this.forceFallbackRooms();
    }

    this.connectRooms();

    this.entranceRoom = this.rooms[0];
    this.exitRoom = this.rooms[this.rooms.length - 1];
    this.gridData[this.exitRoom.cy][this.exitRoom.cx] = SCENE.TILE_INDEX_STAIRS;

    this.worldWidthPx = this.cols * CONFIG.TILE.SIZE;
    this.worldHeightPx = this.rows * CONFIG.TILE.SIZE;
    this.stairsPos.x = this.exitRoom.cx * CONFIG.TILE.SIZE + (CONFIG.TILE.SIZE * 0.5);
    this.stairsPos.y = this.exitRoom.cy * CONFIG.TILE.SIZE + (CONFIG.TILE.SIZE * 0.5);
  };

  GameScene.prototype.roomOverlaps = function(candidate) {
    var i;
    var pad = CONFIG.TILE.ROOM_PADDING;
    for (i = 0; i < this.rooms.length; i += 1) {
      var r = this.rooms[i];
      if (
        candidate.x - pad <= r.x + r.w &&
        candidate.x + candidate.w + pad >= r.x &&
        candidate.y - pad <= r.y + r.h &&
        candidate.y + candidate.h + pad >= r.y
      ) {
        return true;
      }
    }
    return false;
  };

  GameScene.prototype.carveRoom = function(room) {
    var x;
    var y;
    for (y = room.y; y < room.y + room.h; y += 1) {
      for (x = room.x; x < room.x + room.w; x += 1) {
        this.gridData[y][x] = SCENE.TILE_INDEX_FLOOR;
      }
    }
  };

  GameScene.prototype.forceFallbackRooms = function() {
    var w = CONFIG.TILE.ROOM_MIN_W + 1;
    var h = CONFIG.TILE.ROOM_MIN_H + 1;
    var left = { x: 2, y: 2, w: w, h: h };
    var right = { x: this.cols - w - 3, y: this.rows - h - 3, w: w, h: h };
    this.rooms = [left, right];
    this.carveRoom(left);
    this.carveRoom(right);
    left.cx = left.x + Math.floor(left.w / 2);
    left.cy = left.y + Math.floor(left.h / 2);
    right.cx = right.x + Math.floor(right.w / 2);
    right.cy = right.y + Math.floor(right.h / 2);
  };

  GameScene.prototype.connectRooms = function() {
    var i;
    for (i = 1; i < this.rooms.length; i += 1) {
      var prev = this.rooms[i - 1];
      var curr = this.rooms[i];
      this.carveCorridor(prev.cx, prev.cy, curr.cx, curr.cy, SCENE.CORRIDOR_ORDER_XY);
    }
  };

  GameScene.prototype.carveCorridor = function(x1, y1, x2, y2, order) {
    var x;
    var y;
    if (order === SCENE.CORRIDOR_ORDER_XY) {
      var minX = Math.min(x1, x2);
      var maxX = Math.max(x1, x2);
      for (x = minX; x <= maxX; x += 1) {
        this.gridData[y1][x] = SCENE.TILE_INDEX_FLOOR;
      }
      var minY = Math.min(y1, y2);
      var maxY = Math.max(y1, y2);
      for (y = minY; y <= maxY; y += 1) {
        this.gridData[y][x2] = SCENE.TILE_INDEX_FLOOR;
      }
      return;
    }

    var minY2 = Math.min(y1, y2);
    var maxY2 = Math.max(y1, y2);
    for (y = minY2; y <= maxY2; y += 1) {
      this.gridData[y][x1] = SCENE.TILE_INDEX_FLOOR;
    }
    var minX2 = Math.min(x1, x2);
    var maxX2 = Math.max(x1, x2);
    for (x = minX2; x <= maxX2; x += 1) {
      this.gridData[y2][x] = SCENE.TILE_INDEX_FLOOR;
    }
  };

  GameScene.prototype.buildTilemap = function() {
    this.map = this.make.tilemap({
      data: this.gridData,
      tileWidth: CONFIG.TILE.SIZE,
      tileHeight: CONFIG.TILE.SIZE
    });

    var floorSet = this.map.addTilesetImage('tile-floor', 'tile-floor', CONFIG.TILE.SIZE, CONFIG.TILE.SIZE, 0, 0, SCENE.TILE_INDEX_FLOOR);
    var wallSet = this.map.addTilesetImage('tile-wall', 'tile-wall', CONFIG.TILE.SIZE, CONFIG.TILE.SIZE, 0, 0, SCENE.TILE_INDEX_WALL);
    var stairsSet = this.map.addTilesetImage('tile-stairs', 'tile-stairs', CONFIG.TILE.SIZE, CONFIG.TILE.SIZE, 0, 0, SCENE.TILE_INDEX_STAIRS);

    this.worldLayer = this.map.createLayer(0, [floorSet, wallSet, stairsSet], 0, 0);
    this.worldLayer.setCollision([SCENE.TILE_INDEX_WALL]);
    this.worldLayer.setPipeline('Light2D');

    this.physics.world.setBounds(0, 0, this.worldWidthPx, this.worldHeightPx);
  };

  GameScene.prototype.createActors = function() {
    var entranceX = this.entranceRoom.cx * CONFIG.TILE.SIZE + (CONFIG.TILE.SIZE * 0.5);
    var entranceY = this.entranceRoom.cy * CONFIG.TILE.SIZE + (CONFIG.TILE.SIZE * 0.5);

    this.player = this.physics.add.sprite(entranceX, entranceY, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(24, 32);
    this.player.setPipeline('Light2D');

    this.pet = this.physics.add.sprite(entranceX - CONFIG.PET.FOLLOW_MIN_DISTANCE, entranceY, 'pet');
    this.pet.setCollideWorldBounds(true);
    this.pet.body.setSize(20, 24);
    this.pet.setScale(this.petScaleBase);
    this.pet.setPipeline('Light2D');
    this.pet.setInteractive({ useHandCursor: true });
    this.pet.on('pointerdown', function() {
      CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.CHAT_FOCUS);
    });

    this.tweens.add({
      targets: this.pet,
      y: this.pet.y - SCENE.PET_BOB_PIXELS,
      duration: SCENE.PET_BOB_MS,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.playerLight = this.lights.addLight(
      this.player.x,
      this.player.y,
      CONFIG.PLAYER.LIGHT_RADIUS,
      CONFIG.PLAYER.LIGHT_COLOR,
      CONFIG.PLAYER.LIGHT_INTENSITY
    );
    this.petLight = this.lights.addLight(
      this.pet.x,
      this.pet.y,
      CONFIG.PET.LIGHT_RADIUS,
      CONFIG.PET.LIGHT_COLOR,
      CONFIG.PET.LIGHT_INTENSITY
    );
    this.stairsLight = this.lights.addLight(
      this.stairsPos.x,
      this.stairsPos.y,
      CONFIG.WORLD.EXIT_ACTIVATE_GLOW_RADIUS,
      CONFIG.COLORS.STAIRS,
      CONFIG.VISUAL.EXIT_PULSE_MIN * 0.15
    );

    this.tweens.add({
      targets: this.playerLight,
      radius: { from: CONFIG.PLAYER.FLICKER_MIN, to: CONFIG.PLAYER.FLICKER_MAX },
      duration: 140,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.stairsZone = this.add.zone(this.stairsPos.x, this.stairsPos.y, CONFIG.TILE.SIZE, CONFIG.TILE.SIZE);
    this.physics.add.existing(this.stairsZone, true);
  };

  GameScene.prototype.createGroupsAndSpawns = function() {
    this.enemies = this.physics.add.group();
    this.items = this.physics.add.group();
    this.xpOrbs = this.physics.add.group();

    this.spawnEnemies();
    this.spawnItems();
  };

  GameScene.prototype.spawnEnemies = function() {
    var i;
    for (i = 1; i < this.rooms.length; i += 1) {
      this.spawnEnemiesForRoom(this.rooms[i]);
    }
  };

  GameScene.prototype.spawnEnemiesForRoom = function(room) {
    var baseCountCap = CONFIG.Helpers.clamp(
      SCENE.ENEMY_SPAWN_PER_ROOM_MIN + Math.floor((this.floor - 1) / 2),
      SCENE.ENEMY_SPAWN_PER_ROOM_MIN,
      SCENE.ENEMY_SPAWN_PER_ROOM_MAX
    );
    var count = CONFIG.Helpers.randRangeInt(SCENE.ENEMY_SPAWN_PER_ROOM_MIN, baseCountCap);
    var i;
    for (i = 0; i < count; i += 1) {
      var enemyConfig = this.pickEnemyConfigForFloor();
      var pos = this.pickPointInRoom(room);
      var enemy = this.enemies.create(pos.x, pos.y, enemyConfig.key);
      enemy.setCollideWorldBounds(true);
      enemy.body.setSize(enemy.width * 0.7, enemy.height * 0.7);
      enemy.setPipeline('Light2D');

      var scaledHP = Math.max(1, Math.round(enemyConfig.hp * (1 + this.floor * CONFIG.WORLD.FLOOR_HP_SCALE)));
      var scaledDamage = Math.max(1, Math.round(enemyConfig.damage + this.floor * CONFIG.WORLD.FLOOR_DAMAGE_SCALE));
      enemy.setData('hp', scaledHP);
      enemy.setData('maxHp', scaledHP);
      enemy.setData('damage', scaledDamage);
      enemy.setData('speed', enemyConfig.speed);
      enemy.setData('aggro', enemyConfig.aggro);
      enemy.setData('xp', enemyConfig.xp);
      enemy.setData('color', enemyConfig.color);
      enemy.setData('typeKey', enemyConfig.key);
      enemy.setData('defense', 0);
      enemy.setData('state', 'PATROL');
      enemy.setData('room', room);
      enemy.setData('nextPatrolAt', 0);
      enemy.setData('lastContactAt', 0);
      enemy.setData('patrolTarget', this.pickPointInRoom(room));

      this.enemiesAlive += 1;
    }
  };

  GameScene.prototype.pickEnemyConfigForFloor = function() {
    var options = [CONFIG.ENEMIES.SLIME, CONFIG.ENEMIES.SKELETON];
    if (this.floor >= CONFIG.ENEMIES.WRAITH.appearsAt) {
      options.push(CONFIG.ENEMIES.WRAITH);
    }
    return CONFIG.Helpers.pickRandom(options);
  };

  GameScene.prototype.spawnItems = function() {
    var i;
    for (i = 1; i < this.rooms.length; i += 1) {
      this.spawnItemsForRoom(this.rooms[i]);
    }
  };

  GameScene.prototype.spawnItemsForRoom = function(room) {
    var count = CONFIG.Helpers.randRangeInt(SCENE.ITEM_SPAWN_PER_ROOM_MIN, SCENE.ITEM_SPAWN_PER_ROOM_MAX);
    var i;
    for (i = 0; i < count; i += 1) {
      var itemDef = this.pickWeightedItem();
      var pos = this.pickPointInRoom(room);
      var item = this.items.create(pos.x, pos.y, itemDef.key);
      item.body.setAllowGravity(false);
      item.setImmovable(true);
      item.setPipeline('Light2D');
      item.setData('itemType', itemDef.type);
      item.setData('weight', itemDef.weight);
      item.itemLight = this.lights.addLight(
        pos.x,
        pos.y,
        CONFIG.ITEMS.PICKUP_LIGHT_RADIUS,
        CONFIG.COLORS.GOLD,
        SCENE.ITEM_LIGHT_BASE_INTENSITY
      );
      this.tweens.add({
        targets: item,
        y: item.y - 2,
        duration: 780,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  };

  GameScene.prototype.pickWeightedItem = function() {
    var pool = [
      CONFIG.ITEMS.HEALTH_POTION,
      CONFIG.ITEMS.PET_TREAT,
      CONFIG.ITEMS.COIN,
      CONFIG.ITEMS.POWER_CRYSTAL
    ];
    var total = 0;
    var i;
    for (i = 0; i < pool.length; i += 1) {
      total += pool[i].weight;
    }
    var roll = Math.random() * total;
    var cursor = 0;
    for (i = 0; i < pool.length; i += 1) {
      cursor += pool[i].weight;
      if (roll <= cursor) {
        return pool[i];
      }
    }
    return CONFIG.ITEMS.COIN;
  };

  GameScene.prototype.pickPointInRoom = function(room) {
    var tx = CONFIG.Helpers.randRangeInt(room.x + 1, room.x + room.w - 2);
    var ty = CONFIG.Helpers.randRangeInt(room.y + 1, room.y + room.h - 2);
    return {
      x: tx * CONFIG.TILE.SIZE + (CONFIG.TILE.SIZE * 0.5),
      y: ty * CONFIG.TILE.SIZE + (CONFIG.TILE.SIZE * 0.5)
    };
  };

  GameScene.prototype.createParticles = function() {
    this.enemyDeathEmitter = this.add.particles(0, 0, 'particle-dot', {
      speed: { min: 50, max: 150 },
      lifespan: 620,
      alpha: { start: 1, end: 0 },
      scale: { start: 0.9, end: 0 },
      emitting: false
    });

    this.itemPickupEmitter = this.add.particles(0, 0, 'particle-star', {
      speed: { min: 30, max: 120 },
      lifespan: 720,
      alpha: { start: 1, end: 0 },
      scale: { start: 0.9, end: 0 },
      emitting: false
    });
    this.itemPickupEmitter.setParticleTint(CONFIG.COLORS.GOLD);

    this.playerHitEmitter = this.add.particles(0, 0, 'particle-dot', {
      speed: { min: 60, max: 150 },
      lifespan: 420,
      alpha: { start: 1, end: 0 },
      scale: { start: 0.9, end: 0 },
      emitting: false
    });
    this.playerHitEmitter.setParticleTint(CONFIG.COLORS.PLAYER_HIT);

    this.levelUpCyanEmitter = this.add.particles(0, 0, 'particle-dot', {
      speed: { min: 70, max: 180 },
      lifespan: 900,
      alpha: { start: 1, end: 0 },
      scale: { start: 1, end: 0 },
      emitting: false
    });
    this.levelUpCyanEmitter.setParticleTint(CONFIG.COLORS.CYAN);

    this.levelUpGoldEmitter = this.add.particles(0, 0, 'particle-star', {
      speed: { min: 55, max: 150 },
      lifespan: 940,
      alpha: { start: 1, end: 0 },
      scale: { start: 0.95, end: 0 },
      emitting: false
    });
    this.levelUpGoldEmitter.setParticleTint(CONFIG.COLORS.GOLD);

    this.thinkingEmitter = this.add.particles(0, 0, 'particle-question', {
      speed: { min: 0, max: 0 },
      lifespan: 700,
      scale: { start: 0.9, end: 0.5 },
      alpha: { start: 1, end: 0 },
      emitting: false
    });
    this.thinkingEmitter.setParticleTint(CONFIG.COLORS.WHITE);

    this.speechEmitter = this.add.particles(0, 0, 'particle-star', {
      speed: { min: 20, max: 75 },
      lifespan: 450,
      alpha: { start: 1, end: 0 },
      scale: { start: 0.7, end: 0 },
      emitting: false
    });
    this.speechEmitter.setParticleTint(CONFIG.COLORS.WHITE);

    this.ambientDustEmitter = this.add.particles(0, 0, 'dust', {
      x: { min: 0, max: this.worldWidthPx },
      y: { min: 0, max: this.worldHeightPx },
      speedX: { min: SCENE.DUST_SPEED_MIN, max: SCENE.DUST_SPEED_MAX },
      speedY: { min: SCENE.DUST_SPEED_MIN, max: SCENE.DUST_SPEED_MAX },
      lifespan: CONFIG.VISUAL.DUST_PARTICLE_LIFESPAN,
      alpha: { start: SCENE.DUST_ALPHA_START, end: SCENE.DUST_ALPHA_END },
      scale: { min: SCENE.DUST_SCALE_MIN, max: SCENE.DUST_SCALE_MAX },
      frequency: SCENE.DUST_FREQ_MS,
      quantity: 1
    });
    this.ambientDustEmitter.setParticleTint(CONFIG.COLORS.WHITE);

    var emittersToWarm = [
      this.enemyDeathEmitter, this.itemPickupEmitter, this.playerHitEmitter,
      this.levelUpCyanEmitter, this.levelUpGoldEmitter, this.thinkingEmitter,
      this.speechEmitter
    ];
    var w;
    for (w = 0; w < emittersToWarm.length; w += 1) {
      if (emittersToWarm[w]) {
        try { emittersToWarm[w].explode(0, -9999, -9999); } catch (e) { /* pre-warm */ }
      }
    }

    this.torchSparkEmitter = this.add.particles(this.player.x, this.player.y, 'particle-dot', {
      speed: { min: SCENE.TORCH_SPARK_SPEED_MIN, max: SCENE.TORCH_SPARK_SPEED_MAX },
      angle: { min: 245, max: 295 },
      lifespan: SCENE.TORCH_SPARK_LIFESPAN_MS,
      alpha: { start: 1, end: 0 },
      scale: { start: 0.6, end: 0 },
      frequency: SCENE.TORCH_SPARK_FREQ_MS,
      quantity: 1
    });
    this.torchSparkEmitter.setParticleTint(CONFIG.PLAYER.LIGHT_COLOR);
  };

  GameScene.prototype.createInput = function() {
    this.keys = this.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
      attack: CONFIG.INPUT.ATTACK_KEY,
      chat: CONFIG.INPUT.CHAT_KEY
    });

    var chatEl = document.getElementById('chat-input');
    var kbManager = this.input.keyboard;
    if (chatEl) {
      chatEl.addEventListener('focus', function() {
        kbManager.enabled = false;
      });
      chatEl.addEventListener('blur', function() {
        kbManager.enabled = true;
      });
      chatEl.addEventListener('keydown', function(e) {
        e.stopPropagation();
      });
      chatEl.addEventListener('keyup', function(e) {
        e.stopPropagation();
      });
      this.input.on('pointerdown', function() {
        chatEl.blur();
      });
    }
  };

  GameScene.prototype.createPhysics = function() {
    this.physics.add.collider(this.player, this.worldLayer);
    this.physics.add.collider(this.pet, this.worldLayer);
    this.physics.add.collider(this.enemies, this.worldLayer);
    this.physics.add.collider(this.enemies, this.enemies);

    this.physics.add.overlap(this.player, this.enemies, this.onPlayerEnemyOverlap, null, this);
    this.physics.add.overlap(this.player, this.items, this.onPlayerCollectItem, null, this);
    this.physics.add.overlap(this.player, this.xpOrbs, this.onPlayerCollectXPOrb, null, this);
    this.physics.add.overlap(this.player, this.stairsZone, this.onPlayerTouchStairs, null, this);
  };

  GameScene.prototype.createSpeechBubble = function() {
    this.petSpeechText = this.add.text(0, 0, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '12px',
      color: '#f4fbff',
      backgroundColor: '#1a2040'
    })
      .setPadding(4, 2, 4, 2)
      .setOrigin(0.5, 1)
      .setDepth(1100)
      .setAlpha(0)
      .setVisible(false);
  };

  GameScene.prototype.createTimers = function() {
    this.hudTimer = this.time.addEvent({
      delay: CONFIG.TIMERS.HUD_REFRESH_MS,
      loop: true,
      callback: this.emitHudUpdate,
      callbackScope: this
    });

    this.brainTimer = this.time.addEvent({
      delay: CONFIG.PET.BRAIN_TICK_MS,
      loop: true,
      callback: this.runPetBrain,
      callbackScope: this
    });
  };

  GameScene.prototype.setupCamera = function() {
    this.cameras.main.setBounds(0, 0, this.worldWidthPx, this.worldHeightPx);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);
  };

  GameScene.prototype.setupChatListener = function() {
    this.onChatPlayerMessage = function(text) {
      this.lastPlayerMessage = String(text || '').substring(0, SCENE.PET_CHAT_MAX_CHARS);
    }.bind(this);
    CONFIG.EVENT_BUS.on(CONFIG.EVENTS.CHAT_PLAYER_MESSAGE, this.onChatPlayerMessage);
  };

  GameScene.prototype.update = function(time, delta) {
    if (!this.sceneAlive) {
      return;
    }

    this.handlePlayerInput(time);
    this.updateEnemyAI(time);
    this.updatePetAI(time, delta);
    this.updateWorldEffects(delta);
    this.updateLighting();
    this.updateSpeechFollow();
    this.updateItemLights();
  };

  GameScene.prototype.handlePlayerInput = function(time) {
    if (this.isGameOver || this.isFloorTransitioning) {
      this.player.setVelocity(0, 0);
      return;
    }

    var moveX = 0;
    var moveY = 0;
    if (this.keys.left.isDown || this.moveDir.x < 0) { moveX -= 1; }
    if (this.keys.right.isDown || this.moveDir.x > 0) { moveX += 1; }
    if (this.keys.up.isDown || this.moveDir.y < 0) { moveY -= 1; }
    if (this.keys.down.isDown || this.moveDir.y > 0) { moveY += 1; }

    if (moveX !== 0 || moveY !== 0) {
      var dir = new Phaser.Math.Vector2(moveX, moveY).normalize();
      this.player.setVelocity(dir.x * CONFIG.PLAYER.SPEED, dir.y * CONFIG.PLAYER.SPEED);
      this.facing.copy(dir);
      this.player.setFlipX(this.facing.x < 0);
      CONFIG.AudioService.footstep();
    } else {
      this.player.setVelocity(0, 0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.chat)) {
      CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.CHAT_FOCUS);
    }

    var canAttack = (time - this.lastAttackAt) >= CONFIG.PLAYER.ATTACK_COOLDOWN_MS;
    if (canAttack && Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
      this.lastAttackAt = time;
      this.playerAttack();
    }
  };

  GameScene.prototype.playerAttack = function() {
    CONFIG.AudioService.swordSlash();

    var arcX = this.player.x + this.facing.x * (CONFIG.PLAYER.ATTACK_RANGE * 0.6);
    var arcY = this.player.y + this.facing.y * (CONFIG.PLAYER.ATTACK_RANGE * 0.6);
    var arc = this.add.image(arcX, arcY, 'sword-arc')
      .setPipeline('Light2D')
      .setRotation(Math.atan2(this.facing.y, this.facing.x))
      .setAlpha(SCENE.PLAYER_ARC_ALPHA);
    this.tweens.add({
      targets: arc,
      alpha: 0,
      scale: SCENE.PLAYER_ARC_SCALE,
      duration: SCENE.PLAYER_ARC_DURATION_MS,
      onComplete: function() {
        arc.destroy();
      }
    });

    var enemies = this.enemies.getChildren();
    var i;
    for (i = 0; i < enemies.length; i += 1) {
      var enemy = enemies[i];
      if (!enemy.active) {
        continue;
      }
      var dx = enemy.x - this.player.x;
      var dy = enemy.y - this.player.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > CONFIG.PLAYER.ATTACK_RANGE) {
        continue;
      }
      var toEnemy = new Phaser.Math.Vector2(dx, dy).normalize();
      var dot = Phaser.Math.Clamp(this.facing.dot(toEnemy), -1, 1);
      if (dot < CONFIG.PLAYER.ATTACK_ARC_DOT) {
        continue;
      }
      var damage = Math.max(1, CONFIG.PLAYER.ATTACK - (enemy.getData('defense') || 0));
      this.damageEnemy(enemy, damage, true);
      enemy.body.velocity.x += this.facing.x * SCENE.ATTACK_KNOCKBACK_SPEED;
      enemy.body.velocity.y += this.facing.y * SCENE.ATTACK_KNOCKBACK_SPEED;
    }
  };

  GameScene.prototype.petAttackNearby = function() {
    if (!this.pet || !this.pet.active || this.isGameOver || this.isFloorTransitioning) return;
    var enemies = this.enemies.getChildren();
    var petRange = 100;
    for (var i = 0; i < enemies.length; i += 1) {
      var enemy = enemies[i];
      if (!enemy.active) continue;
      var dx = enemy.x - this.pet.x;
      var dy = enemy.y - this.pet.y;
      if (Math.sqrt(dx * dx + dy * dy) <= petRange) {
        var damage = Math.max(1, this.calculatePetAttack() - (enemy.getData('defense') || 0));
        this.damageEnemy(enemy, damage, false);
      }
    }
  };

  GameScene.prototype.damageEnemy = function(enemy, damage, fromPlayer) {
    if (!enemy || !enemy.active) {
      return;
    }
    var hp = enemy.getData('hp') || 0;
    hp -= Math.max(1, Math.round(damage));
    enemy.setData('hp', hp);
    enemy.setTintFill(CONFIG.COLORS.RED);
    this.time.delayedCall(SCENE.ENEMY_HIT_TINT_MS, function() {
      if (enemy && enemy.active) {
        enemy.clearTint();
      }
    });
    CONFIG.AudioService.enemyHit();

    if (hp <= 0) {
      this.killEnemy(enemy, fromPlayer);
    }
  };

  GameScene.prototype.killEnemy = function(enemy, fromPlayer) {
    if (!enemy || !enemy.active) {
      return;
    }

    var x = enemy.x;
    var y = enemy.y;
    var color = enemy.getData('color') || CONFIG.COLORS.WHITE;
    var xpValue = enemy.getData('xp') || 1;

    this.enemyDeathEmitter.setParticleTint(color);
    this.enemyDeathEmitter.explode(SCENE.ENEMY_DEATH_PARTICLES, x, y);
    CONFIG.AudioService.enemyDeath();

    var orbXP = Math.max(1, Math.round(xpValue * CONFIG.PET.XP_FROM_KILL_FACTOR));
    var orb = this.xpOrbs.create(x, y, 'xp-orb');
    orb.setPipeline('Light2D');
    orb.body.setAllowGravity(false);
    orb.setData('xp', orbXP);
    this.tweens.add({
      targets: orb,
      y: orb.y - SCENE.XP_ORB_FLOAT_PIXELS,
      duration: SCENE.XP_ORB_FLOAT_MS,
      yoyo: true,
      repeat: -1
    });

    this.enemiesAlive = Math.max(0, this.enemiesAlive - 1);
    this.score += Math.max(0, Math.round(xpValue * CONFIG.SCORE.KILL_MULTIPLIER));

    enemy.disableBody(true, true);

    if (this.enemiesAlive <= 0) {
      this.activateStairs();
    }
  };

  GameScene.prototype.onPlayerEnemyOverlap = function(player, enemy) {
    if (!enemy || !enemy.active || this.isGameOver || this.isFloorTransitioning) {
      return;
    }
    var now = this.time.now;
    if (now < this.playerInvincibleUntil) {
      return;
    }
    var enemyNext = enemy.getData('lastContactAt') || 0;
    if (now < enemyNext) {
      return;
    }
    enemy.setData('lastContactAt', now + CONFIG.PLAYER.CONTACT_HIT_CD_MS);

    var raw = enemy.getData('damage') || 1;
    var damage = Math.max(1, raw - CONFIG.PLAYER.DEFENSE);
    this.applyPlayerDamage(damage);
  };

  GameScene.prototype.applyPlayerDamage = function(amount) {
    if (this.isGameOver) {
      return;
    }
    var now = this.time.now;
    this.playerHP = CONFIG.Helpers.clamp(this.playerHP - Math.max(1, Math.round(amount)), 0, this.playerMaxHP);
    this.playerInvincibleUntil = now + CONFIG.PLAYER.INVINCIBILITY_MS;

    this.playerHitEmitter.explode(SCENE.PLAYER_HIT_PARTICLES, this.player.x, this.player.y);
    CONFIG.AudioService.playerHit();

    this.tweens.killTweensOf(this.player);
    this.tweens.add({
      targets: this.player,
      alpha: SCENE.PLAYER_DAMAGE_FLICKER_ALPHA,
      yoyo: true,
      repeat: SCENE.PLAYER_DAMAGE_FLICKER_REPEATS,
      duration: Math.max(40, Math.floor(CONFIG.PLAYER.INVINCIBILITY_MS / (SCENE.PLAYER_DAMAGE_FLICKER_REPEATS + 1))),
      onComplete: function() {
        if (this.player && this.player.active) {
          this.player.alpha = 1;
        }
      },
      onCompleteScope: this
    });

    if (this.playerHP <= 0) {
      this.triggerGameOver();
    }
  };

  GameScene.prototype.onPlayerCollectXPOrb = function(player, orb) {
    if (!orb || !orb.active) {
      return;
    }
    var xp = Math.max(1, Math.round(orb.getData('xp') || 1));
    this.addPetXP(xp);
    CONFIG.AudioService.itemPickup();
    this.itemPickupEmitter.explode(6, orb.x, orb.y);
    orb.disableBody(true, true);
  };

  GameScene.prototype.onPlayerCollectItem = function(player, item) {
    this.collectItem(item, 'player');
  };

  GameScene.prototype.collectItem = function(item, picker) {
    if (!item || !item.active) {
      return false;
    }
    var type = item.getData('itemType');
    if (!type) {
      return false;
    }

    if (type === CONFIG.ITEMS.HEALTH_POTION.type) {
      this.playerHP = CONFIG.Helpers.clamp(this.playerHP + CONFIG.ITEMS.PLAYER_HEAL, 0, this.playerMaxHP);
      CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.FLASH, 'Health restored');
    } else if (type === CONFIG.ITEMS.PET_TREAT.type) {
      this.addPetXP(CONFIG.ITEMS.PET_TREAT_XP);
    } else if (type === CONFIG.ITEMS.COIN.type) {
      this.score += CONFIG.ITEMS.COIN_SCORE;
    } else if (type === CONFIG.ITEMS.POWER_CRYSTAL.type) {
      this.addPetXP(CONFIG.ITEMS.POWER_CRYSTAL_XP);
      this.petPowerBuffUntil = this.time.now + CONFIG.PET.POWER_BUFF_MS;
      CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.FLASH, this.petName + ' gained arcane strength');
    }

    if (picker === 'pet') {
      this.showPetSpeech('Found something shiny!', true);
    }

    this.itemPickupEmitter.explode(SCENE.ITEM_PICKUP_PARTICLES, item.x, item.y);
    CONFIG.AudioService.itemPickup();

    if (item.itemLight) {
      this.lights.removeLight(item.itemLight);
      item.itemLight = null;
    }

    item.disableBody(true, true);
    return true;
  };

  GameScene.prototype.activateStairs = function() {
    if (this.stairsActive) {
      return;
    }
    this.stairsActive = true;
    CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.FLASH, 'The way forward is open');
    if (this.stairsPulseTween) {
      this.stairsPulseTween.stop();
    }
    this.stairsPulseTween = this.tweens.add({
      targets: this.stairsLight,
      intensity: { from: CONFIG.VISUAL.EXIT_PULSE_MIN, to: CONFIG.VISUAL.EXIT_PULSE_MAX },
      duration: 700,
      yoyo: true,
      repeat: -1
    });
  };

  GameScene.prototype.onPlayerTouchStairs = function() {
    if (!this.stairsActive || this.isFloorTransitioning || this.isGameOver) {
      return;
    }
    this.startFloorTransition();
  };

  GameScene.prototype.startFloorTransition = function() {
    var self = this;
    this.isFloorTransitioning = true;

    this.score += CONFIG.SCORE.FLOOR_BONUS;
    CONFIG.Helpers.saveHashParam(CONFIG.URL.PET_XP_KEY, this.petXP);
    CONFIG.AudioService.floorTransition();

    var healCooldownRemaining = Math.max(0, this.petHealReadyAt - this.time.now);
    var powerBuffRemaining = Math.max(0, this.petPowerBuffUntil - this.time.now);

    this.cameras.main.once('camerafadeoutcomplete', function() {
      self.scene.restart({
        petName: self.petName,
        floor: self.floor + 1,
        score: self.score,
        petXP: self.petXP,
        playerHP: self.playerHP,
        petHP: self.petHP,
        petHealCooldownRemaining: healCooldownRemaining,
        petPowerBuffRemaining: powerBuffRemaining
      });
    });
    this.cameras.main.fade(SCENE.FLOOR_FADE_MS, 0, 0, 0);
  };

  GameScene.prototype.updateEnemyAI = function(time) {
    if (this.isGameOver || this.isFloorTransitioning) {
      return;
    }
    var enemies = this.enemies.getChildren();
    var i;
    for (i = 0; i < enemies.length; i += 1) {
      var enemy = enemies[i];
      if (!enemy.active) {
        continue;
      }
      var dx = this.player.x - enemy.x;
      var dy = this.player.y - enemy.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var aggro = enemy.getData('aggro') || CONFIG.ENEMIES.SLIME.aggro;

      if (dist <= aggro) {
        enemy.setData('state', 'AGGRO');
      } else if (enemy.getData('state') === 'AGGRO' && dist > aggro * 1.25) {
        enemy.setData('state', 'PATROL');
      }

      if (enemy.getData('state') === 'AGGRO') {
        var chase = new Phaser.Math.Vector2(dx, dy).normalize();
        enemy.setVelocity(chase.x * enemy.getData('speed'), chase.y * enemy.getData('speed'));
        enemy.setFlipX(chase.x < 0);
      } else {
        this.updateEnemyPatrol(enemy, time);
      }
    }
  };

  GameScene.prototype.updateEnemyPatrol = function(enemy, time) {
    var target = enemy.getData('patrolTarget');
    if (!target) {
      target = this.pickPointInRoom(enemy.getData('room'));
      enemy.setData('patrolTarget', target);
    }

    var dx = target.x - enemy.x;
    var dy = target.y - enemy.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= CONFIG.ENEMIES.PATROL_REACH) {
      var nextAt = enemy.getData('nextPatrolAt') || 0;
      if (time >= nextAt) {
        enemy.setData('patrolTarget', this.pickPointInRoom(enemy.getData('room')));
        enemy.setData(
          'nextPatrolAt',
          time + CONFIG.Helpers.randRangeInt(CONFIG.ENEMIES.PATROL_INTERVAL_MIN_MS, CONFIG.ENEMIES.PATROL_INTERVAL_MAX_MS)
        );
      }
      enemy.setVelocity(0, 0);
      return;
    }

    var dir = new Phaser.Math.Vector2(dx, dy).normalize();
    enemy.setVelocity(dir.x * enemy.getData('speed') * 0.7, dir.y * enemy.getData('speed') * 0.7);
    enemy.setFlipX(dir.x < 0);
  };

  GameScene.prototype.updatePetAI = function(time, delta) {
    if (!this.pet || !this.pet.active) {
      return;
    }

    this.processPetAction(time);

    if (!this.currentPetAction) {
      this.updatePetFollow(time);
    }

    if (this.thinkingActive) {
      this.thinkingOrbitAngle += delta * CONFIG.VISUAL.THINKING_ROTATION_SPEED;
      if (!this.nextThinkBurstAt || time >= this.nextThinkBurstAt) {
        var tx = this.pet.x + Math.cos(this.thinkingOrbitAngle) * SCENE.THINK_ORBIT_RADIUS;
        var ty = this.pet.y - SCENE.THINK_OFFSET_Y + Math.sin(this.thinkingOrbitAngle) * (SCENE.THINK_ORBIT_RADIUS * 0.4);
        this.thinkingEmitter.explode(1, tx, ty);
        this.nextThinkBurstAt = time + CONFIG.PET.THINKING_PARTICLE_FREQ_MS;
      }
    }
  };

  GameScene.prototype.updatePetFollow = function(time) {
    var minDistance = CONFIG.PET.FOLLOW_MIN_DISTANCE;
    var maxDistance = CONFIG.PET.FOLLOW_MAX_DISTANCE;
    if (time < this.petFollowCloseUntil) {
      minDistance = Math.max(12, Math.floor(CONFIG.PET.FOLLOW_MIN_DISTANCE * SCENE.PET_CLOSE_FOLLOW_FACTOR));
      maxDistance = Math.max(minDistance + 10, Math.floor(CONFIG.PET.FOLLOW_MAX_DISTANCE * SCENE.PET_CLOSE_FOLLOW_FACTOR));
    }

    var dx = this.player.x - this.pet.x;
    var dy = this.player.y - this.pet.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDistance) {
      var dir = new Phaser.Math.Vector2(dx, dy).normalize();
      this.pet.setVelocity(dir.x * CONFIG.PET.SPEED, dir.y * CONFIG.PET.SPEED);
      this.pet.setFlipX(dir.x < 0);
      return;
    }

    if (dist < minDistance) {
      var away = new Phaser.Math.Vector2(-dx, -dy).normalize();
      this.pet.setVelocity(away.x * CONFIG.PET.SPEED * 0.6, away.y * CONFIG.PET.SPEED * 0.6);
      this.pet.setFlipX(away.x < 0);
      return;
    }

    this.pet.setVelocity(0, 0);
  };

  GameScene.prototype.processPetAction = function(time) {
    if (!this.currentPetAction && this.petActionQueue.length > 0) {
      this.currentPetAction = this.petActionQueue.shift();
      this.beginPetAction(this.currentPetAction, time);
    }

    if (!this.currentPetAction) {
      return;
    }

    if (this.currentPetAction.action === 'PICKUP') {
      this.updatePetPickupAction(this.currentPetAction);
      return;
    }

    if (this.currentPetAction.action === 'IDLE') {
      if (time >= this.currentPetAction.endsAt) {
        this.finishPetAction();
      }
    }
  };

  GameScene.prototype.beginPetAction = function(action, time) {
    if (!action || !action.action) {
      this.finishPetAction();
      return;
    }

    var kind = action.action;
    if (kind === 'FOLLOW') {
      if (String(action.target || '').toLowerCase() === 'close') {
        this.petFollowCloseUntil = time + CONFIG.PET.BRAIN_TICK_MS;
      }
      if (action.message) {
        this.showPetSpeech(action.message, true);
      }
      this.finishPetAction();
      return;
    }

    if (kind === 'SAY') {
      this.showPetSpeech(action.message || CONFIG.Helpers.pickRandom(CONFIG.BRAIN.CHAT_FALLBACKS), true);
      this.finishPetAction();
      return;
    }

    if (kind === 'IDLE') {
      this.pet.setVelocity(0, 0);
      this.currentPetAction.endsAt = time + SCENE.PET_IDLE_MS;
      if (action.message) {
        this.showPetSpeech(action.message, true);
      }
      return;
    }

    if (kind === 'HEAL') {
      this.executePetHeal(action, time);
      return;
    }

    if (kind === 'ATTACK') {
      this.executePetLungeAttack(action);
      return;
    }

    if (kind === 'PICKUP') {
      this.startPetPickupAction(action);
      return;
    }

    this.finishPetAction();
  };

  GameScene.prototype.startPetPickupAction = function(action) {
    var target = this.resolveItemTarget(action.target);
    if (!target) {
      this.finishPetAction();
      return;
    }
    this.currentPetAction.targetItem = target;
    if (action.message) {
      this.showPetSpeech(action.message, true);
    }
  };

  GameScene.prototype.updatePetPickupAction = function(action) {
    var item = action.targetItem;
    if (!item || !item.active) {
      this.pet.setVelocity(0, 0);
      this.finishPetAction();
      return;
    }

    var dx = item.x - this.pet.x;
    var dy = item.y - this.pet.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= SCENE.PET_PICKUP_RANGE) {
      this.pet.setVelocity(0, 0);
      this.collectItem(item, 'pet');
      this.finishPetAction();
      return;
    }

    var dir = new Phaser.Math.Vector2(dx, dy).normalize();
    this.pet.setVelocity(dir.x * CONFIG.PET.SPEED, dir.y * CONFIG.PET.SPEED);
    this.pet.setFlipX(dir.x < 0);
  };

  GameScene.prototype.executePetLungeAttack = function(action) {
    var target = this.resolveEnemyTarget(action.target);
    if (!target) {
      this.finishPetAction();
      return;
    }

    var self = this;
    var fromX = this.pet.x;
    var fromY = this.pet.y;
    var toX = target.x;
    var toY = target.y;
    this.pet.setVelocity(0, 0);

    if (action.message) {
      this.showPetSpeech(action.message, true);
    }

    this.tweens.add({
      targets: this.pet,
      x: toX,
      y: toY,
      duration: CONFIG.PET.LUNGE_TIME_MS,
      ease: 'Quad.easeOut',
      onComplete: function() {
        if (target && target.active) {
          var damage = Math.max(1, self.calculatePetAttack() - (target.getData('defense') || 0));
          self.damageEnemy(target, damage, false);
        }
        self.tweens.add({
          targets: self.pet,
          x: fromX,
          y: fromY,
          duration: CONFIG.PET.LUNGE_TIME_MS,
          ease: 'Quad.easeIn',
          onComplete: function() {
            self.finishPetAction();
          }
        });
      }
    });
  };

  GameScene.prototype.executePetHeal = function(action, time) {
    if (this.petLevel < 7) {
      this.showPetSpeech(action.message || '*can\'t cast yet*', true);
      this.finishPetAction();
      return;
    }
    if (time < this.petHealReadyAt) {
      this.showPetSpeech(action.message || '*recharging magic*', true);
      this.finishPetAction();
      return;
    }
    if (this.playerHP >= this.playerMaxHP) {
      this.finishPetAction();
      return;
    }

    this.playerHP = CONFIG.Helpers.clamp(this.playerHP + CONFIG.PET.HEAL_AMOUNT, 0, this.playerMaxHP);
    this.petHealReadyAt = time + CONFIG.PET.HEAL_COOLDOWN_MS;
    this.showPetSpeech(action.message || 'Healing sparkles!', true);
    CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.FLASH, this.petName + ' healed you');
    this.itemPickupEmitter.explode(8, this.player.x, this.player.y);
    this.finishPetAction();
  };

  GameScene.prototype.finishPetAction = function() {
    this.currentPetAction = null;
  };

  GameScene.prototype.enqueuePetAction = function(action) {
    if (!action || !action.action) {
      return false;
    }
    if (this.petActionQueue.length >= CONFIG.PET.ACTION_QUEUE_MAX) {
      return false;
    }
    this.petActionQueue.push(action);
    return true;
  };

  GameScene.prototype.resolveEnemyTarget = function(targetText) {
    var typeHint = String(targetText || '').toLowerCase();
    var list = this.enemies.getChildren();
    var best = null;
    var bestDist = Number.MAX_VALUE;
    var i;
    for (i = 0; i < list.length; i += 1) {
      var e = list[i];
      if (!e.active) {
        continue;
      }
      var typeKey = String(e.getData('typeKey') || '').toLowerCase();
      if (typeHint && typeHint !== 'nearest' && typeKey.indexOf(typeHint) === -1 && typeHint.indexOf(typeKey) === -1) {
        continue;
      }
      var dx = e.x - this.pet.x;
      var dy = e.y - this.pet.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist) {
        best = e;
        bestDist = d;
      }
    }

    if (best) {
      return best;
    }
    return this.findNearestEnemy(this.pet.x, this.pet.y, Number.MAX_VALUE);
  };

  GameScene.prototype.resolveItemTarget = function(targetText) {
    var typeHint = String(targetText || '').toLowerCase();
    var list = this.items.getChildren();
    var best = null;
    var bestDist = Number.MAX_VALUE;
    var i;
    for (i = 0; i < list.length; i += 1) {
      var it = list[i];
      if (!it.active) {
        continue;
      }
      var type = String(it.getData('itemType') || '').toLowerCase();
      if (typeHint && typeHint !== 'nearest' && type.indexOf(typeHint) === -1 && typeHint.indexOf(type) === -1) {
        continue;
      }
      var dx = it.x - this.pet.x;
      var dy = it.y - this.pet.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist) {
        best = it;
        bestDist = d;
      }
    }

    if (best) {
      return best;
    }
    return this.findNearestItem(this.pet.x, this.pet.y, Number.MAX_VALUE);
  };

  GameScene.prototype.runPetBrain = function() {
    if (this.isGameOver || this.isFloorTransitioning || !this.sceneAlive) {
      return;
    }
    if (this.brainRequestPending) {
      return;
    }

    var mode = this.getBrainMode(this.petLevel);
    if (mode === CONFIG.BRAIN.MODE_SCRIPTED || !GeminiService.online) {
      this.runScriptedBrain(!GeminiService.online);
      return;
    }

    this.runLLMBrain(mode);
  };

  GameScene.prototype.getBrainMode = function(level) {
    if (level <= 3) {
      return CONFIG.BRAIN.MODE_SCRIPTED;
    }
    if (level <= 6) {
      return CONFIG.BRAIN.MODE_LLM_SIMPLE;
    }
    if (level <= 9) {
      return CONFIG.BRAIN.MODE_LLM_SMART;
    }
    return CONFIG.BRAIN.MODE_LLM_GENIUS;
  };

  GameScene.prototype.runScriptedBrain = function(isOfflineFallback) {
    var nearestEnemy = this.findNearestEnemy(this.pet.x, this.pet.y, SCENE.PET_ENEMY_NEARBY_DIST);
    var nearestItem = this.findNearestItem(this.pet.x, this.pet.y, SCENE.PET_ITEM_SCAN_DIST);
    var lowPlayerHP = (this.playerHP / this.playerMaxHP) < SCENE.LOW_HP_RATIO;

    if (this.lastPlayerMessage) {
      var reply = CONFIG.Helpers.pickRandom(CONFIG.BRAIN.CHAT_FALLBACKS);
      if (isOfflineFallback && !reply) {
        reply = CONFIG.CHAT.PLAYER_FALLBACK_REPLY;
      }
      this.enqueuePetAction({ action: 'SAY', target: 'player', message: reply });
      this.lastPlayerMessage = '';
    }

    if (nearestEnemy && nearestEnemy.distance <= SCENE.PET_ENEMY_ATTACK_DIST) {
      this.enqueuePetAction({ action: 'ATTACK', target: 'nearest', message: 'I got this!' });
      return;
    }

    if (nearestItem && (!nearestEnemy || nearestEnemy.distance > SCENE.PET_ENEMY_NEARBY_DIST)) {
      this.enqueuePetAction({ action: 'PICKUP', target: 'nearest', message: 'Treasure!' });
      return;
    }

    if (lowPlayerHP) {
      this.enqueuePetAction({ action: 'SAY', target: 'player', message: 'Careful!' });
      this.enqueuePetAction({ action: 'FOLLOW', target: 'close', message: '' });
      return;
    }

    this.enqueuePetAction({ action: 'FOLLOW', target: 'player', message: '' });
    if (Math.random() < SCENE.SCRIPTED_EMOTE_CHANCE) {
      this.enqueuePetAction({
        action: 'SAY',
        target: 'player',
        message: CONFIG.Helpers.pickRandom(CONFIG.BRAIN.SCRIPTED_EMOTES)
      });
    }
  };

  GameScene.prototype.runLLMBrain = function(mode) {
    var self = this;
    var snapshot = this.buildLLMGameState();
    var promptData = this.buildLLMPrompt(mode);

    this.brainRequestPending = true;
    this.startThinking();

    GeminiService.chat(promptData.systemPrompt, JSON.stringify(snapshot), promptData.maxTokens)
      .then(function(response) {
        if (!self.sceneAlive) {
          return;
        }
        self.brainRequestPending = false;
        self.stopThinking();

        if (!response || !response.action) {
          CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.AI_STATUS, false);
          self.showPetSpeech('\u2728 *' + self.petName + ' seems distracted by a magical butterfly...*', true);
          self.runScriptedBrain(true);
          self.lastPlayerMessage = '';
          return;
        }

        CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.AI_STATUS, true);

        var action = String(response.action || '').toUpperCase();
        if (CONFIG.BRAIN.ACTIONS.indexOf(action) === -1) {
          self.runScriptedBrain(false);
          self.lastPlayerMessage = '';
          return;
        }

        var wordsLimit = promptData.maxWords;
        var msg = self.trimWords(response.message || '', wordsLimit);
        var target = String(response.target || 'nearest');
        self.enqueuePetAction({
          action: action,
          target: target,
          message: msg
        });
        self.lastPlayerMessage = '';
      })
      .catch(function() {
        if (!self.sceneAlive) {
          return;
        }
        self.brainRequestPending = false;
        self.stopThinking();
        CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.AI_STATUS, false);
        self.showPetSpeech('\u2728 *' + self.petName + ' seems distracted by a magical butterfly...*', true);
        self.runScriptedBrain(true);
        self.lastPlayerMessage = '';
      });
  };

  GameScene.prototype.buildLLMGameState = function() {
    var enemies = [];
    var items = [];
    var nearbyEnemies = this.collectNearbyEnemies(this.pet.x, this.pet.y, SCENE.LOOKUP_RADIUS_ENEMIES);
    var nearbyItems = this.collectNearbyItems(this.pet.x, this.pet.y, SCENE.LOOKUP_RADIUS_ITEMS);
    var i;

    for (i = 0; i < nearbyEnemies.length; i += 1) {
      enemies.push({
        type: nearbyEnemies[i].type,
        distance: Math.round(nearbyEnemies[i].distance),
        hp: Math.max(0, Math.round(nearbyEnemies[i].hp))
      });
    }

    for (i = 0; i < nearbyItems.length; i += 1) {
      items.push({
        type: nearbyItems[i].type,
        distance: Math.round(nearbyItems[i].distance)
      });
    }

    return {
      petName: this.petName,
      petLevel: this.petLevel,
      petHP: Math.round(this.petHP),
      petMaxHP: Math.round(this.petMaxHP),
      playerHP: Math.round(this.playerHP),
      playerMaxHP: Math.round(this.playerMaxHP),
      floor: this.floor,
      nearbyEnemies: enemies,
      nearbyItems: items,
      lastPlayerMessage: this.lastPlayerMessage,
      currentAction: this.currentPetAction ? this.currentPetAction.action : 'NONE'
    };
  };

  GameScene.prototype.buildLLMPrompt = function(mode) {
    var desc = '';
    var rule = '';
    var maxWords = CONFIG.BRAIN.MAX_WORDS_SMART;
    var maxTokens = CONFIG.BRAIN.MAX_TOKENS_SMART;

    if (mode === CONFIG.BRAIN.MODE_LLM_SIMPLE) {
      desc = 'Use simple instincts and short language.';
      rule = 'Respond with 1-3 word messages. Basic actions only.';
      maxWords = CONFIG.BRAIN.MAX_WORDS_SIMPLE;
      maxTokens = CONFIG.BRAIN.MAX_TOKENS_SIMPLE;
    } else if (mode === CONFIG.BRAIN.MODE_LLM_SMART) {
      desc = 'Think tactically and protect the player.';
      rule = 'Full sentences. Reason about tactics.';
      maxWords = CONFIG.BRAIN.MAX_WORDS_SMART;
      maxTokens = CONFIG.BRAIN.MAX_TOKENS_SMART;
    } else {
      desc = 'You are highly strategic and protective.';
      rule = 'Strategize, warn of danger, give advice.';
      maxWords = CONFIG.BRAIN.MAX_WORDS_GENIUS;
      maxTokens = CONFIG.BRAIN.MAX_TOKENS_GENIUS;
    }

    var systemPrompt = 'You are ' + this.petName + ', a magical companion at intelligence level ' + this.petLevel + '/10. ' +
      desc + ' You are in a dungeon on floor ' + this.floor + '. ' +
      'Respond with action (FOLLOW/ATTACK/PICKUP/SAY/IDLE/HEAL), target, and message. ' +
      'Keep message under ' + maxWords + ' words. Stay in character as a small cute creature. ' +
      rule;

    return {
      systemPrompt: systemPrompt,
      maxWords: maxWords,
      maxTokens: maxTokens
    };
  };

  GameScene.prototype.startThinking = function() {
    this.thinkingActive = true;
    this.nextThinkBurstAt = this.time.now;
    if (this.petSpeechText) {
      if (this.speechHideTimer) {
        this.speechHideTimer.remove(false);
        this.speechHideTimer = null;
      }
      this.tweens.killTweensOf(this.petSpeechText);
      this.petSpeechText.setText('\u2728 thinking...');
      this.petSpeechText.setPosition(this.pet.x, this.pet.y - SCENE.SPEECH_OFFSET_Y);
      this.petSpeechText.setVisible(true);
      this.petSpeechText.setAlpha(1);
    }
  };

  GameScene.prototype.stopThinking = function() {
    this.thinkingActive = false;
    if (this.petSpeechText && this.petSpeechText.text === '\u2728 thinking...') {
      this.petSpeechText.setVisible(false);
      this.petSpeechText.setAlpha(0);
    }
  };

  GameScene.prototype.trimWords = function(text, maxWords) {
    var clean = String(text || '').trim();
    if (!clean) {
      return '';
    }
    var parts = clean.split(/\s+/);
    if (parts.length <= maxWords) {
      return clean;
    }
    return parts.slice(0, maxWords).join(' ');
  };

  GameScene.prototype.collectNearbyEnemies = function(x, y, radius) {
    var list = this.enemies.getChildren();
    var result = [];
    var i;
    for (i = 0; i < list.length; i += 1) {
      var e = list[i];
      if (!e.active) {
        continue;
      }
      var dx = e.x - x;
      var dy = e.y - y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d <= radius) {
        result.push({
          ref: e,
          type: e.getData('typeKey'),
          distance: d,
          hp: e.getData('hp')
        });
      }
    }
    result.sort(function(a, b) { return a.distance - b.distance; });
    return result;
  };

  GameScene.prototype.collectNearbyItems = function(x, y, radius) {
    var list = this.items.getChildren();
    var result = [];
    var i;
    for (i = 0; i < list.length; i += 1) {
      var it = list[i];
      if (!it.active) {
        continue;
      }
      var dx = it.x - x;
      var dy = it.y - y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d <= radius) {
        result.push({
          ref: it,
          type: it.getData('itemType'),
          distance: d
        });
      }
    }
    result.sort(function(a, b) { return a.distance - b.distance; });
    return result;
  };

  GameScene.prototype.findNearestEnemy = function(x, y, maxDist) {
    var list = this.enemies.getChildren();
    var best = null;
    var bestDist = maxDist;
    var i;
    for (i = 0; i < list.length; i += 1) {
      var e = list[i];
      if (!e.active) {
        continue;
      }
      var dx = e.x - x;
      var dy = e.y - y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d <= bestDist) {
        best = e;
        bestDist = d;
      }
    }
    if (!best) {
      return null;
    }
    return { enemy: best, distance: bestDist };
  };

  GameScene.prototype.findNearestItem = function(x, y, maxDist) {
    var list = this.items.getChildren();
    var best = null;
    var bestDist = maxDist;
    var i;
    for (i = 0; i < list.length; i += 1) {
      var it = list[i];
      if (!it.active) {
        continue;
      }
      var dx = it.x - x;
      var dy = it.y - y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d <= bestDist) {
        best = it;
        bestDist = d;
      }
    }
    if (!best) {
      return null;
    }
    return { item: best, distance: bestDist };
  };

  GameScene.prototype.calculatePetLevel = function(xp) {
    var thresholds = CONFIG.PET.XP_THRESHOLDS;
    var level = 1;
    while (level < CONFIG.PET.MAX_LEVEL_DISPLAY && xp >= thresholds[level - 1]) {
      level += 1;
    }
    return level;
  };

  GameScene.prototype.calculatePetMaxHP = function(level) {
    return CONFIG.PET.BASE_HP + level * CONFIG.PET.HP_PER_LEVEL;
  };

  GameScene.prototype.calculatePetAttack = function() {
    var base = CONFIG.PET.BASE_ATTACK + this.petLevel * CONFIG.PET.ATTACK_PER_LEVEL;
    if (this.time.now <= this.petPowerBuffUntil) {
      base += CONFIG.PET.POWER_BUFF_BONUS;
    }
    return base;
  };

  GameScene.prototype.addPetXP = function(amount) {
    var xpGain = Math.max(0, Math.round(amount || 0));
    if (xpGain <= 0) {
      return;
    }

    var oldLevel = this.petLevel;
    var oldMax = this.petMaxHP;
    this.petXP += xpGain;
    this.petLevel = this.calculatePetLevel(this.petXP);
    this.petMaxHP = this.calculatePetMaxHP(this.petLevel);

    var maxDelta = this.petMaxHP - oldMax;
    if (maxDelta > 0) {
      this.petHP = CONFIG.Helpers.clamp(this.petHP + maxDelta, 0, this.petMaxHP);
    } else {
      this.petHP = CONFIG.Helpers.clamp(this.petHP, 0, this.petMaxHP);
    }

    CONFIG.Helpers.saveHashParam(CONFIG.URL.PET_XP_KEY, this.petXP);

    if (this.petLevel > oldLevel) {
      this.handlePetLevelUp(oldLevel, this.petLevel);
    }
  };

  GameScene.prototype.handlePetLevelUp = function(oldLevel, newLevel) {
    this.petScaleBase = 1 + (newLevel - CONFIG.PET.START_LEVEL) * CONFIG.PET.LEVEL_SCALE_STEP;
    this.pet.setScale(this.petScaleBase);

    try {
      this.levelUpCyanEmitter.explode(SCENE.LEVELUP_PARTICLES, this.pet.x, this.pet.y);
    } catch (e) { /* Phaser emitter init race */ }
    try {
      this.levelUpGoldEmitter.explode(SCENE.LEVELUP_PARTICLES, this.pet.x, this.pet.y);
    } catch (e) { /* Phaser emitter init race */ }

    CONFIG.AudioService.levelUp();

    this.tweens.add({
      targets: this.cameras.main,
      zoom: SCENE.LEVELUP_ZOOM_TO,
      duration: SCENE.LEVELUP_ZOOM_MS,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.PET_LEVELUP, { name: this.petName, level: newLevel });

    if (GeminiService.online && newLevel >= 4) {
      this.requestLevelUpMessage(newLevel);
    } else {
      this.showPetSpeech('*happy bounce*', true);
    }
  };

  GameScene.prototype.requestLevelUpMessage = function(level) {
    var self = this;
    var systemPrompt = 'You are ' + this.petName + ', a cute magical companion who just leveled up to ' + level + '/10. ' +
      'Respond as JSON with action, target, message. Use action SAY and keep message under ' +
      CONFIG.BRAIN.MAX_WORDS_SMART + ' words.';
    var userMessage = JSON.stringify({
      event: 'level_up',
      petName: this.petName,
      level: level,
      floor: this.floor
    });

    GeminiService.chat(systemPrompt, userMessage, CONFIG.BRAIN.MAX_TOKENS_SMART)
      .then(function(response) {
        if (!self.sceneAlive) {
          return;
        }
        if (!response || !response.message) {
          self.showPetSpeech('*happy bounce*', true);
          return;
        }
        self.showPetSpeech(self.trimWords(response.message, CONFIG.BRAIN.MAX_WORDS_SMART), true);
      })
      .catch(function() {
        if (!self.sceneAlive) {
          return;
        }
        self.showPetSpeech('*happy bounce*', true);
      });
  };

  GameScene.prototype.showPetSpeech = function(text, emitToChat) {
    var message = String(text || '').trim();
    if (!message) {
      return;
    }

    var limited = message.substring(0, SCENE.PET_CHAT_MAX_CHARS);
    this.petSpeechText.setText(limited);
    this.petSpeechText.setPosition(this.pet.x, this.pet.y - SCENE.SPEECH_OFFSET_Y);
    this.petSpeechText.setVisible(true);
    this.petSpeechText.setAlpha(0);

    if (this.speechHideTimer) {
      this.speechHideTimer.remove(false);
      this.speechHideTimer = null;
    }
    this.tweens.killTweensOf(this.petSpeechText);
    this.tweens.add({
      targets: this.petSpeechText,
      alpha: 1,
      y: this.petSpeechText.y - 4,
      duration: 120,
      ease: 'Sine.easeOut'
    });

    this.speechHideTimer = this.time.delayedCall(CONFIG.PET.SPEECH_TIME_MS, function() {
      this.tweens.add({
        targets: this.petSpeechText,
        alpha: 0,
        duration: 160,
        onComplete: function() {
          if (this.petSpeechText) {
            this.petSpeechText.setVisible(false);
          }
        },
        onCompleteScope: this
      });
    }, [], this);

    this.speechEmitter.explode(SCENE.CHAT_SPEECH_PARTICLES, this.pet.x, this.pet.y - 12);
    CONFIG.AudioService.petSpeech();

    if (emitToChat) {
      CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.CHAT_ADD, { from: 'pet', text: limited });
    }
  };

  GameScene.prototype.updateSpeechFollow = function() {
    if (!this.petSpeechText || !this.petSpeechText.visible) {
      return;
    }
    this.petSpeechText.x = this.pet.x;
    this.petSpeechText.y = this.pet.y - SCENE.SPEECH_OFFSET_Y;
  };

  GameScene.prototype.updateWorldEffects = function() {
    if (this.torchSparkEmitter) {
      this.torchSparkEmitter.setPosition(this.player.x + this.facing.x * 6, this.player.y - 10);
    }
  };

  GameScene.prototype.updateLighting = function() {
    if (this.playerLight) {
      this.playerLight.x = this.player.x;
      this.playerLight.y = this.player.y;
    }
    if (this.petLight) {
      this.petLight.x = this.pet.x;
      this.petLight.y = this.pet.y;
    }
  };

  GameScene.prototype.updateItemLights = function() {
    var list = this.items.getChildren();
    var i;
    for (i = 0; i < list.length; i += 1) {
      var item = list[i];
      if (!item.active || !item.itemLight) {
        continue;
      }
      item.itemLight.x = item.x;
      item.itemLight.y = item.y;
      var dx = item.x - this.player.x;
      var dy = item.y - this.player.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      item.itemLight.intensity = (d <= SCENE.ITEM_LIGHT_NEAR_DIST)
        ? SCENE.ITEM_LIGHT_NEAR_INTENSITY
        : SCENE.ITEM_LIGHT_BASE_INTENSITY;
    }
  };

  GameScene.prototype.emitHudUpdate = function() {
    var progress = this.getPetLevelProgress();
    CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.HUD_UPDATE, {
      player: {
        hp: this.playerHP,
        maxHp: this.playerMaxHP
      },
      pet: {
        hp: this.petHP,
        maxHp: this.petMaxHP,
        name: this.petName,
        level: this.petLevel,
        xp: this.petXP,
        levelProgress: progress
      },
      score: this.score,
      floor: this.floor
    });
  };

  GameScene.prototype.getPetLevelProgress = function() {
    var level = this.petLevel;
    var thresholds = CONFIG.PET.XP_THRESHOLDS;
    if (level >= CONFIG.PET.MAX_LEVEL_DISPLAY) {
      return 1;
    }
    var prev = (level <= 1) ? 0 : thresholds[level - 2];
    var next = thresholds[level - 1];
    if (next <= prev) {
      return 1;
    }
    var ratio = (this.petXP - prev) / (next - prev);
    return CONFIG.Helpers.clamp(ratio, 0, 1);
  };

  GameScene.prototype.triggerGameOver = function() {
    var self = this;
    if (this.isGameOver) {
      return;
    }
    this.isGameOver = true;
    this.stopThinking();
    CONFIG.Helpers.saveHashParam(CONFIG.URL.PET_XP_KEY, this.petXP);

    CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.GAME_OVER);

    this.cameras.main.once('camerafadeoutcomplete', function() {
      self.scene.start('GameOverScene', {
        petName: self.petName,
        petLevel: self.petLevel,
        floor: self.floor,
        score: self.score
      });
      self.scene.stop('HUDScene');
    });

    this.cameras.main.fade(
      SCENE.GAMEOVER_FADE_MS,
      SCENE.GAMEOVER_FADE_R,
      SCENE.GAMEOVER_FADE_G,
      SCENE.GAMEOVER_FADE_B
    );
  };

  GameScene.prototype.shutdown = function() {
    if (!this.sceneAlive) {
      return;
    }
    window.__gameAPI = null;
    this.sceneAlive = false;

    if (this.onChatPlayerMessage) {
      CONFIG.EVENT_BUS.off(CONFIG.EVENTS.CHAT_PLAYER_MESSAGE, this.onChatPlayerMessage);
      this.onChatPlayerMessage = null;
    }

    if (this.hudTimer) {
      this.hudTimer.remove(false);
      this.hudTimer = null;
    }
    if (this.brainTimer) {
      this.brainTimer.remove(false);
      this.brainTimer = null;
    }
    if (this.speechHideTimer) {
      this.speechHideTimer.remove(false);
      this.speechHideTimer = null;
    }

    if (this.stairsPulseTween) {
      this.stairsPulseTween.stop();
      this.stairsPulseTween = null;
    }
  };

  window.GameScene = GameScene;
})();
