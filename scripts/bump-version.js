#!/usr/bin/env node

/**
 * Version bumping script for HealLog Android builds
 * Semantic Versioning: MAJOR.MINOR.PATCH-beta.BUILD
 * Examples: 1.0.0-beta.1, 1.0.0-beta.2, 1.0.0, 1.1.0
 *
 * Usage:
 *   node bump-version.js patch   # 1.0.0 -> 1.0.1
 *   node bump-version.js minor   # 1.0.0 -> 1.1.0
 *   node bump-version.js major   # 1.0.0 -> 2.0.0
 *   node bump-version.js beta    # 1.0.0 -> 1.0.1-beta.1
 */

const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '../frontend/app.json');
const versionJsonPath = path.join(__dirname, '../backend/VERSION.json');

function bumpVersion(type = 'patch') {
  // Read app.json
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const currentVersion = appJson.expo.version;
  const currentBuild = appJson.expo.android.versionCode;

  console.log(`Current version: ${currentVersion} (build ${currentBuild})`);

  // Parse version (handle beta versions like 1.0.0-beta.1)
  const versionMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/);
  if (!versionMatch) {
    console.error(`Invalid version format: ${currentVersion}`);
    process.exit(1);
  }

  let [, major, minor, patch, beta] = versionMatch.map((v, i) => i === 0 ? v : parseInt(v) || 0);
  let newVersion;
  let newBuild = currentBuild + 1;

  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    case 'beta':
      if (beta > 0) {
        // Already in beta, increment beta number
        newVersion = `${major}.${minor}.${patch}-beta.${beta + 1}`;
      } else {
        // Start new beta cycle
        newVersion = `${major}.${minor}.${patch + 1}-beta.1`;
      }
      break;
    case 'release':
      // Remove beta suffix for release
      newVersion = `${major}.${minor}.${patch}`;
      break;
    default:
      console.error(`Unknown version type: ${type}`);
      console.log('Available types: major, minor, patch, beta, release');
      process.exit(1);
  }

  // Update app.json
  appJson.expo.version = newVersion;
  appJson.expo.android.versionCode = newBuild;

  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
  console.log(`Updated app.json: ${newVersion} (build ${newBuild})`);

  // Update backend VERSION.json
  const versionJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  versionJson.version = newVersion;
  versionJson.build_date = new Date().toISOString();
  versionJson.commit = `version-bump-${newVersion}`;

  fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 4) + '\n');
  console.log(`Updated VERSION.json: ${newVersion}`);

  console.log(`\n✓ Successfully updated to version: ${newVersion} (build ${newBuild})`);
}

// Execute
const type = process.argv[2] || 'patch';
bumpVersion(type);
