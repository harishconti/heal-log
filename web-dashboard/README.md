# HealLog Web Dashboard

A React-based web dashboard for HealLog Pro users, providing analytics, patient management, and subscription features.

## Features

- **Dashboard**: Overview of patient statistics and recent activity
- **Patient Management**: List, search, view, and manage patients
- **Analytics**: Visual charts and metrics for patient data
- **Profile Management**: User profile and subscription settings
- **Authentication**: Login, registration, OTP verification, password reset

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Zustand** for state management
- **React Router** for navigation
- **Chart.js** for data visualization

## Project Structure

```
src/
├── api/           # API client and endpoints
│   ├── client.ts  # Axios client configuration
│   ├── auth.ts    # Authentication endpoints
│   ├── patients.ts # Patient CRUD operations
│   ├── analytics.ts # Analytics data fetching
│   └── payments.ts # Subscription/payment endpoints
├── components/
│   ├── ui/        # Reusable UI components (Button, Card, Modal, etc.)
│   └── charts/    # Chart components (Line, Bar, Pie)
├── hooks/         # Custom React hooks
│   ├── useAuth.ts
│   ├── usePatients.ts
│   └── useAnalytics.ts
├── layouts/       # Page layouts
│   ├── AuthLayout.tsx
│   └── DashboardLayout.tsx
├── pages/         # Page components
│   ├── auth/      # Login, Register, OTP, Forgot Password
│   ├── dashboard/ # Main dashboard
│   ├── patients/  # Patient list, detail, form
│   ├── analytics/ # Analytics charts
│   └── profile/   # User profile
├── store/         # Zustand stores
│   ├── authStore.ts
│   └── appStore.ts
└── types/         # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+
- HealLog backend running (default: http://localhost:8000)

### Installation

```bash
cd web-dashboard
npm install
```

### Development

```bash
npm run dev
```

The dashboard will be available at http://localhost:5173

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the web-dashboard directory:

```env
VITE_API_URL=http://localhost:8000
```

## Access Requirements

The web dashboard is available exclusively for **Pro subscription** users. Free tier users will be prompted to upgrade.

## Related Documentation

- [Main README](../README.md)
- [API Documentation](../API_DOCUMENTATION.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)
