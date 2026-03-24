const getConfig = () => window.TowerDefense?.CONFIG || window.__TD_CONFIG__;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.cfg = getConfig();
    this.bus = this.game.events;

    this.gold = this.cfg.GAME.START_GOLD;
    this.lives = this.cfg.GAME.START_LIVES;
    this.wave = 0;
    this.score = 0;
    this.towers = [];
    this.enemies = this.add.group();
    this.projectiles = this.add.group();
    this.isRunning = true;

    this.audioContext = null;
    this.masterGainNode = null;

    this.path = this.buildPathWaypoints();
    this.pathCellSet = this.buildPathCellSet();
    this.occupiedCellSet = new Set();

    this.pendingBuildCell = null;
    this._hudConsumedClick = false;
    this.betweenWaves = true;
    this.waveCountdownEnd = this.time.now + this.cfg.GAME.WAVE_INTERVAL_MS;
    this.isSpawning = false;
    this.spawnQueue = [];
    this.nextSpawnTime = 0;

    this.drawMap();
    this.createPlacementVisuals();
    this.setupInput();
    this.setupEvents();
    this.setupAudio();

    this.emitStats();
    this.emitWaveState();

    this.events.on("shutdown", this.onShutdown, this);
    this.events.on("destroy", this.onShutdown, this);
  }

  update(time, delta) {
    if (!this.isRunning) {
      return;
    }

    const deltaSeconds = delta / 1000;
    this.updateWaveClock(time);
    this.updateSpawning(time);
    this.updateEnemies(time, deltaSeconds);
    this.updateTowers(time);
    this.updateProjectiles(deltaSeconds);
    this.checkWaveCompletion(time);
  }

  onShutdown() {
    this.bus.off("requestBuildTower", this.buildTowerFromMenu, this);
    this.bus.off("requestNextWave", this.requestNextWave, this);
    this.input.off("pointermove", this.onPointerMove, this);
    this.input.off("pointerdown", this.onPointerDown, this);
  }

  setupEvents() {
    this.bus.on("requestBuildTower", this.buildTowerFromMenu, this);
    this.bus.on("requestNextWave", this.requestNextWave, this);
    this.bus.on("hudClickConsumed", () => { this._hudConsumedClick = true; });
  }

  setupInput() {
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerdown", this.onPointerDown, this);
  }

  setupAudio() {
    this.input.once("pointerdown", () => {
      this.ensureAudioReady();
    });
  }

  ensureAudioReady() {
    if (!this.audioContext) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioClass) {
        return;
      }

      this.audioContext = new AudioClass();
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.gain.value = this.cfg.AUDIO.MASTER_GAIN;
      this.masterGainNode.connect(this.audioContext.destination);
    }

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
  }

  playTone(frequency, duration, type = "sine", delay = 0, startGain = 1) {
    if (!this.audioContext || !this.masterGainNode || this.audioContext.state !== "running") {
      return;
    }

    const now = this.audioContext.currentTime + delay;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gainNode.gain.setValueAtTime(startGain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGainNode);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  playShootSound(towerType) {
    const towerDef = this.cfg.TOWERS[towerType];
    this.playTone(towerDef.shootFrequency, this.cfg.AUDIO.SHOOT_DURATION, "square", 0, 0.7);
  }

  playEnemyDeathSound() {
    if (!this.audioContext || !this.masterGainNode || this.audioContext.state !== "running") {
      return;
    }

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(260, now);
    oscillator.frequency.exponentialRampToValueAtTime(110, now + this.cfg.AUDIO.POP_DURATION);
    gainNode.gain.setValueAtTime(0.6, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + this.cfg.AUDIO.POP_DURATION);
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGainNode);
    oscillator.start(now);
    oscillator.stop(now + this.cfg.AUDIO.POP_DURATION);
  }

  playExitWarningSound() {
    this.playTone(120, this.cfg.AUDIO.EXIT_DURATION, "sawtooth", 0, 0.8);
  }

  playWaveStartSound() {
    const step = this.cfg.AUDIO.CHIME_STEP_DURATION;
    this.playTone(420, step, "sine", 0, 0.6);
    this.playTone(560, step, "sine", step, 0.6);
    this.playTone(740, step, "sine", step * 2, 0.6);
  }

  playGameOverSound() {
    const step = this.cfg.AUDIO.GAME_OVER_STEP_DURATION;
    this.playTone(360, step, "triangle", 0, 0.7);
    this.playTone(260, step, "triangle", step, 0.7);
    this.playTone(180, step, "triangle", step * 2, 0.7);
  }

  drawMap() {
    const cfg = this.cfg;
    const gridSize = cfg.GRID_SIZE;
    const mapGraphics = this.add.graphics().setDepth(cfg.DEPTH.MAP);

    mapGraphics.fillStyle(cfg.COLORS.GRASS, 1);
    mapGraphics.fillRect(0, 0, cfg.WORLD_WIDTH, cfg.WORLD_HEIGHT);

    mapGraphics.fillStyle(cfg.COLORS.PATH, 1);
    this.pathCellSet.forEach((cellKey) => {
      const [col, row] = cellKey.split(",").map(Number);
      mapGraphics.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
    });

    const gridGraphics = this.add.graphics().setDepth(cfg.DEPTH.GRID);
    gridGraphics.lineStyle(1, cfg.COLORS.GRID, 0.1);
    for (let col = 0; col <= cfg.GRID_COLS; col += 1) {
      const x = col * gridSize;
      gridGraphics.lineBetween(x, 0, x, cfg.WORLD_HEIGHT);
    }
    for (let row = 0; row <= cfg.GRID_ROWS; row += 1) {
      const y = row * gridSize;
      gridGraphics.lineBetween(0, y, cfg.WORLD_WIDTH, y);
    }
  }

  createPlacementVisuals() {
    const cfg = this.cfg;
    this.hoverCell = this.add.rectangle(0, 0, cfg.GRID_SIZE, cfg.GRID_SIZE, cfg.COLORS.HOVER_BUILDABLE, 0.25);
    this.hoverCell.setOrigin(0);
    this.hoverCell.setDepth(cfg.DEPTH.HOVER);
    this.hoverCell.setVisible(false);

    this.rangeIndicator = this.add.circle(0, 0, cfg.GRID_SIZE, 0xffffff, 0.08);
    this.rangeIndicator.setDepth(cfg.DEPTH.RANGE);
    this.rangeIndicator.setStrokeStyle(cfg.TOWERS.RANGE_STROKE_WIDTH, 0xffffff, 0.5);
    this.rangeIndicator.setVisible(false);
  }

  buildPathWaypoints() {
    return this.cfg.PATH.TURNS.map((turn) => this.gridToWorld(turn.col, turn.row));
  }

  buildPathCellSet() {
    const pathCellSet = new Set();
    const turns = this.cfg.PATH.TURNS;
    const maxCol = this.cfg.GRID_COLS - 1;
    const maxRow = this.cfg.GRID_ROWS - 1;

    for (let index = 0; index < turns.length - 1; index += 1) {
      const current = turns[index];
      const next = turns[index + 1];
      const colDelta = Math.sign(next.col - current.col);
      const rowDelta = Math.sign(next.row - current.row);
      const steps = Math.max(Math.abs(next.col - current.col), Math.abs(next.row - current.row));

      for (let step = 0; step <= steps; step += 1) {
        const col = current.col + colDelta * step;
        const row = current.row + rowDelta * step;
        if (col >= 0 && col <= maxCol && row >= 0 && row <= maxRow) {
          pathCellSet.add(this.cellKey(col, row));
        }
      }
    }

    return pathCellSet;
  }

  onPointerMove(pointer) {
    const cell = this.worldToCell(pointer.worldX, pointer.worldY);
    if (!cell) {
      this.hoverCell.setVisible(false);
      this.rangeIndicator.setVisible(false);
      return;
    }

    this.hoverCell.setVisible(true);
    this.hoverCell.setPosition(cell.col * this.cfg.GRID_SIZE, cell.row * this.cfg.GRID_SIZE);

    const isBuildable = this.isCellBuildable(cell.col, cell.row);
    const hoverColor = isBuildable ? this.cfg.COLORS.HOVER_BUILDABLE : this.cfg.COLORS.HOVER_BLOCKED;
    this.hoverCell.setFillStyle(hoverColor, 0.25);

    const tower = this.getTowerAtCell(cell.col, cell.row);
    if (tower) {
      this.rangeIndicator.setVisible(true);
      this.rangeIndicator.setPosition(tower.x, tower.y);
      this.rangeIndicator.setRadius(tower.range);
      this.rangeIndicator.setStrokeStyle(this.cfg.TOWERS.RANGE_STROKE_WIDTH, tower.color, 0.75);
    } else {
      this.rangeIndicator.setVisible(false);
    }
  }

  onPointerDown(pointer) {
    if (this._hudConsumedClick) {
      this._hudConsumedClick = false;
      return;
    }

    if (!this.isRunning) {
      return;
    }

    this.ensureAudioReady();

    const cell = this.worldToCell(pointer.worldX, pointer.worldY);
    if (!cell) {
      this.pendingBuildCell = null;
      this.bus.emit("hideTowerMenu");
      return;
    }

    const existingTower = this.getTowerAtCell(cell.col, cell.row);
    if (existingTower) {
      this.pendingBuildCell = null;
      this.bus.emit("hideTowerMenu");
      this.upgradeTower(existingTower);
      return;
    }

    if (!this.isCellBuildable(cell.col, cell.row)) {
      this.pendingBuildCell = null;
      this.bus.emit("hideTowerMenu");
      return;
    }

    this.pendingBuildCell = cell;
    this.bus.emit("showTowerMenu", {
      x: cell.col * this.cfg.GRID_SIZE + this.cfg.GRID_SIZE / 2,
      y: cell.row * this.cfg.GRID_SIZE + this.cfg.GRID_SIZE / 2,
      options: this.getTowerMenuOptions()
    });
  }

  getTowerMenuOptions() {
    return Object.keys(this.cfg.TOWERS)
      .filter((towerType) => typeof this.cfg.TOWERS[towerType] === "object" && this.cfg.TOWERS[towerType].cost)
      .map((towerType) => ({
        type: towerType,
        label: this.cfg.TOWERS[towerType].label,
        cost: this.cfg.TOWERS[towerType].cost,
        color: this.cfg.TOWERS[towerType].color
      }));
  }

  requestNextWave() {
    if (!this.isRunning || !this.betweenWaves) {
      return;
    }

    const isEarlyStart = this.time.now < this.waveCountdownEnd;
    this.startWave(isEarlyStart);
  }

  updateWaveClock(time) {
    if (this.betweenWaves && time >= this.waveCountdownEnd) {
      this.startWave(false);
    }
  }

  startWave(grantEarlyBonus) {
    if (!this.isRunning || !this.betweenWaves) {
      return;
    }

    if (grantEarlyBonus) {
      this.gold += this.cfg.GAME.EARLY_START_BONUS;
    }

    this.wave += 1;
    this.betweenWaves = false;
    this.spawnQueue = this.getWaveSpawnList(this.wave);
    this.isSpawning = this.spawnQueue.length > 0;
    this.nextSpawnTime = this.time.now + this.cfg.GAME.FIRST_SPAWN_DELAY_MS;

    this.emitStats();
    this.emitWaveState();
    this.bus.emit("hideTowerMenu");
    this.playWaveStartSound();
  }

  getWaveSpawnList(wave) {
    const preset = this.cfg.WAVE_PRESETS[wave];
    const counts = preset ? { ...preset } : this.getScaledWaveCounts(wave);
    const spawnList = [];

    Object.entries(counts).forEach(([enemyType, count]) => {
      for (let index = 0; index < count; index += 1) {
        spawnList.push(enemyType);
      }
    });

    Phaser.Utils.Array.Shuffle(spawnList);
    return spawnList;
  }

  getScaledWaveCounts(wave) {
    const base = this.cfg.WAVE_PRESETS[5];
    const scale = Math.pow(this.cfg.WAVE_SCALE_FACTOR, wave - 5);
    return {
      runner: Math.max(1, Math.floor(base.runner * scale)),
      tank: Math.max(1, Math.floor(base.tank * scale)),
      healer: Math.max(1, Math.floor(base.healer * scale))
    };
  }

  updateSpawning(time) {
    if (!this.isSpawning) {
      return;
    }

    while (this.spawnQueue.length > 0 && time >= this.nextSpawnTime) {
      const enemyType = this.spawnQueue.shift();
      this.spawnEnemy(enemyType);
      this.nextSpawnTime += this.cfg.GAME.SPAWN_INTERVAL_MS;
    }

    if (this.spawnQueue.length === 0) {
      this.isSpawning = false;
    }
  }

  spawnEnemy(enemyType) {
    const enemyDef = this.cfg.ENEMIES[enemyType];
    if (!enemyDef) {
      return;
    }

    const hpScale = 1 + (this.wave - 1) * this.cfg.GAME.ENEMY_HP_SCALE_PER_WAVE;
    const maxHp = enemyDef.hp * hpScale;
    const start = this.path[0];
    const container = this.add.container(start.x, start.y).setDepth(this.cfg.DEPTH.ENEMY);
    const body = this.add.circle(0, 0, enemyDef.radius, enemyDef.color, 1);
    container.add(body);

    if (enemyType === "healer") {
      const crossSize = enemyDef.radius;
      const crossThickness = 3;
      const horizontal = this.add.rectangle(0, 0, crossSize, crossThickness, 0x1f1f1f);
      const vertical = this.add.rectangle(0, 0, crossThickness, crossSize, 0x1f1f1f);
      container.add(horizontal);
      container.add(vertical);
    }

    const hpBarY = -enemyDef.radius - this.cfg.HP_BAR.OFFSET_Y;
    const hpBarWidth = enemyDef.radius * this.cfg.HP_BAR.WIDTH_MULTIPLIER;
    const hpBarBg = this.add.rectangle(0, hpBarY, hpBarWidth, this.cfg.HP_BAR.HEIGHT, 0x111111, 0.8);
    hpBarBg.setOrigin(0.5, 0.5);
    const hpBarFill = this.add.rectangle(
      -hpBarWidth / 2,
      hpBarY,
      hpBarWidth,
      this.cfg.HP_BAR.HEIGHT - 1,
      0x7cfc00,
      1
    );
    hpBarFill.setOrigin(0, 0.5);
    container.add(hpBarBg);
    container.add(hpBarFill);

    container.enemyType = enemyType;
    container.maxHp = maxHp;
    container.hp = maxHp;
    container.baseSpeed = enemyDef.speed;
    container.reward = enemyDef.reward;
    container.hitRadius = enemyDef.radius;
    container.pathIndex = 0;
    container.segmentProgress = 0;
    container.slowMultiplier = 1;
    container.slowUntil = 0;
    container.nextHealAt = this.time.now + enemyDef.healCooldownMs;
    container.hpBarFill = hpBarFill;
    container.hpBarWidth = hpBarWidth;
    container.isDead = false;

    this.enemies.add(container);
  }

  updateEnemies(time, deltaSeconds) {
    const enemies = this.enemies.getChildren();
    for (let index = 0; index < enemies.length; index += 1) {
      const enemy = enemies[index];
      if (!enemy.active || enemy.isDead) {
        continue;
      }

      if (enemy.enemyType === "healer" && time >= enemy.nextHealAt) {
        this.healNearbyEnemies(enemy);
        enemy.nextHealAt = time + this.cfg.ENEMIES.healer.healCooldownMs;
      }

      if (time >= enemy.slowUntil) {
        enemy.slowMultiplier = 1;
      }

      const moveSpeed = enemy.baseSpeed * enemy.slowMultiplier;
      let moveRemaining = moveSpeed * deltaSeconds;

      while (moveRemaining > 0 && enemy.pathIndex < this.path.length - 1) {
        const segmentStart = this.path[enemy.pathIndex];
        const segmentEnd = this.path[enemy.pathIndex + 1];
        const toTarget = Phaser.Math.Distance.Between(enemy.x, enemy.y, segmentEnd.x, segmentEnd.y);

        if (toTarget <= moveRemaining) {
          enemy.setPosition(segmentEnd.x, segmentEnd.y);
          enemy.pathIndex += 1;
          enemy.segmentProgress = 0;
          moveRemaining -= toTarget;
        } else {
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, segmentEnd.x, segmentEnd.y);
          enemy.x += Math.cos(angle) * moveRemaining;
          enemy.y += Math.sin(angle) * moveRemaining;
          const segmentLength = Phaser.Math.Distance.Between(segmentStart.x, segmentStart.y, segmentEnd.x, segmentEnd.y);
          const movedLength = Phaser.Math.Distance.Between(segmentStart.x, segmentStart.y, enemy.x, enemy.y);
          enemy.segmentProgress = segmentLength > 0 ? movedLength / segmentLength : 0;
          moveRemaining = 0;
        }
      }

      if (enemy.pathIndex >= this.path.length - 1) {
        this.handleEnemyExit(enemy);
      }
    }

    this.checkTowerDamage();
  }

  checkTowerDamage() {
    const enemies = this.enemies.getChildren();
    const towerDamageRange = 80;

    for (let ti = this.towers.length - 1; ti >= 0; ti--) {
      const tower = this.towers[ti];
      if (!tower.sprite.active) continue;

      for (let ei = 0; ei < enemies.length; ei++) {
        const enemy = enemies[ei];
        if (!enemy.active || enemy.isDead) continue;

        const dist = Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y);
        if (dist <= towerDamageRange) {
          tower.hp -= 1;
          this.updateTowerHpIndicator(tower);

          if (tower.hp <= 0) {
            this.destroyTower(tower, ti);
          }
          break;
        }
      }
    }
  }

  updateTowerHpIndicator(tower) {
    if (!tower.hpIndicator) return;
    const hearts = '♥'.repeat(Math.max(0, tower.hp));
    tower.hpIndicator.setText(hearts);
    if (tower.hp === 1) {
      tower.hpIndicator.setColor('#ff0000');
    } else if (tower.hp === 2) {
      tower.hpIndicator.setColor('#ff8800');
    }
  }

  destroyTower(tower, index) {
    if (tower.sprite) tower.sprite.destroy();
    if (tower.hpIndicator) tower.hpIndicator.destroy();
    this.occupiedCellSet.delete(this.cellKey(tower.col, tower.row));
    this.towers.splice(index, 1);
  }

  healNearbyEnemies(healer) {
    const healRadius = this.cfg.ENEMIES.healer.healRadius;
    const healAmount = this.cfg.ENEMIES.healer.healAmount;
    const enemies = this.enemies.getChildren();

    for (let index = 0; index < enemies.length; index += 1) {
      const enemy = enemies[index];
      if (!enemy.active || enemy.isDead) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(healer.x, healer.y, enemy.x, enemy.y);
      if (distance > healRadius) {
        continue;
      }

      enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmount);
      this.refreshEnemyHpBar(enemy);
    }
  }

  handleEnemyExit(enemy) {
    if (!enemy.active || enemy.isDead) {
      return;
    }

    enemy.isDead = true;
    enemy.destroy();
    this.lives -= 1;
    this.emitStats();
    this.playExitWarningSound();

    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  updateTowers(time) {
    for (let index = 0; index < this.towers.length; index += 1) {
      const tower = this.towers[index];
      if (!tower.sprite.active) {
        continue;
      }

      const target = this.selectTowerTarget(tower);
      if (!target) {
        continue;
      }

      const angle = Phaser.Math.Angle.Between(tower.x, tower.y, target.x, target.y);
      tower.sprite.rotation = angle;

      if (time >= tower.nextShotAt) {
        this.fireTowerProjectile(tower, target);
        tower.nextShotAt = time + 1000 / tower.fireRate;
      }
    }
  }

  selectTowerTarget(tower) {
    const enemies = this.enemies.getChildren();
    let bestTarget = null;
    let bestProgress = -1;

    for (let index = 0; index < enemies.length; index += 1) {
      const enemy = enemies[index];
      if (!enemy.active || enemy.isDead) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y);
      if (distance > tower.range) {
        continue;
      }

      const progress = enemy.pathIndex + enemy.segmentProgress;
      if (progress > bestProgress) {
        bestProgress = progress;
        bestTarget = enemy;
      }
    }

    return bestTarget;
  }

  fireTowerProjectile(tower, target) {
    const projectile = this.add.circle(
      tower.x,
      tower.y,
      this.cfg.PROJECTILES.RADIUS,
      tower.projectileColor,
      1
    );
    projectile.setDepth(this.cfg.DEPTH.PROJECTILE);
    projectile.target = target;
    projectile.damage = tower.damage;
    projectile.speed = tower.projectileSpeed;
    projectile.towerType = tower.type;
    projectile.splashRadius = tower.splashRadius;
    projectile.slowFactor = tower.slowFactor;
    projectile.slowDurationMs = tower.slowDurationMs;

    this.projectiles.add(projectile);
    this.playShootSound(tower.type);
  }

  updateProjectiles(deltaSeconds) {
    const projectiles = this.projectiles.getChildren();
    for (let index = 0; index < projectiles.length; index += 1) {
      const projectile = projectiles[index];
      if (!projectile.active) {
        continue;
      }

      const target = projectile.target;
      if (!target || !target.active || target.isDead) {
        projectile.destroy();
        continue;
      }

      const stepDistance = projectile.speed * deltaSeconds;
      const distance = Phaser.Math.Distance.Between(projectile.x, projectile.y, target.x, target.y);

      if (distance <= stepDistance + target.hitRadius) {
        this.resolveProjectileImpact(projectile, target.x, target.y, target);
        projectile.destroy();
        continue;
      }

      const angle = Phaser.Math.Angle.Between(projectile.x, projectile.y, target.x, target.y);
      projectile.x += Math.cos(angle) * stepDistance;
      projectile.y += Math.sin(angle) * stepDistance;
    }
  }

  resolveProjectileImpact(projectile, impactX, impactY, primaryTarget) {
    if (projectile.splashRadius > 0) {
      const enemies = this.enemies.getChildren();
      for (let index = 0; index < enemies.length; index += 1) {
        const enemy = enemies[index];
        if (!enemy.active || enemy.isDead) {
          continue;
        }

        const distance = Phaser.Math.Distance.Between(impactX, impactY, enemy.x, enemy.y);
        if (distance <= projectile.splashRadius) {
          this.damageEnemy(enemy, projectile.damage, projectile.slowFactor, projectile.slowDurationMs);
        }
      }
      return;
    }

    this.damageEnemy(primaryTarget, projectile.damage, projectile.slowFactor, projectile.slowDurationMs);
  }

  damageEnemy(enemy, amount, slowFactor = 1, slowDurationMs = 0) {
    if (!enemy.active || enemy.isDead) {
      return;
    }

    enemy.hp -= amount;
    if (slowFactor < 1 && slowDurationMs > 0) {
      enemy.slowMultiplier = Math.min(enemy.slowMultiplier, slowFactor);
      enemy.slowUntil = Math.max(enemy.slowUntil, this.time.now + slowDurationMs);
    }

    this.refreshEnemyHpBar(enemy);

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  refreshEnemyHpBar(enemy) {
    const hpRatio = Phaser.Math.Clamp(enemy.hp / enemy.maxHp, 0, 1);
    enemy.hpBarFill.scaleX = hpRatio;
    enemy.hpBarFill.fillColor = hpRatio > 0.5 ? 0x7cfc00 : hpRatio > 0.25 ? this.cfg.COLORS.GOLD : this.cfg.COLORS.ACCENT;
  }

  killEnemy(enemy) {
    if (!enemy.active || enemy.isDead) {
      return;
    }

    enemy.isDead = true;
    enemy.destroy();

    this.gold += enemy.reward;
    this.score += enemy.reward;
    this.emitStats();
    this.playEnemyDeathSound();
  }

  checkWaveCompletion(time) {
    if (!this.isRunning || this.betweenWaves || this.isSpawning) {
      return;
    }

    if (this.enemies.countActive(true) > 0) {
      return;
    }

    this.betweenWaves = true;
    this.waveCountdownEnd = time + this.cfg.GAME.WAVE_INTERVAL_MS;
    this.gold += this.cfg.GAME.WAVE_CLEAR_BONUS;
    this.score += this.cfg.GAME.WAVE_CLEAR_BONUS;
    this.emitStats();
    this.emitWaveState();
  }

  buildTowerFromMenu(towerType) {
    if (!this.isRunning || !this.pendingBuildCell) {
      return;
    }

    const { col, row } = this.pendingBuildCell;
    if (!this.isCellBuildable(col, row)) {
      this.pendingBuildCell = null;
      this.bus.emit("hideTowerMenu");
      return;
    }

    const towerDef = this.cfg.TOWERS[towerType];
    if (!towerDef || this.gold < towerDef.cost) {
      this.pendingBuildCell = null;
      this.bus.emit("hideTowerMenu");
      return;
    }

    const worldPosition = this.gridToWorld(col, row);
    const sprite = this.add.rectangle(
      worldPosition.x,
      worldPosition.y,
      this.cfg.TOWERS.BASE_SIZE,
      this.cfg.TOWERS.BASE_SIZE,
      towerDef.color,
      1
    );
    sprite.setDepth(this.cfg.DEPTH.TOWER);
    sprite.setStrokeStyle(1, 0x0f0f0f, 0.9);

    const tower = {
      type: towerType,
      col,
      row,
      x: worldPosition.x,
      y: worldPosition.y,
      color: towerDef.color,
      sprite,
      damage: towerDef.damage,
      fireRate: towerDef.fireRate,
      range: towerDef.range,
      projectileSpeed: towerDef.projectileSpeed,
      projectileColor: towerDef.projectileColor,
      splashRadius: towerDef.splashRadius,
      slowFactor: towerDef.slowFactor,
      slowDurationMs: towerDef.slowDurationMs,
      baseCost: towerDef.cost,
      upgraded: false,
      nextShotAt: this.time.now,
      hp: 3,
      maxHp: 3,
      hpIndicator: null
    };

    tower.hpIndicator = this.add.text(
      worldPosition.x,
      worldPosition.y - this.cfg.TOWERS.BASE_SIZE * 0.5 - 6,
      '♥♥♥',
      { fontFamily: 'sans-serif', fontSize: '10px', color: '#ff4444' }
    ).setOrigin(0.5).setDepth(this.cfg.DEPTH.TOWER + 1);

    this.towers.push(tower);
    this.occupiedCellSet.add(this.cellKey(col, row));
    this.gold -= towerDef.cost;
    this.emitStats();

    this.pendingBuildCell = null;
    this.bus.emit("hideTowerMenu");
  }

  upgradeTower(tower) {
    if (!this.isRunning || tower.upgraded || this.gold < tower.baseCost) {
      return;
    }

    this.gold -= tower.baseCost;
    tower.upgraded = true;
    tower.damage *= this.cfg.GAME.UPGRADE_MULTIPLIER;
    tower.fireRate *= this.cfg.GAME.UPGRADE_MULTIPLIER;
    tower.range *= this.cfg.GAME.UPGRADE_MULTIPLIER;
    tower.projectileSpeed *= this.cfg.GAME.UPGRADE_PROJECTILE_MULTIPLIER;
    tower.splashRadius *= this.cfg.GAME.UPGRADE_MULTIPLIER;
    tower.slowDurationMs *= this.cfg.GAME.UPGRADE_MULTIPLIER;

    if (tower.slowFactor < 1) {
      const strongerSlow = 1 - (1 - tower.slowFactor) * this.cfg.GAME.UPGRADE_MULTIPLIER;
      tower.slowFactor = Math.max(this.cfg.GAME.MIN_SLOW_FACTOR_AFTER_UPGRADE, strongerSlow);
    }

    tower.sprite.setStrokeStyle(2, this.cfg.COLORS.GOLD, 1);
    this.emitStats();
  }

  triggerGameOver() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.betweenWaves = false;
    this.isSpawning = false;
    this.pendingBuildCell = null;
    this.bus.emit("hideTowerMenu");
    this.bus.emit("gameOver");
    this.playGameOverSound();

    this.scene.pause();
    this.scene.launch("GameOverScene", {
      wave: this.wave,
      score: this.score,
      towersPlaced: this.towers.length
    });
  }

  emitStats() {
    this.bus.emit("statsUpdated", {
      gold: this.gold,
      lives: this.lives,
      wave: this.wave,
      score: this.score
    });
  }

  emitWaveState() {
    this.bus.emit("waveStateChanged", {
      betweenWaves: this.betweenWaves,
      countdownEnd: this.waveCountdownEnd
    });
  }

  worldToCell(x, y) {
    if (x < 0 || x >= this.cfg.WORLD_WIDTH || y < 0 || y >= this.cfg.WORLD_HEIGHT) {
      return null;
    }

    return {
      col: Math.floor(x / this.cfg.GRID_SIZE),
      row: Math.floor(y / this.cfg.GRID_SIZE)
    };
  }

  gridToWorld(col, row) {
    return {
      x: col * this.cfg.GRID_SIZE + this.cfg.GRID_SIZE / 2,
      y: row * this.cfg.GRID_SIZE + this.cfg.GRID_SIZE / 2
    };
  }

  isCellBuildable(col, row) {
    const key = this.cellKey(col, row);
    return !this.pathCellSet.has(key) && !this.occupiedCellSet.has(key);
  }

  getTowerAtCell(col, row) {
    for (let index = 0; index < this.towers.length; index += 1) {
      const tower = this.towers[index];
      if (tower.col === col && tower.row === row) {
        return tower;
      }
    }

    return null;
  }

  cellKey(col, row) {
    return `${col},${row}`;
  }
}
