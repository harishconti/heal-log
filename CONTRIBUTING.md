# Contributing to HealLog

Thank you for your interest in contributing to HealLog! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Keep discussions professional
- Report unacceptable behavior to the maintainers

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB (local or Atlas)
- Git

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/heal-log.git
cd heal-log
```

---

## Development Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your settings

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your backend URL

# Run development server
npm start
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend (if applicable)
cd frontend
npm test
```

---

## Project Structure

```
heal-log/
├── backend/
│   ├── app/
│   │   ├── api/          # API route handlers (16 routers)
│   │   ├── core/         # Config, security, exceptions, logging
│   │   ├── db/           # Database connection and initialization
│   │   ├── models/       # Beanie ODM document models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # Business logic (13 services)
│   │   └── middleware/   # Request logging middleware
│   ├── tests/            # Test files (48 tests)
│   ├── scripts/          # Database scripts
│   ├── main.py           # Application entry
│   └── requirements.txt
│
├── frontend/
│   ├── app/              # Expo Router pages (15+ screens)
│   ├── components/       # React components (core, forms, ui)
│   ├── contexts/         # React contexts
│   ├── models/           # WatermelonDB models
│   ├── services/         # API services (11 services)
│   ├── store/            # Zustand store
│   └── constants/        # App constants
│
├── web-dashboard/        # React + Vite web dashboard
│   ├── src/
│   │   ├── pages/        # Dashboard pages
│   │   ├── components/   # React components
│   │   ├── api/          # API clients
│   │   └── store/        # Zustand stores
│   └── package.json
│
├── scripts/              # Utility scripts (version bump, env generation)
└── docs/                 # Documentation
```

---

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feature/add-appointment-scheduling`
- `fix/patient-search-bug`
- `docs/update-api-documentation`
- `refactor/sync-service`

### Workflow

1. Create a new branch from `main`
2. Make your changes
3. Write/update tests
4. Run tests locally
5. Commit with clear messages
6. Push and create a Pull Request

---

## Coding Standards

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints
- Write docstrings for functions
- Keep functions focused and small

```python
async def get_patient(
    patient_id: str,
    user_id: str
) -> Optional[Patient]:
    """
    Retrieve a patient by ID for a specific user.

    Args:
        patient_id: The patient's unique identifier
        user_id: The authenticated user's ID

    Returns:
        Patient object if found, None otherwise
    """
    return await Patient.find_one(
        Patient.id == patient_id,
        Patient.user_id == user_id
    )
```

### TypeScript (Frontend)

- Use TypeScript strict mode
- Define interfaces for data structures
- Use functional components with hooks
- Keep components small and focused

```typescript
interface PatientCardProps {
  patient: Patient;
  onPress: () => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onPress
}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{patient.name}</Text>
    </TouchableOpacity>
  );
};
```

### Commit Messages

Use conventional commits:

```
feat: add patient export functionality
fix: resolve sync conflict on offline mode
docs: update API documentation
refactor: simplify patient service logic
test: add tests for auth endpoints
chore: update dependencies
```

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_patients.py

# Run specific test
pytest tests/test_patients.py::test_create_patient
```

### Writing Tests

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_patient(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/patients/",
        json={
            "name": "Test Patient",
            "phone": "+1234567890"
        },
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test Patient"
```

---

## Submitting Changes

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Create Pull Request** with:
   - Clear title describing the change
   - Description of what and why
   - Link to related issues
   - Screenshots for UI changes

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tests added/updated
- [ ] All tests passing

## Checklist
- [ ] Code follows project style
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

- At least one maintainer review required
- Address feedback promptly
- Keep PRs focused and small
- Squash commits before merge

---

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be patient - maintainers review when available

Thank you for contributing!
