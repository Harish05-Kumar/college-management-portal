import React from "react";
import { Eye, Trash2 } from "lucide-react";
import ProfilePhoto from "./ProfilePhoto.jsx";

function StudentCard({ loading, onDelete, onViewDetails, student }) {
  return (
    <article className="drive-card student-card">
      <div className="student-card-header">
        <ProfilePhoto src={student.profilePhotoUrl || student.profilePhoto} alt={student.name || "Student"} size="list" />
        <div>
          <h3>{student.name || "Student name not available"}</h3>
        </div>
      </div>
      <dl>
        <div>
          <dt>Department</dt>
          <dd>{student.department || "-"}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{student.email || "-"}</dd>
        </div>
      </dl>
      <div className="card-actions">
        <button type="button" className="secondary-button" onClick={() => onViewDetails(student)} disabled={loading}>
          <Eye size={17} />
          View Details
        </button>
        <button
          type="button"
          className="danger-button"
          onClick={() => onDelete(student)}
          disabled={loading}
          title="Delete student"
        >
          <Trash2 size={17} />
          Delete
        </button>
      </div>
    </article>
  );
}

export default StudentCard;
