#!/usr/bin/env node
// Usage: node ai-player/qwen-player.mjs
// Requires: npx playwright install chromium (once)
// Requires: Qwen server running at http://localhost:11001

import { chromium } from 'playwright';

const QWEN_URL = 'http://localhost:11001/v1/chat/completions';
const GAME_URL = process.env.GAME_URL || 'http://localhost:5173';
const TICK_INTERVAL = 250;

const SYSTEM_PROMPT = `You are playing a 3D space shooter. Based on the game state JSON, output ONLY a JSON array of actions to take this tick from: moveLeft, moveRight, moveUp, moveDown, fire, stopMove. Max 2 actions. Output ONLY the JSON array, no explanation.`;

let totalGames = 0;
let totalScore = 0;

async function queryQwen(gameState) {
  const compact = {
    hp: gameState.hp,
    wave: gameState.wave,
    pos: gameState.playerPos,
    enemies: gameState.enemies.slice(0, 5).map(e => ({
      type: e.type,
      hp: e.hp,
      x: Math.round(e.pos.x),
      y: Math.round(e.pos.y),
      z: Math.round(e.pos.z),
    })),
    powerups: gameState.powerups.slice(0, 3).map(p => ({
      type: p.type,
      x: Math.round(p.pos.x),
      y: Math.round(p.pos.y),
      z: Math.round(p.pos.z),
    })),
    enemyCount: gameState.enemyCount,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch(QWEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3.5-0.8b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(compact) },
        ],
        temperature: 0.1,
        max_tokens: 50,
        chat_template_kwargs: { enable_thinking: false },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return ['fire'];

    const match = content.match(/\[.*\]/s);
    if (match) {
      const actions = JSON.parse(match[0]);
      const valid = ['moveLeft', 'moveRight', 'moveUp', 'moveDown', 'fire', 'stopMove'];
      return actions.filter(a => valid.includes(a)).slice(0, 2);
    }
    return ['fire'];
  } catch {
    clearTimeout(timeout);
    return ['fire'];
  }
}

async function main() {
  console.log('Launching Stellar Siege AI Player...');
  console.log(`Game URL: ${GAME_URL}`);
  console.log(`Qwen URL: ${QWEN_URL}`);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(GAME_URL, { waitUntil: 'domcontentloaded' });

  await page.waitForFunction(() => window.__STELLAR_SIEGE__ !== undefined, {
    timeout: 15000,
  });
  console.log('Game loaded — debug API found.');

  async function tick() {
    try {
      const state = await page.evaluate(() => {
        const api = window.__STELLAR_SIEGE__;
        return {
          state: api.getState(),
          score: api.getScore(),
          hp: api.getHP(),
          wave: api.getWave(),
          enemyCount: api.getEnemyCount(),
          playerPos: api.getPlayerPos(),
          enemies: api.getEnemies(),
          powerups: api.getPowerups(),
        };
      });

      if (state.state === 'gameover') {
        totalGames++;
        totalScore += state.score;
        console.log(
          `[Game ${totalGames}] GAME OVER — Score: ${state.score}, Wave: ${state.wave} | ` +
          `Avg: ${Math.round(totalScore / totalGames)}`
        );
        await page.evaluate(() => window.__STELLAR_SIEGE__.restart());
        return;
      }

      if (state.state === 'playing' || state.state === 'wave-intro') {
        const actions = await queryQwen(state);
        for (const action of actions) {
          await page.evaluate((a) => window.__STELLAR_SIEGE__.injectInput(a), action);
        }
      }
    } catch (err) {
      console.error('Tick error:', err.message);
    }
  }

  console.log('Starting AI loop (Ctrl+C to stop)...\n');
  setInterval(tick, TICK_INTERVAL);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
