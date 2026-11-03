# C11 — Child safety and UI fixes

Implements: `PRD-ACT-011`, `PRD-ACC-004`, `PRD-UX-*`.
Depends on: existing Gentle Growth components, design 01–04.
Status: Implemented locally; native accessibility validation pending.

## Scope / acceptance

Remove continuous autoplay from settings. Normalize legacy continuous/null values to one pass at settings-read and engine boundaries. Keep the existing one/three pass choices; this does not decide the production session budget (`PRD-TBD-03`).

Replace the fixed arithmetic gate with a 1.5-second hold, cancel on early release, background or unmount, and lock Parent Zone whenever the app leaves foreground. Support keyboard hold on web; native screen-reader hold usability remains a release check. The obsolete arithmetic utility now rejects malformed answers strictly. No new gate TTL or server authorization policy.

Child tabs/media chips are at least 56px; improve tile and secondary-button text contrast using existing theme colors. Declare settings selection through accessible state and allow button labels to wrap. Remove decorative perpetual pulse/bounce/celebration and press transforms.

## Tests / migration / rollback

Jest covers legacy normalization, bounded playback, strict parsing, gate lifecycle and hold cancellation. Chromium synthetic fixtures cover 320/390/768px, short tap rejection, held keyboard/mouse, and prototype completion. See the dated review for executed counts and limitations. Maestro flows were updated but not executed.

No schema migration. Existing stored continuous values remain readable and safely normalize; saving persists a bounded value. Rollback by reverting affected components/settings/gate wiring; do not restore unsafe continuous playback. No SOT approval or architecture change.

## Out of scope

Native VoiceOver/TalkBack, Dynamic Type, Reduce Motion/Transparency and sensory media behavior still require device validation. This task does not certify all UI or store compliance.
