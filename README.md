# ICMRS — Intelligent Civic Management & Response System

ICMRS is an AI-powered civic-management platform designed to make citizen
complaint handling faster, smarter, and more transparent.

The platform enables citizens to submit and track civic complaints while
providing officers and administrators with tools for complaint management,
SLA monitoring, departmental routing, analytics, escalation management, and
geographic complaint visualization.

## 🚀 Core Features

### 👤 Citizen

- Citizen registration and login
- Submit civic complaints with category, description, photo, and location
- Automatically generated complaint ID
- Track complaint status and view the complaint timeline
- View SLA and expected resolution information
- Confirm resolutions and submit feedback with a star rating

### 👨‍💼 Department Officer

- Secure officer login and role-based dashboard
- View, search, and filter assigned complaints
- Review complaint details and evidence
- Update complaint status and priority
- Add progress updates
- Upload resolution evidence and resolve complaints
- Monitor SLA deadlines

### 🛡️ Admin

- Secure admin login and role-based access control
- System-wide complaint and SLA monitoring
- Identify at-risk and breached complaints
- Review department performance and resolution rates
- Track average resolution time and citizen satisfaction
- Monitor escalations
- View analytics, complaint maps, and heatmaps
- Manage officers, departments, and SLA configuration

## 🧠 AI Intelligence Layer

ICMRS is designed with an AI intelligence layer to support automated
decision-making throughout the complaint lifecycle. AI capabilities are
integrated progressively as the corresponding backend services become
available.

### Auto-Classification

Complaint information is analyzed to identify the relevant civic category or
department, including Roads, Sanitation, Water Supply, Electricity, and
Public Safety.

### Duplicate Detection

Complaint text, semantic similarity, and geographic proximity are used to
identify potentially duplicate reports and reduce duplicate case creation.

### Dynamic Priority Scoring

Complaints receive a priority score from 0–100 based on factors such as:

- Issue severity
- Public safety risk
- Complaint density
- Location impact
- SLA age

### Computer Vision Verification

Uploaded images can assist with damage severity estimation, evidence
verification, and resolution-proof verification.

## ⏱️ SLA Management

SLA (Service Level Agreement) defines the expected maximum time for resolving
a complaint. ICMRS tracks SLA status throughout the complaint lifecycle so
officers can identify approaching deadlines and administrators can monitor
compliance across departments.

### SLA States

- 🟢 On Track
- 🟡 At Risk
- 🟠 Critical
- 🔴 Breached

## 🗺️ Map & Geographic Intelligence

The platform provides geographic visualization of civic complaints through:

- Complaint locations and priority-based markers
- Complaint clustering and heatmaps
- Category-wise geographic concentration
- Department, status, and date-range filtering

## 🏗️ System Architecture

ICMRS follows a modular-monolith architecture.

```text
ICMRS/
├── backend/                  # Node.js + Express + TypeScript API
│   ├── prisma/               # Prisma schema, migrations, and seed data
│   └── src/
│       ├── config/           # Environment and application configuration
│       ├── database/         # Database seed utilities
│       ├── jobs/             # Background jobs, including SLA monitoring
│       ├── middleware/        # Authentication, errors, and uploads
│       ├── modules/
│       │   ├── ai/           # AI service integration
│       │   ├── auth/         # Authentication
│       │   ├── complaints/   # Complaint lifecycle and resolution
│       │   ├── departments/  # Departments and performance
│       │   ├── notifications/# Email, SMS, and push notifications
│       │   └── users/        # User management and roles
│       ├── app.ts            # Express application bootstrap
│       └── server.ts         # Server entry point
├── frontend/                 # React + Vite + TypeScript web application
│   └── src/
│       ├── components/       # Dashboards, forms, maps, and modals
│       ├── services/         # API client
│       ├── types/            # Shared frontend types
│       ├── App.tsx           # Main application view
│       └── main.tsx          # Application entry point
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run dev
```

Run the backend checks with `npm run build` and `npm run lint`.

### Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Create local environment files from the relevant `.env.example` files when
they are available. Do not commit secrets or production credentials.

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, TypeScript, Prisma, SQLite/PostgreSQL-compatible database, Zod
- **Frontend:** React 18, Vite, TypeScript, Leaflet, Lucide Icons
- **Security and operations:** Helmet, CORS, JWT authentication, Multer, Morgan, node-cron
- **Tooling:** ESLint, Prettier, tsx, Prisma
