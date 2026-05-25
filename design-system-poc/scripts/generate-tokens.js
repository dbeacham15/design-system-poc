#!/usr/bin/env node
// scripts/generate-tokens.js
// Reads tokens.json at repo root → writes src/tokens.css
// Run: npm run tokens:generate

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const manifest = JSON.parse(readFileSync(join(repoRoot, 'tokens.json'), 'utf8'))

function section(title) {
  return [
    '/* ============================================================',
    `   ${title}`,
    '   ============================================================ */',
  ]
}

const lines = [
  '/* AUTO-GENERATED — do not edit directly.',
  '   Source: tokens.json | Generator: npm run tokens:generate */',
  '',
  ...section('PRIMITIVES — color palette (referenced by semantic tokens)'),
  ':root {',
  ...Object.entries(manifest.primitives).map(([name, value]) => `  --${name}: ${value};`),
  '}',
  '',
  ...section('SEMANTIC — light theme (default)'),
  ':root {',
  '  /* Color */',
  ...Object.entries(manifest.semantic.color).map(
    ([name, t]) => `  --${name}: ${t.light}; /* ${t.description} */`
  ),
  '',
  '  /* Spacing */',
  ...Object.entries(manifest.semantic.spacing).map(
    ([name, t]) => `  --${name}: ${t.value}; /* ${t.description} */`
  ),
  '',
  '  /* Typography */',
  ...Object.entries(manifest.semantic.typography).map(
    ([name, t]) => `  --${name}: ${t.value}; /* ${t.description} */`
  ),
  '',
  '  /* Border Radius */',
  ...Object.entries(manifest.semantic.radius).map(
    ([name, t]) => `  --${name}: ${t.value}; /* ${t.description} */`
  ),
  '}',
  '',
  ...section('SEMANTIC — dark theme (OS preference default)'),
  '@media (prefers-color-scheme: dark) {',
  '  :root {',
  ...Object.entries(manifest.semantic.color).map(
    ([name, t]) => `    --${name}: ${t.dark};`
  ),
  '  }',
  '}',
  '',
  ...section('EXPLICIT THEME OVERRIDES — [data-theme] attribute on <html>'),
  '[data-theme="light"] {',
  ...Object.entries(manifest.semantic.color).map(
    ([name, t]) => `  --${name}: ${t.light};`
  ),
  '}',
  '',
  '[data-theme="dark"] {',
  ...Object.entries(manifest.semantic.color).map(
    ([name, t]) => `  --${name}: ${t.dark};`
  ),
  '}',
  '',
]

const outPath = join(repoRoot, 'src', 'tokens.css')
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, lines.join('\n'))
console.log(`✓ Written ${outPath}`)
