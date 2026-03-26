(function() {
  function HUDScene() {
    Phaser.Scene.call(this, { key: 'HUDScene' });
    this.chatMessages = [];
    this.chatMessageObjects = [];
    this.visibleHUD = false;
  }

  HUDScene.prototype = Object.create(Phaser.Scene.prototype);
  HUDScene.prototype.constructor = HUDScene;

  HUDScene.prototype.create = function() {
    this.visibleHUD = true;

    this.panelX = CONFIG.GAME.WIDTH - CONFIG.VISUAL.UI_PANEL_WIDTH;

    this.topBarBg = this.add.rectangle(170, 54, 330, 86, 0x070a18, 0.7).setStrokeStyle(1, 0x31417d, 0.8);

    this.playerLabel = this.add.text(16, 18, 'Player HP', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#ffe4e4'
    });

    this.playerHpBack = this.add.rectangle(16, 38, 210, 14, 0x2a1e2a, 0.95).setOrigin(0, 0.5);
    this.playerHpFill = this.add.rectangle(16, 38, 210, 12, 0xe94560, 1).setOrigin(0, 0.5);

    this.petLabel = this.add.text(16, 52, 'Pet HP / XP', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#d8f8ff'
    });

    this.petHpBack = this.add.rectangle(16, 72, 210, 10, 0x18323d, 0.95).setOrigin(0, 0.5);
    this.petHpFill = this.add.rectangle(16, 72, 210, 8, 0x00bcd4, 1).setOrigin(0, 0.5);
    this.petXpBack = this.add.rectangle(16, 86, 210, 8, 0x233320, 0.95).setOrigin(0, 0.5);
    this.petXpFill = this.add.rectangle(16, 86, 210, 6, 0xffc107, 1).setOrigin(0, 0.5);

    this.scoreText = this.add.text(245, 16, 'Score: 0', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#fff7d5'
    });
    this.floorText = this.add.text(245, 36, 'Floor: 1', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#fff7d5'
    });
    this.petLevelText = this.add.text(245, 56, 'Pet Lv. 1', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#9be8ff'
    });

    this.panel = this.add.rectangle(this.panelX + CONFIG.VISUAL.UI_PANEL_WIDTH * 0.5, CONFIG.GAME.HEIGHT * 0.5, CONFIG.VISUAL.UI_PANEL_WIDTH, CONFIG.GAME.HEIGHT, CONFIG.COLORS.CHAT_BG, CONFIG.VISUAL.UI_PANEL_ALPHA)
      .setStrokeStyle(1, 0x3c4670, 0.9);

    this.chatTitle = this.add.text(this.panelX + 12, 10, 'Companion Chat', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#e6ecff'
    });

    this.aiDot = this.add.circle(this.panelX + CONFIG.VISUAL.UI_PANEL_WIDTH - 16, 20, 5, CONFIG.COLORS.RED, 1);
    this.aiLabel = this.add.text(this.panelX + 12, 36, 'AI Offline', {
      fontFamily: 'Trebuchet MS',
      fontSize: '12px',
      color: '#ff9da6'
    });

    this.chatHint = this.add.text(this.panelX + 10, CONFIG.GAME.HEIGHT - 52, 'Enter / T to chat', {
      fontFamily: 'Trebuchet MS',
      fontSize: '11px',
      color: '#9fb0ef'
    });

    this.flashText = this.add.text(CONFIG.GAME.WIDTH * 0.5, 112, '', {
      fontFamily: 'Georgia',
      fontSize: '26px',
      color: '#ffe082',
      stroke: '#40290f',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);

    this.chatOverlay = document.getElementById('chat-input-overlay');
    this.chatInput = document.getElementById('chat-input');
    var isMobile = 'ontouchstart' in window || window.matchMedia('(pointer: coarse)').matches;
    if (this.chatOverlay && !isMobile) {
      this.chatOverlay.style.display = 'block';
    }
    if (this.chatInput) {
      this.chatInput.placeholder = CONFIG.CHAT.INPUT_PLACEHOLDER;
      this.onChatInputKeyDown = this.handleChatInputKeyDown.bind(this);
      this.chatInput.addEventListener('keydown', this.onChatInputKeyDown);
    }

    this.onHudUpdate = this.handleHudUpdate.bind(this);
    this.onChatAdd = this.handleChatAdd.bind(this);
    this.onAIStatus = this.handleAIStatus.bind(this);
    this.onPetLevelUp = this.handlePetLevelUp.bind(this);
    this.onHudShow = this.handleHudShow.bind(this);
    this.onHudHide = this.handleHudHide.bind(this);
    this.onFlash = this.showFlash.bind(this);
    this.onChatFocus = this.focusInput.bind(this);

    CONFIG.EVENT_BUS.on(CONFIG.EVENTS.HUD_UPDATE, this.onHudUpdate);
    CONFIG.EVENT_BUS.on(CONFIG.EVENTS.CHAT_ADD, this.onChatAdd);
    CONFIG.EVENT_BUS.on(CONFIG.EVENTS.AI_STATUS, this.onAIStatus);
    CONFIG.EVENT_BUS.on(CONFIG.EVENTS.PET_LEVELUP, this.onPetLevelUp);
    CONFIG.EVENT_BUS.on(CONFIG.EVENTS.HUD_SHOW, this.onHudShow);
    CONFIG.EVENT_BUS.on(CONFIG.EVENTS.HUD_HIDE, this.onHudHide);
    CONFIG.EVENT_BUS.on(CONFIG.EVENTS.FLASH, this.onFlash);
    CONFIG.EVENT_BUS.on(CONFIG.EVENTS.CHAT_FOCUS, this.onChatFocus);

    this.events.once('shutdown', this.cleanup, this);
    this.events.once('destroy', this.cleanup, this);
  };

  HUDScene.prototype.handleHudUpdate = function(payload) {
    if (!payload) {
      return;
    }

    var p = payload.player || {};
    var pet = payload.pet || {};
    var score = payload.score || 0;
    var floor = payload.floor || 1;

    var pRatio = p.maxHp > 0 ? CONFIG.Helpers.clamp(p.hp / p.maxHp, 0, 1) : 0;
    var petHpRatio = pet.maxHp > 0 ? CONFIG.Helpers.clamp(pet.hp / pet.maxHp, 0, 1) : 0;
    var petXpRatio = CONFIG.Helpers.clamp(pet.levelProgress || 0, 0, 1);

    this.playerHpFill.width = 210 * pRatio;
    this.petHpFill.width = 210 * petHpRatio;
    this.petXpFill.width = 210 * petXpRatio;

    this.playerLabel.setText('Player HP ' + Math.max(0, Math.round(p.hp || 0)) + '/' + Math.max(0, Math.round(p.maxHp || 0)));
    this.petLabel.setText((pet.name || 'Pet') + ' HP ' + Math.max(0, Math.round(pet.hp || 0)) + '/' + Math.max(0, Math.round(pet.maxHp || 0)) + '  XP ' + Math.round(pet.xp || 0));
    this.petLevelText.setText((pet.name || 'Pet') + ' Lv. ' + Math.max(1, pet.level || 1));
    this.scoreText.setText('Score: ' + Math.round(score));
    this.floorText.setText('Floor: ' + Math.max(1, floor));
  };

  HUDScene.prototype.handleChatAdd = function(message) {
    if (!message || !message.text) {
      return;
    }

    this.chatMessages.push({
      from: message.from || 'pet',
      text: String(message.text).substring(0, 140)
    });

    while (this.chatMessages.length > CONFIG.CHAT.MAX_MESSAGES) {
      this.chatMessages.shift();
    }

    this.renderChatMessages();

    if (message.from === 'pet') {
      CONFIG.AudioService.chatReceived();
    }
  };

  HUDScene.prototype.renderChatMessages = function() {
    var i;
    for (i = 0; i < this.chatMessageObjects.length; i += 1) {
      this.chatMessageObjects[i].destroy();
    }
    this.chatMessageObjects = [];

    var startY = 64;
    var lineGap = 20;
    var panelRight = this.panelX + CONFIG.VISUAL.UI_PANEL_WIDTH - 10;
    var panelLeft = this.panelX + 10;

    for (i = 0; i < this.chatMessages.length; i += 1) {
      var m = this.chatMessages[i];
      var y = startY + i * lineGap;
      var isPlayer = m.from === 'player';
      var style = {
        fontFamily: 'Trebuchet MS',
        fontSize: '12px',
        color: isPlayer ? '#ffffff' : '#86f3ff',
        wordWrap: { width: CONFIG.VISUAL.UI_PANEL_WIDTH - 20 }
      };
      var x = isPlayer ? panelRight : panelLeft;
      var textObj = this.add.text(x, y, m.text, style).setOrigin(isPlayer ? 1 : 0, 0);
      this.chatMessageObjects.push(textObj);
    }
  };

  HUDScene.prototype.handleAIStatus = function(online) {
    if (online) {
      this.aiDot.setFillStyle(CONFIG.COLORS.GREEN, 1);
      this.aiLabel.setText('AI Connected').setColor('#9ff2cc');
    } else {
      this.aiDot.setFillStyle(CONFIG.COLORS.RED, 1);
      this.aiLabel.setText('AI Offline').setColor('#ff9da6');
    }
  };

  HUDScene.prototype.handlePetLevelUp = function(info) {
    var label = (info && info.name ? info.name : 'Pet') + ' reached level ' + (info && info.level ? info.level : 1) + '!';
    this.showFlash(label);
  };

  HUDScene.prototype.showFlash = function(message) {
    if (!message) {
      return;
    }
    this.flashText.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.flashText);
    this.tweens.add({
      targets: this.flashText,
      alpha: 0,
      y: 92,
      duration: 1400,
      ease: 'Sine.easeIn',
      onComplete: function() {
        if (this.flashText) {
          this.flashText.y = 112;
        }
      },
      onCompleteScope: this
    });
  };

  HUDScene.prototype.handleChatInputKeyDown = function(ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      if (!this.chatInput) {
        return;
      }
      var value = this.chatInput.value.trim();
      if (!value) {
        return;
      }
      this.chatInput.value = '';
      CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.CHAT_ADD, { from: 'player', text: value });
      CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.CHAT_PLAYER_MESSAGE, value);
      CONFIG.AudioService.chatSent();
    }
  };

  HUDScene.prototype.focusInput = function() {
    if (this.chatOverlay) {
      this.chatOverlay.style.display = 'flex';
    }
    if (this.chatInput && this.visibleHUD) {
      this.chatInput.focus();
      this.chatInput.select();
    }
  };

  HUDScene.prototype.handleHudShow = function() {
    this.visibleHUD = true;
    this.scene.setVisible(true);
    if (this.chatOverlay) {
      this.chatOverlay.style.display = 'block';
    }
  };

  HUDScene.prototype.handleHudHide = function() {
    this.visibleHUD = false;
    this.scene.setVisible(false);
    if (this.chatOverlay) {
      this.chatOverlay.style.display = 'none';
    }
    if (this.chatInput) {
      this.chatInput.blur();
    }
  };

  HUDScene.prototype.cleanup = function() {
    if (this.chatOverlay) {
      this.chatOverlay.style.display = 'none';
    }

    if (this.chatInput && this.onChatInputKeyDown) {
      this.chatInput.removeEventListener('keydown', this.onChatInputKeyDown);
    }

    CONFIG.EVENT_BUS.off(CONFIG.EVENTS.HUD_UPDATE, this.onHudUpdate);
    CONFIG.EVENT_BUS.off(CONFIG.EVENTS.CHAT_ADD, this.onChatAdd);
    CONFIG.EVENT_BUS.off(CONFIG.EVENTS.AI_STATUS, this.onAIStatus);
    CONFIG.EVENT_BUS.off(CONFIG.EVENTS.PET_LEVELUP, this.onPetLevelUp);
    CONFIG.EVENT_BUS.off(CONFIG.EVENTS.HUD_SHOW, this.onHudShow);
    CONFIG.EVENT_BUS.off(CONFIG.EVENTS.HUD_HIDE, this.onHudHide);
    CONFIG.EVENT_BUS.off(CONFIG.EVENTS.FLASH, this.onFlash);
    CONFIG.EVENT_BUS.off(CONFIG.EVENTS.CHAT_FOCUS, this.onChatFocus);
  };

  window.HUDScene = HUDScene;
})();