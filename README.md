# Kriisko-Studio

**AI-first indie game studio — 29 playable HTML5 titles.**

Live at **[kriisko-glitch.github.io](https://kriisko-glitch.github.io)**.

A portfolio of browser games built with Phaser 3, TypeScript, and Vite. Every game is scored against a [shared design rubric](RUBRIC.md) — 9 titles cleared the 7.0 "ship-ready" bar.

---

## Highlights

| Game | Genre | Rubric Score |
|---|---|---|
| [Neon Citadel](https://kriisko-glitch.github.io/neon-citadel/) | Tower Defense | **7.97** |
| [Neon Survivors v2](https://kriisko-glitch.github.io/neon-survivors-v2/) | Survivors | 7.61 |
| [Neon Survivors](https://kriisko-glitch.github.io/neon-survivors/) | Survivors | 7.53 |
| [Stellar Siege](https://kriisko-glitch.github.io/stellar-siege/) | Shoot 'em up | 7.33 |
| [Neon Dungeon](https://kriisko-glitch.github.io/neon-dungeon/) | Roguelike | 7.20 |
| [Neon Snake Plus](https://kriisko-glitch.github.io/neon-snake-plus/) | Arcade | 7.20 |
| [Whiskers & Wands](https://kriisko-glitch.github.io/llm-pet-rpg/) | LLM Roguelike | 7.03 |
| [Platformer](https://kriisko-glitch.github.io/platformer/) | Platformer | 7.02 |
| [Neon Fortress](https://kriisko-glitch.github.io/neon-fortress/) | Tower Defense | 7.00 |

Full catalog of 29 games on the [landing page](https://kriisko-glitch.github.io).

## Tech Stack

- **Engine:** [Phaser 3](https://phaser.io/) for the action titles, raw Canvas/DOM for the puzzle and idle games
- **Language:** TypeScript for the polished entries (`stellar-siege`, `particle-forge`), vanilla JS elsewhere
- **Build:** [Vite](https://vitejs.dev/) for TS projects, static HTML for the rest
- **Backend:** [Supabase](https://supabase.com/) — global high-score leaderboard + feedback intake via edge functions
- **Hosting:** GitHub Pages
- **LLM:** Google Gemini powers the AI companion in *Whiskers & Wands*

## Shared Modules

Reusable code lives under [`shared/`](shared):

- `kriisko-juice.js` — screen shake, particle bursts, hit-stop
- `kriisko-depth.js` — parallax + lighting helpers
- `kriisko-meta.js` — meta-progression + achievement system
- `leaderboard.js` — local + global Supabase high-score boards
- `feedback.js` — in-game feedback launcher
- `mobile-controls.js` — touch controls (d-pad, virtual joystick)

## Design Rubric

Games are scored across four equally-weighted pillars (see [RUBRIC.md](RUBRIC.md) for the full spec):

- **SDT — Need Satisfaction** — Autonomy, Competence, Relatedness (Ryan/Deci PENS model)
- **Modern 2D Visuals** — readability, animation, juice, lighting, palette, UI
- **Playability (Feel)** — input latency, frame pacing, juice density, audio, retry loop
- **Depth** — skill ceiling, decision density, strategy variety, emergence, progression

Each game runs through an automated AI-player evaluation pass (random play vs. rule-based optimal play, source inspection, vision-LLM screenshot scoring) and lands a composite 0–10 score with per-pillar breakdowns. **9 of 29 titles** clear the 7.0 ship-ready bar; genre-specific floors apply (Roguelike requires 7.0, Arcade only 6.0).

## Running Locally

Static games — just open `index.html`:

```bash
git clone https://github.com/kriisko-glitch/kriisko-glitch.github.io.git
cd kriisko-glitch.github.io
# Any static server works:
npx serve .
```

TypeScript projects (e.g. `stellar-siege`, `particle-forge`):

```bash
cd stellar-siege
npm install
npm run dev
```

## Feedback

Found a bug or have an idea? Use the in-game **Feedback** button or visit [the feedback page](https://kriisko-glitch.github.io/feedback/).

## License

MIT — see [LICENSE](LICENSE).
