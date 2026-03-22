@AGENTS.md

---

## Interstice Design System — Retro-Futuristic Minimalism

### Design Philosophy

Interstice's visual identity blends **retro warmth** with **futuristic minimalism**. Think: a vintage CRT monitor sitting in a field of flowers. The UI should feel **human, warm, and approachable** — not cold corporate SaaS. Our target users are non-technical people who want AI to make hard things easy.

**Core principles:**
1. **Human feel** — Agents are characters, not dashboards. They walk, talk (speech bubbles), group up when collaborating, and sit at their desks when idle. The user should feel like they're watching a team work, not reading a spreadsheet.
2. **Light and warm** — Cream/off-white backgrounds, soft stone borders, warm coral accents. Never dark, never cold blue-gray.
3. **Retro-modern fusion** — Rounded corners (0.75rem+), subtle shadow-lifts on buttons, emoji characters, soft gradients. Modern typography (Geist) but with playful, organic spacing.
4. **Approachable language** — "Tell your team what to do" not "Enter command". "Active" not "RUNNING". Simple words, no jargon.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#faf8f5` (warm cream) | Page background |
| Card | `#ffffff` (white) | Cards, panels |
| Primary | `#e8734a` (coral-orange) | Buttons, active nav, links, brand accent |
| Secondary | `#f0ede8` (warm gray) | Hover backgrounds, secondary fills |
| Muted | `#f5f2ed` / `#78716c` | Subtle backgrounds / muted text |
| Border | `#e7e2db` (stone) | Card borders, dividers |
| Sidebar | `#f5f2ed` (warm off-white) | Sidebar background |
| Destructive | `#dc4a3a` | Error states, deny buttons |
| Success | `#16a34a` (green-600) | Active agents, done states |

### Agent Role Colors

Each agent role has a signature color used for avatars, labels, and accents:

| Role | Color | Light BG | Usage |
|------|-------|----------|-------|
| CEO | `amber-600` / `#d97706` | `amber-50` | Boss, delegator |
| Research | `blue-600` / `#2563eb` | `blue-50` | Web search, analysis |
| Communications | `purple-600` / `#9333ea` | `purple-50` | Email, outreach |
| Developer | `green-600` / `#16a34a` | `emerald-50` | Code, builds |
| Call | `orange-600` / `#ea580c` | `orange-50` | Phone calls |

### Agent Characters

Agents are represented as emoji characters in rounded cards:
- CEO: 🧑‍💼 — sits at "CEO Desk"
- Research: 🔬 — sits at "Research Lab"
- Communications: ✉️ — sits at "Comms Hub"
- Developer: ⌨️ — sits at "Dev Station"
- Call: 📱 — sits at "Call Center"

**Interaction behaviors:**
- **Idle** — Agent sits at their desk, no animation
- **Active** — Agent walks to center (near CEO), bobs gently, green status dot pulses
- **Collaborating** — Multiple active agents cluster in a huddle formation around CEO
- **Speaking** — Speech bubbles float above with recent output/messages
- **Error** — Red status dot, stays at desk

### UI Components

- **Buttons**: Rounded (`rounded-xl`), subtle shadow lift on hover (`.btn-retro`), coral primary
- **Cards**: White background, stone borders, `rounded-2xl`, soft `shadow-sm`
- **Badges**: Rounded-full, soft color fills (e.g., `bg-green-50 text-green-700`)
- **Inputs**: Rounded-lg, stone borders, warm placeholder text
- **Metric cards**: White with rounded-2xl, icon in colored circle, retro shadow lift

### Typography

- **Font**: Geist Sans (body), Geist Mono (code/technical)
- **Headings**: Semibold, foreground color, small (text-sm for page headers)
- **Labels**: 10-11px, uppercase tracking-wider, muted-foreground
- **Body**: 12-13px, relaxed leading

### Animations

- Smooth agent movement: `cubic-bezier(0.34, 1.56, 0.64, 1)` — spring-like overshoot
- Bob (active agents): gentle 3px vertical cycle
- Walk cycle: subtle scaleX/scaleY breathing
- Speech bubbles: fade in, float, fade out over 5s
- Status dots: pulse animation
- Buttons: translateY lift on hover, press on click

### For Pitch Decks & Marketing

When creating slides, landing pages, or marketing materials for Interstice:
- Use the **warm cream/coral** palette, not dark mode
- Show agent characters interacting — this is our visual differentiator
- Lead with the "human feel" angle — AI that works like a team, not a tool
- Use rounded shapes, soft shadows, organic spacing
- Avoid: sharp corners, dark backgrounds, neon colors, dense data tables, terminal aesthetics

---

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
