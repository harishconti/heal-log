# HealLog Web Dashboard

A React-based web dashboard for HealLog Pro users, providing analytics, patient management, and subscription features.

## Features

- **Dashboard**: Overview of patient statistics and recent activity
- **Patient Management**: List, search, view, and manage patients
- **Analytics**: Visual charts and metrics for patient data
- **Profile Management**: User profile and subscription settings
- **Authentication**: Login, registration, OTP verification, password reset

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework |
| Vite | 7.2.4 | Build tool |
| TypeScript | 5.9.3 | Type safety |
| Tailwind CSS | 4.1.18 | Styling |
| Zustand | 5.0.9 | State management |
| React Router DOM | 7.11.0 | Navigation |
| Recharts | 3.6.0 | Data visualization |
| React Hook Form | 7.69.0 | Form handling |
| Zod | 4.2.1 | Validation |
| Axios | 1.13.2 | HTTP client |
| Lucide React | 0.562.0 | Icons |
| date-fns | 4.1.0 | Date formatting |

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
