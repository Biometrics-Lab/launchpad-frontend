# Launchpad

SaaS platform for baseball facilities to measure player metrics and manage player development.

Built with Next.js 15, MUI v6, TypeScript. Connects to the [launchpad](../launchpad/) Spring Boot backend.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Screenshots

### Dashboard
KPI summary cards (Players, Teams, Assessments, Active Now) with a Recently Tested feed showing per-player radar charts and metric badges.

![Dashboard](docs/screenshots/01-dashboard.png)

### Live Session
Real-time session view: rep list with bat speed per rep, live metric panel, and synced video playback with speed controls.

![Live Session](docs/screenshots/02-live-session.png)

### Report — Radar Chart
Player assessment report with a full radar chart visualization. Filter by session or rep, toggle AVG / MIN / MAX, and select metrics.

![Report Radar](docs/screenshots/03-report-radar.png)

### Report — Column Chart
Same report in column chart mode with a metric summary table showing values and session counts below.

![Report Column](docs/screenshots/04-report-column.png)

### Assessments List
Searchable table of all assessments — player name, sport badge, and template — with edit, sessions, and delete actions.

![Assessments List](docs/screenshots/05-assessments-list.png)

### Assessment Detail
Assessment page showing aggregated metrics (MIN / MAX / AVG across sessions and reps) and a sessions table with status badges.

![Assessment Detail](docs/screenshots/06-assessment-detail.png)
