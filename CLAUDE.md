# Agent Rules — Bánh Cá Bốn Mùa Project

## Behavior
- NEVER open browser or Chrome automatically
- NEVER run `npm run build` after making changes
- NEVER run `npm run dev` automatically
- After completing any task: write code, save file, stop — do nothing else

## Development Commands (human runs manually)
- Dev server: `npm run dev`
- Build: `npm run build`
- The human will run these themselves when ready

## Code Style
- TypeScript strict
- Tailwind CSS only, no inline style unless unavoidable
- "use client" only when component uses hooks or browser APIs
- No unnecessary console.log

## Project Stack
- Next.js 14 App Router
- Tailwind CSS
- TypeScript
- No external animation libraries

## File Structure
app/
  page.tsx
  layout.tsx
  menu/
    page.tsx
components/
  VideoHero.tsx
  IntroSection.tsx
  FeatureCard.tsx
public/
  demo.mp4