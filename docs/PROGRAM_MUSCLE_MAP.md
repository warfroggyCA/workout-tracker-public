# Program muscle coverage

The authenticated `/program/muscles` screen is linked from Program. It reads the
active owner's saved Program version, exercise identities and current working-set
prescriptions through `getActiveProgramPresentation`. It does not use a sample
Program in application code and has no mutation endpoint.

## Meaning

- Red is planned working sets attributed by each exercise's **saved primary
  muscle mapping**. Supporting work uses its saved secondary mapping, separately.
- Supporting sets never become full direct sets. A duplicate or aliased muscle is
  counted once per slot; primary takes precedence when both roles name it.
- Repeated occurrences of an exact exercise remain separate slots. Warm-ups,
  load, reps, exercise order and supersets do not multiply the count. Unilateral
  prescriptions are not doubled by side. Timed prescriptions count their saved
  sets, without converting seconds into sets.
- One set can appear under several muscles. Summing muscle totals is not the
  total number of Program sets.
- Colour bands are fixed at 1–3, 4–6, 7–9 and 10+ direct sets. They never rescale
  with the selected days. Zero mapped direct sets leave the skin unchanged.
- Days with direct work counts distinct saved Program days with valid direct
  sets. It is not weekly frequency; schedules may use a different rotation.
- These are planned coverage counts, not measured activation, effectiveness,
  training adequacy, an ACSM score or a Coach recommendation.

Missing or invalid prescriptions contribute no invented sets and remain flagged.
Unknown muscle labels retain textual counts and details without an invented body
region. Missing primary and unreviewed catalog mappings are disclosed. An empty
supporting list means no supporting mapping is recorded, not no involvement.
Catalog review does not certify the anatomical role classification.

## Interaction and freshness

Day buttons independently toggle the shading; All days toggles all/none. Muscle
selection is additive and independent of days. A second tap deselects. The native
muscle selector can inspect any region, including unmapped labels, without
requiring a day selection. Select/Deselect is a large-touch-target alternative.
Selected chips focus an already selected muscle. Clear all resets both selection
sets and the detail filter.

Details always refer to the full saved Program, with links to each relevant day.
The three count tiles filter the exercise list to direct, supporting or direct
work grouped by day; pressing the active tile again restores all work. The map
and selection controls stay in place while the detail pane scrolls. Changing the
inspected muscle resets only that pane to its start. Very short viewports can
scroll the page to preserve access to controls rather than clip them.

The screen reloads server data on Refresh and on returning to the visible tab.
Program navigation uses a fresh read; there is no persisted aggregate or second
Program state store. A version update for the same Program retains muscle
selections, and day selections use lineage IDs. A different active Program resets
the screen's state. This screen neither reads nor rewrites completed History,
active workout snapshots, recommendations or recorded sets.

## Shared foundation

- `src/lib/muscle-coverage.ts`: display aliases, stable labels, pure aggregation,
  role distinction and fixed colour bands. `aggregateMuscleWork(work, dayIds)`
  supports one day, multiple days, all days (omitted filter), or none (empty set).
- `src/lib/froggy-muscle-regions.json`: approved front/back path coordinates.
- `src/components/muscle-map/froggy-muscle-map.tsx`: reusable artwork surface,
  keyboard/touch region toggles, teal selection plus white contrast outline.
  Omitting `onToggle` yields a noninteractive view.
- `src/components/muscle-map/program-muscle-map.tsx`: full-screen selection,
  inspection and filters.
- `public/muscle-map/`: portable original AI-generated mannequin concept artwork.

Calf overlays are restricted to the rear view and inset to the visible calf
silhouette; the front shin is not painted as calf coverage.

The current art is an approved raster front/back concept with schematic SVG
regions, not a rotatable anatomical 3D model. Broad chest, core and shoulder labels
do not assert upper/lower or individual-head coverage. Broad `back`, forearm/grip,
and other unsupported labels remain in textual details. The raster sheet retains
its neutral background; a genuinely transparent cutout will require an artwork
mask or a transparent render when compact day summaries are implemented. Existing
clothed exercise-demo files, motion, bindings and configuration are unchanged.

Compact day-title summaries, finer anatomical mapping, gap analysis, suggestions,
and automatic Program changes are outside this release.

## Verification

```sh
npx vitest run tests/unit/muscle-coverage.test.ts tests/unit/muscle-coverage-db.test.ts tests/unit/program-presentation.test.ts tests/unit/program-presentation-service.test.ts tests/unit/froggy-form-demo.test.ts
npm run typecheck
npm run lint
npm run build
npm run docs:check
```

The database test compares calculated direct/supporting counts with an independent
SQL sum over saved prescriptions, checks owner scoping, publishes an updated
Program through the existing draft/review workflow, and verifies the retained old
prescriptions. Pure tests cover fixed colour bands, no days, one day, duplicated
aliases, role overlap, repeated exact exercises, missing mappings and invalid sets.

For signed-in browser verification use the existing disposable fixture harness:

```sh
E2E_PORT=3197 node scripts/run-e2e-server.mjs --production --froggy-form-demo
```

Use Dev login with `owner@example.com`, then open `/program/muscles`. The fixture
contains synthetic data. Verify desktop and narrow phone layout, direct taps,
keyboard toggles, red plus selection contrast, All days, additive muscles, Clear
all, the three detail filters, no-day inspection, disclosure expansion, refresh
and Program-day links. Do not seed or mutate a live database for verification.
