# FLAT7 HomeCare Design System

## Direction

- Organic-biophilic utility dashboard: calm, tactile, and content-first.
- Dark-only V1 with restrained green accents and no decorative neon.
- Mobile-first at 375px; verify at 768px, 1024px, and 1440px.

## Tokens

| Role | Value |
|---|---|
| Background | `#07110C` |
| Surface | `#0E1A13` |
| Raised surface | `#14231A` |
| Primary | `#34D399` |
| Foreground | `#F0FDF4` |
| Muted text | `#9AACA0` |
| Border | `#22362A` |
| Warning | `#FBBF24` |
| Overdue | `#FB7185` |

- Typeface: Inter/system sans.
- Radius: 14px controls, 16–24px cards, 28px sheets and hero panels.
- Spacing: 4/8px scale; section rhythm 16/24/32/48px.
- Motion: 150–250ms, transform/opacity only, reduced-motion respected.

## Interaction

- Minimum touch target 44×44px with visible pressed and keyboard-focus states.
- One primary action per panel; Quick Entry remains globally available.
- Bottom navigation on phone/tablet; sidebar from 1024px.
- Use Lucide SVG icons only; never use emoji as structural icons.
- Color never communicates status alone: include text and icon.
- Forms use visible labels, inline errors, and explicit success feedback.

## Quality checklist

- WCAG AA contrast, sequential headings, keyboard navigation, and semantic landmarks.
- No horizontal overflow or content hidden behind fixed navigation.
- Loading, empty, offline, pending-sync, success, and error states are present.
- Layout remains usable with reduced motion and enlarged text.
