# EHCore

A HEOR (Health Economics and Outcomes Research) evidence management platform built with Next.js. EHCore helps research teams organize literature, run structured searches, and model patient funnels in a single workspace.

## Features

- **Evidence Libraries** — Build and manage structured evidence tables with customizable columns, sorting, filtering, and AI-assisted data extraction
- **Literature Search** — PICO-based search builder with PubMed query generation, abstract review, and AI inclusion/exclusion decisions
- **Patient Funnels** — Visualize and model patient population funnels across countries with level-by-level article evidence
- **Admin Panel** — User management with role-based access (admin / researcher / viewer)
- **Dossier & Dashboard** — Placeholders for upcoming dossier assembly and analytics modules

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Primitives | Radix UI |
| State | Zustand |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Netlify |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@ehcore.com | admin123 |
| Researcher | researcher@ehcore.com | research123 |
| Viewer | viewer@ehcore.com | viewer123 |

## Project Structure

```
src/
  app/              # Next.js App Router pages
    login/
    libraries/      # Evidence library list + detail
    lit-search/     # Literature search sessions
    patient-funnels/
    admin/
  components/       # Reusable UI + feature components
    ui/             # Button, Card, Input, Badge, Dialog, etc.
  store/            # Zustand stores (libraries, litSearch, funnels)
  types/            # Shared TypeScript types
  lib/              # Utility functions
```

## Deployment

The project is configured for one-click Netlify deployment via `netlify.toml`. Connect the GitHub repository in the Netlify dashboard and it will build and deploy automatically on every push.
