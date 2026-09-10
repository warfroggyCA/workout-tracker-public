# Froggy form viewer verification

The optional viewer covers twenty-one exact catalog identities in Program,
Today day previews, exercise-picker details and active workouts. Tests use disposable synthetic
accounts and records. This document describes observed checks and their limits;
it is not production-release evidence or a certification of exercise technique.

## Automated contracts

`tests/unit/froggy-form-demo.test.ts` checks the actual seed identities,
default-off behavior, conflicts in equipment and laterality, malformed variant
attributes, rejection of related movements, stale descriptors after replacement,
discovery projection, shipped media, and all 144-frame tracking sequences.
`tests/unit/froggy-thumbnail.test.tsx` checks that initial markup does not load
videos or animated sheets, and that both opted-in sprite sheets are complete,
transparent and smaller than 200 KB.

`tests/unit/today-form-preview.test.tsx` renders the actual Today page for the
next and alternate Program day, verifies the form entry without an initial
video, and preserves the ordinary icon for missing or stale descriptors.

Existing Program-presentation, discovery and exercise-card suites remain part
of verification. The repository's standard unit, type, lint, build and protected
CI commands apply; see [Development](DEVELOPMENT.md#pull-requests). The viewer
adds no schema, import, calculation, timer or Coach persistence contract.

## Observed browser behavior

- Today: both the next-day disclosure and alternate-day preview expose the
  form dialog without starting a workout. Curl and squat clips autoplayed;
  pause, keyboard opening, Escape, close-button dismissal and focus return
  were checked. The list and dialog were visually inspected at 390×844 with
  no horizontal overflow; unsupported Dumbbell Row kept its ordinary icon.
- Program icons open and close the inline preview. Opening starts silent
  playback; tapping the image pauses it. Closing removes its video element.
- Two form callouts remain visible while DO/AVOID cards cycle independently.
  The camera-projected connectors follow the demonstrated body locations.
- Expansion and return preserve media mode, position, speed and explicit pause.
  Escape and the close control return focus to the exercise icon.
- Inventory details play the correct bound exercise. Similar unsupported
  variants retain existing reference media. Browsing does not add an exercise.
- Active-workout draft weights and reps survive opening and closing the viewer.
  An earlier synthetic workflow also saved exactly the entered set and observed
  its rest timer continue while the preview was open.
- Both animated-icon trials pause when offscreen or while the full preview is
  open. Other exercise icons remain still.
- Responsive checks at approximately 390 by 844 CSS pixels show no horizontal
  overflow. The final pair's callouts, equipment and headroom were inspected;
  earlier batches were checked when integrated. This was browser emulation.
- A fresh media-failure check withheld only the copied lateral-raise clean MP4.
  The viewer disabled playback, exposed every text tip and offered Retry video.
  Restoring that file and retrying resumed playback. Source Blender assets were
  untouched. The full asset pass subsequently verified every file was restored.
- All 58 offered videos return partial-content responses for a 1024-byte range;
  posters, icons and attribution files return successful responses. The complete
  static library is approximately 132 MiB. No single file exceeds 3.2 MB.

## Remaining limits

Physical iPhone/Safari, offline-installed PWA behavior, forced autoplay denial,
changed operating-system reduced-motion preference and failed lazy JavaScript
loading have not received a fresh end-to-end check. Reduced-motion defaults,
visibility cleanup and the local lazy-player error boundary have been inspected
in source; that is not the same as browser failure injection. The verified
failure above is an unavailable MP4 and its retry path.

The current videos have mixed 512-square, 800-by-720 and 1080-square resolutions.
Consistent 1080 finishing and independent qualified instructional review remain
separate work. Muscle highlights and pointers are schematic, not measurements
of activation or individualized injury-prevention advice.

The server flag remains off by default. Protected checks must finish before
merge, and production enablement remains an explicit deployment action. No
live Program, catalog record, performed history or owner data was modified by
this local verification. Rollout and rollback are described in the
[viewer documentation](FROGGY_FORM_DEMO.md#release-operation).
