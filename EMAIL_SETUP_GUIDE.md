# Email Setup Guide for Beta Release

## Quick Setup (Using One Gmail Account)

If you have a Gmail account, you can use **Gmail aliases** (plus addressing) to create multiple email addresses that all go to one inbox.

### Example:
If your Gmail is `harish@gmail.com`, you can use:
- `harish+support@gmail.com` → Support inquiries
- `harish+legal@gmail.com` → Legal/compliance
- `harish+beta@gmail.com` → Beta tester feedback
- `harish+dpo@gmail.com` → GDPR data protection officer

**All emails will arrive in your main inbox** but you can:
1. Create filters in Gmail to auto-label them
2. Set up auto-responses if needed

### Step-by-Step Setup:

1. **Create Gmail Filters:**
   - Go to Gmail Settings → Filters and Blocked Addresses
   - Click "Create a new filter"
   - In "To:" field, enter: `yourname+support@gmail.com`
   - Click "Create filter"
   - Choose: Apply label "Support" (create label if needed)
   - Repeat for other aliases

2. **Update Legal Documents:**
   ```bash
   # In PRIVACY_POLICY.md and TERMS_OF_SERVICE.md, replace:
   support@clinicoslite.com → yourname+support@gmail.com
   legal@clinicoslite.com → yourname+legal@gmail.com
   dpo@clinicoslite.com → yourname+dpo@gmail.com
   beta@clinicoslite.com → yourname+beta@gmail.com
   ```

## Professional Option (Custom Domain)

If you want `@clinicoslite.com` emails:

### Option 1: Google Workspace ($6/month)
- Get a professional email domain
- support@clinicoslite.com
- Includes Gmail, Calendar, Drive
- https://workspace.google.com

### Option 2: Zoho Mail (FREE for up to 5 users)
- Free custom domain email
- support@clinicoslite.com
- https://www.zoho.com/mail/

### Option 3: Cloudflare Email Routing (FREE)
- Free email forwarding
- Forward `support@clinicoslite.com` → your Gmail
- Requires domain ownership
- https://developers.cloudflare.com/email-routing/

## Recommended for Beta:

**FOR NOW (Quick & Free):**
- Use Gmail aliases (`yourname+support@gmail.com`)
- Update all legal docs with these addresses
- Works perfectly for beta testing

**AFTER BETA SUCCESS (Professional):**
- Register `clinicoslite.com` domain ($10-15/year)
- Use Zoho Mail FREE tier or Cloudflare routing
- Migrate to professional emails

## Which Address to Use Where:

| Use Case | Email Alias | Purpose |
|----------|-------------|---------|
| **Play Store Contact** | +support | Primary support email (required) |
| **Privacy Policy** | +support AND +dpo | Support + Data Protection Officer |
| **Terms of Service** | +legal | Legal inquiries |
| **Beta Feedback** | +beta | Beta tester feedback forms |
| **Developer Console** | Your main email | Google Play developer account |

## Business Address Options:

### Option 1: Home Address (Privacy Concerns)
⚠️ Your home address will be public on Play Store

### Option 2: Virtual Office ($10-30/month)
- Professional business address
- Mail forwarding service
- Examples: Regus, WeWork, local coworking spaces

### Option 3: Registered Agent Service ($50-100/year)
- Legal business address
- Privacy protection
- Available in India (search "virtual office India")

### Option 4: Leave Blank During Beta
- Not required for internal testing/beta track
- Required only for production release

## For India-Based Developers:

**Recommended Jurisdiction:**
```
Jurisdiction: Laws of India
Governing Law: Indian Information Technology Act, 2000
```

**Data Protection:**
- India has Digital Personal Data Protection Act, 2023
- Mention compliance with Indian privacy laws
- Include GDPR if you have EU users

## Required Updates:

### In PRIVACY_POLICY.md:
1. Line ~66: **Email**: [YOUR_EMAIL]
2. Line ~67: **Address**: [YOUR_ADDRESS or "TBD"]
3. Line ~88: **DPO Email**: [YOUR_EMAIL]

### In TERMS_OF_SERVICE.md:
1. Line ~300: **Email**: [YOUR_EMAIL]
2. Line ~301: **Support**: [YOUR_EMAIL]
3. Line ~302: **Address**: [YOUR_ADDRESS or "TBD"]
4. Line ~215: **Governing Law**: [Your Jurisdiction - e.g., "Laws of India"]

---

## Next Steps:

1. ✅ Choose your email solution (Gmail aliases recommended for beta)
2. ✅ Update PRIVACY_POLICY.md with your emails
3. ✅ Update TERMS_OF_SERVICE.md with your emails
4. ✅ Choose jurisdiction (India recommended if you're based there)
5. ⏳ Business address can wait until production release
