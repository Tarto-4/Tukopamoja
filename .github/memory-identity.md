# Project Identity

<!--
  This file is prepended to every memory-injected prompt, regardless of namespace.
  Keep it under 200 words so it does not crowd out dynamic memory facts.
  Agents read this on every run — it has no TTL and is never distilled.
-->

## Project name
Tukopamoja

## Purpose
Real-time multiplayer game arena (quiz, puzzle, strategy, word games) for hosted live sessions with spectators.

## Tech stack
Next.js 14, React 18, TypeScript, Supabase (Postgres + Realtime), Tailwind CSS, Zustand, GitHub Pages (static export)

## Key constraints
TypeScript strict mode, static export for GitHub Pages, Supabase RLS for all data access, palette colors: Yellow #eecd00, Dark Grey #4c4d4e, Black #050405, Purple #873287, Green #82bc00, Blue #42738d, Orange #f7a800, Red #f42535, Brown #65513c, Light Grey #5c6670, Beige #d8d2c4

## Team conventions
Conventional commits, main branch, dual remotes (ens.ghe.com + github.com), deploy via gh-pages
