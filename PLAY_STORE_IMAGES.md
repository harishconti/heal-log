# Play Store Images Guide

## 📱 Required Images

### 1. App Icon
| Spec | Value |
|------|-------|
| Size | 512 x 512 px |
| Format | PNG (32-bit) |
| Shape | Full square (Google adds rounding) |
| Background | Solid or transparent |

**Your icon:** `frontend/assets/images/icon.png` ✅

---

### 2. Feature Graphic (REQUIRED)
| Spec | Value |
|------|-------|
| Size | 1024 x 500 px |
| Format | PNG or JPEG |
| Purpose | Banner on Play Store page |

**Design tips:**
- Show app name prominently
- Include 1-2 key feature icons
- Use brand colors (medical blue/green)
- Keep text minimal & readable
- No screenshots in feature graphic

**Example layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [App Icon]   PATIENTLOG                        │
│               Modern Patient Management             │
│                                                     │
│       📋 📝 📱   Offline-First | Secure | Fast      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 3. Screenshots (REQUIRED: min 2, max 8)
| Spec | Value |
|------|-------|
| Phone | 1080 x 1920 px (9:16) recommended |
| Tablet (optional) | 1920 x 1200 px (16:10) |
| Format | PNG or JPEG |
| Minimum | 2 screenshots |
| Recommended | 4-6 screenshots |

**Recommended screenshots:**
1. **Patient List** - Home screen with patients
2. **Patient Details** - Full patient profile
3. **Clinical Notes** - Note creation/viewing
4. **Dashboard** - Profile stats screen
5. **Contact Import** (optional)
6. **Login Screen** (optional)

---

## 🎨 Design Recommendations

### Color Palette (Medical/Healthcare)
```
Primary Blue:    #2563EB (Trust, Professional)
Secondary Teal:  #0D9488 (Health, Calm)
Accent Green:    #10B981 (Success, Positive)
Dark Text:       #1F2937
Light BG:        #F9FAFB
```

### Typography
- Headlines: Bold, sans-serif (Inter, Roboto, Poppins)
- Body: Regular weight, high readability
- Size: Large enough to read on mobile search results

### Style Guidelines
- Clean, minimal design
- Ample white space
- Consistent visual language
- Professional healthcare aesthetic
- Focus on functionality, not decoration

---

## 🛠️ Tool Suggestions

### Free Tools

#### 1. Canva (RECOMMENDED - Easiest)
**URL:** https://www.canva.com

**Why Canva:**
- ✅ Free tier available
- ✅ Play Store templates built-in
- ✅ Drag-and-drop interface
- ✅ Stock icons and images included
- ✅ Export as PNG/JPEG

**How to use:**
1. Sign up at canva.com
2. Search: "Google Play Store feature graphic"
3. Pick a template
4. Customize with your branding
5. Download as PNG

**Templates to search:**
- "App feature graphic"
- "Mobile app banner"
- "Play Store screenshot mockup"

---

#### 2. Figma
**URL:** https://www.figma.com

**Why Figma:**
- ✅ Free for individuals
- ✅ Professional design tool
- ✅ Better for custom designs
- ✅ Great for screenshot mockups
- ✅ Team collaboration

**How to use:**
1. Create free account
2. Create new file (1024 x 500 for feature graphic)
3. Design from scratch or use community templates
4. Export as PNG

**Figma Community resources:**
- Search "Play Store assets" in Figma Community
- Many free templates available

---

#### 3. Adobe Express (Free)
**URL:** https://www.adobe.com/express

**Why Adobe Express:**
- ✅ Adobe quality, free tier
- ✅ Templates included
- ✅ Easy resizing

---

### Screenshot with Device Frames

#### MockuPhone (FREE)
**URL:** https://mockuphone.com
- Upload screenshot
- Add device frame
- Download result

#### Previewed (FREE)
**URL:** https://previewed.app
- 3D device mockups
- Multiple device templates

#### Screely (FREE)
**URL:** https://screely.com
- Add browser/device frames
- Clean, minimal style

---

## 📸 Taking Screenshots

### From Android Emulator
1. Run app: `npm run android`
2. Navigate to desired screen
3. Click camera icon in emulator toolbar
4. Screenshot saved to desktop

### From Physical Device
1. Hold Power + Volume Down
2. Screenshot saved to gallery
3. Transfer to computer

### Screenshot Checklist
- [ ] App has realistic demo data (not empty)
- [ ] No debug overlays visible
- [ ] Status bar looks clean
- [ ] Content is centered and complete
- [ ] No sensitive/personal data visible

---

## 📋 Quick Specifications Reference

| Asset | Size | Format | Required |
|-------|------|--------|----------|
| App Icon | 512 x 512 | PNG | ✅ Yes |
| Feature Graphic | 1024 x 500 | PNG/JPEG | ✅ Yes |
| Phone Screenshots | 1080 x 1920+ | PNG/JPEG | ✅ Min 2 |
| Tablet Screenshots | 1920 x 1200+ | PNG/JPEG | ❌ Optional |
| TV Banner | 1280 x 720 | PNG/JPEG | ❌ No |

---

## 🎯 Quick Start (30 minutes)

### Feature Graphic (15 mins)
1. Go to canva.com
2. Create design → Custom size: 1024 x 500
3. Add background color (#2563EB or gradient)
4. Add app name: "PATIENTLOG"
5. Add tagline: "Modern Patient Management"
6. Add 2-3 icons (clipboard, stethoscope, phone)
7. Download as PNG

### Screenshots (15 mins)
1. Run `npm run android`
2. Add 5-10 demo patients with realistic names
3. Take screenshots of:
   - Patient list
   - Patient details
   - Profile/stats
   - (Optional) Clinical notes
4. Optional: Add device frames using MockuPhone

---

## ✅ Final Checklist

- [ ] App icon (512x512) - Already exists ✅
- [ ] Feature graphic (1024x500) created
- [ ] Screenshot 1: Patient list
- [ ] Screenshot 2: Patient details
- [ ] Screenshot 3: Profile dashboard
- [ ] Screenshot 4: Clinical notes (optional)
- [ ] All images are high quality
- [ ] No placeholder/test data visible
- [ ] Tested on different backgrounds

---

**Time estimate:** 30-60 minutes total

**Output folder suggestion:** Create `frontend/assets/playstore/` for all assets
