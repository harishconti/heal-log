const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '..', 'VERSION');

try {
    if (!fs.existsSync(versionFilePath)) {
        console.error('VERSION file not found!');
        process.exit(1);
    }

    const currentVersion = fs.readFileSync(versionFilePath, 'utf8').trim();
    console.log(`Current Version: ${currentVersion}`);

    // Regex to ensure format X.Y.Z
    const versionParts = currentVersion.split('.').map(Number);

    if (versionParts.length !== 3 || versionParts.some(isNaN)) {
        console.error(`Invalid version format in VERSION file: "${currentVersion}". Expected format: X.Y.Z (e.g., 1.0.0)`);
        process.exit(1);
    }

    let [major, minor, patch] = versionParts;

    // Increment logic with 0-9 overflow support
    patch++;
    if (patch > 9) {
        patch = 0;
        minor++;
        if (minor > 9) {
            minor = 0;
            major++;
            // "upto 0-9 pos1" requested. 
            // If major > 9, we will allow it to become 10 (standard behavior) or reset?
            // Assuming standard behavior for Major (indefinite growth) is safer than resetting to 0.0.0 key-roll-over style unless specified.
            // If strict single digit is required for parsing elsewhere, this might break.
            // For now, allowing Major to expand.
        }
    }

    const newVersion = `${major}.${minor}.${patch}`;
    console.log(`New Version: ${newVersion}`);

    fs.writeFileSync(versionFilePath, newVersion, 'utf8');
    console.log('VERSION file updated.');

    // Update README.md
    try {
        const readmePath = path.join(__dirname, '..', 'README.md');
        if (fs.existsSync(readmePath)) {
            let readmeContent = fs.readFileSync(readmePath, 'utf8');

            // Regex to replace "Current Version: X.Y.Z" and "Version: X.Y.Z" matches
            const versionRegex1 = /(\*\*Current Version:\*\* )(\d+\.\d+\.\d+)/g;
            const versionRegex2 = /(- \*\*Version:\*\* )(\d+\.\d+\.\d+) \(stable\)/g;

            let updatedReadme = readmeContent.replace(versionRegex1, `$1${newVersion}`);
            updatedReadme = updatedReadme.replace(versionRegex2, `$1${newVersion} (stable)`);

            if (readmeContent !== updatedReadme) {
                fs.writeFileSync(readmePath, updatedReadme, 'utf8');
                console.log('README.md version updated.');
            } else {
                console.log('No matching version string found in README.md to update.');
            }
        } else {
            console.warn('README.md not found, skipping update.');
        }
    } catch (readmeError) {
        console.error('Error updating README.md:', readmeError);
    }

} catch (error) {
    console.error('Error bumping version:', error);
    process.exit(1);
}
