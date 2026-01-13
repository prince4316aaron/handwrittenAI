import { ref, push } from "firebase/database";
import { db } from "../firebase/firebaseConfig";
import { dbPaths } from "../firebase/dbPaths";

export const submitAnswer = async (
  professorId,
  classId,
  examId,
  answerData
) => {
  const answersRef = ref(
    db,
    dbPaths.answers(professorId, classId, examId)
  );

  return push(answersRef, {
    ...answerData,
    uploadedAt: new Date().toISOString()
  });
};
