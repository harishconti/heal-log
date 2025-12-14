# 📐 GOOGLE PLAY STORE IMAGE SIZES

**Complete Guide for PatientLog Images**

---

## 🎯 QUICK SUMMARY TABLE

| Image Type | Size | Orientation | Format | Location |
|-----------|------|-------------|--------|----------|
| **App Icon** | **512×512 px** | Square | PNG | Program Policies |
| **Feature Graphic** | **1024×500 px** | Horizontal | PNG/JPG | Main Store Listing |
| **Screenshots** | **1080×1920 px** | Vertical | PNG/JPG | Main Store Listing |
| **Promo Graphic** | **180×120 px** | Horizontal | PNG/JPG | Optional |
| **TV Banner** | **1280×720 px** | Horizontal | PNG/JPG | If TV app |

---

## 📱 DETAILED BREAKDOWN

### 1️⃣ **APP ICON** ✅ (Already correct)

```
Size:         512×512 px
Shape:        SQUARE
Format:       PNG with transparency
Aspect Ratio: 1:1 (square)
Location:     Google Play Console → Program Policies

How to resize (if needed):
- Desktop tool: Photoshop, GIMP, or Canva
- Online tool: Resize.com, TinyPNG
- Command line: ImageMagick
  convert icon.png -resize 512x512 icon_512.png
```

✅ Your icon is already 512×512. **NO CHANGE NEEDED.**

---

### 2️⃣ **FEATURE GRAPHIC** (Horizontal Banner)

```
Size:         1024×500 px
Shape:        HORIZONTAL/LANDSCAPE
Format:       PNG or JPG
Aspect Ratio: 2.048:1 (very wide, short)
Location:     Google Play Console → Main Store Listing → Graphics

How to resize:
- The image I generated is landscape (wider than tall)
- Resize to: 1024 pixels WIDE × 500 pixels TALL

Online tool (easiest):
1. Go to: Canva.com or Pixlr.com
2. Upload image
3. Set size to: 1024 × 500
4. Download PNG

Command line:
convert feature_graphic.png -resize 1024x500 feature_1024x500.png
```

**Current state:** Landscape (wider than tall) ✓  
**Resize to:** `1024×500` (HORIZONTAL/LANDSCAPE)

---

### 3️⃣ **SCREENSHOTS** (Vertical Phone Screens)

```
Size:         1080×1920 px
Shape:        VERTICAL/PORTRAIT
Format:       PNG or JPG
Aspect Ratio: 9:16 (tall, narrow - like a phone)
Location:     Google Play Console → Main Store Listing → Screenshots
Quantity:     4-8 images recommended (2 minimum)

How to resize:
- These should be VERTICAL (taller than wide)
- Resize to: 1080 pixels WIDE × 1920 pixels TALL

Online tool (easiest):
1. Take screenshot on Android emulator or device
2. Go to: Canva.com → Resize
3. Set size to: 1080 × 1920
4. Add text overlays (optional)
5. Download

Command line:
convert screenshot.png -resize 1080x1920 screenshot_1080x1920.png
```

**Current state:** Need to take actual app screenshots  
**Resize to:** `1080×1920` (VERTICAL/PORTRAIT)

---

### 4️⃣ **PROMOTIONAL GRAPHIC** (Optional)

```
Size:         180×120 px
Shape:        HORIZONTAL
Format:       PNG or JPG
Location:     Google Play Console → Main Store Listing → Graphic elements
Requirement:  OPTIONAL (not required)

How to resize:
convert image.png -resize 180x120 promo_180x120.png
```

**Status:** Optional - skip for now

---

## 🎨 VISUAL GUIDE

```
🎯 APP ICON (512×512)
┌─────────────────┐
│                 │
│     SQUARE      │  Width:  512 px
│   (1:1 ratio)   │  Height: 512 px
│                 │
└─────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 FEATURE GRAPHIC (1024×500)
┌────────────────────────────────────────────────────────┐
│                                                        │
│   HORIZONTAL/LANDSCAPE (2.048:1 ratio)                 │
│   Very wide, short height                              │
│                                                        │
│   Used as banner at top of store listing                │
│                                                        │
└────────────────────────────────────────────────────────┘
Width:  1024 px
Height: 500 px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 SCREENSHOTS (1080×1920)
┌───────┐
│       │
│   V   │  Width:  1080 px
│   E   │  Height: 1920 px
│   R   │
│   T   │  VERTICAL/PORTRAIT
│   I   │  (9:16 ratio, like a phone)
│   C   │
│   A   │  Looks like a phone screen
│   L   │
│       │
└───────┘
```

---

## 🎯 STEP-BY-STEP RESIZE INSTRUCTIONS

### **Using Canva (Easiest for Non-Tech)**

#### **For Feature Graphic (1024×500):**
1. Go to: canva.com
2. Search: "Custom dimensions"
3. Enter: 1024 × 500
4. Upload your feature_graphic.png
5. Stretch/fit to canvas
6. Download as PNG

#### **For Screenshots (1080×1920):**
1. Go to: canva.com
2. Search: "Custom dimensions"
3. Enter: 1080 × 1920
4. Upload your screenshot.png
5. Add text overlays (optional)
6. Download as PNG

---

### **Using Command Line (macOS/Linux)**

```bash
# Install ImageMagick if needed:
brew install imagemagick

# Resize Feature Graphic (1024×500)
convert feature_graphic.png -resize 1024x500 -background white -gravity center -extent 1024x500 feature_1024x500.png

# Resize Screenshot (1080×1920)
convert screenshot.png -resize 1080x1920 -background white -gravity center -extent 1080x1920 screenshot_1080x1920.png

# Resize App Icon (512×512)
convert app_icon.png -resize 512x512 icon_512.png
```

---

### **Using Online Tools (No Installation)**

#### **TinyPNG.com**
- Upload image
- Manually crop to desired size
- Download

#### **Pixlr.com**
1. Upload image
2. Image → Image Size
3. Set Width and Height
4. Download

#### **Resize.com**
1. Upload image
2. Set pixel dimensions
3. Download

---

## 📋 YOUR IMAGES - WHAT TO DO

### ✅ **App Icon (512×512)**
- Status: Already correct size
- Action: READY TO UPLOAD
- Location: Google Play Console → Program Policies

### 🔄 **Feature Graphic (1024×500)**
- Current: Landscape (wider than tall) ✓ Correct orientation
- Action: Resize to 1024×500 px
- Tool: Use Canva or online resizer
- Location: Google Play Console → Main Store Listing → Graphics

### 📱 **Screenshots (1080×1920)**
- Current: Need to take actual app screenshots
- Action: Take 4-8 screenshots of your app
- Then resize each to 1080×1920 px
- Tool: Android emulator screenshot → Canva resize
- Location: Google Play Console → Main Store Listing → Screenshots

### 🎬 **Promotional Image**
- Current: Can use lifestyle photo (doctor with phone)
- Action: Optional - can skip for beta
- If used: Resize to 180×120 px (optional)

---

## 🎯 PRIORITY ORDER

**What to prepare FIRST:**

1. ✅ **App Icon (512×512)** - Done! Ready to upload
2. 🔄 **Feature Graphic (1024×500)** - Resize ASAP
3. 📱 **Screenshots (1080×1920)** - Take from app, then resize
4. 🎬 **Lifestyle Image** - Optional, can add later

---

## 📊 GOOGLE PLAY CONSOLE UPLOAD LOCATIONS

```
Google Play Console
├─ Your App → Clinic OS Lite (or PatientLog)
│
├─ Store presence
│  └─ Main store listing
│     ├─ Graphics section
│     │  ├─ Icon (512×512 px) ← Upload app icon here
│     │  ├─ Feature graphic (1024×500 px) ← Upload banner here
│     │  ├─ Screenshots (1080×1920 px) ← Upload 4-8 here
│     │  └─ Promo graphic (180×120 px) ← Optional
│     │
│     ├─ Short description
│     │  └─ Text only
│     │
│     ├─ Full description
│     │  └─ Text only
│     │
│     └─ Category, Rating, etc.
│
└─ Release
   └─ AAB file upload
```

---

## ✅ FINAL CHECKLIST

Before uploading to Google Play Console:

- [ ] **App Icon**: 512×512 px, PNG, SQUARE ✓
- [ ] **Feature Graphic**: 1024×500 px, PNG/JPG, HORIZONTAL ✓
- [ ] **Screenshots**: 1080×1920 px each, PNG/JPG, VERTICAL (4-8 images)
- [ ] **Promo Image**: Optional, 180×120 px if used
- [ ] All images in high quality (no blurry/pixelated)
- [ ] All images match app branding (colors, style)
- [ ] Ready for upload to Play Console

---

## 🎨 QUICK SIZE REFERENCE CARD

Print this or save as image:

```
╔═══════════════════════════════════════════════════════════════╗
║         GOOGLE PLAY STORE IMAGE SIZES - PATIENTLOG           ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  1. APP ICON                                                  ║
║     Size: 512×512 px  |  Shape: SQUARE  |  Format: PNG       ║
║     ✓ READY                                                    ║
║                                                               ║
║  2. FEATURE GRAPHIC (Banner)                                  ║
║     Size: 1024×500 px  |  Shape: HORIZONTAL  |  Format: PNG   ║
║     🔄 NEEDS RESIZE                                            ║
║                                                               ║
║  3. SCREENSHOTS (Phone screens)                               ║
║     Size: 1080×1920 px  |  Shape: VERTICAL  |  Format: PNG    ║
║     📱 TAKE FROM APP                                           ║
║                                                               ║
║  4. PROMO IMAGE (Optional)                                    ║
║     Size: 180×120 px  |  Shape: HORIZONTAL  |  Format: PNG    ║
║     🎬 OPTIONAL - CAN SKIP                                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🚀 NEXT STEPS

1. ✅ Keep app icon as 512×512
2. 🔄 Resize feature graphic to 1024×500 (use Canva)
3. 📱 Take 4-8 screenshots from your app
4. 📐 Resize each screenshot to 1080×1920
5. 📤 Upload all to Google Play Console
6. ✅ Ready for beta submission!

---

*Last updated: December 14, 2025*
