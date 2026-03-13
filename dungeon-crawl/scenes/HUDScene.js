(function () {
  "use strict";

  class HUDScene extends Phaser.Scene {
    constructor() {
      super("HUDScene");
      this.cfg = null;
      this.eventBus = null;
      this.hudData = null;
      this.mapData = null;
      this.displayedPlayerHP = 0;
      this.displayedCompanionHP = 0;
      this.playerBarFill = null;
      this.companionBarFill = null;
      this.floorText = null;
      this.scoreText = null;
      this.statsText = null;
      this.minimapGraphics = null;
      this.notifications = [];
      this.lastMapDrawAt = 0;
    }

    create() {
      this.cfg = window.DungeonCrawl.CONFIG;
      this.eventBus = window.DungeonCrawl.EVENT_BUS;
      this.hudData = {
        playerHP: this.cfg.PLAYER.MAX_HP,
        playerMaxHP: this.cfg.PLAYER.MAX_HP,
        companionHP: this.cfg.COMPANION.MAX_HP,
        companionMaxHP: this.cfg.COMPANION.MAX_HP,
        companionFainted: false,
        floor: 1,
        score: 0,
        keys: 0,
        coins: 0,
        kills: 0,
        playerAttack: this.cfg.PLAYER.START_ATTACK,
        playerDefense: this.cfg.PLAYER.START_DEFENSE
      };
      this.displayedPlayerHP = this.hudData.playerHP;
      this.displayedCompanionHP = this.hudData.companionHP;

      this.drawPanels();
      this.createTexts();
      this.createBars();
      this.minimapGraphics = this.add.graphics().setDepth(2100).setScrollFactor(0);

      this.eventBus.on(this.cfg.EVENTS.HUD_UPDATE, this.onHudUpdate, this);
      this.eventBus.on(this.cfg.EVENTS.MAP_UPDATE, this.onMapUpdate, this);
      this.eventBus.on(this.cfg.EVENTS.NOTIFY, this.onNotify, this);
      this.events.once("shutdown", this.onShutdown, this);
    }

    onShutdown() {
      this.eventBus.off(this.cfg.EVENTS.HUD_UPDATE, this.onHudUpdate, this);
      this.eventBus.off(this.cfg.EVENTS.MAP_UPDATE, this.onMapUpdate, this);
      this.eventBus.off(this.cfg.EVENTS.NOTIFY, this.onNotify, this);
    }

    drawPanels() {
      var g = this.add.graphics().setDepth(2000).setScrollFactor(0);
      var w = this.cfg.GAME.WIDTH;
      var h = this.cfg.GAME.HEIGHT;
      var panelColor = this.cfg.HUD.PANEL_BG;
      var panelAlpha = this.cfg.HUD.PANEL_ALPHA;
      var border = this.cfg.HUD.BORDER;
      var minimapW = this.cfg.HUD.MINIMAP_WIDTH;
      var minimapH = this.cfg.HUD.MINIMAP_HEIGHT;

      g.fillStyle(panelColor, panelAlpha);
      g.fillRoundedRect(10, 10, 240, 74, 8);
      g.lineStyle(2, border, 1);
      g.strokeRoundedRect(10, 10, 240, 74, 8);

      g.fillStyle(panelColor, panelAlpha);
      g.fillRoundedRect(w * 0.5 - 70, 10, 140, 36, 8);
      g.lineStyle(2, border, 1);
      g.strokeRoundedRect(w * 0.5 - 70, 10, 140, 36, 8);

      g.fillStyle(panelColor, panelAlpha);
      g.fillRoundedRect(w - 200, 10, 190, 74, 8);
      g.lineStyle(2, border, 1);
      g.strokeRoundedRect(w - 200, 10, 190, 74, 8);

      g.fillStyle(panelColor, panelAlpha);
      g.fillRoundedRect(w - minimapW - 16, h - minimapH - 16, minimapW, minimapH, 6);
      g.lineStyle(2, border, 1);
      g.strokeRoundedRect(w - minimapW - 16, h - minimapH - 16, minimapW, minimapH, 6);
    }

    createTexts() {
      this.floorText = this.add
        .text(this.cfg.GAME.WIDTH * 0.5, 28, "Floor 1", {
          fontFamily: "Georgia, serif",
          fontSize: "18px",
          color: "#f4f6ff"
        })
        .setOrigin(0.5)
        .setDepth(2100)
        .setScrollFactor(0);

      this.scoreText = this.add
        .text(this.cfg.GAME.WIDTH - 20, 28, "Score: 0", {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "18px",
          color: "#ffc107"
        })
        .setOrigin(1, 0.5)
        .setDepth(2100)
        .setScrollFactor(0);

      this.statsText = this.add
        .text(24, 57, "ATK 10  DEF 2  K 0  C 0  Key 0", {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "13px",
          color: "#9bb0d9"
        })
        .setDepth(2100)
        .setScrollFactor(0);

      this.add
        .text(20, 16, "HP", {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "12px",
          color: "#ffd0d7"
        })
        .setDepth(2100)
        .setScrollFactor(0);

      this.add
        .text(20, 36, "Companion", {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "12px",
          color: "#c7f7ff"
        })
        .setDepth(2100)
        .setScrollFactor(0);
    }

    createBars() {
      this.playerBarFill = this.add.graphics().setDepth(2100).setScrollFactor(0);
      this.companionBarFill = this.add.graphics().setDepth(2100).setScrollFactor(0);
      this.redrawBars();
    }

    onHudUpdate(data) {
      this.hudData = data;
      this.floorText.setText("Floor " + data.floor);
      this.scoreText.setText("Score: " + data.score);
      this.statsText.setText(
        "ATK " +
          data.playerAttack +
          "  DEF " +
          data.playerDefense +
          "  K " +
          data.kills +
          "  C " +
          data.coins +
          "  Key " +
          data.keys
      );
    }

    onMapUpdate(data) {
      this.mapData = data;
      this.drawMinimap(true);
    }

    redrawBars() {
      var hpWidth = 150;
      var hpX = 54;
      var playerRatio = Phaser.Math.Clamp(this.displayedPlayerHP / this.hudData.playerMaxHP, 0, 1);
      var companionRatio = Phaser.Math.Clamp(this.displayedCompanionHP / this.hudData.companionMaxHP, 0, 1);

      this.playerBarFill.clear();
      this.playerBarFill.fillStyle(0x202638, 1);
      this.playerBarFill.fillRect(hpX, 18, hpWidth, 10);
      this.playerBarFill.fillStyle(this.cfg.HUD.HP_COLOR, 1);
      this.playerBarFill.fillRect(hpX, 18, hpWidth * playerRatio, 10);

      this.companionBarFill.clear();
      this.companionBarFill.fillStyle(0x202638, 1);
      this.companionBarFill.fillRect(hpX, 38, hpWidth, 8);
      this.companionBarFill.fillStyle(this.cfg.HUD.COMPANION_HP_COLOR, 1);
      this.companionBarFill.fillRect(hpX, 38, hpWidth * companionRatio, 8);
      if (this.hudData.companionFainted) {
        this.companionBarFill.fillStyle(0x8894aa, 0.8);
        this.companionBarFill.fillRect(hpX, 38, hpWidth, 8);
      }
    }

    onNotify(message) {
      var w = this.cfg.GAME.WIDTH;
      var y = 98 + this.notifications.length * 28;
      var box = this.add.container(w + 130, y).setDepth(2200).setScrollFactor(0);
      var bg = this.add.rectangle(0, 0, 240, 24, this.cfg.HUD.PANEL_BG, 0.93);
      bg.setStrokeStyle(2, this.cfg.HUD.BORDER, 1);
      var text = this.add
        .text(-112, -1, message, {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "12px",
          color: "#f6f7ff"
        })
        .setOrigin(0, 0.5);

      box.add([bg, text]);
      this.notifications.push(box);
      this.tweens.add({
        targets: box,
        x: w - 130,
        duration: 180,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.time.delayedCall(this.cfg.FX.NOTIFY_HOLD_MS, () => {
            this.tweens.add({
              targets: box,
              x: w + 130,
              duration: 200,
              ease: "Sine.easeIn",
              onComplete: () => {
                Phaser.Utils.Array.Remove(this.notifications, box);
                box.destroy();
                this.reflowNotifications();
              }
            });
          });
        }
      });
    }

    reflowNotifications() {
      for (var i = 0; i < this.notifications.length; i += 1) {
        var box = this.notifications[i];
        this.tweens.add({
          targets: box,
          y: 98 + i * 28,
          duration: 120
        });
      }
    }

    drawMinimap(force) {
      if (!this.mapData) {
        return;
      }
      var now = this.time.now;
      if (!force && now - this.lastMapDrawAt < 140) {
        return;
      }
      this.lastMapDrawAt = now;

      var g = this.minimapGraphics;
      var mmW = this.cfg.HUD.MINIMAP_WIDTH;
      var mmH = this.cfg.HUD.MINIMAP_HEIGHT;
      var x = this.cfg.GAME.WIDTH - mmW - 16;
      var y = this.cfg.GAME.HEIGHT - mmH - 16;
      var scaleX = mmW / this.mapData.width;
      var scaleY = mmH / this.mapData.height;

      g.clear();
      g.fillStyle(0x101427, 0.8);
      g.fillRoundedRect(x + 2, y + 2, mmW - 4, mmH - 4, 4);

      for (var i = 0; i < this.mapData.rooms.length; i += 1) {
        var room = this.mapData.rooms[i];
        var explored = !!this.mapData.explored[room.id];
        g.fillStyle(explored ? 0x6f7c9b : 0x273047, explored ? 1 : 0.55);
        g.fillRect(
          x + room.x * scaleX + 1,
          y + room.y * scaleY + 1,
          Math.max(2, room.w * scaleX - 1),
          Math.max(2, room.h * scaleY - 1)
        );
      }

      g.fillStyle(0xe94560, 1);
      g.fillCircle(
        x + this.mapData.playerTileX * scaleX + scaleX * 0.5,
        y + this.mapData.playerTileY * scaleY + scaleY * 0.5,
        2
      );
    }

    update() {
      this.displayedPlayerHP = Phaser.Math.Linear(this.displayedPlayerHP, this.hudData.playerHP, 0.15);
      this.displayedCompanionHP = Phaser.Math.Linear(this.displayedCompanionHP, this.hudData.companionHP, 0.15);
      this.redrawBars();
      this.drawMinimap(false);
    }
  }

  window.HUDScene = HUDScene;
})();
