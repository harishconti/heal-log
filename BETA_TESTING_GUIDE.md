# HealLog Beta Testing Guide

Welcome to the HealLog beta program! This guide will help you get started with testing and provide information on how to report issues.

## What is Beta Testing?

As a beta tester, you're helping us identify bugs, usability issues, and areas for improvement before the public release. Your feedback is invaluable in making HealLog the best it can be.

---

## Getting Started

### 1. Download the App

**Android:**
- You'll receive a link to download the beta APK
- Or access via Google Play Beta program (if enrolled)

**Requirements:**
- Android 8.0 (API 26) or higher
- At least 100MB free storage
- Internet connection for initial setup

### 2. Create an Account

1. Open the app and tap "Register"
2. Enter your email and create a password
3. Fill in your professional details
4. Check your email for the verification code (8 digits)
5. Enter the code to verify your account

### 3. Explore Key Features

| Feature | How to Test |
|---------|-------------|
| Patient Management | Add, edit, and search for patients |
| Clinical Notes | Create notes for patient visits |
| Offline Mode | Turn off WiFi and continue working |
| Sync | Turn WiFi back on to sync changes |
| Profile | Update your profile and photo |

---

## What to Test

### Critical Flows (Priority 1)
- [ ] Registration and login
- [ ] Adding a new patient
- [ ] Creating clinical notes
- [ ] Offline functionality
- [ ] Data sync when coming back online
- [ ] Password reset flow

### Core Features (Priority 2)
- [ ] Patient search
- [ ] Editing patient details
- [ ] Editing clinical notes
- [ ] Profile photo upload
- [ ] Dark mode toggle
- [ ] Logout and re-login

### Edge Cases (Priority 3)
- [ ] Rapid switching between online/offline
- [ ] Large amounts of data (50+ patients)
- [ ] Long text in notes
- [ ] Special characters in names
- [ ] Multiple device sync

---

## Reporting Issues

### How to Report a Bug

1. **In-App Feedback** (Preferred)
   - Go to Settings > Send Feedback
   - Describe the issue
   - Include screenshots if possible

2. **Email**
   - Send to: support@heallog.com
   - Subject: [BETA BUG] Brief description

3. **GitHub Issues**
   - Go to: https://github.com/harishconti/heal-log/issues
   - Use the Bug Report template

### What to Include in Bug Reports

Please provide as much detail as possible:

```
**Device:** Samsung Galaxy S21
**Android Version:** 13
**App Version:** 1.0.0-beta.1

**Steps to Reproduce:**
1. Go to patient list
2. Tap on a patient
3. Tap "Add Note"
4. Enter text and save
5. App crashes

**Expected:** Note should be saved
**Actual:** App crashes with error

**Screenshots/Video:** [Attach if available]

**Additional Context:** This happens every time when offline
```

### Severity Levels

When reporting, indicate severity:

| Severity | Description | Example |
|----------|-------------|---------|
| **Critical** | App crashes, data loss | Crash when saving patient |
| **High** | Feature doesn't work | Can't sync data |
| **Medium** | Feature partially works | Search results incomplete |
| **Low** | Minor issues | Typo in text |

---

## Known Issues (Beta 1)

These issues are already known and being worked on:

1. **Slow initial sync** - First sync may take a while with lots of data
2. **Profile photo delay** - Photos may take a moment to appear
3. **Keyboard overlap** - On some devices, keyboard covers input fields

---

## Beta Testing Guidelines

### Do's
- Test on your actual workflow
- Try edge cases and unusual scenarios
- Report even minor issues
- Note device-specific problems
- Test offline functionality
- Provide honest feedback

### Don'ts
- Don't use real patient data (use test data)
- Don't share the beta APK publicly
- Don't expect production-level stability
- Don't delete the app without backing up test data

---

## Test Data Suggestions

Use fictional test patients:

| Name | Use Case |
|------|----------|
| John Doe | Normal patient flow |
| Jane Smith | Multiple notes |
| Test Patient 123 | Special characters |
| AAAAPatient | Alphabetical sorting |
| ZZZZPatient | End of list |

---

## Feedback Categories

When providing feedback, categorize it:

1. **Bug** - Something is broken
2. **Usability** - Hard to use but works
3. **Feature Request** - Something new
4. **Performance** - Slow or laggy
5. **Design** - Visual/UI issues

---

## Beta Timeline

| Phase | Dates | Focus |
|-------|-------|-------|
| Beta 1 | Week 1-2 | Core functionality |
| Beta 2 | Week 3 | Bug fixes + features |
| Beta 3 | Week 4 | Polish + performance |
| Release | Week 5 | Public launch |

---

## Frequently Asked Questions

### Is my data safe?
Yes, but this is a beta version. We recommend using test data, not real patient information.

### Will my data transfer to the final release?
Yes, your account and data will carry over to the production release.

### How do I update to a new beta version?
You'll receive a notification or email with a new download link.

### Can I use multiple devices?
Yes! Your data syncs across devices when you're logged in.

### What happens if I find a critical bug?
Report it immediately via email to support@heallog.com with [URGENT] in the subject.

---

## Contact & Support

**Email:** support@heallog.com
**Response Time:** Within 24-48 hours during beta

**Emergency Issues:** support@heallog.com with [URGENT] in subject

---

## Thank You!

Your participation in the beta program helps make HealLog better for all healthcare professionals. We appreciate your time and feedback!

---

*Last Updated: January 1, 2026*
*Version: 3.1.0*
