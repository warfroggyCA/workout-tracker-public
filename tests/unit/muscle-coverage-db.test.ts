import { expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createMigratedTestDatabase } from "../helpers/database";
import {
  users,
  userProfiles,
  exercises,
  exercisePrescriptions,
} from "@/db/schema";
import { activateProgramAtomically } from "@/services/program-activation";
import { getActiveProgramPresentation } from "@/services/program-presentation";
import {
  getOrCreateProgramDraft,
  saveProgramDraft,
  reviewProgramDraft,
} from "@/services/program-drafts";
import { publishProgramDraft } from "@/services/program-publication";
import { aggregateMuscleWork, programMuscleWork } from "@/lib/muscle-coverage";

it("loads owner-scoped saved Program roles and matches independent SQL working-set totals", async () => {
  const database = await createMigratedTestDatabase();
  try {
    const ownerId = crypto.randomUUID();
    await database.db
      .insert(users)
      .values({ id: ownerId, email: "muscle-map@example.com" });
    await database.db
      .insert(userProfiles)
      .values({ userId: ownerId, unit: "lb" });
    const [press] = await database.db
      .insert(exercises)
      .values({
        name: "Synthetic press",
        userId: null,
        variantKey: "barbell_bench_press",
        variantAttributes: {},
        isUnilateral: false,
        movementPattern: "horizontal_push",
        primaryMuscles: ["chest"],
        secondaryMuscles: ["triceps"],
        loadType: "barbell",
        catalogReviewed: true,
      })
      .returning();
    const [extension] = await database.db
      .insert(exercises)
      .values({
        name: "Synthetic extension",
        userId: ownerId,
        movementPattern: "isolation_arms",
        primaryMuscles: ["triceps"],
        secondaryMuscles: [],
        loadType: "bodyweight",
        catalogReviewed: false,
      })
      .returning();
    const result = await activateProgramAtomically(database.db, {
      userId: ownerId,
      loadUnit: "lb",
      programName: "Coverage fixture",
      changeSummary: "Synthetic fixture",
      auditAction: "program.activate",
      auditSummary: "Synthetic fixture",
      days: [
        {
          name: "Day 1",
          exercises: [
            { exerciseId: press.id, sets: 3 },
            { exerciseId: extension.id, sets: 2 },
          ],
        },
        { name: "Day 2", exercises: [{ exerciseId: press.id, sets: 4 }] },
      ].map((day) => ({
        ...day,
        exercises: day.exercises.map((slot) => ({
          ...slot,
          repMin: 8,
          repMax: 12,
          targetLoad: 0,
          restSec: 90,
          supersetKey: null,
          notes: null,
          warmupNotes: null,
          warmupSets: [],
        })),
      })),
    });
    expect(result.ok).toBe(true);
    const before = await database.db.select().from(exercisePrescriptions);
    const program = await getActiveProgramPresentation(database.db, ownerId);
    expect(program).not.toBeNull();
    const totals = aggregateMuscleWork(programMuscleWork(program!));
    expect(
      program!.days[0].slots[0].exercise.muscleMapping?.coverageReview?.version,
    ).toBe("coverage-v2");
    expect(totals.frontdelts).toMatchObject({ direct: 0, supporting: 7 });
    // Presentation-specific refinement does not rewrite the stored catalog roles.
    const storedPress = (await database.db.select().from(exercises)).find(
      (e) => e.id === press.id,
    )!;
    expect(storedPress.primaryMuscles).toEqual(["chest"]);
    expect(storedPress.secondaryMuscles).toEqual(["triceps"]);
    const independent = await database.client.query<{
      direct_sets: number;
      supporting_sets: number;
    }>(`
      SELECT SUM(CASE WHEN e.primary_muscles @> '["triceps"]'::jsonb THEN p.sets ELSE 0 END)::int AS direct_sets,
             SUM(CASE WHEN e.secondary_muscles @> '["triceps"]'::jsonb THEN p.sets ELSE 0 END)::int AS supporting_sets
      FROM exercise_prescriptions p JOIN workout_template_exercises s ON s.id = p.template_exercise_id
      JOIN exercises e ON e.id = s.exercise_id WHERE p.superseded_by_id IS NULL
    `);
    expect(totals.triceps.direct).toBe(independent.rows[0].direct_sets);
    expect(totals.triceps.supporting).toBe(independent.rows[0].supporting_sets);
    expect(totals.chest).toMatchObject({
      direct: 7,
      supporting: 0,
      directDays: 2,
    });
    expect(totals.triceps).toMatchObject({
      direct: 2,
      supporting: 7,
      directDays: 1,
    });
    expect(
      await getActiveProgramPresentation(database.db, crypto.randomUUID()),
    ).toBeNull();
    expect(await database.db.select().from(exercisePrescriptions)).toEqual(
      before,
    );
    // A later read reflects the current prescription, without a cached totals store.
    const state = await getOrCreateProgramDraft(database.db, ownerId);
    if (!state) throw new Error("Missing draft");
    const document = structuredClone(state.draft.document);
    document.days[0].exercises[0].sets = 5;
    document.days[0].exercises[0].setNotes = [null, null, null, null, null];
    if (document.days[0].exercises[0].intent)
      document.days[0].exercises[0].intent.idealDose.value = 5;
    const saved = await saveProgramDraft(database.db, ownerId, {
      draftId: state.draft.id,
      expectedRevision: state.draft.revision,
      mutationId: crypto.randomUUID(),
      document,
    });
    expect(saved.status, JSON.stringify(saved)).toBe("saved");
    if (saved.status !== "saved") return;
    const review = await reviewProgramDraft(
      database.db,
      ownerId,
      state.draft.id,
      saved.revision,
    );
    if (!review || review.status !== "publishable")
      throw new Error("Draft not publishable");
    const published = await publishProgramDraft(database.db, ownerId, {
      draftId: state.draft.id,
      expectedRevision: saved.revision,
      reviewHash: review.hash!,
    });
    expect(published).toMatchObject({ ok: true });
    const refreshed = await getActiveProgramPresentation(database.db, ownerId);
    const changed = programMuscleWork(refreshed!);
    expect(changed[0].sets).toBe(5);
    expect(refreshed!.version.id).not.toBe(program!.version.id);
    const retained = await database.db.select().from(exercisePrescriptions);
    expect(
      retained.filter((p) => before.some((old) => old.id === p.id)),
    ).toEqual(before);
    const history = await database.db.execute(
      sql`select count(*)::int as count from workout_sessions`,
    );
    expect(history.rows[0].count).toBe(0);
  } finally {
    await database.close();
  }
}, 30_000);
