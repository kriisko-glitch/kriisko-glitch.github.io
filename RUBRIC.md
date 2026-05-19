# Kriisko-Studio 2D Game Rubric v1.0

> Design and review spec for browser-based 2D games.
> Authored 2026-04-16. Synthesized from four research passes on Self-Determination Theory, modern 2D visuals, playability (juice/feel), and depth.

## Scoring model

Four pillars, equal weight by default (0.25 each). Each pillar yields 0–10. Final composite is a weighted average.

| Pillar | Weight | What it measures |
|---|---|---|
| **SDT — Need Satisfaction** | 0.25 | Autonomy + Competence + Relatedness (Ryan/Deci, Przybylski PENS) |
| **Modern 2D Visuals** | 0.25 | Readability, animation, juice, lighting, palette, UI, depth, FX restraint |
| **Playability (Feel)** | 0.25 | Input latency, frame pacing, juice density, audio, consistency, onboarding, retry |
| **Depth** | 0.25 | Skill ceiling, decision density, strategy variety, emergence, progression |

Composite interpretation:
- **≥ 7.0** — ship-ready quality
- **5.5–6.9** — playable but visibly rough; iterate
- **< 5.5** — significant rework needed

**Ship gate (any single pillar):** SDT-Competence ≥ 7, SDT-Autonomy ≥ 6, SDT-Relatedness ≥ 5, Visuals ≥ 6, Playability ≥ 6.5, Depth ≥ genre-floor (see §5).

---

## 1. SDT Pillar — Player Experience of Need Satisfaction

### 1.1 Autonomy (sub-weight 0.35)
| ID | Criterion | Measurement |
|---|---|---|
| A1 | Meaningful build/strategy choices reachable within 3 min | Count visible upgrade/choice UI; count distinct post-choice state traces across 2 playthroughs |
| A2 | Control scheme flexibility | Detect keyboard + mouse + touch support; remap or alt-scheme present |
| A3 | Failure reversibility | Restart button, difficulty select, non-punitive restart path |
| A4 | Pace self-determination | Pause available, speed toggle, or non-auto-advance structure |
| A5 | Non-optimal play viability | 2+ playstyle profiles survive ≥60s |

### 1.2 Competence (sub-weight 0.40)
| ID | Criterion | Measurement |
|---|---|---|
| C1 | Goal legibility within 10s | Visible HUD: score, objective, time, or HP |
| C2 | Input→response latency | Median < 50ms, p95 < 100ms over 30 samples |
| C3 | Difficulty curve (monotonic, non-punishing) | First-death typically 60–180s; ramp observable in spawn/score rate |
| C4 | Feedback density | ≥1 visible or audible feedback event per 2s of action |
| C5 | Failure is instructive | Cause-of-death signalled within 1s (death text, attacker highlight) |

### 1.3 Relatedness (sub-weight 0.25)
| ID | Criterion | Measurement |
|---|---|---|
| R1 | NPC/entity characterization | Named allies, enemies with distinct behavior or art |
| R2 | World/narrative framing | Title + theme + any diegetic text (tooltips, mission, log) |
| R3 | Persistence across sessions | localStorage/cookie score, unlocks, meta-progression |
| R4 | Social surface | Visible leaderboard, share-score, community link |

**Relatedness proxy for solo arcade games:** weight R2/R3/R4 at 40/30/30; R1 is a bonus, not a penalty.

---

## 2. Modern 2D Visuals Pillar

| ID | Category | Weight | Primary measure |
|---|---|---|---|
| V1 | Readability & silhouette | 0.22 | Player-vs-background luminance delta; WCAG contrast |
| V2 | Animation quality | 0.16 | Frame count, easing usage, idle anim detection |
| V3 | Particles & juice | 0.15 | Motion pixel density; screen shake events; hit-stop |
| V4 | Lighting & atmosphere | 0.12 | Bloom, vignette, shader presence |
| V5 | Color theory & palette | 0.10 | Dominant palette size, saturation discipline |
| V6 | UI polish | 0.10 | Font quality, alignment grid, icon clarity |
| V7 | Background depth | 0.08 | Parallax layers, ambient motion |
| V8 | Post-processing restraint | 0.07 | Effect stack count; taste override |

**Baseline for "modern 2D" (2024–2026):** lit sprites or shader glow, generous juice (shake + flash + particles per hit), restrained post-FX, 8–32 dominant palette colors, readable silhouette at 1080p, 60fps feel.

---

## 3. Playability Pillar

| ID | Criterion | Weight | Measurement |
|---|---|---|---|
| P1 | Input latency | 0.22 | Median event→state change ms |
| P2 | Frame pacing | 0.18 | RAF delta σ; p99 < 25ms |
| P3 | Juice density | 0.20 | Juice events/action: shake, flash, particles, hit-stop, audio |
| P4 | Audio feedback coverage | 0.12 | % of meaningful actions producing audio |
| P5 | Control consistency | 0.10 | Variance across 100 repeated input sequences |
| P6 | Onboarding clarity | 0.08 | Time-to-first-meaningful-action |
| P7 | Retry loop | 0.10 | Death → controllable again, ms |

---

## 4. Depth Pillar

| ID | Criterion | Weight | Measurement |
|---|---|---|---|
| D1 | Skill ceiling gap | 0.25 | (Optimal score − Random score) / Optimal |
| D2 | Decision density | 0.15 | Meaningful choices/min + branch points |
| D3 | Strategy variety | 0.20 | Distinct viable builds surviving ≥70% of optimal score |
| D4 | Emergent interactions | 0.20 | Mechanic × mechanic pairwise interaction count |
| D5 | Progression depth | 0.10 | Run-state, meta-progression, unlock tree, scaling |
| D6 | Replayability triggers | 0.05 | PRNG, daily, difficulty modes, leaderboard |
| D7 | Content/mechanic ratio | 0.05 | min(10, (enemy_types + level_types + boss_types) / (mechanic_count × 2)) |

**Depth ≠ content.** A 20-level identical-mechanic game scores low on D4; a 3-mechanic emergent game scores high.

---

## 5. Genre-specific floors

| Genre | Min Composite | Min Depth | Notes |
|---|---|---|---|
| Arcade (Snake, Pong, Breakout) | 6.0 | 25 | Shallow is acceptable; juice + polish carry |
| Idle / Incremental | 6.0 | 35 | Depth in prestige loops + tech tree |
| Platformer | 6.5 | 45 | Depth in movement tech |
| Puzzle (Match-3) | 6.5 | 55 | ≥3 viable strategies required |
| Tower Defense | 7.0 | 55 | Tower × enemy synergy is the game |
| Survivors / Auto-battler | 7.0 | 60 | ≥5 build archetypes + synergy |
| Roguelike | 7.0 | 65 | Highest depth bar — genre promise |

---

## 6. Evaluation protocol

Each game is run through an automated AI-player pass that collects:

1. **Pre-flight** — load `index.html`, confirm state hooks exist within 15s.
2. **Onboarding phase (0–15s)** — capture initial DOM, screenshots, tutorial prompts, state probe.
3. **Calibration strike** — single input, measure end-to-end latency.
4. **Random play (60s)** — uniform random legal inputs; capture score trajectory and juice events.
5. **Rule-based optimal play (60s)** — genre-specific heuristic (seek food / dodge bullets / match tiles).
6. **Post-death probe** — detect game-over, capture retry latency and cause signalling.
7. **Source inspection** — scan source for upgrade trees, mechanic tags, shader usage.
8. **Vision pass** — peak-action screenshot scored by a vision model for readability + juice + UI taste.

All metrics aggregate into a single JSON report per game.

---

## 7. Sources

- Ryan, Rigby, Przybylski (2006) — PENS model.
- Przybylski, Rigby, Ryan (2010) — Competence > Autonomy > Relatedness for short-form.
- Jan Willem Nijman — "The Art of Screenshake" (2013).
- Steve Swink — *Game Feel* (2008).
- Doug Church — *Formal Abstract Design Tools* (1999).
- Raph Koster — *A Theory of Fun for Game Design* (2013, rev.).
- Jesse Schell — *The Art of Game Design* (2019, 3rd ed., Lens of Elegance).
- Barlow & Bostan (2023) — "Emergent Narrative and Systems Coupling in 2D Roguelikes."
