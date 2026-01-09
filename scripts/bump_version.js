#!/usr/bin/env node

/**
 * Auto Version Bump Script for GitHub Actions
 * This script is called by the auto-version.yml workflow to increment
 * the patch version in the VERSION file on each push to main.
 */

const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '../VERSION');
const readmePath = path.join(__dirname, '../README.md');

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

    const [, major, minor, patch] = versionMatch.map((v, i) => i === 0 ? v : parseInt(v));
    const newVersion = `${major}.${minor}.${patch + 1}`;

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

    console.log(`\n✓ Successfully bumped version to: ${newVersion}`);
}

// Execute
bumpVersion();
