# Glossary — flashlight domain terms

Terms → `flashlights` columns (see `docs/database.md`).

| Term | Meaning |
|------|---------|
| **Emitter / LED** | The light source chip. Column `emitters` (text[], canonical). Named by brand + model, e.g. `Cree XHP-70.3 HI`, `Luminus SST-20`, `Nichia 519A`. See the emitter naming convention in `docs/database.md`. |
| **LEP** | Laser Excited Phosphor — a laser-pumped emitter for very long, tight throw. Stored as emitter `LEP`. |
| **Lumens** | Total light output (brightness). `max_lumens` / `min_lumens`. A "turbo" mode figure for max. |
| **Candela (cd)** | Beam *intensity* at the brightest point. Column `candela`. High candela = a tight, far-reaching beam even at modest lumens. |
| **Throw** | How far the beam reaches, in metres. Column `beam_distance_m`. Derived from candela (throw ≈ 2·√candela). |
| **Beam type** | Flood (wide), Throw (narrow/far), or a mix. Column `beam_type`. |
| **Driver** | The circuit regulating power to the emitter. Column `driver_type`: Buck / Boost / FET / Linear. Affects efficiency + regulation. |
| **CRI** | Color Rendering Index — how true colors look under the light (higher = more natural; "high-CRI" ≈ 90+). |
| **CCT / color temperature** | Warmth of the white, in Kelvin (e.g. 4000K warm, 6500K cool). |
| **Battery types** | Cell sizes the light accepts. `battery_options` (jsonb `[{type,count}]`, canonical) + `battery_types` (text[]). Li-ion (18650, 21700, 16340…), disposables (AA, AAA, CR123A…), Built-in. See battery notes in `docs/database.md`. |
| **16340 vs CR123A** | `16340` = rechargeable Li-ion in CR123 size (for USB-C lights). `CR123A` = non-rechargeable primary. Don't conflate. |
| **Charging** | How the cell is recharged: USB / Magnetic / None (external charger). Columns `charging_type`, `has_usb_charging`. |
| **IP rating** | Ingress protection — dust/water resistance, e.g. `IP68`. Column `ip_rating`. |
| **Impact resistance** | Drop rating in metres. Column `impact_resistance_m`. |
| **EDC** | Everyday Carry — small pocketable lights. A category. |
| **Tactical / Thrower / Flood / Headlamp …** | Use categories. Full list in `lib/constants.ts` (`CATEGORIES`). |
| **Anodizing / Cerakote / Ti / Zr / Damascus** | Body materials/finishes. Used in the collection editor (`docs/ui.md`, Material Options). |
