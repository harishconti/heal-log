# Design Specifications: MedDash Login Redesign

## 1. Detailed Layout Description (Desktop-First)

The new layout moves away from the wide, disconnected split-screen to a **Compact Two-Column Grid** centered within the viewport. This brings the primary action (Login) and the brand value proposition (Hero) closer together, creating a unified focal point.

### Container & Grid
*   **Main Container:** A centered container with a maximum width of `1280px` (max-w-7xl) and a minimum height of `100vh`.
*   **Grid Structure:** A simple 2-column grid.
    *   **Left Column (Hero):** Takes up 50-55% of the width. Aligned right against the center line. Padding: `4rem` (horizontal), `auto` (vertical).
    *   **Right Column (Login):** Takes up 45-50% of the width. Aligned left against the center line. Padding: `4rem` (horizontal), `auto` (vertical).
*   **Vertical Alignment:** Both columns are vertically centered (`items-center`), ensuring the form and the hero text always appear balanced regardless of screen height.

### Left Column: Hero & Trust Indicators
*   **Branding:** Logo placed at the top-left of the content block (not the screen corner), creating a distinct header for the content.
*   **Headline:** Large, bold typography (`text-5xl`), tight leading. Max width `600px`.
*   **Subheading:** concise, high-contrast (`text-indigo-100`), max width `500px`.
*   **Stats Row:** Located immediately below the subheading.
    *   **Layout:** A flex row with 3 distinct blocks, separated by subtle vertical dividers (white/20).
    *   **Style:** Icon (left) + Stat (top) + Label (bottom).
*   **Feature Pills:** A grid of 4 interactive "pills" or small cards below the stats.
    *   **Style:** Translucent white background (`bg-white/10`), rounded corners (`rounded-lg`), hover effect (`hover:bg-white/20`).

### Right Column: The Login Card
*   **Card Container:** A white/light-gray card floating on the softer right-side background, or simply the form centered in the white right column (cleaner).
    *   *Decision:* We will use a **Clean Split**: Left side is the dark gradient Hero. Right side is a clean, solid white/light gray background containing the Form centered. This provides the highest contrast and "medical" cleanliness.
*   **Form Width:** Max width `400px`.
*   **Spacing:** clearly defined gaps between Header ("Welcome back"), Inputs, and Action Button.

## 2. Style Guide

### Colors (Tailwind v4 Palette Refinement)
*   **Hero Background:** `bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900`.
*   **Text (Hero):**
    *   Headlines: `#FFFFFF` (White)
    *   Body/Subheads: `#E0E7FF` (Indigo-100) - High contrast against dark blue.
*   **Text (Form Side):**
    *   Headlines: `#0F172A` (Slate-900)
    *   Body: `#475569` (Slate-600)
    *   Inputs: `#1E293B` (Slate-800)
*   **Primary Action (Button):**
    *   Background: `#2563EB` (Blue-600) -> `#1D4ED8` (Blue-700) on hover.
    *   Text: `#FFFFFF`
*   **Secondary Action (Links):** `#2563EB` (Blue-600).

### Typography
*   **Font Family:** Inter (existing).
*   **Hierarchy:**
    *   **Hero Headline:** `text-5xl font-bold tracking-tight leading-tight`.
    *   **Section Headers (Form):** `text-2xl font-bold tracking-tight`.
    *   **Body (Large):** `text-lg text-indigo-100` (Hero subhead).
    *   **Body (Base):** `text-base text-slate-600` (Form labels/inputs).
    *   **Stats:** `text-3xl font-bold` (Number), `text-sm font-medium` (Label).

### Component Styles

*   **Stats Component:**
    *   3 columns.
    *   Icon: `w-6 h-6 text-blue-300`.
    *   Stat: `text-2xl font-bold text-white`.
    *   Label: `text-xs uppercase tracking-wider text-blue-200`.

*   **Feature Pills:**
    *   Container: `flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 transition-all cursor-default hover:bg-white/10`.
    *   Icon Box: `w-8 h-8 rounded bg-white/10 flex items-center justify-center`.

*   **Login Inputs:**
    *   Height: `h-12` (Standardized, accessible touch target).
    *   Border: `border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`.
    *   Radius: `rounded-lg` (Modern but professional).

*   **Primary Button:**
    *   Height: `h-12`.
    *   Style: `w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all`.

## 3. Responsive Recommendations

*   **Tablet (768px - 1024px):**
    *   Stack the columns vertically.
    *   **Hero (Top):** Reduces height, centers text. Stats become a single row or scrolling row.
    *   **Form (Bottom):** White background, full width, centered form max-width `400px`.
*   **Mobile (< 768px):**
    *   **Hero:** Minimal version. Logo + Headline + "Trusted by 10k+" (hide detailed stats/features to reduce scroll).
    *   **Form:** Takes priority. Padding reduced to `1.5rem`. Inputs remain `h-12` for touch accessibility.
