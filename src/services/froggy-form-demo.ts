import "server-only";
import { matchFroggyFormDemo, type FroggyCatalogIdentity } from "@/lib/froggy-form-demo";

export function getFroggyFormDemo(exercise: FroggyCatalogIdentity) {
  return matchFroggyFormDemo(exercise, process.env.FROGGY_FORM_DEMO_PILOT === "true");
}
