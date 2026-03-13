(function () {
  "use strict";

  function colorToCss(colorInt) {
    return "#" + colorInt.toString(16).padStart(6, "0");
  }

  class BootScene extends Phaser.Scene {
    constructor() {
      super("BootScene");
    }

    create() {
      var cfg = window.DungeonCrawl.CONFIG;
      var width = cfg.GAME.WIDTH;
      var height = cfg.GAME.HEIGHT;

      this.cameras.main.setBackgroundColor(cfg.GAME.BACKGROUND);

      var title = this.add
        .text(width * 0.5, height * 0.38, "DUNGEON CRAWL", {
          fontFamily: "Georgia, serif",
          fontSize: "34px",
          color: "#e94560"
        })
        .setOrigin(0.5);

      var subtitle = this.add
        .text(width * 0.5, height * 0.45, "Procedural boot sequence", {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "16px",
          color: "#b9bfd6"
        })
        .setOrigin(0.5);

      var barBg = this.add.rectangle(width * 0.5, height * 0.57, 360, 22, 0x111827, 0.95);
      barBg.setStrokeStyle(2, 0xe94560, 1);
      var barFill = this.add.rectangle(width * 0.5 - 178, height * 0.57, 2, 14, 0xe94560, 1);
      barFill.setOrigin(0, 0.5);

      var status = this.add
        .text(width * 0.5, height * 0.62, "Preparing textures...", {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "14px",
          color: "#d3d9ef"
        })
        .setOrigin(0.5);

      var steps = [
        this.buildDungeonTiles.bind(this),
        this.buildPlayerTexture.bind(this),
        this.buildCompanionTexture.bind(this),
        this.buildEnemyTextures.bind(this),
        this.buildChestTextures.bind(this),
        this.buildItemTextures.bind(this),
        this.buildFxTextures.bind(this)
      ];

      var stepIndex = 0;
      var runStep = () => {
        if (stepIndex < steps.length) {
          steps[stepIndex]();
          stepIndex += 1;
          var ratio = stepIndex / steps.length;
          barFill.width = 356 * ratio;
          status.setText("Generating assets " + Math.floor(ratio * 100) + "%");
          this.time.delayedCall(40, runStep);
          return;
        }

        status.setText("Entering dungeon...");
        this.time.delayedCall(140, () => {
          title.destroy();
          subtitle.destroy();
          this.scene.start("GameScene");
          this.scene.launch("HUDScene");
        });
      };

      runStep();
    }

    buildDungeonTiles() {
      var cfg = window.DungeonCrawl.CONFIG;
      var size = cfg.TILE_SIZE;
      var tiles = this.textures.createCanvas("dungeon-tiles", size * 4, size);
      var ctx = tiles.context;
      var floorBase = "#2a2a3e";
      var wallBase = "#1a1a2e";

      ctx.clearRect(0, 0, size * 4, size);

      ctx.fillStyle = floorBase;
      ctx.fillRect(0, 0, size, size);
      for (var i = 0; i < 48; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? "#32324a" : "#222234";
        ctx.fillRect(
          Phaser.Math.Between(1, size - 3),
          Phaser.Math.Between(1, size - 3),
          2,
          2
        );
      }

      var wallX = size;
      ctx.fillStyle = wallBase;
      ctx.fillRect(wallX, 0, size, size);
      ctx.fillStyle = "#23233b";
      for (var y = 2; y < size; y += 6) {
        for (var x = 2; x < size; x += 7) {
          ctx.fillRect(wallX + x, y, 4, 3);
        }
      }
      ctx.fillStyle = "#3a3a58";
      ctx.fillRect(wallX, 0, size, 2);
      ctx.fillRect(wallX, 0, 2, size);

      var downX = size * 2;
      ctx.fillStyle = floorBase;
      ctx.fillRect(downX, 0, size, size);
      ctx.fillStyle = "#ffc107";
      ctx.fillRect(downX + 13, 8, 6, 12);
      ctx.beginPath();
      ctx.moveTo(downX + 8, 18);
      ctx.lineTo(downX + 24, 18);
      ctx.lineTo(downX + 16, 26);
      ctx.closePath();
      ctx.fill();

      var upX = size * 3;
      ctx.fillStyle = floorBase;
      ctx.fillRect(upX, 0, size, size);
      ctx.fillStyle = "#4caf50";
      ctx.fillRect(upX + 13, 12, 6, 12);
      ctx.beginPath();
      ctx.moveTo(upX + 8, 14);
      ctx.lineTo(upX + 24, 14);
      ctx.lineTo(upX + 16, 6);
      ctx.closePath();
      ctx.fill();

      tiles.refresh();
    }

    buildPlayerTexture() {
      var cfg = window.DungeonCrawl.CONFIG;
      var w = cfg.PLAYER.WIDTH;
      var h = cfg.PLAYER.HEIGHT;
      var g = this.make.graphics({ x: 0, y: 0, add: false });

      g.fillStyle(0x3f475e, 1);
      g.fillRoundedRect(7, 6, 10, 12, 2);
      g.fillStyle(0x8a94b2, 1);
      g.fillRect(8, 7, 8, 2);
      g.fillStyle(0xc6c8d1, 1);
      g.fillCircle(12, 4, 4);
      g.fillStyle(0x222733, 1);
      g.fillRect(7, 19, 4, 11);
      g.fillRect(13, 19, 4, 11);
      g.fillStyle(0xe94560, 1);
      g.fillTriangle(6, 8, 2, 24, 9, 24);
      g.fillStyle(0x9aa4c7, 1);
      g.fillRect(2, 11, 4, 12);
      g.generateTexture("player", w, h);
      g.destroy();
    }

    buildCompanionTexture() {
      var cfg = window.DungeonCrawl.CONFIG;
      var w = cfg.COMPANION.WIDTH;
      var h = cfg.COMPANION.HEIGHT;
      var g = this.make.graphics({ x: 0, y: 0, add: false });

      g.fillStyle(0x008ca0, 1);
      g.fillRoundedRect(2, 7, 16, 13, 5);
      g.fillStyle(0x00bcd4, 1);
      g.fillEllipse(10, 12, 16, 12);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(7, 11, 2);
      g.fillCircle(13, 11, 2);
      g.fillStyle(0x1b2a36, 1);
      g.fillCircle(7, 11, 1);
      g.fillCircle(13, 11, 1);
      g.fillStyle(0x7ce4ef, 1);
      g.fillRect(8, 18, 4, 4);
      g.generateTexture("companion", w, h);
      g.destroy();
    }

    buildEnemyTextures() {
      this.buildSkeletonTexture();
      this.buildSlimeTexture();
      this.buildWraithTexture();
    }

    buildSkeletonTexture() {
      var g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xd4d4d4, 1);
      g.fillCircle(10, 6, 5);
      g.fillRect(6, 11, 8, 10);
      g.fillRect(4, 12, 3, 10);
      g.fillRect(13, 12, 3, 10);
      g.fillRect(7, 21, 3, 7);
      g.fillRect(11, 21, 3, 7);
      g.fillStyle(0x2f2f2f, 1);
      g.fillRect(8, 5, 2, 2);
      g.fillRect(11, 5, 2, 2);
      g.generateTexture("enemy-skeleton", 20, 28);
      g.destroy();
    }

    buildSlimeTexture() {
      var g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x4caf50, 1);
      g.fillEllipse(9, 10, 18, 14);
      g.fillStyle(0x7ccc71, 1);
      g.fillEllipse(9, 8, 10, 6);
      g.fillStyle(0x132116, 1);
      g.fillCircle(6, 9, 1);
      g.fillCircle(12, 9, 1);
      g.generateTexture("enemy-slime", 18, 18);
      g.destroy();
    }

    buildWraithTexture() {
      var g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x9c27b0, 0.9);
      g.fillRoundedRect(3, 3, 16, 18, 4);
      g.fillTriangle(3, 21, 19, 21, 11, 26);
      g.fillStyle(0xd8b6e6, 1);
      g.fillCircle(8, 9, 2);
      g.fillCircle(14, 9, 2);
      g.generateTexture("enemy-wraith", 22, 26);
      g.destroy();
    }

    buildChestTextures() {
      var g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x6d4c41, 1);
      g.fillRoundedRect(2, 8, 20, 12, 2);
      g.fillStyle(0x4e342e, 1);
      g.fillRect(2, 12, 20, 8);
      g.fillStyle(0xc4902f, 1);
      g.fillRect(11, 13, 2, 5);
      g.generateTexture("chest-closed", 24, 24);
      g.clear();

      g.fillStyle(0x6d4c41, 1);
      g.fillRect(2, 13, 20, 9);
      g.fillStyle(0x9c6e5f, 1);
      g.fillRect(2, 8, 20, 4);
      g.fillStyle(0xc4902f, 1);
      g.fillRect(11, 14, 2, 4);
      g.generateTexture("chest-open", 24, 24);
      g.destroy();
    }

    buildItemTextures() {
      var g = this.make.graphics({ x: 0, y: 0, add: false });

      g.fillStyle(0xe94560, 1);
      g.fillRoundedRect(5, 5, 6, 10, 2);
      g.fillStyle(0xf8a5b2, 1);
      g.fillRect(6, 3, 4, 2);
      g.generateTexture("item-potion", 16, 16);
      g.clear();

      g.fillStyle(0xffc107, 1);
      g.fillCircle(8, 8, 6);
      g.fillStyle(0xffe082, 1);
      g.fillCircle(6, 6, 2);
      g.generateTexture("item-coin", 16, 16);
      g.clear();

      g.fillStyle(0xf4c35a, 1);
      g.fillRect(2, 7, 10, 3);
      g.fillCircle(3, 8, 3);
      g.fillRect(12, 6, 2, 2);
      g.fillRect(12, 10, 2, 2);
      g.generateTexture("item-key", 16, 16);
      g.clear();

      g.fillStyle(0xe94560, 1);
      g.fillTriangle(8, 1, 14, 8, 8, 15);
      g.fillTriangle(8, 1, 2, 8, 8, 15);
      g.generateTexture("item-attack-gem", 16, 16);
      g.clear();

      g.fillStyle(0x4fc3f7, 1);
      g.fillTriangle(8, 1, 14, 8, 8, 15);
      g.fillTriangle(8, 1, 2, 8, 8, 15);
      g.generateTexture("item-defense-gem", 16, 16);
      g.destroy();
    }

    buildFxTextures() {
      var spark = this.make.graphics({ x: 0, y: 0, add: false });
      spark.fillStyle(0xffaa44, 1);
      spark.fillCircle(2, 2, 2);
      spark.generateTexture("particle-spark", 4, 4);
      spark.clear();
      spark.fillStyle(0xffffff, 1);
      spark.fillCircle(2, 2, 2);
      spark.generateTexture("particle-dot", 4, 4);
      spark.clear();
      spark.fillStyle(0xa6afc7, 1);
      spark.fillCircle(2, 2, 1);
      spark.generateTexture("particle-dust", 4, 4);
      spark.clear();
      spark.fillStyle(0xbfc8ff, 1);
      spark.fillCircle(6, 6, 6);
      spark.fillStyle(0x1b2035, 1);
      spark.fillCircle(6, 6, 3);
      spark.generateTexture("bubble-bg", 12, 12);
      spark.clear();
      spark.fillStyle(0x9ec5ff, 1);
      spark.fillCircle(4, 4, 3);
      spark.generateTexture("particle-think", 8, 8);
      spark.destroy();

      var vignetteSize = 256;
      var vignette = this.textures.createCanvas("vignette", vignetteSize, vignetteSize);
      var ctx = vignette.context;
      var center = vignetteSize / 2;
      var gradient = ctx.createRadialGradient(
        center,
        center,
        vignetteSize * 0.12,
        center,
        center,
        vignetteSize * 0.5
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.7, "rgba(0,0,0,0.25)");
      gradient.addColorStop(1, "rgba(0,0,0,0.8)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, vignetteSize, vignetteSize);
      vignette.refresh();

      var fog = this.textures.createCanvas("fog", 64, 64);
      var fogCtx = fog.context;
      fogCtx.fillStyle = "rgba(12,12,20,0.28)";
      fogCtx.fillRect(0, 0, 64, 64);
      for (var i = 0; i < 40; i += 1) {
        fogCtx.fillStyle = "rgba(255,255,255,0.04)";
        fogCtx.fillRect(Phaser.Math.Between(0, 63), Phaser.Math.Between(0, 63), 1, 1);
      }
      fog.refresh();

      var speechColor = colorToCss(window.DungeonCrawl.CONFIG.HUD.BORDER);
      var speech = this.textures.createCanvas("speech-bubble", 96, 40);
      var speechCtx = speech.context;
      speechCtx.fillStyle = "rgba(15,18,36,0.92)";
      speechCtx.strokeStyle = speechColor;
      speechCtx.lineWidth = 2;
      speechCtx.beginPath();
      speechCtx.roundRect(2, 2, 92, 28, 6);
      speechCtx.fill();
      speechCtx.stroke();
      speechCtx.beginPath();
      speechCtx.moveTo(42, 30);
      speechCtx.lineTo(48, 38);
      speechCtx.lineTo(54, 30);
      speechCtx.closePath();
      speechCtx.fill();
      speechCtx.stroke();
      speech.refresh();
    }
  }

  window.BootScene = BootScene;
})();
