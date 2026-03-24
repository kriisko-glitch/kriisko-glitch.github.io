(function () {
  "use strict";

  var ROOM_LINES = ["Dark in here...", "I smell danger", "Ooh, treasure!"];

  // SWAP POINT: replace this scripted planner with an LLM-backed policy later.
  var CompanionBrain = {
    think: function (state) {
      if (state.playerHP / state.playerMaxHP < 0.3) {
        return { action: state.actions.SAY, target: null, message: "Careful, master!" };
      }

      if (state.nearbyEnemies.length > 0 && state.nearbyEnemies[0].distance <= state.dangerRange) {
        return { action: state.actions.ATTACK, target: state.nearbyEnemies[0].entity, message: null };
      }

      if (
        state.nearbyItems.length > 0 &&
        state.nearbyEnemies.length === 0 &&
        state.nearbyItems[0].distance <= state.pickupRange
      ) {
        return { action: state.actions.PICKUP, target: state.nearbyItems[0].entity, message: null };
      }

      if (state.newRoomEntered) {
        return { action: state.actions.SAY, target: null, message: state.roomLine };
      }

      return { action: state.actions.FOLLOW, target: null, message: null };
    }
  };

  function createAudioSystem(scene) {
    var cfg = scene.cfg;
    var audioEnabled = cfg.AUDIO.ENABLED;
    var context = scene.sound && scene.sound.context ? scene.sound.context : null;
    var master = null;
    var ambientOsc = null;
    var stepToggle = false;

    if (!audioEnabled || !context) {
      return {
        unlock: function () {},
        playFootstep: function () {},
        playSlash: function () {},
        playEnemyHit: function () {},
        playEnemyDeath: function () {},
        playChestOpen: function () {},
        playPickup: function () {},
        playPlayerDamage: function () {},
        playCompanionSpeech: function () {},
        playFloorTransition: function () {}
      };
    }

    master = context.createGain();
    master.gain.value = cfg.AUDIO.MASTER_GAIN;
    master.connect(context.destination);

    function envelope(gain, startAt, attack, peak, release) {
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), startAt + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + attack + release);
    }

    function playTone(type, frequency, durationMs, volume, sweepTo) {
      var now = context.currentTime;
      var osc = context.createOscillator();
      var gain = context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now);
      if (sweepTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, sweepTo), now + durationMs / 1000);
      }
      envelope(gain, now, 0.005, volume, durationMs / 1000);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + durationMs / 1000 + 0.03);
    }

    function playNoise(durationMs, volume, highPassHz) {
      var sampleRate = context.sampleRate;
      var frameCount = Math.floor(sampleRate * (durationMs / 1000));
      var buffer = context.createBuffer(1, frameCount, sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < frameCount; i += 1) {
        data[i] = (Math.random() * 2 - 1) * 0.7;
      }
      var noiseSource = context.createBufferSource();
      var filter = context.createBiquadFilter();
      var gain = context.createGain();
      filter.type = "highpass";
      filter.frequency.value = highPassHz;
      noiseSource.buffer = buffer;
      envelope(gain, context.currentTime, 0.002, volume, durationMs / 1000);
      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      noiseSource.start();
      noiseSource.stop(context.currentTime + durationMs / 1000 + 0.02);
    }

    function startAmbientIfNeeded() {
      if (ambientOsc) {
        return;
      }
      var now = context.currentTime;
      ambientOsc = context.createOscillator();
      var ambientGain = context.createGain();
      ambientOsc.type = "sine";
      ambientOsc.frequency.setValueAtTime(46, now);
      ambientGain.gain.setValueAtTime(cfg.AUDIO.AMBIENT_GAIN, now);
      ambientOsc.connect(ambientGain);
      ambientGain.connect(master);
      ambientOsc.start(now);
    }

    function unlock() {
      if (context.state === "suspended") {
        context.resume();
      }
      startAmbientIfNeeded();
    }

    return {
      unlock: unlock,
      playFootstep: function () {
        stepToggle = !stepToggle;
        playTone("square", stepToggle ? 140 : 172, 40, 0.07, null);
      },
      playSlash: function () {
        playNoise(50, 0.08, 900);
        playTone("sawtooth", 440, 50, 0.05, 150);
      },
      playEnemyHit: function () {
        playTone("triangle", 120, 70, 0.08, 70);
      },
      playEnemyDeath: function () {
        playTone("sine", 240, 180, 0.1, 80);
      },
      playChestOpen: function () {
        playTone("triangle", 430, 80, 0.08, null);
        scene.time.delayedCall(60, function () {
          playTone("triangle", 540, 80, 0.08, null);
        });
        scene.time.delayedCall(120, function () {
          playTone("triangle", 670, 120, 0.09, null);
        });
      },
      playPickup: function () {
        playTone("triangle", 900, 120, 0.08, 1200);
      },
      playPlayerDamage: function () {
        playNoise(80, 0.09, 200);
        playTone("square", 90, 80, 0.06, 50);
      },
      playCompanionSpeech: function () {
        playTone("triangle", 540, 55, 0.05, null);
        scene.time.delayedCall(45, function () {
          playTone("triangle", 620, 50, 0.05, null);
        });
        scene.time.delayedCall(90, function () {
          playTone("triangle", 700, 45, 0.05, null);
        });
      },
      playFloorTransition: function () {
        playTone("sine", 70, 360, 0.1, 40);
        scene.time.delayedCall(80, function () {
          playTone("triangle", 180, 260, 0.08, 520);
        });
      }
    };
  }

  function randomInt(scene, min, max) {
    return Phaser.Math.Between(min, max);
  }

  function choose(scene, list) {
    return list[randomInt(scene, 0, list.length - 1)];
  }

  class GameScene extends Phaser.Scene {
    constructor() {
      super("GameScene");
      this.runState = null;
      this.layout = null;
      this.player = null;
      this.companion = null;
      this.enemies = null;
      this.items = null;
      this.chests = null;
      this.playerLight = null;
      this.companionLight = null;
      this.exitLight = null;
      this.exitPulseTween = null;
      this.exitZone = null;
      this.exitActive = false;
      this.transitioning = false;
      this.currentRoom = null;
      this.pendingRoomCallout = false;
      this.pendingRoomLine = null;
      this.lastHudBroadcastAt = 0;
      this.lastMapBroadcastAt = 0;
      this.lastFootstepAt = 0;
      this.playerFacing = new Phaser.Math.Vector2(1, 0);
      this.playerInvulnUntil = 0;
      this.playerAttackReadyAt = 0;
      this.companionState = null;
      this.audioSystem = null;
      this.vignette = null;
      this.fogOverlay = null;
    }

    init(data) {
      var cfg = window.DungeonCrawl.CONFIG;
      var incoming = data && data.runState ? data.runState : null;
      if (incoming) {
        this.runState = incoming;
      } else {
        this.runState = {
          floor: 1,
          score: 0,
          kills: 0,
          itemsCollected: 0,
          coins: 0,
          keys: 0,
          player: {
            hp: cfg.PLAYER.MAX_HP,
            maxHP: cfg.PLAYER.MAX_HP,
            attack: cfg.PLAYER.START_ATTACK,
            defense: cfg.PLAYER.START_DEFENSE
          },
          companion: {
            hp: cfg.COMPANION.MAX_HP,
            maxHP: cfg.COMPANION.MAX_HP,
            fainted: false
          }
        };
      }
    }

    create() {
      this.cfg = window.DungeonCrawl.CONFIG;
      this.eventBus = window.DungeonCrawl.EVENT_BUS;
      this.transitioning = false;

      this.keys = this.input.keyboard.addKeys({
        up: "W",
        down: "S",
        left: "A",
        right: "D",
        attack: "SPACE",
        interact: "E"
      });

      this.audioSystem = createAudioSystem(this);
      this.input.keyboard.once("keydown", this.audioSystem.unlock, this.audioSystem);
      this.input.once("pointerdown", this.audioSystem.unlock, this.audioSystem);

      this.lights.enable().setAmbientColor(this.cfg.LIGHTING.AMBIENT);

      this.buildFloor();
      this.createAtmosphere();
      this.cameras.main.fadeIn(this.cfg.FX.FADE_DURATION_MS);

      this.input.on("pointerdown", this.onPointerDown, this);
      this.events.once("shutdown", this.onShutdown, this);

      this.broadcastHud(true);
      this.broadcastMap(true);
    }

    onShutdown() {
      this.input.off("pointerdown", this.onPointerDown, this);
    }

    buildFloor() {
      this.layout = this.generateDungeonLayout(this.runState.floor);
      this.createTilemapFromLayout(this.layout);
      this.createGroups();
      this.spawnPlayerAndCompanion();
      this.spawnEnemies();
      this.spawnChests();
      this.setupColliders();
      this.setupWorldFx();
      this.setupExit();
      this.setupCamera();
      this.createCompanionUi();
      this.markCurrentRoomByPlayerPosition(true);
    }

    generateDungeonLayout(floorNum) {
      var cfg = this.cfg;
      var width = cfg.DUNGEON.MIN_WIDTH + Math.min(8, floorNum - 1) * 2;
      var height = cfg.DUNGEON.MIN_HEIGHT + Math.min(6, floorNum - 1) * 2;
      var roomTarget =
        randomInt(this, cfg.DUNGEON.BASE_ROOMS_MIN, cfg.DUNGEON.BASE_ROOMS_MAX) +
        Math.floor((floorNum - 1) * cfg.DUNGEON.ROOMS_PER_FLOOR_BONUS);
      var grid = [];
      var rooms = [];
      var attempts = roomTarget * 20;
      var i;

      for (i = 0; i < height; i += 1) {
        grid[i] = [];
        for (var x = 0; x < width; x += 1) {
          grid[i][x] = 1;
        }
      }

      for (i = 0; i < attempts && rooms.length < roomTarget; i += 1) {
        var roomW = randomInt(this, cfg.DUNGEON.ROOM_WIDTH_MIN, cfg.DUNGEON.ROOM_WIDTH_MAX);
        var roomH = randomInt(this, cfg.DUNGEON.ROOM_HEIGHT_MIN, cfg.DUNGEON.ROOM_HEIGHT_MAX);
        var roomX = randomInt(this, 1, width - roomW - 2);
        var roomY = randomInt(this, 1, height - roomH - 2);
        var candidate = {
          id: rooms.length,
          x: roomX,
          y: roomY,
          w: roomW,
          h: roomH,
          cx: roomX + Math.floor(roomW / 2),
          cy: roomY + Math.floor(roomH / 2)
        };
        if (this.roomOverlaps(candidate, rooms, cfg.DUNGEON.ROOM_PADDING)) {
          continue;
        }
        rooms.push(candidate);
        this.carveRect(grid, roomX, roomY, roomW, roomH, 0);
      }

      if (rooms.length < 2) {
        rooms = [
          { id: 0, x: 2, y: 2, w: 8, h: 8, cx: 6, cy: 6 },
          {
            id: 1,
            x: width - 10,
            y: height - 10,
            w: 8,
            h: 8,
            cx: width - 6,
            cy: height - 6
          }
        ];
        for (var yy = 0; yy < height; yy += 1) {
          for (var xx = 0; xx < width; xx += 1) {
            grid[yy][xx] = 1;
          }
        }
        this.carveRect(grid, rooms[0].x, rooms[0].y, rooms[0].w, rooms[0].h, 0);
        this.carveRect(grid, rooms[1].x, rooms[1].y, rooms[1].w, rooms[1].h, 0);
      }

      rooms.sort(function (a, b) {
        return a.cx - b.cx;
      });
      for (i = 0; i < rooms.length; i += 1) {
        rooms[i].id = i;
      }

      for (i = 1; i < rooms.length; i += 1) {
        this.connectRooms(grid, rooms[i - 1], rooms[i]);
      }

      var entranceRoom = rooms[0];
      var exitRoom = rooms[rooms.length - 1];
      var entrance = { x: entranceRoom.cx, y: entranceRoom.cy };
      var exit = { x: exitRoom.cx, y: exitRoom.cy };

      grid[entrance.y][entrance.x] = 3;
      grid[exit.y][exit.x] = 2;

      var enemySpawns = [];
      var chests = [];
      var roomEnemyMaxBonus = Math.floor((floorNum - 1) / 2);

      for (i = 1; i < rooms.length; i += 1) {
        var room = rooms[i];
        var enemyCount = randomInt(
          this,
          cfg.DUNGEON.ENEMIES_PER_ROOM_MIN,
          cfg.DUNGEON.ENEMIES_PER_ROOM_MAX + roomEnemyMaxBonus
        );

        for (var n = 0; n < enemyCount; n += 1) {
          enemySpawns.push({
            roomId: room.id,
            tx: randomInt(this, room.x + 1, room.x + room.w - 2),
            ty: randomInt(this, room.y + 1, room.y + room.h - 2),
            type: this.rollEnemyType(floorNum)
          });
        }

        if (Math.random() < cfg.DUNGEON.CHEST_CHANCE) {
          chests.push({
            roomId: room.id,
            tx: randomInt(this, room.x + 1, room.x + room.w - 2),
            ty: randomInt(this, room.y + 1, room.y + room.h - 2),
            opened: false,
            drops: this.rollChestDrops()
          });
        }
      }

      if (chests.length === 0) {
        chests.push({
          roomId: exitRoom.id,
          tx: exitRoom.cx,
          ty: exitRoom.cy - 1,
          opened: false,
          drops: this.rollChestDrops()
        });
      }

      choose(this, chests).drops.push(this.cfg.ITEMS.KEY);
      if (Math.random() < this.cfg.ITEMS.GEM_FLOOR_CHANCE) {
        choose(this, chests).drops.push(this.cfg.ITEMS.ATTACK_GEM);
      }
      if (Math.random() < this.cfg.ITEMS.GEM_FLOOR_CHANCE) {
        choose(this, chests).drops.push(this.cfg.ITEMS.DEFENSE_GEM);
      }

      return {
        width: width,
        height: height,
        grid: grid,
        rooms: rooms,
        entrance: entrance,
        exit: exit,
        enemySpawns: enemySpawns,
        chestSpawns: chests,
        explored: {}
      };
    }

    rollEnemyType(floorNum) {
      if (floorNum >= 3 && Math.random() < 0.28) {
        return "WRAITH";
      }
      return Math.random() < 0.55 ? "SKELETON" : "SLIME";
    }

    rollChestDrops() {
      var cfg = this.cfg;
      var count = randomInt(this, cfg.ITEMS.CHEST_DROP_MIN, cfg.ITEMS.CHEST_DROP_MAX);
      var drops = [];
      for (var i = 0; i < count; i += 1) {
        var roll = Math.random();
        if (roll < 0.55) {
          drops.push(cfg.ITEMS.COIN);
        } else if (roll < 0.85) {
          drops.push(cfg.ITEMS.POTION);
        } else {
          drops.push(cfg.ITEMS.COIN);
          drops.push(cfg.ITEMS.POTION);
        }
      }
      return drops;
    }

    roomOverlaps(candidate, rooms, padding) {
      for (var i = 0; i < rooms.length; i += 1) {
        var room = rooms[i];
        var separated =
          candidate.x + candidate.w + padding < room.x ||
          room.x + room.w + padding < candidate.x ||
          candidate.y + candidate.h + padding < room.y ||
          room.y + room.h + padding < candidate.y;
        if (!separated) {
          return true;
        }
      }
      return false;
    }

    carveRect(grid, x, y, w, h, tileValue) {
      for (var ty = y; ty < y + h; ty += 1) {
        for (var tx = x; tx < x + w; tx += 1) {
          grid[ty][tx] = tileValue;
        }
      }
    }

    connectRooms(grid, roomA, roomB) {
      var x = roomA.cx;
      var y = roomA.cy;
      while (x !== roomB.cx) {
        grid[y][x] = 0;
        x += x < roomB.cx ? 1 : -1;
      }
      while (y !== roomB.cy) {
        grid[y][x] = 0;
        y += y < roomB.cy ? 1 : -1;
      }
      grid[y][x] = 0;
    }

    createTilemapFromLayout(layout) {
      var cfg = this.cfg;
      this.map = this.make.tilemap({
        data: layout.grid,
        tileWidth: cfg.TILE_SIZE,
        tileHeight: cfg.TILE_SIZE
      });
      this.tileset = this.map.addTilesetImage("dungeon-tiles");
      this.layer = this.map.createLayer(0, this.tileset, 0, 0);
      this.layer.setDepth(cfg.DEPTH.TILE);
      this.layer.setPipeline("Light2D");
      this.layer.setCollision([1]);

      this.physics.world.setBounds(
        0,
        0,
        layout.width * cfg.TILE_SIZE,
        layout.height * cfg.TILE_SIZE,
        true,
        true,
        true,
        true
      );
    }

    createGroups() {
      this.enemies = this.physics.add.group();
      this.items = this.physics.add.group();
      this.chests = this.physics.add.group();
    }

    setupCamera() {
      var worldWidth = this.layout.width * this.cfg.TILE_SIZE;
      var worldHeight = this.layout.height * this.cfg.TILE_SIZE;
      this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
      this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
      this.cameras.main.setBackgroundColor(this.cfg.GAME.BACKGROUND);
    }

    tileToWorld(tileX, tileY) {
      return {
        x: tileX * this.cfg.TILE_SIZE + this.cfg.TILE_SIZE * 0.5,
        y: tileY * this.cfg.TILE_SIZE + this.cfg.TILE_SIZE * 0.5
      };
    }

    spawnPlayerAndCompanion() {
      var cfg = this.cfg;
      var entry = this.tileToWorld(this.layout.entrance.x, this.layout.entrance.y);
      this.player = this.physics.add.sprite(entry.x, entry.y, "player");
      this.player.setDepth(cfg.DEPTH.PLAYER);
      this.player.setPipeline("Light2D");
      this.player.setCollideWorldBounds(true);
      this.player.body.setSize(cfg.PLAYER.WIDTH * 0.65, cfg.PLAYER.HEIGHT * 0.7, true);

      var companionX = entry.x - cfg.COMPANION.FOLLOW_MAX;
      var companionY = entry.y + cfg.COMPANION.FOLLOW_MIN * 0.35;
      this.companion = this.physics.add.sprite(companionX, companionY, "companion");
      this.companion.setDepth(cfg.DEPTH.COMPANION);
      this.companion.setPipeline("Light2D");
      this.companion.setCollideWorldBounds(true);
      this.companion.body.setSize(cfg.COMPANION.WIDTH * 0.7, cfg.COMPANION.HEIGHT * 0.7, true);
      this.companion.setData("animState", "idle");
      this.tweens.add({
        targets: this.companion,
        scaleY: 1.05,
        yoyo: true,
        repeat: -1,
        duration: 420
      });

      this.playerLight = this.lights.addLight(
        this.player.x,
        this.player.y,
        cfg.LIGHTING.PLAYER_RADIUS,
        cfg.LIGHTING.PLAYER_COLOR,
        cfg.LIGHTING.PLAYER_INTENSITY
      );
      this.companionLight = this.lights.addLight(
        this.companion.x,
        this.companion.y,
        cfg.LIGHTING.COMPANION_RADIUS,
        cfg.LIGHTING.COMPANION_COLOR,
        cfg.LIGHTING.COMPANION_INTENSITY
      );

      this.companionState = {
        queue: [],
        currentAction: null,
        lastThinkAt: 0,
        followDistance: cfg.COMPANION.FOLLOW_MAX,
        closeFollow: false
      };

      if (this.runState.companion.fainted) {
        this.companion.setTint(0x555555);
      }
    }

    spawnEnemies() {
      var cfg = this.cfg;
      var hpScale = Math.pow(cfg.FLOOR_SCALING.HP_MULTIPLIER, this.runState.floor - 1);
      var damageScale = (this.runState.floor - 1) * cfg.FLOOR_SCALING.DAMAGE_ADD;

      for (var i = 0; i < this.layout.enemySpawns.length; i += 1) {
        var spawn = this.layout.enemySpawns[i];
        var worldPos = this.tileToWorld(spawn.tx, spawn.ty);
        var enemyCfg = cfg.ENEMIES[spawn.type];
        var enemy = this.physics.add.sprite(worldPos.x, worldPos.y, enemyCfg.KEY);
        enemy.setDepth(cfg.DEPTH.ENEMIES);
        enemy.setPipeline("Light2D");
        enemy.setData("enemyType", spawn.type);
        enemy.setData("roomId", spawn.roomId);
        enemy.setData("hp", Math.round(enemyCfg.HP * hpScale));
        enemy.setData("maxHP", Math.round(enemyCfg.HP * hpScale));
        enemy.setData("attack", enemyCfg.DAMAGE + damageScale);
        enemy.setData("defense", enemyCfg.DEFENSE);
        enemy.setData("speed", enemyCfg.SPEED);
        enemy.setData("aggro", false);
        enemy.setData("nextHitPlayerAt", 0);
        enemy.setData("nextHitCompanionAt", 0);
        enemy.setData("patrolIndex", 0);
        enemy.setData("patrolA", this.randomRoomPoint(spawn.roomId));
        enemy.setData("patrolB", this.randomRoomPoint(spawn.roomId));
        enemy.setCollideWorldBounds(spawn.type !== "WRAITH");

        if (spawn.type === "WRAITH") {
          enemy.setAlpha(cfg.ENEMIES.WRAITH.ALPHA);
        }

        if (spawn.type === "SLIME") {
          this.tweens.add({
            targets: enemy,
            scaleY: 0.9,
            scaleX: 1.08,
            yoyo: true,
            duration: 330,
            repeat: -1
          });
        }

        this.enemies.add(enemy);
      }
    }

    spawnChests() {
      var cfg = this.cfg;
      for (var i = 0; i < this.layout.chestSpawns.length; i += 1) {
        var spawn = this.layout.chestSpawns[i];
        var pos = this.tileToWorld(spawn.tx, spawn.ty);
        var chest = this.physics.add.sprite(pos.x, pos.y, cfg.ITEMS.CHEST_CLOSED);
        chest.body.setImmovable(true);
        chest.body.moves = false;
        chest.setPipeline("Light2D");
        chest.setDepth(cfg.DEPTH.ITEMS);
        chest.setData("opened", false);
        chest.setData("drops", spawn.drops.slice());
        chest.setData("roomId", spawn.roomId);
        chest.setData(
          "glowLight",
          this.lights.addLight(chest.x, chest.y, cfg.LIGHTING.CHEST_RADIUS, cfg.LIGHTING.CHEST_COLOR, 0)
        );
        this.chests.add(chest);
      }
    }

    setupColliders() {
      var scene = this;
      this.physics.add.collider(this.player, this.layer);
      this.physics.add.collider(this.companion, this.layer);
      this.physics.add.collider(
        this.enemies,
        this.layer,
        null,
        function (enemy) {
          return enemy.getData("enemyType") !== "WRAITH";
        },
        this
      );
      this.physics.add.collider(this.player, this.chests);
      this.physics.add.collider(this.companion, this.chests);

      this.physics.add.overlap(this.player, this.enemies, function (player, enemy) {
        scene.handleEnemyContactWithPlayer(enemy);
      });
      this.physics.add.overlap(this.companion, this.enemies, function (companion, enemy) {
        scene.handleEnemyContactWithCompanion(enemy);
      });
      this.physics.add.overlap(this.player, this.items, function (player, item) {
        scene.collectItem(item, false);
      });
    }

    setupWorldFx() {
      var cfg = this.cfg;

      this.torchEmitter = this.add.particles(this.player.x, this.player.y - 10, "particle-spark", {
        speedX: { min: -10, max: 10 },
        speedY: { min: -60, max: -20 },
        lifespan: 700,
        quantity: 1,
        frequency: 170,
        scale: { start: 1, end: 0.1 },
        tint: [0xffaa44, 0xff8844],
        blendMode: "ADD"
      });
      this.torchEmitter.setDepth(cfg.DEPTH.WORLD_UI);

      this.dustEmitter = this.add.particles(0, 0, "particle-dust", {
        x: { min: 0, max: this.layout.width * cfg.TILE_SIZE },
        y: { min: 0, max: this.layout.height * cfg.TILE_SIZE },
        speedX: { min: -4, max: 4 },
        speedY: { min: -4, max: 4 },
        lifespan: 7000,
        quantity: 1,
        frequency: 260,
        alpha: { start: cfg.FX.DUST_ALPHA, end: 0 },
        scale: { start: 0.6, end: 0.1 }
      });
      this.dustEmitter.setDepth(cfg.DEPTH.TILE + 1);

      this.hitEmitter = this.add.particles(0, 0, "particle-dot", {
        speed: { min: 50, max: 170 },
        lifespan: 320,
        scale: { start: 1, end: 0 },
        quantity: 16,
        emitting: false,
        blendMode: "ADD"
      });

      this.pickupEmitter = this.add.particles(0, 0, "particle-dot", {
        speedY: { min: -80, max: -30 },
        speedX: { min: -40, max: 40 },
        lifespan: 420,
        scale: { start: 0.8, end: 0 },
        quantity: 12,
        emitting: false,
        blendMode: "ADD"
      });

      this.thinkEmitter = this.add.particles(0, 0, "particle-think", {
        speedY: { min: -18, max: -8 },
        speedX: { min: -8, max: 8 },
        lifespan: 700,
        scale: { start: 0.8, end: 0 },
        quantity: 6,
        emitting: false,
        blendMode: "ADD"
      });

      this.transitionEmitter = this.add.particles(0, 0, "particle-dot", {
        speed: { min: 60, max: 200 },
        lifespan: 600,
        scale: { start: 1.2, end: 0 },
        quantity: 40,
        emitting: false,
        blendMode: "ADD"
      });
    }

    setupExit() {
      var cfg = this.cfg;
      var exitPos = this.tileToWorld(this.layout.exit.x, this.layout.exit.y);
      this.exitZone = this.add.zone(exitPos.x, exitPos.y, cfg.TILE_SIZE * 0.9, cfg.TILE_SIZE * 0.9);
      this.physics.world.enable(this.exitZone);
      this.exitZone.body.moves = false;
      this.exitZone.body.setAllowGravity(false);

      this.exitLight = this.lights.addLight(
        exitPos.x,
        exitPos.y,
        cfg.LIGHTING.EXIT_RADIUS,
        cfg.LIGHTING.EXIT_COLOR,
        cfg.LIGHTING.EXIT_INTENSITY_IDLE
      );
      this.exitActive = this.enemies.countActive(true) === 0;
      if (this.exitActive) {
        this.activateExit();
      }
    }

    activateExit() {
      if (this.exitActive && this.exitPulseTween) {
        return;
      }
      this.exitActive = true;
      this.exitLight.intensity = this.cfg.LIGHTING.EXIT_INTENSITY_ACTIVE;
      if (this.exitPulseTween) {
        this.exitPulseTween.stop();
      }
      this.exitPulseTween = this.tweens.add({
        targets: this.exitLight,
        radius: {
          from: this.cfg.LIGHTING.EXIT_RADIUS - 10,
          to: this.cfg.LIGHTING.EXIT_RADIUS + 20
        },
        intensity: {
          from: this.cfg.LIGHTING.EXIT_INTENSITY_ACTIVE - 0.3,
          to: this.cfg.LIGHTING.EXIT_INTENSITY_ACTIVE + 0.7
        },
        yoyo: true,
        duration: 720,
        repeat: -1
      });
    }

    createCompanionUi() {
      this.companionHpGraphics = this.add.graphics().setDepth(this.cfg.DEPTH.WORLD_UI);

      var bubbleBg = this.add.image(0, 0, "speech-bubble");
      var bubbleText = this.add
        .text(0, -6, "", {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "11px",
          color: "#e7ecff",
          align: "center",
          wordWrap: { width: 82 }
        })
        .setOrigin(0.5);
      this.companionSpeech = this.add.container(0, 0, [bubbleBg, bubbleText]);
      this.companionSpeech.setDepth(this.cfg.DEPTH.WORLD_UI);
      this.companionSpeech.setVisible(false);
      this.companionSpeech.setAlpha(0);
      this.companionSpeechText = bubbleText;
    }

    createAtmosphere() {
      this.fogOverlay = this.add
        .tileSprite(0, 0, this.cfg.GAME.WIDTH, this.cfg.GAME.HEIGHT, "fog")
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(this.cfg.DEPTH.SCREEN_FX - 2)
        .setAlpha(0.22);

      this.vignette = this.add
        .image(this.cfg.GAME.WIDTH * 0.5, this.cfg.GAME.HEIGHT * 0.5, "vignette")
        .setScrollFactor(0)
        .setDepth(this.cfg.DEPTH.SCREEN_FX)
        .setAlpha(0.4)
        .setBlendMode(Phaser.BlendModes.MULTIPLY)
        .setDisplaySize(this.cfg.GAME.WIDTH, this.cfg.GAME.HEIGHT);
    }

    onPointerDown(pointer) {
      if (pointer.button !== 0) {
        return;
      }
      var opened = this.tryOpenNearestChest(80, pointer.worldX, pointer.worldY);
      if (!opened) {
        this.tryPlayerAttack(pointer.worldX, pointer.worldY);
      }
    }

    update(time, delta) {
      if (!this.player || this.transitioning) {
        return;
      }

      this.updatePlayerInput(time);
      this.updateEnemyAI(time);
      this.updateCompanionBrain(time);
      this.updateCompanionAction(time);
      this.updateCompanionUi();
      this.updateLights(time);
      this.updateAtmosphere(delta);
      this.updateChestGlow();
      this.markCurrentRoomByPlayerPosition(false);
      this.checkExitTrigger();
      this.broadcastHud(false);
      this.broadcastMap(false);

      if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
        this.tryPlayerAttack();
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
        this.tryOpenNearestChest(this.cfg.TILE_SIZE * 1.2, this.player.x, this.player.y);
      }
    }

    updatePlayerInput(time) {
      var cfg = this.cfg;
      var vx = 0;
      var vy = 0;

      if (this.keys.left.isDown) {
        vx -= 1;
      }
      if (this.keys.right.isDown) {
        vx += 1;
      }
      if (this.keys.up.isDown) {
        vy -= 1;
      }
      if (this.keys.down.isDown) {
        vy += 1;
      }

      var isMoving = vx !== 0 || vy !== 0;
      if (isMoving) {
        var vec = new Phaser.Math.Vector2(vx, vy).normalize().scale(cfg.PLAYER.SPEED);
        this.player.setVelocity(vec.x, vec.y);
        this.playerFacing.set(vec.x, vec.y).normalize();
        if (time - this.lastFootstepAt >= cfg.AUDIO.FOOTSTEP_INTERVAL_MS) {
          this.audioSystem.playFootstep();
          this.lastFootstepAt = time;
        }
      } else {
        this.player.setVelocity(0, 0);
      }
    }

    tryPlayerAttack(targetWorldX, targetWorldY) {
      var now = this.time.now;
      var cfg = this.cfg;
      if (now < this.playerAttackReadyAt || this.transitioning) {
        return;
      }
      this.playerAttackReadyAt = now + cfg.PLAYER.ATTACK_COOLDOWN_MS;

      if (typeof targetWorldX === "number" && typeof targetWorldY === "number") {
        var toward = new Phaser.Math.Vector2(targetWorldX - this.player.x, targetWorldY - this.player.y);
        if (toward.lengthSq() > 0) {
          this.playerFacing = toward.normalize();
        }
      }

      this.audioSystem.playSlash();
      this.hitEmitter.setParticleTint(0xf5f5ff);
      this.hitEmitter.explode(14, this.player.x + this.playerFacing.x * 16, this.player.y + this.playerFacing.y * 16);

      var arcHalfRad = Phaser.Math.DegToRad(cfg.PLAYER.ATTACK_ARC_DEG * 0.5);
      var range = cfg.PLAYER.ATTACK_RANGE;
      var scene = this;

      this.enemies.children.each(function (enemy) {
        if (!enemy.active) {
          return;
        }
        var toEnemy = new Phaser.Math.Vector2(enemy.x - scene.player.x, enemy.y - scene.player.y);
        var distance = toEnemy.length();
        if (distance > range) {
          return;
        }
        var angle = Phaser.Math.Angle.BetweenPoints(scene.player, enemy);
        var facingAngle = Math.atan2(scene.playerFacing.y, scene.playerFacing.x);
        var angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle - facingAngle));
        if (angleDiff <= arcHalfRad) {
          scene.applyDamageToEnemy(enemy, scene.runState.player.attack, scene.player);
        }
      });
    }

    applyDamageToEnemy(enemy, attackValue, attackerSprite) {
      if (!enemy.active) {
        return;
      }
      var damage = Math.max(1, attackValue - enemy.getData("defense"));
      enemy.setData("hp", enemy.getData("hp") - damage);
      enemy.setTintFill(0xffffff);
      this.time.delayedCall(this.cfg.FX.DAMAGE_FLASH_MS, function () {
        if (enemy.active) {
          enemy.clearTint();
        }
      });
      this.audioSystem.playEnemyHit();

      var knock = new Phaser.Math.Vector2(enemy.x - attackerSprite.x, enemy.y - attackerSprite.y).normalize();
      enemy.body.velocity.x += knock.x * this.cfg.PLAYER.HIT_KNOCKBACK * 12;
      enemy.body.velocity.y += knock.y * this.cfg.PLAYER.HIT_KNOCKBACK * 12;

      this.hitEmitter.setParticleTint(this.cfg.ENEMIES[enemy.getData("enemyType")].COLOR);
      this.hitEmitter.explode(8, enemy.x, enemy.y);

      if (enemy.getData("hp") <= 0) {
        this.killEnemy(enemy);
      }
    }

    handleEnemyContactWithPlayer(enemy) {
      var now = this.time.now;
      if (now < enemy.getData("nextHitPlayerAt") || now < this.playerInvulnUntil) {
        return;
      }
      enemy.setData("nextHitPlayerAt", now + 1000);
      this.playerInvulnUntil = now + this.cfg.PLAYER.INVULN_MS;

      var damage = Math.max(1, enemy.getData("attack") - this.runState.player.defense);
      this.runState.player.hp = Math.max(0, this.runState.player.hp - damage);
      this.player.setTintFill(0xffffff);
      this.time.delayedCall(this.cfg.FX.DAMAGE_FLASH_MS, () => {
        if (this.player.active) {
          this.player.clearTint();
        }
      });

      this.tweens.killTweensOf(this.player);
      this.tweens.add({
        targets: this.player,
        alpha: 0.35,
        yoyo: true,
        repeat: 4,
        duration: 45,
        onComplete: () => {
          this.player.alpha = 1;
        }
      });

      this.audioSystem.playPlayerDamage();
      this.hitEmitter.setParticleTint(0xff5566);
      this.hitEmitter.explode(10, this.player.x, this.player.y);
      this.cameras.main.shake(this.cfg.FX.CAMERA_SHAKE_MS, this.cfg.FX.CAMERA_SHAKE_INTENSITY);

      var knock = new Phaser.Math.Vector2(this.player.x - enemy.x, this.player.y - enemy.y).normalize();
      this.player.body.velocity.x += knock.x * this.cfg.PLAYER.HIT_KNOCKBACK * 14;
      this.player.body.velocity.y += knock.y * this.cfg.PLAYER.HIT_KNOCKBACK * 14;

      if (this.runState.player.hp <= 0) {
        this.triggerGameOver();
      }
    }

    handleEnemyContactWithCompanion(enemy) {
      var now = this.time.now;
      if (this.runState.companion.fainted || now < enemy.getData("nextHitCompanionAt")) {
        return;
      }
      enemy.setData("nextHitCompanionAt", now + 1000);

      var damage = Math.max(1, enemy.getData("attack") - 1);
      this.runState.companion.hp = Math.max(0, this.runState.companion.hp - damage);

      this.companion.setTintFill(0xffffff);
      this.time.delayedCall(this.cfg.FX.DAMAGE_FLASH_MS, () => {
        if (this.companion.active && !this.runState.companion.fainted) {
          this.companion.clearTint();
        }
      });

      var knock = new Phaser.Math.Vector2(this.companion.x - enemy.x, this.companion.y - enemy.y).normalize();
      this.companion.body.velocity.x += knock.x * this.cfg.PLAYER.HIT_KNOCKBACK * 10;
      this.companion.body.velocity.y += knock.y * this.cfg.PLAYER.HIT_KNOCKBACK * 10;

      if (this.runState.companion.hp <= 0) {
        this.runState.companion.fainted = true;
        this.companion.setData("animState", "hurt");
        this.companion.setTint(0x555555);
        this.companion.body.setVelocity(0, 0);
        this.companionState.queue.length = 0;
        this.companionState.currentAction = null;
        this.showCompanionSpeech("I'll recover next floor...");
      }
    }

    killEnemy(enemy) {
      var enemyType = enemy.getData("enemyType");
      this.audioSystem.playEnemyDeath();

      this.hitEmitter.setParticleTint(this.cfg.ENEMIES[enemyType].COLOR);
      this.hitEmitter.explode(20, enemy.x, enemy.y);
      this.dropEnemyLoot(enemy.x, enemy.y);

      enemy.disableBody(true, true);
      enemy.destroy();

      this.runState.kills += 1;
      this.runState.score += this.cfg.SCORE.KILL;

      if (this.enemies.countActive(true) === 0) {
        this.activateExit();
      }
    }

    dropEnemyLoot(x, y) {
      if (Math.random() < 0.65) {
        this.spawnItem(this.cfg.ITEMS.COIN, x, y);
      } else if (Math.random() < 0.2) {
        this.spawnItem(this.cfg.ITEMS.POTION, x, y);
      }
    }

    spawnItem(itemType, x, y) {
      var item = this.physics.add.sprite(x, y, itemType);
      item.setDepth(this.cfg.DEPTH.ITEMS);
      item.setPipeline("Light2D");
      item.setData("itemType", itemType);
      item.body.setCircle(6);
      this.items.add(item);

      this.tweens.add({
        targets: item,
        y: item.y - 5,
        yoyo: true,
        repeat: -1,
        duration: 700,
        ease: "Sine.easeInOut"
      });
      return item;
    }

    collectItem(item, collectedByCompanion) {
      if (!item.active) {
        return;
      }
      var itemType = item.getData("itemType");
      var pickupMessage = "";

      if (itemType === this.cfg.ITEMS.POTION) {
        this.runState.player.hp = Math.min(
          this.runState.player.maxHP,
          this.runState.player.hp + this.cfg.ITEMS.POTION_HEAL
        );
        pickupMessage = "Health Potion +30 HP";
      } else if (itemType === this.cfg.ITEMS.COIN) {
        this.runState.score += this.cfg.ITEMS.COIN_SCORE;
        this.runState.coins += 1;
        pickupMessage = "Coin +10 score";
      } else if (itemType === this.cfg.ITEMS.KEY) {
        this.runState.keys += 1;
        pickupMessage = "Key acquired";
      } else if (itemType === this.cfg.ITEMS.ATTACK_GEM) {
        this.runState.player.attack += this.cfg.ITEMS.ATTACK_GEM_BONUS;
        pickupMessage = "Attack Gem +3 ATK";
      } else if (itemType === this.cfg.ITEMS.DEFENSE_GEM) {
        this.runState.player.defense += this.cfg.ITEMS.DEFENSE_GEM_BONUS;
        pickupMessage = "Defense Gem +1 DEF";
      }

      this.runState.itemsCollected += 1;
      this.audioSystem.playPickup();
      this.pickupEmitter.setParticleTint(0xffef95);
      this.pickupEmitter.explode(12, item.x, item.y);

      var prefix = collectedByCompanion ? "Companion: " : "";
      this.eventBus.emit(this.cfg.EVENTS.ITEM_PICKED, prefix + pickupMessage);
      this.eventBus.emit(this.cfg.EVENTS.NOTIFY, prefix + pickupMessage);

      item.disableBody(true, true);
      item.destroy();
    }

    openChest(chest) {
      if (!chest.active || chest.getData("opened")) {
        return false;
      }

      chest.setData("opened", true);
      chest.setTexture(this.cfg.ITEMS.CHEST_OPEN);
      this.audioSystem.playChestOpen();
      this.pickupEmitter.setParticleTint(0xffc107);
      this.pickupEmitter.explode(25, chest.x, chest.y);

      var drops = chest.getData("drops");
      for (var i = 0; i < drops.length; i += 1) {
        var scatterX = chest.x + randomInt(this, -16, 16);
        var scatterY = chest.y + randomInt(this, -14, 14);
        this.spawnItem(drops[i], scatterX, scatterY);
      }
      return true;
    }

    tryOpenNearestChest(maxDistance, fromX, fromY) {
      var sourceX = typeof fromX === "number" ? fromX : this.player.x;
      var sourceY = typeof fromY === "number" ? fromY : this.player.y;
      var bestChest = null;
      var bestDistance = maxDistance;
      this.chests.children.each(function (chest) {
        if (!chest.active || chest.getData("opened")) {
          return;
        }
        var d = Phaser.Math.Distance.Between(sourceX, sourceY, chest.x, chest.y);
        if (d < bestDistance) {
          bestDistance = d;
          bestChest = chest;
        }
      });

      if (bestChest) {
        return this.openChest(bestChest);
      }
      return false;
    }

    randomRoomPoint(roomId) {
      var room = this.layout.rooms[roomId];
      var tx = randomInt(this, room.x + 1, room.x + room.w - 2);
      var ty = randomInt(this, room.y + 1, room.y + room.h - 2);
      return this.tileToWorld(tx, ty);
    }

    updateEnemyAI(time) {
      var scene = this;
      var playerRoomId = this.currentRoom ? this.currentRoom.id : -1;

      this.enemies.children.each(function (enemy) {
        if (!enemy.active) {
          return;
        }

        var enemyType = enemy.getData("enemyType");
        var speed = enemy.getData("speed");
        var roomId = enemy.getData("roomId");
        var aggro = enemy.getData("aggro");
        var distanceToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, scene.player.x, scene.player.y);
        if (!aggro && (distanceToPlayer <= scene.cfg.DUNGEON.AGGRO_RANGE || roomId === playerRoomId)) {
          enemy.setData("aggro", true);
          aggro = true;
        }

        if (aggro) {
          var target = scene.player;
          if (!scene.runState.companion.fainted) {
            var dComp = Phaser.Math.Distance.Between(enemy.x, enemy.y, scene.companion.x, scene.companion.y);
            if (dComp < distanceToPlayer * 0.9) {
              target = scene.companion;
            }
          }
          var dir = new Phaser.Math.Vector2(target.x - enemy.x, target.y - enemy.y);
          if (dir.lengthSq() > 0) {
            dir.normalize();
          }
          if (enemyType === "SLIME") {
            var wobble = Math.sin((time + enemy.x) * 0.02) * 0.23;
            var nx = dir.x - dir.y * wobble;
            var ny = dir.y + dir.x * wobble;
            enemy.setVelocity(nx * speed, ny * speed);
          } else {
            enemy.setVelocity(dir.x * speed, dir.y * speed);
          }
          return;
        }

        var targetIndex = enemy.getData("patrolIndex");
        var patrolPoint = enemy.getData(targetIndex === 0 ? "patrolA" : "patrolB");
        var toPoint = new Phaser.Math.Vector2(patrolPoint.x - enemy.x, patrolPoint.y - enemy.y);
        if (toPoint.length() < scene.cfg.TILE_SIZE * 0.3) {
          enemy.setData("patrolIndex", targetIndex === 0 ? 1 : 0);
          patrolPoint = enemy.getData(targetIndex === 0 ? "patrolB" : "patrolA");
          toPoint.set(patrolPoint.x - enemy.x, patrolPoint.y - enemy.y);
        }
        if (toPoint.lengthSq() > 0) {
          toPoint.normalize();
        }
        enemy.setVelocity(toPoint.x * speed * 0.75, toPoint.y * speed * 0.75);
      });
    }

    updateCompanionBrain(time) {
      if (this.runState.companion.fainted) {
        return;
      }

      if (time - this.companionState.lastThinkAt < this.cfg.COMPANION.THINK_INTERVAL_MS) {
        return;
      }
      this.companionState.lastThinkAt = time;

      var nearbyEnemies = this.getNearbyEntities(
        this.companion.x,
        this.companion.y,
        this.cfg.COMPANION.PICKUP_RANGE + this.cfg.TILE_SIZE,
        this.enemies
      );
      var nearbyItems = this.getNearbyEntities(
        this.companion.x,
        this.companion.y,
        this.cfg.COMPANION.PICKUP_RANGE,
        this.items
      );

      this.thinkEmitter.setParticleTint(0x9ec5ff);
      this.thinkEmitter.explode(5, this.companion.x, this.companion.y - 20);

      var state = {
        playerPos: { x: this.player.x, y: this.player.y },
        companionPos: { x: this.companion.x, y: this.companion.y },
        nearbyEnemies: nearbyEnemies,
        nearbyItems: nearbyItems,
        companionHP: this.runState.companion.hp,
        companionMaxHP: this.runState.companion.maxHP,
        playerHP: this.runState.player.hp,
        playerMaxHP: this.runState.player.maxHP,
        floorNum: this.runState.floor,
        newRoomEntered: this.pendingRoomCallout,
        roomLine: this.pendingRoomLine || choose(this, ROOM_LINES),
        actions: this.cfg.BRAIN_ACTIONS,
        dangerRange: this.cfg.COMPANION.DANGER_RANGE,
        pickupRange: this.cfg.COMPANION.PICKUP_RANGE
      };
      var decision = CompanionBrain.think(state);
      this.enqueueCompanionDecision(decision);
      this.pendingRoomCallout = false;
      this.pendingRoomLine = null;
    }

    getNearbyEntities(x, y, maxDistance, group) {
      var results = [];
      group.children.each(function (entity) {
        if (!entity.active) {
          return;
        }
        var d = Phaser.Math.Distance.Between(x, y, entity.x, entity.y);
        if (d <= maxDistance) {
          results.push({ entity: entity, distance: d });
        }
      });
      results.sort(function (a, b) {
        return a.distance - b.distance;
      });
      return results;
    }

    enqueueCompanionDecision(decision) {
      if (!decision) {
        return;
      }
      if (decision.action === this.cfg.BRAIN_ACTIONS.SAY && decision.message) {
        this.pushCompanionAction({
          action: this.cfg.BRAIN_ACTIONS.SAY,
          target: null,
          message: decision.message,
          closeFollow: false
        });

        if (decision.message === "Careful, master!") {
          this.pushCompanionAction({
            action: this.cfg.BRAIN_ACTIONS.FOLLOW,
            target: null,
            message: null,
            closeFollow: true
          });
          return;
        }

        this.pushCompanionAction({
          action: this.cfg.BRAIN_ACTIONS.FOLLOW,
          target: null,
          message: null,
          closeFollow: false
        });
        return;
      }

      if (decision.action === this.cfg.BRAIN_ACTIONS.ATTACK && decision.target) {
        this.pushCompanionAction({
          action: this.cfg.BRAIN_ACTIONS.ATTACK,
          target: decision.target,
          message: null,
          closeFollow: false
        });
        return;
      }

      if (decision.action === this.cfg.BRAIN_ACTIONS.PICKUP && decision.target) {
        this.pushCompanionAction({
          action: this.cfg.BRAIN_ACTIONS.PICKUP,
          target: decision.target,
          message: null,
          closeFollow: false
        });
        return;
      }

      this.pushCompanionAction({
        action: this.cfg.BRAIN_ACTIONS.FOLLOW,
        target: null,
        message: null,
        closeFollow: false
      });
    }

    pushCompanionAction(actionObj) {
      var queue = this.companionState.queue;
      if (queue.length >= this.cfg.COMPANION.ACTION_QUEUE_MAX) {
        return;
      }
      queue.push(actionObj);
    }

    updateCompanionAction(time) {
      if (this.runState.companion.fainted) {
        this.companion.setData("animState", "hurt");
        this.companion.setVelocity(0, 0);
        return;
      }

      if (!this.companionState.currentAction && this.companionState.queue.length > 0) {
        this.companionState.currentAction = this.companionState.queue.shift();
        this.companionState.currentAction.timeoutAt = time + this.cfg.COMPANION.ACTION_TIMEOUT_MS;
        if (this.companionState.currentAction.action === this.cfg.BRAIN_ACTIONS.SAY) {
          this.showCompanionSpeech(this.companionState.currentAction.message);
        }
      }

      if (!this.companionState.currentAction) {
        this.moveCompanionFollow(false);
        return;
      }

      var action = this.companionState.currentAction;
      if (action.action === this.cfg.BRAIN_ACTIONS.SAY) {
        this.companion.setData("animState", "idle");
        this.companionState.currentAction = null;
        return;
      }

      if (action.action === this.cfg.BRAIN_ACTIONS.FOLLOW) {
        this.companion.setData("animState", "following");
        this.moveCompanionFollow(action.closeFollow);
        if (time >= action.timeoutAt) {
          this.companionState.currentAction = null;
        }
        return;
      }

      if (action.action === this.cfg.BRAIN_ACTIONS.PICKUP) {
        this.companion.setData("animState", "following");
        if (!action.target || !action.target.active) {
          this.companionState.currentAction = null;
          return;
        }
        this.moveCompanionTo(action.target.x, action.target.y, this.cfg.COMPANION.SPEED);
        if (Phaser.Math.Distance.Between(this.companion.x, this.companion.y, action.target.x, action.target.y) <= 20) {
          this.collectItem(action.target, true);
          this.companionState.currentAction = null;
          return;
        }
        if (time >= action.timeoutAt) {
          this.companionState.currentAction = null;
        }
        return;
      }

      if (action.action === this.cfg.BRAIN_ACTIONS.ATTACK) {
        this.companion.setData("animState", "attacking");
        if (!action.target || !action.target.active) {
          this.companionState.currentAction = null;
          return;
        }
        this.moveCompanionTo(action.target.x, action.target.y, this.cfg.COMPANION.SPEED + 10);
        var attackDistance = Phaser.Math.Distance.Between(
          this.companion.x,
          this.companion.y,
          action.target.x,
          action.target.y
        );
        if (attackDistance <= this.cfg.COMPANION.ATTACK_RANGE) {
          this.applyDamageToEnemy(
            action.target,
            Math.max(1, Math.floor(this.runState.player.attack * this.cfg.COMPANION.ATTACK_MULTIPLIER)),
            this.companion
          );
          this.hitEmitter.setParticleTint(0x56d6ff);
          this.hitEmitter.explode(7, action.target.x, action.target.y);
          this.companionState.currentAction = null;
          return;
        }
        if (time >= action.timeoutAt) {
          this.companionState.currentAction = null;
        }
      }
    }

    moveCompanionFollow(closeFollow) {
      var targetDistance = closeFollow ? this.cfg.COMPANION.FOLLOW_MIN * 0.72 : this.cfg.COMPANION.FOLLOW_MAX;
      var followX = this.player.x - this.playerFacing.x * targetDistance;
      var followY = this.player.y - this.playerFacing.y * targetDistance;
      this.moveCompanionTo(followX, followY, this.cfg.COMPANION.SPEED);
    }

    moveCompanionTo(x, y, speed) {
      var dir = new Phaser.Math.Vector2(x - this.companion.x, y - this.companion.y);
      if (dir.length() < 8) {
        this.companion.setData("animState", "idle");
        this.companion.setVelocity(0, 0);
        return;
      }
      dir.normalize();
      this.companion.setVelocity(dir.x * speed, dir.y * speed);
    }

    showCompanionSpeech(message) {
      if (!message) {
        return;
      }
      this.audioSystem.playCompanionSpeech();
      this.companionSpeechText.setText(message);
      this.companionSpeech.setVisible(true);
      this.companionSpeech.setAlpha(0);
      this.companionSpeech.setScale(0.95);
      this.tweens.killTweensOf(this.companionSpeech);
      this.tweens.add({
        targets: this.companionSpeech,
        alpha: 1,
        scale: 1,
        duration: 150,
        onComplete: () => {
          this.time.delayedCall(this.cfg.COMPANION.BUBBLE_HOLD_MS, () => {
            this.tweens.add({
              targets: this.companionSpeech,
              alpha: 0,
              y: this.companionSpeech.y - 5,
              duration: 220,
              onComplete: () => {
                this.companionSpeech.setVisible(false);
              }
            });
          });
        }
      });
    }

    updateCompanionUi() {
      var cfg = this.cfg;
      var ratio = Phaser.Math.Clamp(this.runState.companion.hp / this.runState.companion.maxHP, 0, 1);
      var barWidth = 28;
      var x = this.companion.x - barWidth * 0.5;
      var y = this.companion.y - cfg.COMPANION.HEIGHT;

      this.companionHpGraphics.clear();
      this.companionHpGraphics.fillStyle(0x1f2638, 0.95);
      this.companionHpGraphics.fillRect(x - 1, y - 1, barWidth + 2, 5);
      this.companionHpGraphics.fillStyle(cfg.HUD.COMPANION_HP_COLOR, 1);
      this.companionHpGraphics.fillRect(x, y, barWidth * ratio, 3);

      if (this.companionSpeech.visible) {
        this.companionSpeech.setPosition(this.companion.x, this.companion.y - 38);
      }
    }

    updateLights(time) {
      var cfg = this.cfg;
      this.playerLight.x = this.player.x;
      this.playerLight.y = this.player.y;
      this.companionLight.x = this.companion.x;
      this.companionLight.y = this.companion.y;

      var wave = Math.sin(time * 0.018) * cfg.PLAYER.TORCH_FLICKER_AMPLITUDE;
      var jitter = Phaser.Math.Between(-2, 2);
      this.playerLight.radius = cfg.LIGHTING.PLAYER_RADIUS + wave + jitter;
      this.playerLight.intensity = cfg.LIGHTING.PLAYER_INTENSITY + Math.sin(time * 0.014) * 0.18;

      this.torchEmitter.setPosition(this.player.x, this.player.y - 12);
      if (this.runState.companion.fainted) {
        this.companionLight.intensity = 0.15;
      } else {
        this.companionLight.intensity = cfg.LIGHTING.COMPANION_INTENSITY;
      }
    }

    updateAtmosphere(delta) {
      if (this.fogOverlay) {
        this.fogOverlay.tilePositionX += delta * 0.008;
      }
    }

    updateChestGlow() {
      var cfg = this.cfg;
      this.chests.children.each(
        function (chest) {
          if (!chest.active) {
            return;
          }
          var light = chest.getData("glowLight");
          if (!light) {
            return;
          }
          light.x = chest.x;
          light.y = chest.y;
          var nearby = Phaser.Math.Distance.Between(this.player.x, this.player.y, chest.x, chest.y) < 110;
          if (nearby && !chest.getData("opened")) {
            light.intensity = cfg.LIGHTING.CHEST_INTENSITY;
          } else {
            light.intensity = 0;
          }
        },
        this
      );
    }

    markCurrentRoomByPlayerPosition(forceBroadcast) {
      var room = this.findRoomForPosition(this.player.x, this.player.y);
      if (!room) {
        return;
      }
      if (!this.currentRoom || this.currentRoom.id !== room.id) {
        this.currentRoom = room;
        this.pendingRoomCallout = true;
        this.pendingRoomLine = choose(this, ROOM_LINES);
        this.layout.explored[room.id] = true;
        this.eventBus.emit(this.cfg.EVENTS.ROOM_ENTERED, { roomId: room.id });
        this.broadcastMap(true);
      } else if (forceBroadcast) {
        this.layout.explored[room.id] = true;
      }
    }

    findRoomForPosition(worldX, worldY) {
      var tileX = Math.floor(worldX / this.cfg.TILE_SIZE);
      var tileY = Math.floor(worldY / this.cfg.TILE_SIZE);
      for (var i = 0; i < this.layout.rooms.length; i += 1) {
        var room = this.layout.rooms[i];
        if (tileX >= room.x && tileX < room.x + room.w && tileY >= room.y && tileY < room.y + room.h) {
          return room;
        }
      }
      return null;
    }

    checkExitTrigger() {
      if (!this.exitActive || this.transitioning) {
        return;
      }
      var d = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.exitZone.x, this.exitZone.y);
      if (d <= this.cfg.TILE_SIZE * 0.45) {
        this.advanceFloor();
      }
    }

    advanceFloor() {
      if (this.transitioning) {
        return;
      }
      this.transitioning = true;
      this.runState.score += this.cfg.SCORE.FLOOR_CLEAR;
      this.audioSystem.playFloorTransition();
      this.transitionEmitter.setParticleTint(0xc3d5ff);
      this.transitionEmitter.explode(60, this.player.x, this.player.y);
      this.eventBus.emit(this.cfg.EVENTS.FLOOR_TRANSITION, { fromFloor: this.runState.floor });

      this.cameras.main.fadeOut(this.cfg.FX.FADE_DURATION_MS, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.runState.floor += 1;
        if (this.runState.companion.fainted) {
          this.runState.companion.fainted = false;
          this.runState.companion.hp = Math.max(
            1,
            Math.round(this.runState.companion.maxHP * this.cfg.COMPANION.REVIVE_RATIO)
          );
        }
        this.scene.restart({ runState: this.runState });
      });
    }

    triggerGameOver() {
      if (this.transitioning) {
        return;
      }
      this.transitioning = true;
      this.eventBus.emit(this.cfg.EVENTS.GAME_OVER, {
        floorsReached: this.runState.floor,
        kills: this.runState.kills,
        score: this.runState.score,
        itemsCollected: this.runState.itemsCollected
      });

      this.cameras.main.fadeOut(this.cfg.FX.FADE_DURATION_MS, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.stop("HUDScene");
        this.scene.start("GameOverScene", {
          stats: {
            floorsReached: this.runState.floor,
            kills: this.runState.kills,
            score: this.runState.score,
            itemsCollected: this.runState.itemsCollected
          }
        });
      });
    }

    broadcastHud(force) {
      var now = this.time.now;
      if (!force && now - this.lastHudBroadcastAt < 90) {
        return;
      }
      this.lastHudBroadcastAt = now;
      this.eventBus.emit(this.cfg.EVENTS.HUD_UPDATE, {
        playerHP: this.runState.player.hp,
        playerMaxHP: this.runState.player.maxHP,
        companionHP: this.runState.companion.hp,
        companionMaxHP: this.runState.companion.maxHP,
        companionFainted: this.runState.companion.fainted,
        floor: this.runState.floor,
        score: this.runState.score,
        keys: this.runState.keys,
        coins: this.runState.coins,
        kills: this.runState.kills,
        playerAttack: this.runState.player.attack,
        playerDefense: this.runState.player.defense
      });
    }

    broadcastMap(force) {
      var now = this.time.now;
      if (!force && now - this.lastMapBroadcastAt < 180) {
        return;
      }
      this.lastMapBroadcastAt = now;
      this.eventBus.emit(this.cfg.EVENTS.MAP_UPDATE, {
        width: this.layout.width,
        height: this.layout.height,
        rooms: this.layout.rooms,
        explored: this.layout.explored,
        playerTileX: Math.floor(this.player.x / this.cfg.TILE_SIZE),
        playerTileY: Math.floor(this.player.y / this.cfg.TILE_SIZE)
      });
    }
  }

  window.GameScene = GameScene;
})();
