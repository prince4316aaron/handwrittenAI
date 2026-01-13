import { ref, onValue, off } from "firebase/database";
import { db } from "../firebase/firebaseConfig";
import { dbPaths } from "../firebase/dbPaths";

export const listenToExams = (professorId, classId, callback) => {
  const examsRef = ref(
    db,
    dbPaths.exams(professorId, classId)
  );

  onValue(examsRef, (snapshot) => {
    callback(snapshot.val() || {});
  });

  return () => off(examsRef);
};
