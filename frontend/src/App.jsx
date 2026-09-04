import React, { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  FileUp,
  GraduationCap,
  ListChecks,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  X,
  UserRound
} from "lucide-react";
import { apiRequest, clearSession, getRoleFromPath, getStoredSession, getToken, normalizeRole, setSession } from "./api.js";
import ProfilePhoto from "./components/ProfilePhoto.jsx";
import StudentDetailsModal from "./components/StudentDetailsModal.jsx";
import StudentList from "./components/StudentList.jsx";

const ADMIN_ROLE = "ADMIN";
const STUDENT_ROLE = "STUDENT";
const ADMIN_DASHBOARD_PATH = "/admin/dashboard";
const ADMIN_STUDENTS_PATH = "/admin/students";
const STUDENT_DASHBOARD_PATH = "/student/dashboard";
const PROFILE_PHOTO_MAX_SIZE = 2 * 1024 * 1024;
const PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png"];
const PROFILE_PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png"];

const emptyCompany = {
  companyName: "",
  requiredCgpa: "",
  requiredSkills: "",
  packageAmount: ""
};

const emptyDrive = {
  companyId: "",
  title: "",
  jobRole: "",
  description: "",
  responsibilities: "",
  qualifications: "",
  benefits: "",
  employmentType: "",
  workMode: "",
  experienceRequired: "",
  jobLocation: "",
  numberOfOpenings: "",
  selectionProcess: "",
  bondDetails: "",
  packageAmount: "",
  requiredCgpa: "",
  requiredSkills: "",
  driveDate: "",
  applicationDeadline: "",
  status: "OPEN"
};

const emptyRegistration = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  department: "",
  cgpa: "",
  profilePhoto: null
};

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const initialSession = getStoredSession();
  const [token, setToken] = useState(initialSession.token);
  const [userId, setUserId] = useState(initialSession.userId);
  const [role, setRole] = useState(initialSession.role);
  const [loginMode, setLoginMode] = useState(path.startsWith("/admin") ? "admin" : "student");
  const [authView, setAuthView] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registrationForm, setRegistrationForm] = useState(emptyRegistration);
  const [registrationPhotoPreview, setRegistrationPhotoPreview] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegistrationPassword, setShowRegistrationPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [student, setStudent] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [drives, setDrives] = useState([]);
  const [driveCount, setDriveCount] = useState(0);
  const [adminStudents, setAdminStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [applicationCount, setApplicationCount] = useState(0);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [companyForm, setCompanyForm] = useState(emptyCompany);
  const [driveForm, setDriveForm] = useState(emptyDrive);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoutConfirmRole, setLogoutConfirmRole] = useState(null);

  useEffect(() => {
    return () => {
      if (registrationPhotoPreview) {
        URL.revokeObjectURL(registrationPhotoPreview);
      }
    };
  }, [registrationPhotoPreview]);

  const activeResume = useMemo(
    () => resumes.find((resume) => String(resume.id) === selectedResumeId),
    [resumes, selectedResumeId]
  );

  useEffect(() => {
    function handlePopState() {
      setPath(window.location.pathname);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (token && role) {
      loadDashboard(role);
    }
  }, [token, role]);

  async function loadDashboard(currentRole = role) {
    setLoading(true);
    setMessage("");
    try {
      if (currentRole === ADMIN_ROLE) {
        const [companyData, driveData, driveCountData, applicationData, countData, studentData] = await Promise.all([
          apiRequest("/companies", { role: ADMIN_ROLE }),
          apiRequest("/placement-drives", { role: ADMIN_ROLE }),
          apiRequest("/placement-drives/count", { role: ADMIN_ROLE }),
          apiRequest("/applications", { role: ADMIN_ROLE }),
          apiRequest("/applications/count", { role: ADMIN_ROLE }),
          apiRequest("/api/admin/students", { role: ADMIN_ROLE })
        ]);
        setCompanies(companyData);
        setDrives(driveData);
        setDriveCount(Number(driveCountData));
        setApplications(applicationData);
        setApplicationCount(Number(countData));
        setAdminStudents(studentData);
      } else {
        const [studentData, driveData, applicationData, resumeData] = await Promise.all([
          apiRequest("/students/me", { role: STUDENT_ROLE }),
          apiRequest("/placement-drives/open", { role: STUDENT_ROLE }),
          apiRequest("/applications/student/me", { role: STUDENT_ROLE }),
          apiRequest("/resumes/me", { role: STUDENT_ROLE })
        ]);
        setStudent(studentData);
        setDrives(driveData);
        setApplications(applicationData);
        setApplicationCount(applicationData.length);
        setResumes(resumeData);
        if (resumeData.length && !selectedResumeId) {
          setSelectedResumeId(String(resumeData[0].id));
        }
      }
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        logout(currentRole);
      }
      setMessage(cleanError(error.message));
    } finally {
      setLoading(false);
    }
  }

  async function login(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const session = await apiRequest(loginMode === "admin" ? "/auth/admin/login" : "/auth/student/login", {
        method: "POST",
        body: loginForm
      });
      const storedSession = setSession(session);
      setToken(storedSession.token);
      setUserId(storedSession.userId);
      setRole(storedSession.role);
      replacePath(getDashboardPath(storedSession.role));
      setLoginForm({ email: "", password: "" });
    } catch (error) {
      setMessage(cleanError(error.message));
    } finally {
      setLoading(false);
    }
  }

  async function registerStudent(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (registrationForm.password !== registrationForm.confirmPassword) {
      setMessage("Password and Confirm Password must match");
      setLoading(false);
      return;
    }

    const cgpa = Number(registrationForm.cgpa);
    if (Number.isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      setMessage("CGPA must be between 0 and 10");
      setLoading(false);
      return;
    }

    const photoError = validateProfilePhotoFile(registrationForm.profilePhoto);
    if (photoError) {
      setMessage(photoError);
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", registrationForm.name);
    formData.append("email", registrationForm.email);
    formData.append("password", registrationForm.password);
    formData.append("confirmPassword", registrationForm.confirmPassword);
    formData.append("department", registrationForm.department);
    formData.append("cgpa", String(cgpa));
    formData.append("skills", registrationForm.skills || "");
    formData.append("profilePhoto", registrationForm.profilePhoto);

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: formData
      });
      setRegistrationForm(emptyRegistration);
      setRegistrationPhotoPreview("");
      setAuthView("login");
      setMessage("Registration Successful! A confirmation email has been sent to your registered email address.");
    } catch (error) {
      setMessage(cleanError(error.message));
    } finally {
      setLoading(false);
    }
  }

  function selectRegistrationPhoto(file) {
    if (registrationPhotoPreview) {
      URL.revokeObjectURL(registrationPhotoPreview);
    }

    const validationMessage = validateProfilePhotoFile(file);
    if (validationMessage) {
      setRegistrationForm({ ...registrationForm, profilePhoto: null });
      setRegistrationPhotoPreview("");
      setMessage(validationMessage);
      return false;
    }

    setMessage("");
    setRegistrationForm({ ...registrationForm, profilePhoto: file });
    setRegistrationPhotoPreview(URL.createObjectURL(file));
    return true;
  }

  async function createCompany(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await apiRequest("/companies", {
        method: "POST",
        role: ADMIN_ROLE,
        body: {
          ...companyForm,
          requiredCgpa: Number(companyForm.requiredCgpa),
          packageAmount: Number(companyForm.packageAmount)
        }
      });
      setCompanyForm(emptyCompany);
      await loadDashboard(ADMIN_ROLE);
      setMessage("Company added");
    } catch (error) {
      setMessage(cleanError(error.message));
    } finally {
      setLoading(false);
    }
  }

  async function createDrive(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await apiRequest("/placement-drives", {
        method: "POST",
        body: {
          ...driveForm,
          companyId: Number(driveForm.companyId),
          requiredCgpa: driveForm.requiredCgpa === "" ? null : Number(driveForm.requiredCgpa),
          packageAmount: driveForm.packageAmount === "" ? null : Number(driveForm.packageAmount),
          numberOfOpenings: driveForm.numberOfOpenings === "" ? null : Number(driveForm.numberOfOpenings)
        }
      });
      setDriveForm(emptyDrive);
      await loadDashboard(ADMIN_ROLE);
      setMessage("Placement drive created");
    } catch (error) {
      setMessage(cleanError(error.message));
    } finally {
      setLoading(false);
    }
  }

  async function deleteCompany(companyId) {
    setLoading(true);
    setMessage("");
    try {
      await apiRequest(`/companies/${companyId}`, {
        method: "DELETE",
        role: ADMIN_ROLE
      });
      await loadDashboard(ADMIN_ROLE);
      setMessage("Company deleted");
    } catch (error) {
      setMessage(cleanError(error.message));
    } finally {
      setLoading(false);
    }
  }

  async function deleteDrive(driveId) {
    setLoading(true);
    setMessage("");
    try {
      await apiRequest(`/placement-drives/${driveId}`, {
        method: "DELETE",
        role: ADMIN_ROLE
      });
      await loadDashboard(ADMIN_ROLE);
      setMessage("Drive deleted");
    } catch (error) {
      setMessage(cleanError(error.message));
    } finally {
      setLoading(false);
    }
  }

  async function deleteStudent(studentId) {
    setLoading(true);
    setMessage("");
    try {
      await apiRequest(`/api/admin/students/${studentId}`, {
        method: "DELETE",
        role: ADMIN_ROLE
      });
      setAdminStudents((currentStudents) => currentStudents.filter((student) => student.id !== studentId));
      setApplications((currentApplications) => {
        const nextApplications = currentApplications.filter((application) => application.studentId !== studentId);
        setApplicationCount(nextApplications.length);
        return nextApplications;
      });
      setMessage("Student deleted successfully");
    } catch (error) {
      setMessage(cleanError(error.message));
    } finally {
      setLoading(false);
    }
  }

  async function importJobsFromRapidAPI(query = "", location = "") {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (query) params.append("query", query);
      if (location) params.append("location", location);
      
      await apiRequest(`/placement-drives/import-jobs?${params.toString()}`, {
        method: "POST",
        role: role
      });
      await loadDashboard(role);
      setMessage("Jobs imported successfully from RapidAPI. Note: Existing jobs were updated with new data.");
    } catch (error) {
      setMessage(cleanError(error.message));
    } finally {
      setLoading(false);
    }
  }

  async function sendApplicationStatus(applicationId, status) {
    setMessage("");
    try {
      await apiRequest(`/applications/${applicationId}/status?status=${encodeURIComponent(status)}`, {
        method: "PUT",
        role: ADMIN_ROLE
      });
      await apiRequest(`/applications/${applicationId}/send-email`, {
        method: "POST",
        role: ADMIN_ROLE
      });
      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === applicationId ? { ...application, status } : application
        )
      );
      setMessage("Email sent successfully");
    } catch (error) {
      setMessage(cleanError(error.message));
      throw error;
    }
  }

  async function deleteApplication(applicationId) {
    setMessage("");
    try {
      await apiRequest(`/applications/${applicationId}`, {
        method: "DELETE",
        role: ADMIN_ROLE
      });
      setApplications((currentApplications) => {
        const nextApplications = currentApplications.filter((application) => application.id !== applicationId);
        setApplicationCount(nextApplications.length);
        return nextApplications;
      });
      setMessage("Application deleted");
    } catch (error) {
      setMessage(cleanError(error.message));
      throw error;
    }
  }

  async function uploadResume(input) {
    const file = input?.target ? input.target.files[0] : input;
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setMessage("");
    try {
      const uploadedResume = await apiRequest("/resumes/upload", {
        method: "POST",
        role: STUDENT_ROLE,
        body: formData
      });
      setSelectedResumeId(String(uploadedResume.id));
      await loadDashboard(STUDENT_ROLE);
      setSelectedResumeId(String(uploadedResume.id));
      setMessage("Resume uploaded");
      return uploadedResume;
    } catch (error) {
      setMessage(cleanError(error.message));
      throw error;
    } finally {
      setLoading(false);
      if (input?.target) {
        input.target.value = "";
      }
    }
  }

  async function deleteResume(resumeId) {
    if (!resumeId) return;
    setLoading(true);
    setMessage("");
    try {
      await apiRequest(`/resumes/${resumeId}`, {
        method: "DELETE",
        role: STUDENT_ROLE
      });
      await loadDashboard(STUDENT_ROLE);
      setSelectedResumeId("");
      setMessage("Resume deleted");
    } catch (error) {
      setMessage(cleanError(error.message));
    } finally {
      setLoading(false);
    }
  }

  async function applyForDrive(driveId, applicationForm) {
    setLoading(true);
    setMessage("");
    try {
      await apiRequest(`/applications/apply/${driveId}`, {
        method: "POST",
        role: STUDENT_ROLE,
        body: {
          ...applicationForm,
          resumeId: applicationForm?.resumeId ? Number(applicationForm.resumeId) : null,
          cgpa: applicationForm?.cgpa === "" ? null : Number(applicationForm?.cgpa)
        }
      });
      await loadDashboard(STUDENT_ROLE);
      setMessage("Application submitted");
    } catch (error) {
      setMessage(cleanError(error.message));
    } finally {
      setLoading(false);
    }
  }

  function requestLogout(roleToClear = role) {
    setLogoutConfirmRole(roleToClear);
  }

  function logout(roleToClear = role) {
    clearSession(roleToClear);
    setToken(null);
    setUserId(null);
    setRole(null);
    setStudent(null);
    setCompanies([]);
    setDrives([]);
    setDriveCount(0);
    setAdminStudents([]);
    setApplications([]);
    setApplicationCount(0);
    setResumes([]);
    setSelectedResumeId("");
    setAuthView("login");
    setLogoutConfirmRole(null);
    replacePath("/");
  }

  if (token && role) {
    const requiredRole = getRoleFromPath(path);

    if (requiredRole && requiredRole !== role) {
      replacePath(getDashboardPath(role));
      return null;
    }

    if (!requiredRole) {
      replacePath(getDashboardPath(role));
      return null;
    }
  }

  if (!token) {
    const isRegisteringStudent = loginMode === "student" && authView === "register";

    return (
      <main className="login-shell">
        <section className="login-panel">
          <div>
            <p className="eyebrow">College Placement</p>
            <h1>
              {loginMode === "admin"
                ? "Admin Console"
                : isRegisteringStudent
                  ? "Student Registration"
                  : "Student Portal"}
            </h1>
          </div>

          <div className="segmented" role="tablist" aria-label="Login type">
            <button
              type="button"
              className={loginMode === "student" ? "active" : ""}
              onClick={() => {
                setLoginMode("student");
                setMessage("");
              }}
            >
              <GraduationCap size={17} />
              Student
            </button>
            <button
              type="button"
              className={loginMode === "admin" ? "active" : ""}
              onClick={() => {
                setLoginMode("admin");
                setAuthView("login");
                setMessage("");
              }}
            >
              <UserRound size={17} />
              Admin
            </button>
          </div>

          {isRegisteringStudent ? (
            <form onSubmit={registerStudent} className="login-form">
              <label>
                Full Name
                <input
                  value={registrationForm.name}
                  onChange={(event) => setRegistrationForm({ ...registrationForm, name: event.target.value })}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={registrationForm.email}
                  onChange={(event) => setRegistrationForm({ ...registrationForm, email: event.target.value })}
                  required
                />
              </label>
              <PasswordField
                label="Password"
                value={registrationForm.password}
                visible={showRegistrationPassword}
                onToggle={() => setShowRegistrationPassword((visible) => !visible)}
                onChange={(value) => setRegistrationForm({ ...registrationForm, password: value })}
              />
              <PasswordField
                label="Confirm Password"
                value={registrationForm.confirmPassword}
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((visible) => !visible)}
                onChange={(value) => setRegistrationForm({ ...registrationForm, confirmPassword: value })}
              />
              <label>
                Department
                <input
                  value={registrationForm.department}
                  onChange={(event) => setRegistrationForm({ ...registrationForm, department: event.target.value })}
                  required
                />
              </label>
              <label>
                CGPA
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.01"
                  value={registrationForm.cgpa}
                  onChange={(event) => setRegistrationForm({ ...registrationForm, cgpa: event.target.value })}
                  required
                />
              </label>
              <label>
                Passport Size Photo
                <span className="photo-upload-control">
                  <FileUp size={18} />
                  <span>{registrationForm.profilePhoto?.name || "Upload JPG or PNG photo"}</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(event) => {
                      if (!selectRegistrationPhoto(event.target.files[0])) {
                        event.target.value = "";
                      }
                    }}
                    required
                  />
                </span>
              </label>
              {registrationPhotoPreview && (
                <div className="photo-preview">
                  <ProfilePhoto src={registrationPhotoPreview} alt="Passport size photo preview" size="large" />
                </div>
              )}
              <button type="submit" disabled={loading}>
                <UserRound size={18} />
                Register
              </button>
              <button type="button" className="secondary-action" onClick={() => setAuthView("login")}>
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={login} className="login-form">
              <label>
                Email
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                  required
                />
              </label>
              <PasswordField
                label="Password"
                value={loginForm.password}
                visible={showLoginPassword}
                onToggle={() => setShowLoginPassword((visible) => !visible)}
                onChange={(value) => setLoginForm({ ...loginForm, password: value })}
              />
              <button type="submit" disabled={loading}>
                <UserRound size={18} />
                Sign in
              </button>
              {loginMode === "student" && (
                <button type="button" className="secondary-action" onClick={() => setAuthView("register")}>
                  Create student account
                </button>
              )}
            </form>
          )}
          {message && <p className="message">{message}</p>}
        </section>
      </main>
    );
  }

  if (role === ADMIN_ROLE) {
    const isStudentManagementPath = path === ADMIN_STUDENTS_PATH;

    return (
      <AdminRoute token={token} role={role}>
        <>
          {isStudentManagementPath ? (
            <StudentManagementPage
              deleteStudent={deleteStudent}
              loading={loading}
              logout={() => requestLogout(ADMIN_ROLE)}
              message={message}
              refresh={() => loadDashboard(ADMIN_ROLE)}
              setMessage={setMessage}
              students={adminStudents}
            />
          ) : (
            <AdminDashboard
              applications={applications}
              applicationCount={applicationCount}
              companies={companies}
              companyForm={companyForm}
              createCompany={createCompany}
              createDrive={createDrive}
              deleteCompany={deleteCompany}
              deleteDrive={deleteDrive}
              driveCount={driveCount}
              driveForm={driveForm}
              drives={drives}
              loading={loading}
              logout={() => requestLogout(ADMIN_ROLE)}
              message={message}
              refresh={() => loadDashboard(ADMIN_ROLE)}
              setCompanyForm={setCompanyForm}
              setDriveForm={setDriveForm}
              students={adminStudents}
              deleteApplication={deleteApplication}
              sendApplicationStatus={sendApplicationStatus}
            />
          )}
          {logoutConfirmRole && (
            <LogoutConfirmDialog
              onCancel={() => setLogoutConfirmRole(null)}
              onLogout={() => logout(logoutConfirmRole)}
            />
          )}
        </>
      </AdminRoute>
    );
  }

  if (role === STUDENT_ROLE) {
    return (
      <StudentRoute token={token} role={role}>
        <StudentDashboard
          activeResume={activeResume}
          applications={applications}
          applyForDrive={applyForDrive}
          drives={drives}
          loading={loading}
          logout={() => requestLogout(STUDENT_ROLE)}
          message={message}
          refresh={() => loadDashboard(STUDENT_ROLE)}
          resumes={resumes}
          selectedResumeId={selectedResumeId}
          setSelectedResumeId={setSelectedResumeId}
          student={student}
          deleteResume={deleteResume}
          uploadResume={uploadResume}
          importJobsFromRapidAPI={importJobsFromRapidAPI}
        />
        {logoutConfirmRole && (
          <LogoutConfirmDialog
            onCancel={() => setLogoutConfirmRole(null)}
            onLogout={() => logout(logoutConfirmRole)}
          />
        )}
      </StudentRoute>
    );
  }

  if (token) {
    replacePath("/");
    return null;
  }

  replacePath("/");
  return null;
}

function StudentRoute({ token, role, children }) {
  if (!token) return null;

  if (role !== STUDENT_ROLE) {
    replacePath(getDashboardPath(role));
    return null;
  }

  return children;
}

function AdminRoute({ token, role, children }) {
  if (!token) return null;

  if (role !== ADMIN_ROLE) {
    replacePath(getDashboardPath(role));
    return null;
  }

  return children;
}

function getDashboardPath(role) {
  return role === ADMIN_ROLE ? ADMIN_DASHBOARD_PATH : STUDENT_DASHBOARD_PATH;
}

function replacePath(nextPath) {
  if (window.location.pathname !== nextPath) {
    window.history.replaceState(null, "", nextPath);
    window.setTimeout(() => window.dispatchEvent(new Event("popstate")), 0);
  }
}

function pushPath(nextPath) {
  if (window.location.pathname !== nextPath) {
    window.history.pushState(null, "", nextPath);
    window.dispatchEvent(new Event("popstate"));
  }
}

function StudentDashboard({
  activeResume,
  applications,
  applyForDrive,
  drives,
  loading,
  logout,
  message,
  refresh,
  resumes,
  selectedResumeId,
  setSelectedResumeId,
  student,
  deleteResume,
  uploadResume,
  importJobsFromRapidAPI
}) {
  const [importQuery, setImportQuery] = useState("");
  const [importLocation, setImportLocation] = useState("");
  const [showApplications, setShowApplications] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [detailsDrive, setDetailsDrive] = useState(null);
  const [applicationForm, setApplicationForm] = useState(null);
  const [applicationErrors, setApplicationErrors] = useState([]);
  const [showResumeBuilder, setShowResumeBuilder] = useState(false);
  const [previewResume, setPreviewResume] = useState(null);

  function openApplicationModal(drive) {
    const resumeId = selectedResumeId || (resumes[0] ? String(resumes[0].id) : "");
    if (!resumeId) {
      setApplicationErrors(["Please upload or build your resume before applying."]);
      return;
    }
    setSelectedResumeId(resumeId);
    setApplicationErrors([]);
    setSelectedDrive(drive);
    setApplicationForm({
      studentName: student?.name || "",
      email: student?.email || "",
      department: student?.department || "",
      cgpa: student?.cgpa ?? "",
      skills: student?.skills || "",
      resumeId,
      phoneNumber: "",
      coverLetter: ""
    });
  }

  function closeApplicationModal() {
    setSelectedDrive(null);
    setApplicationForm(null);
    setApplicationErrors([]);
  }

  async function submitApplication(event) {
    event.preventDefault();
    const errors = validateApplicationForm(applicationForm, selectedDrive);
    setApplicationErrors(errors);
    if (errors.length) return;

    try {
      await applyForDrive(selectedDrive.id, applicationForm);
      closeApplicationModal();
    } catch (error) {
      setApplicationErrors(cleanError(error.message).split("\n").filter(Boolean));
    }
  }

  async function replaceResume(file) {
    try {
      const uploadedResume = await uploadResume(file);
      if (uploadedResume) {
        setApplicationForm((form) => ({ ...form, resumeId: String(uploadedResume.id) }));
      }
    } catch (error) {
      setApplicationErrors([cleanError(error.message)]);
    }
  }

  return (
    <main className="dashboard">
      <Topbar
        eyebrow="Student Dashboard"
        title={student?.name || "Placement Portal"}
        logout={logout}
        refresh={refresh}
      >
        <ProfilePhoto src={student?.profilePhotoUrl || student?.profilePhoto} alt={student?.name || "Student"} size="dashboard" />
      </Topbar>

      <section className="summary-grid">
        <Metric label="Student Name" value={student?.name || "-"} />
        <Metric label="CGPA" value={student?.cgpa ?? "-"} />
        <Metric label="Department" value={student?.department || "-"} />
        <Metric label="Applications" value={applications.length} onClick={() => setShowApplications(true)} clickable />
      </section>

      {showApplications && (
        <div className="modal-overlay" onClick={() => setShowApplications(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>My Applications ({applications.length})</h2>
              <button className="close-button" type="button" onClick={() => setShowApplications(false)} title="Close">
                <X size={20} />
              </button>
            </div>
            <ApplicationList applications={applications} />
          </div>
        </div>
      )}

      <section className="workspace">
        <ResumeManager
          activeResume={activeResume}
          loading={loading}
          onBuild={() => setShowResumeBuilder(true)}
          onDelete={deleteResume}
          onPreview={setPreviewResume}
          onUpload={uploadResume}
          resumes={resumes}
          selectedResumeId={selectedResumeId}
          setSelectedResumeId={setSelectedResumeId}
        />

        {message && <p className="message">{message}</p>}
        {applicationErrors.length > 0 && !selectedDrive && (
          <div className="validation-box">
            {applicationErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <div className="content-grid">
          <section>
            <SectionHeading icon={<ExternalLink size={20} />} title="External Jobs" />
            <form className="panel-form" onSubmit={(e) => { e.preventDefault(); importJobsFromRapidAPI(importQuery, importLocation); }}>
              <input
                placeholder="Job query (e.g., software engineer)"
                value={importQuery}
                onChange={(event) => setImportQuery(event.target.value)}
              />
              <input
                placeholder="Location (e.g., Bangalore)"
                value={importLocation}
                onChange={(event) => setImportLocation(event.target.value)}
              />
              <button type="submit" disabled={loading}>
                <Download size={17} />
                Search Jobs
              </button>
            </form>
            <div className="drive-list">
              {drives.filter(drive => drive.source === "RapidAPI").length === 0 && <EmptyState text="No external jobs found. Search above to find jobs." />}
              {drives.filter(drive => drive.source === "RapidAPI").map((drive) => (
                <ExternalJobCard key={drive.id} drive={drive}>
                  <button type="button" onClick={() => openApplicationModal(drive)} disabled={loading}>
                    <Send size={17} />
                    Apply
                  </button>
                </ExternalJobCard>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading icon={<BriefcaseBusiness size={20} />} title="Campus Drives" />
            <div className="drive-list">
              {drives.filter(drive => !drive.source || drive.source !== "RapidAPI").length === 0 && <EmptyState text="No campus drives available." />}
              {drives.filter(drive => !drive.source || drive.source !== "RapidAPI").map((drive) => (
                <DriveCard key={drive.id} drive={drive}>
                  <button type="button" onClick={() => setDetailsDrive(drive)}>
                    <Eye size={17} />
                    View Details
                  </button>
                </DriveCard>
              ))}
            </div>
          </section>
        </div>
      </section>

      {selectedDrive && applicationForm && (
        <DriveApplicationModal
          applicationDate={new Date()}
          drive={selectedDrive}
          errors={applicationErrors}
          form={applicationForm}
          loading={loading}
          onChange={setApplicationForm}
          onClose={closeApplicationModal}
          onReplaceResume={replaceResume}
          onSubmit={submitApplication}
          resumes={resumes}
        />
      )}

      {detailsDrive && (
        <JobDetailsModal
          applyLabel="Apply"
          drive={detailsDrive}
          loading={loading}
          onApply={() => {
            setDetailsDrive(null);
            openApplicationModal(detailsDrive);
          }}
          onClose={() => setDetailsDrive(null)}
        />
      )}

      {showResumeBuilder && (
        <ResumeBuilderModal
          loading={loading}
          onClose={() => setShowResumeBuilder(false)}
          onSaved={async (saved) => {
            await refresh();
            if (saved?.resumeId) {
              setSelectedResumeId(String(saved.resumeId));
            }
          }}
          student={student}
        />
      )}

      {previewResume && (
        <ResumePreviewModal
          onClose={() => setPreviewResume(null)}
          resume={previewResume}
        />
      )}
    </main>
  );
}

function ResumeManager({
  activeResume,
  loading,
  onBuild,
  onDelete,
  onPreview,
  onUpload,
  resumes,
  selectedResumeId,
  setSelectedResumeId
}) {
  const uploadedResumes = resumes.filter((resume) => resume.sourceType !== "BUILT");
  const builtResume = resumes.find((resume) => resume.sourceType === "BUILT");

  return (
    <section className="resume-manager">
      <div className="resume-manager-header">
        <SectionHeading icon={<FileText size={20} />} title="Resume" />
        <div className="resume-score-mini">
          <span>Current Resume</span>
          <strong>{activeResume?.fileName || "Not selected"}</strong>
        </div>
      </div>

      <div className="resume-options">
        <article className="resume-option-card">
          <div>
            <h3>Upload Existing Resume</h3>
            <p>Upload a PDF resume and use it for campus drive applications.</p>
          </div>
          <label className="file-button">
            <FileUp size={18} />
            <input type="file" accept=".pdf" onChange={onUpload} />
            {uploadedResumes.length ? "Replace Resume" : "Upload Resume"}
          </label>
        </article>

        <article className="resume-option-card">
          <div>
            <h3>Build Resume</h3>
            <p>Create an ATS-friendly resume inside the student portal.</p>
          </div>
          <button type="button" onClick={onBuild} disabled={loading}>
            <Pencil size={18} />
            {builtResume ? "Edit Built Resume" : "Build Resume"}
          </button>
        </article>
      </div>

      <div className="resume-current-card">
        <div className="form-row">
          <label>
            Select Resume
            <select value={selectedResumeId} onChange={(event) => setSelectedResumeId(event.target.value)}>
              <option value="">No resume selected</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.fileName} {resume.sourceType === "BUILT" ? "(Built)" : "(Uploaded)"}
                </option>
              ))}
            </select>
          </label>
          <div className="resume-file-size">
            <span>File Size</span>
            <strong>{activeResume ? `${Math.round((activeResume.fileSize || 0) / 1024)} KB` : "-"}</strong>
          </div>
        </div>

        {activeResume ? (
          <div className="card-actions">
            {activeResume.sourceType === "BUILT" && (
              <button type="button" className="secondary-button" onClick={async () => onPreview(await fetchBuiltResume(activeResume.id))}>
                <Eye size={17} />
                Preview Resume
              </button>
            )}
            <button type="button" className="resume-button" onClick={() => downloadResume(activeResume.id, activeResume.fileName)}>
              <Download size={17} />
              Download
            </button>
            <button type="button" className="danger-button" onClick={() => onDelete(activeResume.id)} disabled={loading}>
              <Trash2 size={17} />
              Delete Resume
            </button>
          </div>
        ) : (
          <p className="muted-text">Please upload or build your resume before applying.</p>
        )}
      </div>
    </section>
  );
}

const resumeSteps = [
  "Personal Info",
  "Education",
  "Skills",
  "Projects",
  "Experience",
  "Certifications",
  "Achievements",
  "Languages",
  "Hobbies",
  "Declaration",
  "Preview"
];

function ResumeBuilderModal({ loading, onClose, onSaved, student }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultBuiltResume(student));
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadBuilder() {
      try {
        const data = await apiRequest("/resumes/builder/me", { role: STUDENT_ROLE });
        if (!ignore) setForm(normalizeBuiltResume(data, student));
      } catch (error) {
        if (!ignore) setErrors([cleanError(error.message)]);
      }
    }
    loadBuilder();
    return () => {
      ignore = true;
    };
  }, [student]);

  const score = calculateResumeScore(form);

  function updateField(field, value) {
    setForm({ ...form, [field]: value });
  }

  async function saveResume(event) {
    event.preventDefault();
    const validation = validateBuiltResume(form);
    setErrors(validation);
    if (validation.length) return;

    setSaving(true);
    try {
      const saved = await apiRequest("/resumes/builder", {
        method: "POST",
        role: STUDENT_ROLE,
        body: sanitizeBuiltResumePayload(form)
      });
      await onSaved(saved);
      onClose();
    } catch (error) {
      setErrors([cleanError(error.message)]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content resume-builder-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Resume Builder</h2>
            <p className="muted-text">Resume Completion {score}%</p>
          </div>
          <button className="close-button" type="button" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <form className="resume-builder-body" onSubmit={saveResume}>
          <div className="resume-progress">
            {resumeSteps.map((label, index) => (
              <button
                key={label}
                type="button"
                className={index === step ? "active" : index < step ? "complete" : ""}
                onClick={() => setStep(index)}
              >
                {label}{index < step ? " ✓" : ""}
              </button>
            ))}
          </div>

          {errors.length > 0 && (
            <div className="validation-box">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}

          <ResumeStepContent form={form} step={step} updateField={updateField} setForm={setForm} />

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              Back
            </button>
            {step < resumeSteps.length - 1 ? (
              <button type="button" onClick={() => setStep(Math.min(resumeSteps.length - 1, step + 1))}>
                Next
              </button>
            ) : (
              <button type="submit" disabled={loading || saving}>
                <Save size={17} />
                Save Resume
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function ResumeStepContent({ form, step, updateField, setForm }) {
  if (step === 0) {
    return (
      <div className="resume-step-grid">
        <label>Full Name<input value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} required /></label>
        <label>Email<input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required /></label>
        <label>Phone Number<input value={form.phoneNumber} onChange={(e) => updateField("phoneNumber", e.target.value)} required /></label>
        <label>Address<input value={form.address} onChange={(e) => updateField("address", e.target.value)} /></label>
        <label>LinkedIn URL<input value={form.linkedInUrl} onChange={(e) => updateField("linkedInUrl", e.target.value)} /></label>
        <label>GitHub URL<input value={form.githubUrl} onChange={(e) => updateField("githubUrl", e.target.value)} /></label>
        <label>Portfolio URL<input value={form.portfolioUrl} onChange={(e) => updateField("portfolioUrl", e.target.value)} /></label>
        <label className="full-width">Career Objective / Professional Summary<textarea rows={4} value={form.summary} onChange={(e) => updateField("summary", e.target.value)} /></label>
      </div>
    );
  }

  if (step === 1) {
    return <EducationEditor items={form.education} setItems={(education) => setForm({ ...form, education })} />;
  }
  if (step === 2) {
    return <SimpleListEditor title="Technical Skills" placeholder="Java" items={form.skills} field="name" setItems={(skills) => setForm({ ...form, skills })} />;
  }
  if (step === 3) {
    return <ProjectEditor items={form.projects} setItems={(projects) => setForm({ ...form, projects })} />;
  }
  if (step === 4) {
    return <ExperienceEditor items={form.experience} setItems={(experience) => setForm({ ...form, experience })} />;
  }
  if (step === 5) {
    return <SimpleListEditor title="Certifications" placeholder="Oracle Java" items={form.certifications} field="name" setItems={(certifications) => setForm({ ...form, certifications })} />;
  }
  if (step === 6) {
    return <SimpleListEditor title="Achievements" placeholder="Won coding competition" items={form.achievements} field="description" setItems={(achievements) => setForm({ ...form, achievements })} />;
  }
  if (step === 7) {
    return <SimpleListEditor title="Languages" placeholder="English" items={form.languages} field="name" setItems={(languages) => setForm({ ...form, languages })} />;
  }
  if (step === 8) {
    return <label className="full-width">Hobbies<textarea rows={4} value={form.hobbies} onChange={(e) => updateField("hobbies", e.target.value)} /></label>;
  }
  if (step === 9) {
    return (
      <label className="declaration-check">
        <input type="checkbox" checked={form.declarationAccepted} onChange={(e) => updateField("declarationAccepted", e.target.checked)} />
        I hereby declare that the above information is true.
      </label>
    );
  }
  return <ResumePreview resume={form} />;
}

function EducationEditor({ items, setItems }) {
  return (
    <RepeatingEditor
      addLabel="Add Education"
      emptyItem={{ collegeName: "", degree: "", department: "", university: "", cgpa: "", graduationYear: "" }}
      items={items}
      setItems={setItems}
      render={(item, update) => (
        <div className="resume-step-grid">
          <label>College Name<input value={item.collegeName || ""} onChange={(e) => update("collegeName", e.target.value)} /></label>
          <label>Degree<input value={item.degree || ""} onChange={(e) => update("degree", e.target.value)} /></label>
          <label>Department<input value={item.department || ""} onChange={(e) => update("department", e.target.value)} /></label>
          <label>University<input value={item.university || ""} onChange={(e) => update("university", e.target.value)} /></label>
          <label>CGPA<input type="number" min="0" max="10" step="0.01" value={item.cgpa ?? ""} onChange={(e) => update("cgpa", e.target.value)} /></label>
          <label>Graduation Year<input value={item.graduationYear || ""} onChange={(e) => update("graduationYear", e.target.value)} /></label>
        </div>
      )}
    />
  );
}

function ProjectEditor({ items, setItems }) {
  return (
    <RepeatingEditor
      addLabel="Add Project"
      emptyItem={{ projectName: "", description: "", technologiesUsed: "", githubLink: "", role: "", duration: "" }}
      items={items}
      setItems={setItems}
      render={(item, update) => (
        <div className="resume-step-grid">
          <label>Project Name<input value={item.projectName || ""} onChange={(e) => update("projectName", e.target.value)} /></label>
          <label>Technologies Used<input value={item.technologiesUsed || ""} onChange={(e) => update("technologiesUsed", e.target.value)} /></label>
          <label>GitHub Link<input value={item.githubLink || ""} onChange={(e) => update("githubLink", e.target.value)} /></label>
          <label>Role<input value={item.role || ""} onChange={(e) => update("role", e.target.value)} /></label>
          <label>Duration<input value={item.duration || ""} onChange={(e) => update("duration", e.target.value)} /></label>
          <label className="full-width">Description<textarea rows={3} value={item.description || ""} onChange={(e) => update("description", e.target.value)} /></label>
        </div>
      )}
    />
  );
}

function ExperienceEditor({ items, setItems }) {
  return (
    <RepeatingEditor
      addLabel="Add Experience"
      emptyItem={{ company: "", role: "", duration: "", description: "" }}
      items={items}
      setItems={setItems}
      render={(item, update) => (
        <div className="resume-step-grid">
          <label>Company<input value={item.company || ""} onChange={(e) => update("company", e.target.value)} /></label>
          <label>Role<input value={item.role || ""} onChange={(e) => update("role", e.target.value)} /></label>
          <label>Duration<input value={item.duration || ""} onChange={(e) => update("duration", e.target.value)} /></label>
          <label className="full-width">Description<textarea rows={3} value={item.description || ""} onChange={(e) => update("description", e.target.value)} /></label>
        </div>
      )}
    />
  );
}

function SimpleListEditor({ title, placeholder, items, field, setItems }) {
  return (
    <section className="simple-list-editor">
      <h3>{title}</h3>
      <RepeatingEditor
        addLabel={`Add ${title.replace(/s$/, "")}`}
        emptyItem={{ [field]: "" }}
        items={items}
        setItems={setItems}
        render={(item, update) => (
          <input placeholder={placeholder} value={item[field] || ""} onChange={(e) => update(field, e.target.value)} />
        )}
      />
    </section>
  );
}

function RepeatingEditor({ addLabel, emptyItem, items = [], render, setItems }) {
  const safeItems = items.length ? items : [emptyItem];

  function updateItem(index, field, value) {
    setItems(safeItems.map((item, currentIndex) => currentIndex === index ? { ...item, [field]: value } : item));
  }

  function removeItem(index) {
    const next = safeItems.filter((_, currentIndex) => currentIndex !== index);
    setItems(next.length ? next : [emptyItem]);
  }

  return (
    <div className="repeating-editor">
      {safeItems.map((item, index) => (
        <article className="repeat-card" key={index}>
          {render(item, (field, value) => updateItem(index, field, value))}
          <button type="button" className="secondary-button" onClick={() => removeItem(index)}>
            <Trash2 size={16} />
            Remove
          </button>
        </article>
      ))}
      <button type="button" className="secondary-button" onClick={() => setItems([...safeItems, emptyItem])}>
        <Plus size={17} />
        {addLabel}
      </button>
    </div>
  );
}

function ResumePreviewModal({ onClose, resume }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content resume-preview-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Resume Preview</h2>
          <button className="close-button" type="button" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>
        <div className="resume-preview-scroll">
          <ResumePreview resume={resume} />
        </div>
      </div>
    </div>
  );
}

function ResumePreview({ resume }) {
  const education = (resume.education || []).filter(hasEducation);
  const skills = (resume.skills || []).map((item) => item.name).filter(Boolean);
  const projects = (resume.projects || []).filter((item) => item.projectName);
  const experience = (resume.experience || []).filter((item) => item.company || item.role);
  const certifications = (resume.certifications || []).map((item) => item.name).filter(Boolean);
  const achievements = (resume.achievements || []).map((item) => item.description).filter(Boolean);
  const languages = (resume.languages || []).map((item) => item.name).filter(Boolean);

  return (
    <article className="resume-preview">
      <header>
        <h1>{resume.fullName || "Student Name"}</h1>
        <p>{[resume.email, resume.phoneNumber, resume.address, resume.linkedInUrl, resume.githubUrl, resume.portfolioUrl].filter(Boolean).join(" | ")}</p>
      </header>
      <PreviewSection title="Summary" show={resume.summary}><p>{resume.summary}</p></PreviewSection>
      <PreviewSection title="Education" show={education.length}>
        {education.map((item, index) => (
          <div key={index}>
            <strong>{[item.degree, item.department].filter(Boolean).join(" - ")}</strong>
            <p>{[item.collegeName, item.university, item.graduationYear, item.cgpa ? `CGPA: ${item.cgpa}` : ""].filter(Boolean).join(" | ")}</p>
          </div>
        ))}
      </PreviewSection>
      <PreviewSection title="Skills" show={skills.length}><p>{skills.join(", ")}</p></PreviewSection>
      <PreviewSection title="Projects" show={projects.length}>
        {projects.map((project, index) => (
          <div key={index}>
            <strong>{project.projectName}</strong>
            <p>{project.description}</p>
            <p>{[project.technologiesUsed, project.role, project.duration, project.githubLink].filter(Boolean).join(" | ")}</p>
          </div>
        ))}
      </PreviewSection>
      <PreviewSection title="Experience" show={experience.length}>
        {experience.map((item, index) => (
          <div key={index}>
            <strong>{[item.company, item.role, item.duration].filter(Boolean).join(" - ")}</strong>
            <p>{item.description}</p>
          </div>
        ))}
      </PreviewSection>
      <PreviewSection title="Certifications" show={certifications.length}><ul>{certifications.map((item) => <li key={item}>{item}</li>)}</ul></PreviewSection>
      <PreviewSection title="Achievements" show={achievements.length}><ul>{achievements.map((item) => <li key={item}>{item}</li>)}</ul></PreviewSection>
      <PreviewSection title="Languages" show={languages.length}><p>{languages.join(", ")}</p></PreviewSection>
      <PreviewSection title="Hobbies" show={resume.hobbies}><p>{resume.hobbies}</p></PreviewSection>
    </article>
  );
}

function PreviewSection({ children, show, title }) {
  if (!show) return null;
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function AdminDashboard({
  applications,
  applicationCount,
  companies,
  companyForm,
  createCompany,
  createDrive,
  deleteCompany,
  deleteDrive,
  driveCount,
  driveForm,
  drives,
  loading,
  logout,
  message,
  refresh,
  setCompanyForm,
  setDriveForm,
  students,
  deleteApplication,
  sendApplicationStatus
}) {
  const [showApplications, setShowApplications] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedDriveInfo, setSelectedDriveInfo] = useState(null);

  function requestCompanyDelete(company) {
    setConfirmAction({
      message: "Are you sure you want to delete this company?",
      onDelete: () => deleteCompany(company.id)
    });
  }

  function requestDriveDelete(drive) {
    setConfirmAction({
      message: "Delete this drive?",
      onDelete: () => deleteDrive(drive.id)
    });
  }

  async function confirmDelete() {
    if (!confirmAction) return;
    const action = confirmAction.onDelete;
    setConfirmAction(null);
    await action();
  }

  return (
    <main className="dashboard admin-dashboard">
      <Topbar eyebrow="Admin Console" title="Placement Management" logout={logout} refresh={refresh} />

      <section className="summary-grid">
        <Metric label="Students" value={students.length} onClick={() => pushPath(ADMIN_STUDENTS_PATH)} clickable />
        <Metric label="Companies" value={companies.length} />
        <Metric label="Drives" value={driveCount} />
        <Metric label="Applications" value={applicationCount} onClick={() => setShowApplications(true)} clickable />
      </section>

      {showApplications && (
        <ApplicationModal
          applications={applications}
          deleteApplication={deleteApplication}
          onClose={() => setShowApplications(false)}
          sendApplicationStatus={sendApplicationStatus}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.message}
          loading={loading}
          onCancel={() => setConfirmAction(null)}
          onDelete={confirmDelete}
        />
      )}

      {selectedDriveInfo && (
        <DriveInfoModal
          applications={applications.filter((application) => application.driveId === selectedDriveInfo.id)}
          deleteApplication={deleteApplication}
          drive={selectedDriveInfo}
          onClose={() => setSelectedDriveInfo(null)}
          sendApplicationStatus={sendApplicationStatus}
        />
      )}

      {message && <p className="message">{message}</p>}

      <section className="admin-grid">
        <form className="panel-form" onSubmit={createCompany}>
          <SectionHeading icon={<Building2 size={20} />} title="Add Company" />
          <input
            placeholder="Company name"
            value={companyForm.companyName}
            onChange={(event) => setCompanyForm({ ...companyForm, companyName: event.target.value })}
            required
          />
          <input
            placeholder="Required CGPA"
            type="number"
            min="0"
            max="10"
            step="0.01"
            value={companyForm.requiredCgpa}
            onChange={(event) => setCompanyForm({ ...companyForm, requiredCgpa: event.target.value })}
            required
          />
          <input
            placeholder="Required skills"
            value={companyForm.requiredSkills}
            onChange={(event) => setCompanyForm({ ...companyForm, requiredSkills: event.target.value })}
          />
          <input
            placeholder="Package amount"
            type="number"
            min="0"
            step="0.01"
            value={companyForm.packageAmount}
            onChange={(event) => setCompanyForm({ ...companyForm, packageAmount: event.target.value })}
            required
          />
          <button type="submit" disabled={loading}>
            <Plus size={17} />
            Add Company
          </button>
        </form>

        <form className="panel-form" onSubmit={createDrive}>
          <SectionHeading icon={<BriefcaseBusiness size={20} />} title="Create Drive" />
          <select
            value={driveForm.companyId}
            onChange={(event) => setDriveForm({ ...driveForm, companyId: event.target.value })}
            required
          >
            <option value="">Select company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.companyName}
              </option>
            ))}
          </select>
          <input
            placeholder="Drive title"
            value={driveForm.title}
            onChange={(event) => setDriveForm({ ...driveForm, title: event.target.value })}
            required
          />
          <input
            placeholder="Job role"
            value={driveForm.jobRole}
            onChange={(event) => setDriveForm({ ...driveForm, jobRole: event.target.value })}
            required
          />
          <textarea
            placeholder="Job description"
            value={driveForm.description}
            onChange={(event) => setDriveForm({ ...driveForm, description: event.target.value })}
            rows={4}
          />
          <textarea
            placeholder="Responsibilities"
            value={driveForm.responsibilities}
            onChange={(event) => setDriveForm({ ...driveForm, responsibilities: event.target.value })}
            rows={3}
          />
          <textarea
            placeholder="Qualifications"
            value={driveForm.qualifications}
            onChange={(event) => setDriveForm({ ...driveForm, qualifications: event.target.value })}
            rows={3}
          />
          <textarea
            placeholder="Benefits"
            value={driveForm.benefits}
            onChange={(event) => setDriveForm({ ...driveForm, benefits: event.target.value })}
            rows={3}
          />
          <div className="form-row">
            <select
              value={driveForm.employmentType}
              onChange={(event) => setDriveForm({ ...driveForm, employmentType: event.target.value })}
            >
              <option value="">Employment type</option>
              <option value="Full Time">Full Time</option>
              <option value="Internship">Internship</option>
              <option value="Part Time">Part Time</option>
            </select>
            <select
              value={driveForm.workMode}
              onChange={(event) => setDriveForm({ ...driveForm, workMode: event.target.value })}
            >
              <option value="">Work mode</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
          <div className="form-row">
            <input
              placeholder="Experience required"
              value={driveForm.experienceRequired}
              onChange={(event) => setDriveForm({ ...driveForm, experienceRequired: event.target.value })}
            />
            <input
              placeholder="Job location"
              value={driveForm.jobLocation}
              onChange={(event) => setDriveForm({ ...driveForm, jobLocation: event.target.value })}
            />
          </div>
          <div className="form-row">
            <input
              placeholder="Number of openings"
              type="number"
              min="0"
              step="1"
              value={driveForm.numberOfOpenings}
              onChange={(event) => setDriveForm({ ...driveForm, numberOfOpenings: event.target.value })}
            />
            <input
              placeholder="Package"
              type="number"
              min="0"
              step="0.01"
              value={driveForm.packageAmount}
              onChange={(event) => setDriveForm({ ...driveForm, packageAmount: event.target.value })}
            />
          </div>
          <input
            placeholder="Required CGPA"
            type="number"
            min="0"
            max="10"
            step="0.01"
            value={driveForm.requiredCgpa}
            onChange={(event) => setDriveForm({ ...driveForm, requiredCgpa: event.target.value })}
          />
          <input
            placeholder="Required skills"
            value={driveForm.requiredSkills}
            onChange={(event) => setDriveForm({ ...driveForm, requiredSkills: event.target.value })}
          />
          <textarea
            placeholder="Selection process"
            value={driveForm.selectionProcess}
            onChange={(event) => setDriveForm({ ...driveForm, selectionProcess: event.target.value })}
            rows={3}
          />
          <textarea
            placeholder="Bond details (optional)"
            value={driveForm.bondDetails}
            onChange={(event) => setDriveForm({ ...driveForm, bondDetails: event.target.value })}
            rows={2}
          />
          <div className="form-row">
            <input
              type="date"
              value={driveForm.driveDate}
              onChange={(event) => setDriveForm({ ...driveForm, driveDate: event.target.value })}
            />
            <input
              type="date"
              value={driveForm.applicationDeadline}
              onChange={(event) => setDriveForm({ ...driveForm, applicationDeadline: event.target.value })}
            />
          </div>
          <button type="submit" disabled={loading}>
            <Plus size={17} />
            Create Drive
          </button>
        </form>
      </section>

      <section className="content-grid admin-content">
        <div>
          <SectionHeading icon={<Building2 size={20} />} title="Companies" />
          <div className="drive-list">
            {companies.length === 0 && <EmptyState text="No companies added yet." />}
            {companies.map((company) => (
              <article className="drive-card" key={company.id}>
                <div>
                  <h3>{company.companyName}</h3>
                  <p>{company.packageAmount ? `${company.packageAmount} LPA` : "Package not set"}</p>
                </div>
                <dl>
                  <div>
                    <dt>CGPA</dt>
                    <dd>{company.requiredCgpa ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>Skills</dt>
                    <dd>{company.requiredSkills || "-"}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => requestCompanyDelete(company)}
                  disabled={loading}
                  title="Delete company"
                >
                  <Trash2 size={17} />
                  Delete
                </button>
              </article>
            ))}
          </div>
        </div>

        <div>
          <SectionHeading icon={<BriefcaseBusiness size={20} />} title="Drives" />
          <div className="drive-list">
            {drives.filter(drive => !drive.source || drive.source !== "RapidAPI").length === 0 && <EmptyState text="No placement drives created yet." />}
            {drives.filter(drive => !drive.source || drive.source !== "RapidAPI").map((drive) => (
              <DriveCard key={drive.id} drive={drive}>
                <div className="card-actions">
                  <button
                    type="button"
                    className="open-drive-button"
                    onClick={() => setSelectedDriveInfo(drive)}
                  >
                    <Eye size={17} />
                    OPEN
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => requestDriveDelete(drive)}
                    disabled={loading}
                    title="Delete drive"
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>
                </div>
              </DriveCard>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}

function StudentManagementPage({ deleteStudent, loading, logout, message, refresh, setMessage, students }) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [studentApplications, setStudentApplications] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return students;

    return students.filter((student) =>
      [student.name, student.email].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [searchTerm, students]);

  function requestStudentDelete(student) {
    setConfirmAction({
      message: "Are you sure you want to delete this student?",
      onDelete: () => deleteStudent(student.id)
    });
  }

  async function viewStudentDetails(student) {
    setStudentDetailsLoading(true);
    setMessage("");
    try {
      const [details, applications] = await Promise.all([
        apiRequest(`/api/admin/students/${student.id}`, { role: ADMIN_ROLE }),
        apiRequest(`/api/admin/students/${student.id}/applications`, { role: ADMIN_ROLE })
      ]);
      setSelectedStudent(details);
      setStudentApplications(applications);
    } catch (error) {
      setMessage(cleanError(error.message));
    } finally {
      setStudentDetailsLoading(false);
    }
  }

  async function confirmDelete() {
    if (!confirmAction) return;
    const action = confirmAction.onDelete;
    setConfirmAction(null);
    await action();
    setSelectedStudent(null);
    setStudentApplications([]);
  }

  return (
    <main className="dashboard admin-dashboard">
      <Topbar eyebrow="Admin Console" title="Student Management" logout={logout} refresh={refresh} />

      <section className="student-management-toolbar">
        <button type="button" className="secondary-button" onClick={() => pushPath(ADMIN_DASHBOARD_PATH)}>
          Back to Dashboard
        </button>
        <div className="student-total-card">
          <span>Total Students</span>
          <strong>{students.length}</strong>
        </div>
        <label className="student-search">
          Search by Name or Email
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Enter name or email"
          />
        </label>
      </section>

      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.message}
          loading={loading}
          onCancel={() => setConfirmAction(null)}
          onDelete={confirmDelete}
        />
      )}

      {(selectedStudent || studentDetailsLoading) && (
        <StudentDetailsModal
          applications={studentApplications}
          applicationsLoading={studentDetailsLoading}
          loading={studentDetailsLoading}
          onClose={() => {
            setSelectedStudent(null);
            setStudentApplications([]);
          }}
          onDownloadResume={downloadResume}
          onViewResume={viewResume}
          student={selectedStudent}
        />
      )}

      {message && <p className="message">{message}</p>}

      <section>
        <SectionHeading icon={<GraduationCap size={20} />} title="Registered Students" />
        <StudentList
          loading={loading || studentDetailsLoading}
          onDelete={requestStudentDelete}
          onViewDetails={viewStudentDetails}
          students={filteredStudents}
        />
      </section>
    </main>
  );
}

function Topbar({ children, eyebrow, title, logout, refresh }) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        {children}
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="topbar-actions">
        <button className="icon-button" type="button" onClick={refresh} title="Refresh">
          <RefreshCw size={20} />
        </button>
        <button className="icon-button" type="button" onClick={logout} title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}

function Metric({ label, value, onClick, clickable }) {
  return (
    <div className={`metric ${clickable ? 'clickable' : ''}`} onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PasswordField({ label, value, visible, onToggle, onChange }) {
  return (
    <label>
      {label}
      <span className="password-field">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
        />
        <button type="button" onClick={onToggle} aria-label={visible ? `Hide ${label}` : `Show ${label}`}>
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          {visible ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}

function SectionHeading({ icon, title }) {
  return (
    <div className="section-heading">
      {icon}
      <h2>{title}</h2>
    </div>
  );
}

function DriveCard({ drive, children }) {
  return (
    <article className="drive-card">
      <div>
        <h3>{drive.title || drive.jobRole}</h3>
        <p>{drive.companyName || (drive.jobRole || "Role not set")}</p>
        {drive.source && <span className="source-badge">{drive.source}</span>}
      </div>
      <dl>
        <div>
          <dt>Package</dt>
          <dd>{drive.packageAmount != null ? `${drive.packageAmount} LPA` : drive.salary || "-"}</dd>
        </div>
        <div>
          <dt>CGPA</dt>
          <dd>{drive.requiredCgpa ?? "-"}</dd>
        </div>
        <div>
          <dt>Skills</dt>
          <dd>{drive.requiredSkills || "-"}</dd>
        </div>
        <div>
          <dt>Deadline</dt>
          <dd>{drive.applicationDeadline || "-"}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{drive.jobLocation || drive.location || "-"}</dd>
        </div>
      </dl>
      {drive.jobUrl && (
        <a href={drive.jobUrl} target="_blank" rel="noopener noreferrer" className="external-link">
          <ExternalLink size={14} />
          View Job
        </a>
      )}
      {children}
    </article>
  );
}

function ExternalJobCard({ drive, children }) {
  const description = drive.description || "";
  const hasLongDescription = description.length > 250;
  const displayDescription = hasLongDescription ? description.substring(0, 250) : description;
  const requirements = parseExternalRequirements(drive.requiredSkills);

  return (
    <article className="drive-card external-job-card">
      <div className="job-header">
        <h3>{drive.title || "Job title not specified"}</h3>
        <p className="company-name">{drive.companyName || "Company not specified"}</p>
        <div className="job-meta">
          <span>{drive.location || "Location not specified"}</span>
          <span aria-hidden="true">|</span>
          <span>{drive.jobRole || "Employment type not specified"}</span>
          {drive.salary && (
            <>
              <span aria-hidden="true">|</span>
              <span className="salary">{drive.salary}</span>
            </>
          )}
        </div>
      </div>

      <div className="job-details">
        <div className="job-description">
          <h4>Description:</h4>
          <p>
            {description ? displayDescription : "Description not available."}
            {hasLongDescription && drive.jobUrl && (
              <a href={drive.jobUrl} target="_blank" rel="noopener noreferrer" className="text-button">
                ...Read More
              </a>
            )}
            {hasLongDescription && !drive.jobUrl && <span className="text-button">...Read More</span>}
          </p>
        </div>

        <div className="job-requirements">
          <h4>Requirements:</h4>
          {requirements.length > 0 ? (
            <ul>
              {requirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          ) : (
            <p>Requirements not specified.</p>
          )}
        </div>
      </div>

      <div className="card-actions">
        {drive.jobUrl && (
          <a href={drive.jobUrl} target="_blank" rel="noopener noreferrer" className="external-link">
            <ExternalLink size={14} />
            View Job
          </a>
        )}
        {children}
      </div>
    </article>
  );
}

function JobDetailsModal({ applyLabel = "Apply", drive, loading, onApply, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content job-details-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header job-details-header">
          <div>
            <span className="eyebrow">Campus Drive</span>
            <h2>{drive.title || drive.jobRole || "Job Details"}</h2>
            <p>{drive.companyName || "Company not specified"}</p>
          </div>
          <button className="close-button" type="button" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="job-details-body">
          <DriveBasicInfo drive={drive} />
          <DriveTextSection title="About the Job" text={drive.description} />
          <DriveListSection icon={<ListChecks size={18} />} title="Responsibilities" text={drive.responsibilities} />
          <DriveListSection icon={<GraduationCap size={18} />} title="Qualifications" text={drive.qualifications} />
          <DriveListSection icon={<CheckCircle2 size={18} />} title="Benefits" text={drive.benefits} />
          <DriveListSection icon={<ShieldCheck size={18} />} ordered title="Selection Process" text={drive.selectionProcess} />
          {hasText(drive.bondDetails) && <DriveTextSection title="Bond Details" text={drive.bondDetails} />}
        </div>

        <div className="job-details-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>
            Close
          </button>
          <button type="button" onClick={onApply} disabled={loading}>
            <Send size={17} />
            {applyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DriveInfoModal({ applications, deleteApplication, drive, onClose, sendApplicationStatus }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content drive-info-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header job-details-header">
          <div>
            <span className="eyebrow">Drive Information</span>
            <h2>{drive.title || drive.jobRole || "Drive Details"}</h2>
            <p>{drive.companyName || "Company not specified"}</p>
          </div>
          <button className="close-button" type="button" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="job-details-body">
          <DriveBasicInfo drive={drive} />
          <DriveTextSection title="Job Description" text={drive.description} />
          <DriveListSection icon={<ListChecks size={18} />} title="Responsibilities" text={drive.responsibilities} />
          <DriveListSection icon={<GraduationCap size={18} />} title="Qualifications" text={drive.qualifications} />
          <DriveListSection icon={<CheckCircle2 size={18} />} title="Benefits" text={drive.benefits} />
          <DriveListSection icon={<ShieldCheck size={18} />} ordered title="Selection Process" text={drive.selectionProcess} />
          {hasText(drive.bondDetails) && <DriveTextSection title="Bond Details" text={drive.bondDetails} />}

          <section className="job-detail-section applicants-section">
            <div className="job-section-title">
              <UserRound size={18} />
              <h3>Applicants ({applications.length})</h3>
            </div>
            <ApplicationModalContent
              applications={applications}
              deleteApplication={deleteApplication}
              sendApplicationStatus={sendApplicationStatus}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function DriveBasicInfo({ drive }) {
  const packageValue = drive.packageAmount != null && drive.packageAmount !== ""
    ? `${drive.packageAmount} LPA`
    : drive.salary || "-";

  return (
    <section className="job-detail-section">
      <div className="job-section-title">
        <BriefcaseBusiness size={18} />
        <h3>Basic Information</h3>
      </div>
      <div className="job-info-grid">
        <InfoTile icon={<BriefcaseBusiness size={18} />} label="Job Title" value={drive.title || drive.jobRole || "-"} />
        <InfoTile icon={<Building2 size={18} />} label="Company Name" value={drive.companyName || "-"} />
        <InfoTile icon={<CircleDollarSign size={18} />} label="Package" value={packageValue} />
        <InfoTile icon={<MapPin size={18} />} label="Job Location" value={drive.jobLocation || drive.location || "-"} />
        <InfoTile label="Employment Type" value={drive.employmentType || drive.jobRole || "-"} />
        <InfoTile label="Work Mode" value={drive.workMode || "-"} />
        <InfoTile label="Experience Required" value={drive.experienceRequired || "-"} />
        <InfoTile label="Number of Openings" value={drive.numberOfOpenings ?? "-"} />
        <InfoTile label="Required CGPA" value={drive.requiredCgpa ?? "-"} />
        <InfoTile label="Required Skills" value={drive.requiredSkills || "-"} />
        <InfoTile label="Application Deadline" value={drive.applicationDeadline || "-"} />
      </div>
    </section>
  );
}

function InfoTile({ icon, label, value }) {
  return (
    <div className="info-tile">
      {icon && <span>{icon}</span>}
      <div>
        <span className="info-label">{label}</span>
        <span className="info-value">{value}</span>
      </div>
    </div>
  );
}

function DriveTextSection({ title, text }) {
  return (
    <section className="job-detail-section">
      <h3>{title}</h3>
      <p className="job-detail-text">{hasText(text) ? text : "Not specified."}</p>
    </section>
  );
}

function DriveListSection({ icon, ordered = false, title, text }) {
  const items = splitDetailItems(text);
  const ListTag = ordered ? "ol" : "ul";

  return (
    <section className="job-detail-section">
      <div className="job-section-title">
        {icon}
        <h3>{title}</h3>
      </div>
      {items.length > 0 ? (
        <ListTag className="job-detail-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ListTag>
      ) : (
        <p className="job-detail-text">Not specified.</p>
      )}
    </section>
  );
}

function parseExternalRequirements(value) {
  if (!value || value === "Requirements not specified.") {
    return [];
  }

  const separator = value.includes("\n") ? /\r?\n/ : ",";
  return value
    .split(separator)
    .map((requirement) => requirement.trim())
    .filter(Boolean);
}

function splitDetailItems(value) {
  if (!hasText(value)) return [];

  const separator = value.includes("\n") ? /\r?\n/ : /[;,]/;
  return value
    .split(separator)
    .map((item) => item.replace(/^[-*0-9.)\s]+/, "").trim())
    .filter(Boolean);
}

function hasText(value) {
  return value != null && String(value).trim() !== "";
}

function DriveApplicationModal({
  applicationDate,
  drive,
  errors,
  form,
  loading,
  onChange,
  onClose,
  onReplaceResume,
  onSubmit,
  resumes
}) {
  const selectedResume = resumes.find((resume) => String(resume.id) === String(form.resumeId));

  function updateField(field, value) {
    onChange({ ...form, [field]: value });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content application-form-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Campus Drive Application</h2>
          <button className="close-button" type="button" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        <form className="application-form" onSubmit={onSubmit}>
          {errors.length > 0 && (
            <div className="validation-box">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}

          <div className="form-row">
            <label>
              Student Name
              <input value={form.studentName} onChange={(event) => updateField("studentName", event.target.value)} required />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
            </label>
          </div>

          <div className="form-row">
            <label>
              Department
              <input value={form.department} onChange={(event) => updateField("department", event.target.value)} required />
            </label>
            <label>
              CGPA
              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={form.cgpa}
                onChange={(event) => updateField("cgpa", event.target.value)}
                required
              />
            </label>
          </div>

          <label>
            Skills
            <textarea value={form.skills} onChange={(event) => updateField("skills", event.target.value)} rows={3} />
          </label>

          <div className="form-row">
            <label>
              Resume
              <select value={form.resumeId} onChange={(event) => updateField("resumeId", event.target.value)} required>
                <option value="">No resume selected</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.fileName}
                  </option>
                ))}
              </select>
            </label>
            <label className="file-button application-upload">
              <FileUp size={18} />
              <input type="file" accept=".pdf,.doc,.docx" onChange={(event) => onReplaceResume(event.target.files[0])} />
              Upload / Replace Resume
            </label>
          </div>

          <p className="resume-summary">
            {selectedResume ? `Attached resume: ${selectedResume.fileName}` : "Resume not uploaded."}
          </p>

          <div className="form-row">
            <label>
              Phone Number
              <input value={form.phoneNumber} onChange={(event) => updateField("phoneNumber", event.target.value)} />
            </label>
            <label>
              Application Date
              <input value={formatDate(applicationDate)} readOnly />
            </label>
          </div>

          <label>
            Cover Letter
            <textarea value={form.coverLetter} onChange={(event) => updateField("coverLetter", event.target.value)} rows={4} />
          </label>

          <dl className="readonly-drive-details">
            <div>
              <dt>Company</dt>
              <dd>{drive.companyName || "-"}</dd>
            </div>
            <div>
              <dt>Drive Title</dt>
              <dd>{drive.title || "-"}</dd>
            </div>
            <div>
              <dt>Job Role</dt>
              <dd>{drive.jobRole || "-"}</dd>
            </div>
          </dl>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              <Send size={17} />
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const APPLICATION_STATUS_OPTIONS = [
  { value: "APPLIED", label: "Applied" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "SELECTED", label: "Selected" },
  { value: "REJECTED", label: "Rejected" }
];

function ApplicationStatusBadge({ status }) {
  const normalizedStatus = (status || "APPLIED").toUpperCase();
  const statusLabel = APPLICATION_STATUS_OPTIONS.find((option) => option.value === normalizedStatus)?.label || normalizedStatus;

  return <span className={`application-status-badge ${normalizedStatus.toLowerCase()}`}>{statusLabel}</span>;
}

function ApplicationList({ applications }) {
  return (
    <div className="application-list">
      {applications.length === 0 && <EmptyState text="No applications submitted yet." />}
      {applications.map((application) => (
        <article className="application-row" key={application.id}>
          <ApplicationDetails application={application} />
          <span>{formatDate(application.appliedAt)}</span>
          <ApplicationStatusBadge status={application.status} />
        </article>
      ))}
    </div>
  );
}

function ApplicationModal({ applications, deleteApplication, onClose, sendApplicationStatus }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content application-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Applications ({applications.length})</h2>
          <button className="close-button" type="button" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>
        <ApplicationModalContent
          applications={applications}
          deleteApplication={deleteApplication}
          sendApplicationStatus={sendApplicationStatus}
        />
      </div>
    </div>
  );
}

function ApplicationModalContent({ applications, deleteApplication, sendApplicationStatus }) {
  const [previewResume, setPreviewResume] = useState(null);
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [sendingIds, setSendingIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);

  useEffect(() => {
    setSelectedStatuses((currentStatuses) => {
      const nextStatuses = {};
      applications.forEach((application) => {
        nextStatuses[application.id] = currentStatuses[application.id] || application.status || "APPLIED";
      });
      return nextStatuses;
    });
  }, [applications]);

  async function previewApplicationResume(application) {
    if (!application.resumeId) return;
    try {
      const builtResume = await fetchBuiltResume(application.resumeId, ADMIN_ROLE);
      setPreviewResume(builtResume);
    } catch {
      await viewResume(application.resumeId);
    }
  }

  async function handleSend(application) {
    const selectedStatus = selectedStatuses[application.id] || application.status || "APPLIED";
    setSendingIds((currentIds) => [...currentIds, application.id]);
    try {
      await sendApplicationStatus(application.id, selectedStatus);
    } finally {
      setSendingIds((currentIds) => currentIds.filter((id) => id !== application.id));
    }
  }

  async function handleDelete(application) {
    const confirmed = window.confirm("Are you sure you want to delete this application?");
    if (!confirmed) return;

    setDeletingIds((currentIds) => [...currentIds, application.id]);
    try {
      await deleteApplication(application.id);
    } finally {
      setDeletingIds((currentIds) => currentIds.filter((id) => id !== application.id));
    }
  }

  return (
    <>
        <div className="application-list detailed-applications">
          {applications.length === 0 && <EmptyState text="No applications submitted yet." />}
          {applications.map((application) => {
            const selectedStatus = selectedStatuses[application.id] || application.status || "APPLIED";
            const isSending = sendingIds.includes(application.id);
            const isDeleting = deletingIds.includes(application.id);

            return (
              <article className="application-card" key={application.id}>
                <div className="application-card-header">
                  <div>
                    <h3>{application.studentName || `Student #${application.studentId ?? "-"}`}</h3>
                    <p>{application.studentEmail || "Email not available"}</p>
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                </div>
                <div className="application-status-controls">
                  <select
                    value={selectedStatus}
                    onChange={(event) =>
                      setSelectedStatuses((currentStatuses) => ({
                        ...currentStatuses,
                        [application.id]: event.target.value
                      }))
                    }
                    disabled={isSending || isDeleting}
                  >
                    {APPLICATION_STATUS_OPTIONS.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="send-button"
                    onClick={() => handleSend(application)}
                    disabled={isSending || isDeleting}
                  >
                    <Send size={17} />
                    {isSending ? "Sending..." : "Send"}
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleDelete(application)}
                    disabled={isSending || isDeleting}
                  >
                    <Trash2 size={17} />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
                <dl className="application-meta">
                  <div>
                    <dt>Department</dt>
                    <dd>{application.department || "-"}</dd>
                  </div>
                  <div>
                    <dt>CGPA</dt>
                    <dd>{application.cgpa ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>Skills</dt>
                    <dd>{application.skills || "-"}</dd>
                  </div>
                  <div>
                    <dt>Company</dt>
                    <dd>{application.companyName || `Company #${application.companyId ?? "-"}`}</dd>
                  </div>
                  <div>
                    <dt>Drive</dt>
                    <dd>{application.driveTitle || `Drive #${application.driveId ?? "-"}`}</dd>
                  </div>
                  <div>
                    <dt>Job Role</dt>
                    <dd>{application.jobRole || "-"}</dd>
                  </div>
                  <div>
                    <dt>Applied Date</dt>
                    <dd>{formatDate(application.appliedAt)}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <ApplicationStatusBadge status={application.status} />
                    </dd>
                  </div>
                </dl>
                {application.resumeId ? (
                  <div className="card-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => viewResume(application.resumeId)}
                    >
                      <Eye size={17} />
                      View Resume
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => previewApplicationResume(application)}
                    >
                      <FileText size={17} />
                      Preview Resume
                    </button>
                    <button
                      type="button"
                      className="resume-button"
                      onClick={() => downloadResume(application.resumeId, application.resumeFileName)}
                    >
                      <Download size={17} />
                      Download Resume
                    </button>
                  </div>
                ) : (
                  <span className="muted-text">No resume uploaded</span>
                )}
              </article>
            );
          })}
        </div>
        {previewResume && <ResumePreviewModal onClose={() => setPreviewResume(null)} resume={previewResume} />}
    </>
  );
}

function ConfirmDialog({ message, loading, onCancel, onDelete }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(event) => event.stopPropagation()}>
        <h2>Confirm Delete</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button type="button" className="secondary-button" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="danger-button" onClick={onDelete} disabled={loading}>
            <Trash2 size={17} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function LogoutConfirmDialog({ onCancel, onLogout }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="modal-overlay" role="presentation">
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
        <h2 id="logout-confirm-title">Confirm Logout</h2>
        <p>Are you sure you want to logout?</p>
        <div className="confirm-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger-button" onClick={onLogout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplicationDetails({ application, showStudent = false }) {
  const company = application.companyName || `Company #${application.companyId ?? "-"}`;
  const role = application.jobRole || application.driveTitle || `Drive #${application.driveId ?? "-"}`;

  return (
    <span className="application-details">
      {showStudent && (
        <span className="application-student">
          {application.studentName || `Student #${application.studentId ?? "-"}`}
        </span>
      )}
      <span className="application-company">{company}</span>
      <span>{role}</span>
    </span>
  );
}

function defaultBuiltResume(student) {
  return {
    fullName: student?.name || "",
    email: student?.email || "",
    phoneNumber: "",
    address: "",
    linkedInUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    summary: "",
    education: [{
      collegeName: "",
      degree: "",
      department: student?.department || "",
      university: "",
      cgpa: student?.cgpa ?? "",
      graduationYear: ""
    }],
    skills: splitCsv(student?.skills).map((name) => ({ name })),
    projects: [{ projectName: "", description: "", technologiesUsed: "", githubLink: "", role: "", duration: "" }],
    experience: [{ company: "", role: "", duration: "", description: "" }],
    certifications: [{ name: "" }],
    achievements: [{ description: "" }],
    languages: [{ name: "" }],
    hobbies: "",
    declarationAccepted: false
  };
}

function normalizeBuiltResume(data, student) {
  const fallback = defaultBuiltResume(student);
  return {
    ...fallback,
    ...data,
    phoneNumber: data?.phoneNumber || fallback.phoneNumber,
    education: normalizeList(data?.education, fallback.education),
    skills: normalizeList(data?.skills, fallback.skills.length ? fallback.skills : [{ name: "" }]),
    projects: normalizeList(data?.projects, fallback.projects),
    experience: normalizeList(data?.experience, fallback.experience),
    certifications: normalizeList(data?.certifications, fallback.certifications),
    achievements: normalizeList(data?.achievements, fallback.achievements),
    languages: normalizeList(data?.languages, fallback.languages)
  };
}

function normalizeList(value, fallback) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function splitCsv(value) {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function validateBuiltResume(form) {
  const errors = [];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[0-9+()\-\s]{7,20}$/;

  if (!form.fullName?.trim()) errors.push("Name is required.");
  if (!emailPattern.test(form.email || "")) errors.push("Valid email is required.");
  if (!phonePattern.test(form.phoneNumber || "")) errors.push("Valid phone number is required.");
  if (!(form.education || []).some(hasEducation)) errors.push("Education is required.");
  if (!(form.skills || []).some((item) => item.name?.trim())) errors.push("At least one skill is required.");
  if (!(form.projects || []).some((item) => item.projectName?.trim())) errors.push("At least one project is required.");
  if (!form.declarationAccepted) errors.push("Declaration must be accepted.");
  [
    ["LinkedIn URL", form.linkedInUrl],
    ["GitHub URL", form.githubUrl],
    ["Portfolio URL", form.portfolioUrl],
    ...(form.projects || []).map((project) => ["Project GitHub Link", project.githubLink])
  ].forEach(([label, value]) => {
    if (value && !/^https?:\/\//i.test(value)) errors.push(`${label} must start with http:// or https://.`);
  });
  return errors;
}

function sanitizeBuiltResumePayload(form) {
  return {
    ...form,
    education: (form.education || []).map((item) => ({
      ...item,
      cgpa: item.cgpa === "" || item.cgpa == null ? null : Number(item.cgpa)
    }))
  };
}

function calculateResumeScore(form) {
  let score = 0;
  if (form.fullName && form.email && form.phoneNumber) score += 15;
  if (form.summary) score += 10;
  if ((form.education || []).some(hasEducation)) score += 15;
  if ((form.skills || []).some((item) => item.name)) score += 15;
  if ((form.projects || []).some((item) => item.projectName)) score += 15;
  if ((form.experience || []).some((item) => item.company || item.role)) score += 10;
  if ((form.certifications || []).some((item) => item.name)) score += 5;
  if ((form.achievements || []).some((item) => item.description)) score += 5;
  if ((form.languages || []).some((item) => item.name)) score += 5;
  if (form.declarationAccepted) score += 5;
  return Math.min(score, 100);
}

function hasEducation(item) {
  return Boolean(item && (item.collegeName || item.degree || item.department || item.university || item.cgpa || item.graduationYear));
}

function validateApplicationForm(form, drive) {
  const errors = [];
  const cgpa = Number(form?.cgpa);

  if (!form?.studentName?.trim()) {
    errors.push("Student Name required.");
  }
  if (!form?.email?.trim()) {
    errors.push("Email required.");
  }
  if (!form?.department?.trim()) {
    errors.push("Department required.");
  }
  if (form?.cgpa === "" || Number.isNaN(cgpa)) {
    errors.push("CGPA required.");
  }
  if (!form?.resumeId) {
    errors.push("Resume not uploaded.");
  }
  if (!Number.isNaN(cgpa) && drive?.requiredCgpa != null && cgpa < Number(drive.requiredCgpa)) {
    errors.push("CGPA requirement not met.");
  }

  return errors;
}

function validateProfilePhotoFile(file) {
  if (!file) {
    return "Passport Size Photo is required";
  }

  const name = file.name?.toLowerCase() || "";
  const hasAllowedExtension = PROFILE_PHOTO_EXTENSIONS.some((extension) => name.endsWith(extension));

  if (!hasAllowedExtension || (file.type && !PROFILE_PHOTO_TYPES.includes(file.type))) {
    return "Passport Size Photo must be a JPG, JPEG, or PNG file";
  }

  if (file.size > PROFILE_PHOTO_MAX_SIZE) {
    return "Passport Size Photo must be 2 MB or smaller";
  }

  return "";
}

function EmptyState({ text }) {
  return <p className="empty-state">{text}</p>;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

async function downloadResume(resumeId, fileName = "resume") {
  const response = await fetch(`/resumes/${resumeId}/download`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "resume";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function viewResume(resumeId) {
  const response = await fetch(`/resumes/${resumeId}/download`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

async function fetchBuiltResume(resumeId, role = STUDENT_ROLE) {
  return apiRequest(`/resumes/${resumeId}/builder`, { role });
}

function cleanError(message) {
  if (!message) return "Something went wrong";
  try {
    const parsed = JSON.parse(message);
    return parsed.message || parsed.error || message;
  } catch {
    return message;
  }
}

export default App;
