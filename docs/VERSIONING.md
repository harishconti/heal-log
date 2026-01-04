# HealLog Versioning Strategy

## Semantic Versioning (MAJOR.MINOR.PATCH)

HealLog follows [Semantic Versioning 2.0.0](https://semver.org/) for all releases.

### MAJOR Version
Increment when making **incompatible API or app changes**.
- Breaking API changes
- Major feature removals
- Required data migrations
- Database schema changes that break backward compatibility

Example: `1.0.0` → `2.0.0`

### MINOR Version
Increment when adding **new features** in a backward-compatible way.
- New patient features
- New analytics dashboards
- New API endpoints
- UI improvements

Example: `1.0.0` → `1.1.0`

### PATCH Version
Increment for **bug fixes** and minor improvements.
- Bug fixes
- Performance improvements
- Security patches
- Documentation updates

Example: `1.0.0` → `1.0.1`

---

## Beta Versioning

For beta releases, append `-beta.N`:
- `1.0.0-beta.1` - First beta release
- `1.0.0-beta.2` - Second beta release
- `1.0.0` - First production release

### Beta Version Rules
1. Beta versions are always less than the release version
2. Beta numbers increment within the same version
3. Bug fixes during beta increment the beta number
4. Feature additions during beta may require a new minor version

---

## Version Files

HealLog maintains version information in two locations:

### Frontend (`frontend/package.json`)
```json
{
  "name": "frontend",
  "version": "1.0.49"
}
```

### Backend (`backend/VERSION.json`)
```json
{
  "version": "1.0.49",
  "build_date": "2026-01-01T23:37:00+05:30",
  "features": ["..."],
  "fixes": ["..."]
}
```

---

## Release Process

### 1. Prepare Release
```bash
# Bump version (patch, minor, major, or beta)
node scripts/bump-version.js patch

# Or for beta releases
node scripts/bump-version.js beta
```

### 2. Update Changelog
Document changes in `CHANGELOG.md`:
- New features
- Bug fixes
- Breaking changes
- Migration instructions

### 3. Create Git Tag
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 4. Create GitHub Release
- Go to Releases on GitHub
- Create release from the tag
- Include changelog highlights
- Attach APK for Android releases

### 5. Deploy
- Backend: Deploy to production server
- Frontend: Build and submit to Play Store
- Web Dashboard: Deploy to hosting

---

## Android versionCode

The Android `versionCode` is an integer that **must increment** with every release.

### Rules
- Must increment with every release
- Never decrement
- Must be unique for each APK uploaded to Play Store

### Calculation
We use a simple incrementing number:
- Beta 1: versionCode = 1
- Beta 2: versionCode = 2
- Release 1.0.0: versionCode = 3
- Patch 1.0.1: versionCode = 4

### Alternative (for larger projects)
Calculate from version: `MMMNNNPPP`
- MMM = Major (001-999)
- NNN = Minor (001-999)
- PPP = Patch (001-999)

Examples:
- 1.0.0 = versionCode 1000000
- 1.0.1 = versionCode 1000001
- 1.1.0 = versionCode 1001000
- 2.0.0 = versionCode 2000000

---

## Example Timeline

```
Dec 25: 1.0.0-beta.1 (closed beta)
Dec 28: 1.0.0-beta.2 (bug fixes)
Jan 3:  1.0.0-beta.3 (feature additions)
Jan 10: 1.0.0 (production release)
Jan 20: 1.0.1 (security patch)
Feb 1:  1.1.0 (new features)
Mar 15: 2.0.0 (breaking changes)
```

---

## Quick Reference

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fix | Patch | 1.0.0 → 1.0.1 |
| New feature | Minor | 1.0.0 → 1.1.0 |
| Breaking change | Major | 1.0.0 → 2.0.0 |
| Beta release | Beta | 1.0.0 → 1.0.1-beta.1 |
| Release from beta | Release | 1.0.1-beta.3 → 1.0.1 |

---

## Bump Version Script

Use the included script for version management:

```bash
# Patch version (bug fixes)
node scripts/bump-version.js patch

# Minor version (new features)
node scripts/bump-version.js minor

# Major version (breaking changes)
node scripts/bump-version.js major

# Beta release
node scripts/bump-version.js beta

# Release (remove beta suffix)
node scripts/bump-version.js release
```

The script automatically updates:
- `frontend/app.json` (version and versionCode)
- `backend/VERSION.json` (version and build_date)
