import Phaser from 'phaser';
import { GAME, COLORS } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';

declare global {
  interface Window {
    __VOID_DRIFT__: {
      getScore: () => number;
      getWave: () => number;
      getHP: () => number;
      getEnemyCount: () => number;
      getUpgrades: () => string[];
      getState: () => 'menu' | 'playing' | 'gameover';
      spawnEnemy: (type: 'drone' | 'bruiser' | 'cruiser') => void;
      killPlayer: () => void;
      setScore: (n: number) => void;
    };
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: COLORS.BG,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 2,
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
};

const game = new Phaser.Game(config);

function getGameScene(): GameScene | null {
  const scene = game.scene.getScene('GameScene');
  if (scene && scene.scene.isActive()) {
    return scene as GameScene;
  }
  return null;
}

function getCurrentState(): 'menu' | 'playing' | 'gameover' {
  if (game.scene.isActive('GameOverScene')) return 'gameover';
  const gs = getGameScene();
  if (gs) return gs.gameState === 'gameover' ? 'gameover' : 'playing';
  return 'menu';
}

window.__VOID_DRIFT__ = {
  getScore: () => {
    const gs = getGameScene();
    return gs ? gs.score : 0;
  },
  getWave: () => {
    const gs = getGameScene();
    if (!gs) return 0;
    return (gs as any).waveManager?.currentWave ?? 0;
  },
  getHP: () => {
    const gs = getGameScene();
    return gs?.player?.hp ?? 0;
  },
  getEnemyCount: () => {
    const gs = getGameScene();
    return gs?.getEnemyCount() ?? 0;
  },
  getUpgrades: () => {
    const gs = getGameScene();
    return gs?.player?.appliedUpgrades ?? [];
  },
  getState: getCurrentState,
  spawnEnemy: (type: 'drone' | 'bruiser' | 'cruiser') => {
    const gs = getGameScene();
    gs?.spawnEnemy(type);
  },
  killPlayer: () => {
    const gs = getGameScene();
    gs?.killPlayer();
  },
  setScore: (n: number) => {
    const gs = getGameScene();
    if (gs) gs.score = n;
  },
};
