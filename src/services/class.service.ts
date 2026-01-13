import { get, onValue, push, ref, remove, set, update } from "firebase/database";
import { db } from "../firebase/firebaseConfig";
import { ExtractedStudent } from "./ai.service"; // <--- NEW IMPORT

// 1. Create a Class
// 🔹 UPDATED createClass to handle Student IDs
export const createClass = async (
  professorId: string, 
  classData: { 
    className: string; 
    section: string; 
    semester: string; 
    themeColor: string;
    studentList?: ExtractedStudent[]; 
  }
) => {
  try {
    // 1. Reference to the classes list
    const classesRef = ref(db, `professors/${professorId}/classes`);
    
    // 2. Generate a NEW unique key for the class
    const newClassRef = push(classesRef);
    const newClassKey = newClassRef.key;
    if (!newClassKey) throw new Error("Could not generate class ID");

    // 3. Prepare the FULL class object (including students) locally
    const fullClassData: any = {
      className: classData.className,
      section: classData.section,
      semester: classData.semester,
      themeColor: classData.themeColor,
      createdAt: new Date().toISOString(),
      students: {} // Initialize empty container for students
    };

    // 4. If we have students, add them INSIDE the object now
    if (classData.studentList && classData.studentList.length > 0) {
      classData.studentList.forEach((student) => {
        // Generate a unique ID client-side (doesn't save yet)
        const studentKey = push(ref(db, 'dummy')).key; 
        
        if (studentKey) {
            fullClassData.students[studentKey] = {
                name: student.name,
                studentId: student.id || "Pending",
                addedAt: new Date().toISOString(),
            };
        }
      });
    }

    // 5. SAVE EVERYTHING AT ONCE
    // Using set() on the new key avoids the "update path" conflict entirely
    await set(newClassRef, fullClassData);

    return newClassKey;
  } catch (error) {
    console.error("Error creating class:", error);
    throw error;
  }
};

// 2. Get Classes
export const getClasses = async (professorId: string) => {
  try {
    const snapshot = await get(ref(db, `professors/${professorId}/classes`));
    return snapshot.exists() ? snapshot.val() : {};
  } catch (error) {
    console.error("Error fetching classes:", error);
    return {};
  }
};

export const updateClass = async (
  professorId: string,
  classId: string,
  updates: {
    className?: string;
    section?: string;
    semester?: string;
    themeColor?: string;
  }
) => {
  try {
    const classRef = ref(db, `professors/${professorId}/classes/${classId}`);
    await update(classRef, updates);
  } catch (error) {
    console.error("Error updating class:", error);
    throw error;
  }
};

export const listenToClasses = (professorId: string, callback: (data: any) => void) => {
  const classesRef = ref(db, `professors/${professorId}/classes`);
  
  const unsubscribe = onValue(classesRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : {});
  });

  return unsubscribe;
};

// 🔹 FETCH STUDENTS
export const listenToStudents = (professorId: string, classId: string, callback: (data: any[]) => void) => {
  const studentsRef = ref(db, `professors/${professorId}/classes/${classId}/students`);
  
  const unsubscribe = onValue(studentsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const studentList = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      callback(studentList);
    } else {
      callback([]);
    }
  });

  return unsubscribe;
};

// 🔹 ADD STUDENT
export const addStudent = async (
  professorId: string, 
  classId: string, 
  studentData: { name: string; studentId: string }
) => {
  const key = studentData.studentId || push(ref(db, `professors/${professorId}/classes/${classId}/students`)).key;
  if (!key) return;

  const studentRef = ref(db, `professors/${professorId}/classes/${classId}/students/${key}`);
  
  await set(studentRef, {
    name: studentData.name,
    studentId: studentData.studentId,
    addedAt: new Date().toISOString(),
  });
};

// 🔹 UPDATE STUDENT
export const updateStudent = async (professorId: string, classId: string, studentKey: string, updates: { name?: string; studentId?: string }) => {
  const studentRef = ref(db, `professors/${professorId}/classes/${classId}/students/${studentKey}`);
  await update(studentRef, updates);
};

// 🔹 DELETE STUDENT
export const deleteStudent = async (professorId: string, classId: string, studentKey: string) => {
  const studentRef = ref(db, `professors/${professorId}/classes/${classId}/students/${studentKey}`);
  await remove(studentRef);
};

// 🔹 ADD ACTIVITY
export const addActivity = async (professorId: string, classId: string, title: string) => {
  const activitiesRef = ref(db, `professors/${professorId}/classes/${classId}/activities`);
  await push(activitiesRef, {
    title,
    createdAt: new Date().toISOString(),
  });
};

// 🔹 LISTEN TO ACTIVITIES
export const listenToActivities = (professorId: string, classId: string, callback: (data: any[]) => void) => {
  const activitiesRef = ref(db, `professors/${professorId}/classes/${classId}/activities`);
  
  const unsubscribe = onValue(activitiesRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const list = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    } else {
      callback([]);
    }
  });

  return unsubscribe;
};

// 🔹 DELETE ACTIVITY
export const deleteActivity = async (professorId: string, classId: string, activityId: string) => {
  const activityRef = ref(db, `professors/${professorId}/classes/${classId}/activities/${activityId}`);
  await remove(activityRef);
};

// 🔹 UPDATE ACTIVITY TITLE
export const updateActivity = async (
  professorId: string, 
  classId: string, 
  activityId: string, 
  newTitle: string
) => {
  const activityRef = ref(db, `professors/${professorId}/classes/${classId}/activities/${activityId}`);
  await update(activityRef, {
    title: newTitle
  });
};

// 🔹 FETCH ALL STUDENTS IN A CLASS
export const getStudentsInClass = async (professorId: string, classId: string) => {
  const studentsRef = ref(db, `professors/${professorId}/classes/${classId}/students`);
  const snapshot = await get(studentsRef);
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    return Object.keys(data).map(key => ({
      id: key,
      name: data[key].name 
    })).sort((a, b) => a.name.localeCompare(b.name));
  }
  return [];
};

// 🔹 FETCH ACTIVITIES
export const getActivities = async (professorId: string, classId: string) => {
  const activitiesRef = ref(db, `professors/${professorId}/classes/${classId}/activities`);
  const snapshot = await get(activitiesRef);

  if (snapshot.exists()) {
    const data = snapshot.val();
    return Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));
  }
  return [];
};

// 🔹 GET SCORES FOR AN ACTIVITY
export const getStudentScores = async (professorId: string, classId: string, activityId: string) => {
  try {
    const studentsRef = ref(db, `professors/${professorId}/classes/${classId}/students`);
    const snapshot = await get(studentsRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const results: any[] = [];

      Object.keys(data).forEach((studentKey) => {
        const student = data[studentKey];
        const scores = student.scores || {};
        const activityScore = scores[activityId]; 

        results.push({
          id: studentKey,
          name: student.name,
          score: activityScore ? activityScore.score : null, 
          feedback: activityScore ? activityScore.feedback : "",
          gradedAt: activityScore ? activityScore.gradedAt : null
        });
      });

      return results.sort((a, b) => (b.score || -1) - (a.score || -1));
    }
    return [];
  } catch (error) {
    console.error("Error fetching scores:", error);
    return [];
  }
};

// 🔹 SAVE STUDENT SCORE
export const saveStudentScore = async (
  professorId: string,
  classId: string,
  studentId: string,
  activityId: string,
  data: { score: number; feedback: string; gradedAt: string }
) => {
  const scoreRef = ref(db, `professors/${professorId}/classes/${classId}/students/${studentId}/scores/${activityId}`);
  await update(scoreRef, data);
};

// 🔹 IMPORT MASTERLIST (UPDATED TO SAVE IDs)
export const saveMasterlist = async (professorId: string, classId: string, students: ExtractedStudent[]) => {
  try {
    const updates: any = {};
    const studentsPath = `professors/${professorId}/classes/${classId}/students`;

    students.forEach((student) => {
      // Use push() to create a unique database key
      const newStudentRef = push(ref(db, studentsPath));
      const key = newStudentRef.key;
      
      if (key) {
        updates[`${studentsPath}/${key}`] = {
          name: student.name,
          studentId: student.id || "Pending", // Now saves the AI-detected ID!
          addedAt: new Date().toISOString()
        };
      }
    });

    await update(ref(db), updates);
    return true;
  } catch (error) {
    console.error("Error saving masterlist:", error);
    throw error;
  }
};