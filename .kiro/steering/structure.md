---
inclusion: always
---

# Project structure

```
/.kiro/            specs, steering, hooks (must stay in git; judged)
/src/logic/        pure game logic (no DOM, no camera) - property-tested
/src/tracking/     camera + MediaPipe -> brushing signal
/src/ui/           mirror frame, monsters, screens
/src/audio/        voice lines + sound
/src/storage/      localStorage wrapper
/public/models/    MediaPipe model files (same-origin)
/public/assets/    monster art, frame art, sounds
/tests/            Vitest + fast-check
```

- File names: kebab-case. One concept per file.
- Every voice line lives in one table (`src/audio/lines.ts`) with its caption text.
- Every monster lives in one table (`src/logic/monsters.ts`): id, name, rarity, unlock rule.
