(function() {
  function TitleScene() {
    Phaser.Scene.call(this, { key: 'TitleScene' });
    this.onAIStatus = null;
    this.startLocked = false;
  }

  TitleScene.prototype = Object.create(Phaser.Scene.prototype);
  TitleScene.prototype.constructor = TitleScene;

  TitleScene.prototype.create = function() {
    var w = CONFIG.GAME.WIDTH;
    var h = CONFIG.GAME.HEIGHT;

    this.cameras.main.setBackgroundColor('#0a0d1a');

    this.add.rectangle(w * 0.5, h * 0.5, w, h, CONFIG.COLORS.BG_DARK, 1);
    this.add.rectangle(w * 0.5, h * 0.2, w * 0.8, 130, 0x1f2750, 0.35);

    this.add.text(w * 0.5, 96, 'Whiskers & Wands', {
      fontFamily: 'Georgia',
      fontSize: '56px',
      color: '#f6e9ba',
      stroke: '#311f12',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(w * 0.5, 155, 'The first Kriisko-Studio AI companion adventure', {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: '#d0d9ff'
    }).setOrigin(0.5);

    var button = this.add.rectangle(w * 0.5, h * 0.73, 270, 54, 0x244b7e, 0.95)
      .setStrokeStyle(3, 0x6ec6ff, 0.8)
      .setInteractive({ useHandCursor: true });
    var buttonLabel = this.add.text(w * 0.5, h * 0.73, 'Begin Adventure', {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);

    button.on('pointerover', function() {
      button.setFillStyle(0x2c5b96, 1);
      buttonLabel.setScale(1.04);
    });
    button.on('pointerout', function() {
      button.setFillStyle(0x244b7e, 0.95);
      buttonLabel.setScale(1);
    });
    button.on('pointerdown', this.beginAdventure, this);

    this.add.text(w * 0.5, h * 0.82, 'WASD move  |  SPACE attack  |  T chat with companion', {
      fontFamily: 'Trebuchet MS',
      fontSize: '15px',
      color: '#b8c6ff'
    }).setOrigin(0.5);

    this.nameOverlay = document.getElementById('pet-name-overlay');
    this.nameInput = document.getElementById('pet-name-input');
    this.aiDot = document.getElementById('title-ai-dot');
    this.aiLabel = document.getElementById('title-ai-label');

    if (this.nameOverlay) {
      this.nameOverlay.style.display = 'block';
    }
    if (this.nameInput) {
      this.nameInput.value = this.nameInput.value || 'Pip';
      this.time.delayedCall(30, function() {
        this.nameInput.focus();
        this.nameInput.select();
      }, [], this);
      this.onNameInputKeyDown = this.handleNameInputKeyDown.bind(this);
      this.nameInput.addEventListener('keydown', this.onNameInputKeyDown);
    }

    this.updateAIStatus(OllamaService.online);

    this.onAIStatus = this.updateAIStatus.bind(this);
    CONFIG.EVENT_BUS.on(CONFIG.EVENTS.AI_STATUS, this.onAIStatus);

    OllamaService.healthCheck()
      .then(function(online) {
        CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.AI_STATUS, online);
      })
      .catch(function() {
        CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.AI_STATUS, false);
      });

    this.input.keyboard.on('keydown-ENTER', this.beginAdventure, this);

    this.events.once('shutdown', this.cleanup, this);
    this.events.once('destroy', this.cleanup, this);
  };

  TitleScene.prototype.handleNameInputKeyDown = function(ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      this.beginAdventure();
    }
  };

  TitleScene.prototype.updateAIStatus = function(online) {
    if (!this.aiDot || !this.aiLabel) {
      return;
    }
    if (online) {
      this.aiDot.classList.add('online');
      this.aiLabel.textContent = 'AI Connected';
    } else {
      this.aiDot.classList.remove('online');
      this.aiLabel.textContent = 'AI Offline';
    }
  };

  TitleScene.prototype.beginAdventure = function() {
    if (this.startLocked) {
      return;
    }
    this.startLocked = true;

    var petName = 'Pip';
    if (this.nameInput && this.nameInput.value) {
      petName = this.nameInput.value.trim().substring(0, 16);
    }
    if (!petName) {
      petName = 'Pip';
    }

    if (this.nameOverlay) {
      this.nameOverlay.style.display = 'none';
    }

    CONFIG.AudioService.ensureContext();

    this.scene.start('GameScene', {
      petName: petName,
      floor: 1,
      score: 0
    });
    this.scene.launch('HUDScene');
  };

  TitleScene.prototype.cleanup = function() {
    if (this.nameOverlay) {
      this.nameOverlay.style.display = 'none';
    }

    if (this.nameInput && this.onNameInputKeyDown) {
      this.nameInput.removeEventListener('keydown', this.onNameInputKeyDown);
    }

    if (this.onAIStatus) {
      CONFIG.EVENT_BUS.off(CONFIG.EVENTS.AI_STATUS, this.onAIStatus);
    }

    this.input.keyboard.off('keydown-ENTER', this.beginAdventure, this);
  };

  window.TitleScene = TitleScene;
})();