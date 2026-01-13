export const dbPaths = {
  professor: (professorId) =>
    `professors/${professorId}`,

  classes: (professorId) =>
    `professors/${professorId}/classes`,

  class: (professorId, classId) =>
    `professors/${professorId}/classes/${classId}`,

  students: (professorId, classId) =>
    `professors/${professorId}/classes/${classId}/students`,

  exams: (professorId, classId) =>
    `professors/${professorId}/classes/${classId}/exams`,

  exam: (professorId, classId, examId) =>
    `professors/${professorId}/classes/${classId}/exams/${examId}`,

  answers: (professorId, classId, examId) =>
    `professors/${professorId}/classes/${classId}/exams/${examId}/answers`,

  reports: (professorId, classId, examId) =>
  `professors/${professorId}/classes/${classId}/exams/${examId}/reports`,

  student: (professorId, classId, studentId) =>
  `professors/${professorId}/classes/${classId}/students/${studentId}`,

  answer: (professorId, classId, examId, answerId) =>
  `professors/${professorId}/classes/${classId}/exams/${examId}/answers/${answerId}`,
};
