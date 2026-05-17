# Proposal: Premium Landing Page Redesign

## Goal
Redesign the landing page of TinPet (`tinpet-web/frontend`) with a premium, dynamic, and highly engaging aesthetic, adopting the exact sections, CSS transitions, and HTML-rendered mobile phone mockup provided by the user.

## Affected Components
- `src/index.css` (Tailwind keyframes & variables)
- `src/pages/landing/LandingPage.tsx` (orbes, blobs & container layout)
- `src/pages/landing/components/LandingHeader.tsx` (sticky navbar, menu navigation, toggle dark/light theme)
- `src/pages/landing/components/LandingHero.tsx` (badges, tilted dog picture, CTAs)
- `src/pages/landing/components/LandingFooter.tsx` (realigned footer columns)
- `src/pages/landing/components/AuthModal.tsx` (sleek inputs, register/login logic integration)
- `[NEW] LandingPetsSlider.tsx` (continuous infinite carousels with hover-scale)
- `[NEW] LandingAppMockup.tsx` (Tinder-style iPhone 3D mockup)
- `[NEW] LandingStories.tsx` (snap-scroll stories carousel with arrows)

## Key Technical Decisions
1. **Brand Colors**: Preserve the original TinPet brand color (`#ce4998` / `var(--tp-pink)`) as requested, and integrate the cream color (`#FEF3C7`) for background accents.
2. **Carousel Data**: Use static, invented pet details (Luna, Coco, Toby, Oliver, Copito, Mila) for optimized, seamless rendering in the continuous infinite scrolling loop.
3. **Animations**: Leverage Tailwind v4 `@theme` directive in `src/index.css` to hook keyframes globally without polluting components.

## Rollback Plan
Since this change is purely presentational, rolling back consists of checking out the previous version of the `src/pages/landing` files from `git`:
```bash
git checkout HEAD -- src/pages/landing/
git checkout HEAD -- src/index.css
```
