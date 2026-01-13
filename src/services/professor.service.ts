import { get, ref, set } from "firebase/database";
import { dbPaths } from "../firebase/dbPaths";
import { db } from "../firebase/firebaseConfig";

export const createProfessor = async (
  professorId: string,
  data: any
) => {
  const professorRef = ref(db, dbPaths.professor(professorId));
  const snapshot = await get(professorRef);

  // Only create profile if it doesn't exist
  if (!snapshot.exists()) {
    return set(professorRef, {
      ...data,
      createdAt: new Date().toISOString(),
    });
  }

  // Otherwise do nothing (Google login re-use)
  return;
};

export const getProfessorProfile = async (professorId: string) => {
  const snapshot = await get(
    ref(db, dbPaths.professor(professorId))
  );

  return snapshot.exists() ? snapshot.val() : null;
};
