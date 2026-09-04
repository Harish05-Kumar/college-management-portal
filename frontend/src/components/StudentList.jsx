import React from "react";
import StudentCard from "./StudentCard.jsx";

function StudentList({ loading, onDelete, onViewDetails, students }) {
  return (
    <div className="drive-list student-list">
      {students.length === 0 && <p className="empty-state">No students registered yet.</p>}
      {students.map((student) => (
        <StudentCard
          key={student.id}
          loading={loading}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
          student={student}
        />
      ))}
    </div>
  );
}

export default StudentList;
