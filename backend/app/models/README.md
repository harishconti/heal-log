# Models Directory

## Current Status

This directory contains **legacy plain Pydantic models** for backward compatibility.

### Active Files
- `document.py` - Used by `document_service.py` for raw MongoDB operations

### Deprecated Files
The following files are deprecated and unused:
- `patient.py` - Superseded by `app/schemas/patient.py` (Beanie Document)
- `user.py` - Superseded by `app/schemas/user.py` (Beanie Document)
- `clinical_note.py` - Superseded by `app/schemas/clinical_note.py` (Beanie Document)

## Current Pattern

The codebase currently uses **schemas/** for both:
1. Beanie Documents (database models)
2. API request/response schemas (Pydantic models)

This differs from the recommended separation in `docs/architecture_suggestions.md` but is consistent across the codebase.

## Future Work

The architecture document recommends:
- **models/** - Should contain Beanie Documents only
- **schemas/** - Should contain API request/response schemas only

Migrating to this structure would require updating all imports across the codebase.

## Recommendation

For new code:
- Use `app/schemas/` for both database models and API schemas
- Follow the pattern in `schemas/patient.py` as the reference implementation
- Do not add new files to this `models/` directory
