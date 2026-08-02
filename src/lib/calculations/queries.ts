import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, type EmissionCalculation } from "@/lib/types";

export async function fetchLatestCalculationForProcess(
  organizationId: string,
  processId: string,
  periodYear?: number
): Promise<EmissionCalculation | null> {
  const clauses = [
    where("organizationId", "==", organizationId),
    where("processId", "==", processId),
  ];
  if (periodYear != null) clauses.push(where("periodYear", "==", periodYear));

  const snap = await getDocs(query(collection(db, COLLECTIONS.emissionCalculations), ...clauses));
  if (snap.empty) return null;
  const docs = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<EmissionCalculation, "id">) }))
    .sort((a, b) => b.version - a.version || b.calculatedAt - a.calculatedAt);
  return docs[0];
}
