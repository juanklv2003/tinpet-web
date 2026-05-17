# Specs: Premium Landing Page Redesign

## Requirements

### Requirement 1: Dark Mode Toggle
- The header MUST include a button to toggle between dark and light themes.
- When clicked, the website theme SHALL switch smoothly, appending/removing the `.dark` class to `document.documentElement` and updating `localStorage`.
- The icon MUST alternate between Moon and Sun appropriately.

### Requirement 2: Infinite Pets Carousel
- The website MUST feature a continuous infinite scrolling list of pet cards.
- The carousel SHALL display static mock pet data: Coco, Luna, Toby, Oliver, Copito, and Mila.
- The track SHOULD pause scrolling when the user hovers over it (`pause-on-hover`).

### Requirement 3: App Mockup
- The website MUST display an interactive, tilted CSS mobile phone mockup.
- The mockup MUST show details for "Rex" (1 year, Perro, veterinaria carlos).
- Buttons for Like/Dislike MUST be visually clickable and represent standard Tinder actions.

---

## Scenarios

### Scenario 1: Toggling Dark Mode
- **Given** the landing page is loaded in light theme
- **When** the user clicks the dark mode toggle button in the header
- **Then** the page MUST transition smoothly to dark theme
- **And** the icon in the header MUST change to a Sun
- **And** the user's preference MUST be saved to localStorage

### Scenario 2: Pausing Pets Carousel on Hover
- **Given** the infinite pets carousel is actively scrolling
- **When** the user moves their cursor over any pet card inside the carousel
- **Then** the scrolling animation MUST pause immediately
- **And** when the cursor leaves, the scrolling animation MUST resume
