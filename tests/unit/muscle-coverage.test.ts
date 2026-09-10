import { describe, expect, it } from "vitest";
import {
  aggregateMuscleWork,
  directSetColor,
  muscleKey,
  programMuscleWork,
} from "@/lib/muscle-coverage";
import {
  projectProgramPresentation,
  type ProgramPresentationSource,
} from "@/lib/program-presentation";

function fixture(sets: number | null = 3) {
  const slot = (
    id: string,
    primary: string[],
    supporting: string[],
    count: number | null,
  ) => ({
    id,
    lineageId: id,
    orderIdx: 0,
    supersetGroupId: null,
    restSec: 90,
    notes: null,
    warmupNotes: "Warm-up",
    warmupSets: [{ label: "Primer", reps: 5 }],
    exercise: {
      id: `exercise-${id}`,
      name: "Renamable exercise",
      family: null,
      movementPattern: "horizontal_push",
      muscleMapping: { primary, supporting, catalogReviewed: true },
    },
    prescription:
      count === null
        ? null
        : {
            sets: count,
            repRangeMin: 8,
            repRangeMax: 12,
            targetLoad: null,
            targetLoadUnit: null,
            progressionRuleId: "double",
          },
  });
  return projectProgramPresentation({
    program: { id: "program", name: "Synthetic Program" },
    version: { id: "version", versionNo: 1 },
    groups: [],
    days: [
      {
        id: "d1",
        lineageId: "d1",
        name: "Day 1",
        orderIdx: 0,
        notes: null,
        warmupNotes: null,
        intent: null,
        slots: [
          slot("a", ["chest", "Chest"], ["triceps", "chest"], sets),
          slot("b", ["triceps"], ["chest"], 2),
        ],
      },
      {
        id: "d2",
        lineageId: "d2",
        name: "Day 2",
        orderIdx: 1,
        notes: null,
        warmupNotes: null,
        intent: null,
        slots: [slot("c", ["pectorals"], ["triceps"], 4)],
      },
    ],
  } as ProgramPresentationSource);
}

describe("planned muscle coverage", () => {
  it("counts saved roles once per working-set slot and preserves the source", () => {
    const source = fixture();
    const before = structuredClone(source);
    const coverage = aggregateMuscleWork(programMuscleWork(source));
    expect(coverage.chest).toMatchObject({
      direct: 7,
      supporting: 2,
      directDays: 2,
    });
    expect(coverage.triceps).toMatchObject({
      direct: 2,
      supporting: 7,
      directDays: 1,
    });
    expect(coverage.chest.rows).toHaveLength(3);
    expect(source).toEqual(before);
  });
  it("supports all, one and no days without changing role classification or scale", () => {
    const work = programMuscleWork(fixture());
    expect(aggregateMuscleWork(work, new Set())).toEqual({});
    expect(aggregateMuscleWork(work, new Set(["d1"])).chest).toMatchObject({
      direct: 3,
      supporting: 2,
      directDays: 1,
    });
    expect(aggregateMuscleWork(work, new Set(["missing"]))).toEqual({});
    expect(directSetColor(3)).toBe("#fa7879");
    expect(directSetColor(4)).toBe("#ec4e59");
    expect(directSetColor(10)).toBe("#af1534");
    expect(directSetColor(0)).toBe("transparent");
  });
  it.each([null, 0, -1, 1.5, NaN, Infinity])(
    "does not invent sets or a direct day for invalid prescription %s",
    (sets) => {
      const work = programMuscleWork(fixture(sets));
      expect(work[0].sets).toBeNull();
      expect(aggregateMuscleWork(work).chest).toMatchObject({
        direct: 4,
        supporting: 2,
        directDays: 1,
      });
    },
  );
  it("reports missing mappings and retains unsupported labels without guessing anatomical subdivisions", () => {
    const source = fixture();
    source.days[0].slots[0].exercise.muscleMapping = undefined;
    const work = programMuscleWork(source);
    expect(work[0]).toMatchObject({
      missingPrimary: true,
      direct: [],
      supporting: [],
      catalogReviewed: false,
    });
    expect(muscleKey("back")).toBe("unmapped:back");
    expect(muscleKey("upper chest")).toBe("unmapped:upper chest");
    expect(muscleKey("rear_delts")).toBe("reardelts");
  });
  it("keeps repeated exercise occurrences and updated saved prescriptions independent", () => {
    const source = fixture();
    source.days[1].slots[0].exercise.id = source.days[0].slots[0].exercise.id;
    expect(aggregateMuscleWork(programMuscleWork(source)).chest.direct).toBe(7);
    source.days[0].slots[0].prescription!.sets = 5;
    expect(aggregateMuscleWork(programMuscleWork(source)).chest.direct).toBe(9);
  });
});
