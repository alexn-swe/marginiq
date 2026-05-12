# MarginIQ

**Marketplace inventory and profit tracking for resellers — know your margins, grow your business.**

> **Status: In Development** — Core UI is built and functional with mock data. Backend, authentication, and database integration are planned for upcoming milestones.

---

## The Problem

Resellers juggling multiple marketplaces (eBay, Amazon, Poshmark, etc.) have no single place to track what they paid, what they sold, and what they actually made. Spreadsheets break down fast. MarginIQ is built to fix that.

---

## Features

### Implemented
- **Dashboard** — Overview of key metrics (revenue, profit, ROI, active listings) with dynamic summary cards
- **Inventory Management** — Browse and search inventory with filters, sorting, and status tracking
- **Sales Page** — View sales history with profit metrics, filters, and sortable columns
- **Analytics Dashboard** — Charts and visualizations for performance trends (powered by Recharts)
- **Import / Export** — CSV upload for bulk inventory import; report downloads
- **Settings Page** — Placeholder for user/account configuration
- **Responsive Layout** — Sidebar navigation and header work across screen sizes

### Planned
- **Authentication** — User accounts with secure login (NextAuth or Clerk)
- **PostgreSQL + Prisma** — Persistent data storage replacing current mock data
- **Multi-marketplace sync** — Connect eBay, Amazon, Poshmark, and other platforms
- **Profit calculator** — Factor in fees, shipping, and COGS automatically
- **Docker** — Containerized local development environment
- **CI/CD pipeline** — GitHub Actions for automated testing and deployment
- **AWS deployment** — Production hosting on AWS (ECS or App Runner)
- **Alerts and notifications** — Low stock, price drop, and margin threshold alerts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Data | Mock data (static) |
| Database | PostgreSQL + Prisma *(planned)* |
| Auth | NextAuth or Clerk *(planned)* |
| Infra | Docker, GitHub Actions, AWS *(planned)* |

---

## Screenshots

> Screenshots coming soon — UI is functional and being actively developed.

<!-- Add screenshots here once pages are ready for showcase -->
<!-- ![Dashboard](docs/screenshots/dashboard.png) -->
<!-- ![Inventory](docs/screenshots/inventory.png) -->
<!-- ![Analytics](docs/screenshots/analytics.png) -->

---

## Local Development

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Setup

```bash
# Clone the repo
git clone https://github.com/alexn-swe/marginiq.git
cd marginiq

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

No environment variables are required to run the current version — all data is mocked locally.

---

## Project Roadmap

### Phase 1 — UI Foundation (Current)
- [x] Dashboard with summary cards
- [x] Inventory page with search and filters
- [x] Sales page with profit metrics
- [x] Analytics page with charts
- [x] CSV import / export
- [x] Responsive sidebar layout

### Phase 2 — Backend + Auth
- [ ] Set up PostgreSQL database with Prisma ORM
- [ ] Replace mock data with real database queries
- [ ] Add user authentication (NextAuth or Clerk)
- [ ] REST or tRPC API layer

### Phase 3 — Integrations + Deployment
- [ ] Marketplace API integrations (eBay, Amazon, Poshmark)
- [ ] Automated fee and shipping cost calculation
- [ ] Docker + docker-compose for local dev
- [ ] GitHub Actions CI/CD pipeline
- [ ] Deploy to AWS

### Phase 4 — Growth Features
- [ ] Profit alerts and threshold notifications
- [ ] Bulk pricing tools
- [ ] Historical trend reports
- [ ] Multi-user / team support

---

## Resume Bullets

> For reference when describing this project professionally.

- Built a full-stack SaaS application in Next.js 16 and TypeScript for marketplace resellers to track inventory, sales, and profit margins across platforms
- Designed and implemented a multi-page dashboard with data visualizations (Recharts), CSV import/export, and filterable inventory and sales tables
- Architected a scalable project structure with PostgreSQL + Prisma, authentication, Docker, and AWS deployment planned for upcoming milestones

---

## Contributing

This is a personal project and not currently open to outside contributions. Feel free to fork and use as inspiration.

---

## License

MIT
