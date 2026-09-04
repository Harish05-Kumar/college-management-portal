import React from "react";
import { Download, Eye, X } from "lucide-react";
import ProfilePhoto from "./ProfilePhoto.jsx";

function StudentDetailsModal({ applications = [], applicationsLoading = false, loading, onClose, onDownloadResume, onViewResume, student }) {
  const resumeBuilder = student?.resumeBuilder;
  const resumes = student?.resumes || [];
  const primaryResume = resumes[0];
  const phoneNumber = student?.phoneNumber || resumeBuilder?.phoneNumber;
  const registrationDate = student?.registrationDate || student?.registeredAt || student?.createdAt;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content student-details-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Student Details</h2>
          <button className="close-button" type="button" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="student-details-body">
          {loading && !student ? (
            <p className="empty-state">Loading student details...</p>
          ) : (
            <>
              <div className="student-detail-profile">
                <ProfilePhoto src={student?.profilePhotoUrl || student?.profilePhoto} alt={student?.name || "Student"} size="detail" />
                <div>
                  <h3>{student?.name || "Student name not available"}</h3>
                  <p>{student?.email || "-"}</p>
                </div>
              </div>

              <DetailSection title="Personal Information">
                <dl className="student-details-grid">
                  <DetailItem label="Student Name" value={student?.name} />
                  <DetailItem label="Email" value={student?.email} />
                  <DetailItem label="Department" value={student?.department} />
                  <DetailItem label="CGPA" value={student?.cgpa} />
                  <DetailItem label="Skills" value={student?.skills} wide />
                  {phoneNumber && <DetailItem label="Phone Number" value={phoneNumber} />}
                  {registrationDate && <DetailItem label="Registration Date" value={formatDate(registrationDate)} />}
                </dl>
              </DetailSection>

              <DetailSection title="Resume">
                {primaryResume ? (
                  <div className="resume-actions-row">
                    <div>
                      <strong>{primaryResume.fileName || "Resume"}</strong>
                      <p className="muted-text">{primaryResume.sourceType || "Uploaded resume"}</p>
                    </div>
                    <div className="card-actions">
                      <button type="button" className="secondary-button" onClick={() => onViewResume(primaryResume.id)}>
                        <Eye size={17} />
                        View Resume
                      </button>
                      <button
                        type="button"
                        className="resume-button"
                        onClick={() => onDownloadResume(primaryResume.id, primaryResume.fileName)}
                      >
                        <Download size={17} />
                        Download Resume
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="empty-state">No resume uploaded.</p>
                )}
              </DetailSection>

              <DetailSection title="Resume Builder Information">
                {!resumeBuilder ? (
                  <p className="empty-state">No resume builder information available.</p>
                ) : (
                  <div className="resume-builder-details">
                    <ListBlock
                      title="Education"
                      items={resumeBuilder.education}
                      renderItem={(item) =>
                        joinParts([
                          item.degree,
                          item.department,
                          item.collegeName,
                          item.university,
                          item.graduationYear,
                          item.cgpa == null ? "" : `CGPA: ${item.cgpa}`
                        ])
                      }
                    />
                    <ListBlock
                      title="Projects"
                      items={resumeBuilder.projects}
                      renderItem={(item) =>
                        joinParts([item.projectName, item.description, item.technologiesUsed, item.role, item.duration])
                      }
                    />
                    <ListBlock title="Certifications" items={resumeBuilder.certifications} renderItem={(item) => item.name} />
                    <ListBlock
                      title="Experience"
                      items={resumeBuilder.experience}
                      renderItem={(item) => joinParts([item.company, item.role, item.duration, item.description])}
                    />
                    <ListBlock title="Languages" items={resumeBuilder.languages} renderItem={(item) => item.name} />
                    <ListBlock title="Achievements" items={resumeBuilder.achievements} renderItem={(item) => item.description} />
                  </div>
                )}
              </DetailSection>

              <DetailSection title="Placement Applications">
                {applicationsLoading ? (
                  <p className="empty-state">Loading placement applications...</p>
                ) : applications.length ? (
                  <div className="student-application-list">
                    {applications.map((application) => (
                      <article className="student-application-card" key={application.id}>
                        <div className="student-application-card-header">
                          <div>
                            <h4>{application.companyName || `Company #${application.companyId ?? "-"}`}</h4>
                            <p>{application.driveTitle || `Drive #${application.driveId ?? "-"}`}</p>
                          </div>
                          <ApplicationStatusBadge status={application.status} />
                        </div>
                        <dl className="student-application-grid">
                          <DetailItem label="Job Role" value={application.jobRole} />
                          <DetailItem label="Package" value={formatPackage(application)} />
                          <DetailItem label="Required CGPA" value={application.requiredCgpa} />
                          <DetailItem label="Student CGPA" value={application.cgpa} />
                          <DetailItem label="Applied Date" value={formatDate(application.appliedAt)} />
                          <DetailItem label="Current Status" value={<ApplicationStatusBadge status={application.status} />} />
                          {application.updatedAt && <DetailItem label="Last Updated Date" value={formatDate(application.updatedAt)} />}
                        </dl>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">This student has not applied for any placement drives yet.</p>
                )}
              </DetailSection>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSection({ children, title }) {
  return (
    <section className="student-detail-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function DetailItem({ label, value, wide = false }) {
  return (
    <div className={wide ? "wide" : ""}>
      <dt>{label}</dt>
      <dd>{value ?? "-"}</dd>
    </div>
  );
}

const APPLICATION_STATUS_LABELS = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  SELECTED: "Selected",
  REJECTED: "Rejected"
};

function ApplicationStatusBadge({ status }) {
  const normalizedStatus = (status || "APPLIED").toUpperCase();
  const statusLabel = APPLICATION_STATUS_LABELS[normalizedStatus] || normalizedStatus;
  return <span className={`application-status-badge ${normalizedStatus.toLowerCase()}`}>{statusLabel}</span>;
}

function ListBlock({ items = [], renderItem, title }) {
  const visibleItems = items.map(renderItem).filter(Boolean);

  return (
    <div className="resume-builder-block">
      <h4>{title}</h4>
      {visibleItems.length ? (
        <ul>
          {visibleItems.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted-text">Not added.</p>
      )}
    </div>
  );
}

function joinParts(parts) {
  return parts.filter((part) => part != null && String(part).trim()).join(" | ");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatPackage(application) {
  if (application?.packageAmount != null) return `${application.packageAmount} LPA`;
  return application?.salary || "-";
}

export default StudentDetailsModal;
