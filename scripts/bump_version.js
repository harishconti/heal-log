#!/usr/bin/env node

/**
 * Auto Version Bump Script for GitHub Actions
 * This script is called by the auto-version.yml workflow to increment
 * the patch version in the VERSION file on each push to main.
 * 
 * It also synchronizes the version to:
 * - frontend/app.json (and increments android.versionCode)
 * - frontend/package.json
 * - backend/VERSION.json
 * - README.md
 */

const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '../VERSION');
const readmePath = path.join(__dirname, '../README.md');
const appJsonPath = path.join(__dirname, '../frontend/app.json');
const packageJsonPath = path.join(__dirname, '../frontend/package.json');
const backendVersionPath = path.join(__dirname, '../backend/VERSION.json');

function bumpVersion() {
    // Read current version from VERSION file
    const currentVersion = fs.readFileSync(versionFilePath, 'utf8').trim();
    console.log(`Current version: ${currentVersion}`);

    // Parse version
    const versionMatch = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!versionMatch) {
        console.error(`Invalid version format: ${currentVersion}`);
        process.exit(1);
    }

    const [major, minor, patch] = versionMatch.map((v, i) => i === 0 ? v : parseInt(v));

    let newMajor = parseInt(major);
    let newMinor = parseInt(minor);
    let newPatch = parseInt(patch) + 1;

    if (newPatch > 9) {
        newPatch = 0;
        newMinor += 1;
    }

    if (newMinor > 9) {
        newMinor = 0;
        newMajor += 1;
    }

    const newVersion = `${newMajor}.${newMinor}.${newPatch}`;

    // Update VERSION file
    fs.writeFileSync(versionFilePath, newVersion);
    console.log(`Updated VERSION to: ${newVersion}`);

    // Update README.md version badge if it exists
    try {
        let readme = fs.readFileSync(readmePath, 'utf8');
        // Update version in README if there's a version badge or reference
        const versionRegex = new RegExp(currentVersion.replace(/\./g, '\\.'), 'g');
        readme = readme.replace(versionRegex, newVersion);
        fs.writeFileSync(readmePath, readme);
        console.log(`Updated README.md with version: ${newVersion}`);
    } catch (err) {
        console.log('README.md not found or could not be updated, skipping...');
    }

    // Update frontend/app.json
    try {
        if (fs.existsSync(appJsonPath)) {
            const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
            appJson.expo.version = newVersion;
            if (appJson.expo.android && appJson.expo.android.versionCode) {
                appJson.expo.android.versionCode += 1;
                console.log(`Incremented android.versionCode to: ${appJson.expo.android.versionCode}`);
            }
            fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
            console.log(`Updated frontend/app.json to version: ${newVersion}`);
        } else {
            console.log('frontend/app.json not found, skipping...');
        }
    } catch (err) {
        console.error(`Error updating frontend/app.json: ${err.message}`);
    }

    // Update frontend/package.json
    try {
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            packageJson.version = newVersion;
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
            console.log(`Updated frontend/package.json to version: ${newVersion}`);
        } else {
            console.log('frontend/package.json not found, skipping...');
        }
    } catch (err) {
        console.error(`Error updating frontend/package.json: ${err.message}`);
    }

    // Update backend/VERSION.json
    try {
        if (fs.existsSync(backendVersionPath)) {
            const versionJson = JSON.parse(fs.readFileSync(backendVersionPath, 'utf8'));
            versionJson.version = newVersion;
            versionJson.build_date = new Date().toISOString().split('T')[0] + 'T00:00:00Z';
            fs.writeFileSync(backendVersionPath, JSON.stringify(versionJson, null, 4) + '\n');
            console.log(`Updated backend/VERSION.json to version: ${newVersion}`);
        } else {
            console.log('backend/VERSION.json not found, skipping...');
        }
    } catch (err) {
        console.error(`Error updating backend/VERSION.json: ${err.message}`);
    }

    console.log(`\n✓ Successfully bumped version to: ${newVersion}`);
}

// Execute
bumpVersion();
