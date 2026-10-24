# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Members of the public who sign up for an account and keep their own personal tasks, grouped by project. They open the board to see what is pending, capture new tasks, and tick things off.

## Product Purpose
Taskify is a spatial task reminder board. Instead of a list, each task is a floating card on a pannable, zoomable canvas. Success means a new visitor can sign up, add a task, and understand the board within the first minute, and returning users can scan what is overdue at a glance.

## Positioning
Tasks are physical objects: a force simulation pulls unfinished cards toward a Pending zone and finished ones toward a Finished zone, cards from the same project cluster together, and cards push each other apart. Completing a task visibly sends it drifting across the board.

## Operating Context
Desktop and laptop browsers first (trackpad pan and pinch zoom, mouse drag); must remain usable on touch devices. Sessions are short and frequent: glance, add, complete.

## Capabilities and Constraints
- Accounts: username or email + password login, signup, logout; cookie sessions (30 days).
- Tasks: project, title, optional description, due date, completed flag. Create, edit, complete, delete.
- Projects are created inline from the task form.
- Canvas: pan, zoom, draggable cards, draggable Pending/Finished zones, extendable canvas bounds; zone layout and bounds persist per browser.
- Physics forces are part of the product identity; their tuning may be adjusted for feel, not replaced. The physics calibration panel is a developer tool and must not be part of the default public experience.
- Stack: Next.js 16 (App Router), React 19, Tailwind 4, motion, d3-force, Prisma + PostgreSQL, Docker.

## Evidence on Hand
No testimonials, customers, metrics, or press. Do not fabricate any.

## Product Principles
- The board is the product: the canvas stays front and centre, chrome stays out of the way.
- Every state is designed: first run, loading, empty, error, and offline-ish failures.
- Due-date urgency (overdue, due soon) must be readable at a glance.
- Physics should feel calm and settled, never jittery.
