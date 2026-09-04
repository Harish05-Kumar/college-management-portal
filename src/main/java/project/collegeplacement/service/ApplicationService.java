package project.collegeplacement.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import project.collegeplacement.dto.ApplicationRequest;
import project.collegeplacement.dto.ApplicationResponse;
import project.collegeplacement.dto.EligibilityResponse;
import project.collegeplacement.entity.Application;
import project.collegeplacement.entity.Company;
import project.collegeplacement.entity.PlacementDrive;
import project.collegeplacement.entity.Resume;
import project.collegeplacement.entity.Student;
import project.collegeplacement.repository.ApplicationRepository;
import project.collegeplacement.repository.CompanyRepository;
import project.collegeplacement.repository.PlacementDriveRepository;
import project.collegeplacement.repository.ResumeRepository;
import project.collegeplacement.repository.StudentRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final StudentRepository studentRepository;
    private final PlacementDriveRepository placementDriveRepository;
    private final CompanyRepository companyRepository;
    private final ResumeRepository resumeRepository;
    private final MailService mailService;

    public Application applyForDrive(String studentEmail, Long driveId, ApplicationRequest request) {
        Student student = getStudentByEmail(studentEmail);
        PlacementDrive drive = getDriveById(driveId);

        if (applicationRepository.existsByStudentIdAndDriveId(student.getId(), driveId)) {
            throw new RuntimeException("You have already applied for this drive.");
        }

        Long resumeId = request == null ? null : request.getResumeId();
        Resume resume = resolveResume(student, resumeId);
        EligibilityResponse eligibility = buildEligibility(student, drive, resume);

        List<String> validationErrors = new ArrayList<>(validateApplicationRequest(student, request));
        validationErrors.addAll(eligibility.getReasons());
        validationErrors = new ArrayList<>(new LinkedHashSet<>(validationErrors));

        if (!validationErrors.isEmpty()) {
            throw new RuntimeException(String.join("\n", validationErrors));
        }

        Application application = new Application();
        application.setStudentId(student.getId());
        application.setCompanyId(drive.getCompanyId());
        application.setDriveId(drive.getId());
        application.setResumeId(resume.getId());
        application.setStudentName(student.getName());
        application.setStudentEmail(student.getEmail());
        application.setDepartment(student.getDepartment());
        application.setCgpa(student.getCgpa());
        application.setSkills(request != null && hasText(request.getSkills()) ? request.getSkills().trim() : student.getSkills());
        application.setResumePath(resume.getFileName());
        application.setCompanyName(resolveCompanyName(drive));
        application.setDriveTitle(drive.getTitle());
        application.setJobRole(drive.getJobRole());
        application.setPhoneNumber(request == null ? null : blankToNull(request.getPhoneNumber()));
        application.setCoverLetter(request == null ? null : blankToNull(request.getCoverLetter()));
        application.setStatus("APPLIED");
        application.setAppliedAt(LocalDateTime.now());

        return applicationRepository.save(application);
    }

    public boolean checkEligibility(String studentEmail, Long driveId) {
        return getEligibility(studentEmail, driveId).isEligible();
    }

    public EligibilityResponse getEligibility(String studentEmail, Long driveId) {
        Student student = getStudentByEmail(studentEmail);
        PlacementDrive drive = getDriveById(driveId);
        Resume resume = getLatestResume(student);
        return buildEligibility(student, drive, resume);
    }

    public List<ApplicationResponse> getAllApplications() {
        return applicationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public long getApplicationCount() {
        return applicationRepository.count();
    }

    public List<ApplicationResponse> getStudentApplications(String studentEmail) {
        Student student = getStudentByEmail(studentEmail);
        return getStudentApplicationsByStudentId(student.getId());
    }

    public List<ApplicationResponse> getStudentApplicationsByStudentId(Long studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new RuntimeException("Student not found");
        }
        return applicationRepository.findByStudentIdOrderByAppliedAtDesc(studentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ApplicationResponse> getDriveApplications(Long driveId) {
        return applicationRepository.findByDriveId(driveId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public Application updateStatus(Long applicationId, String status) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        application.setStatus(normalizeStatus(status));
        application.setUpdatedAt(LocalDateTime.now());
        return applicationRepository.save(application);
    }

    public void sendStatusEmail(Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        application.setStatus(normalizeStatus(application.getStatus()));
        mailService.sendApplicationStatusEmail(application);
    }

    public void deleteApplication(Long applicationId) {
        if (!applicationRepository.existsById(applicationId)) {
            throw new RuntimeException("Application not found");
        }
        applicationRepository.deleteById(applicationId);
    }

    private Student getStudentByEmail(String email) {
        return studentRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    private PlacementDrive getDriveById(Long driveId) {
        return placementDriveRepository.findById(driveId)
                .orElseThrow(() -> new RuntimeException("Placement drive not found"));
    }

    private ApplicationResponse toResponse(Application application) {
        PlacementDrive drive = application.getDriveId() == null
                ? null
                : placementDriveRepository.findById(application.getDriveId()).orElse(null);

        Long companyId = application.getCompanyId();
        if (companyId == null && drive != null) {
            companyId = drive.getCompanyId();
        }

        Company company = companyId == null
                ? null
                : companyRepository.findById(companyId).orElse(null);
        Student student = application.getStudentId() == null
                ? null
                : studentRepository.findById(application.getStudentId()).orElse(null);

        String resumeFileName = application.getResumeId() == null
                ? null
                : resumeRepository.findById(application.getResumeId())
                        .map(Resume::getFileName)
                        .orElse(application.getResumePath());

        return new ApplicationResponse(
                application.getId(),
                application.getStudentId(),
                firstText(application.getStudentName(), student == null ? null : student.getName()),
                firstText(application.getStudentEmail(), student == null ? null : student.getEmail()),
                firstText(application.getDepartment(), student == null ? null : student.getDepartment()),
                application.getCgpa() == null && student != null ? student.getCgpa() : application.getCgpa(),
                firstText(application.getSkills(), student == null ? null : student.getSkills()),
                application.getPhoneNumber(),
                application.getCoverLetter(),
                companyId,
                firstText(application.getCompanyName(), company == null ? null : company.getCompanyName()),
                application.getDriveId(),
                firstText(application.getDriveTitle(), drive == null ? null : drive.getTitle()),
                firstText(application.getJobRole(), drive == null ? null : drive.getJobRole()),
                application.getResumeId(),
                resumeFileName,
                firstText(application.getResumePath(), resumeFileName),
                application.getStatus(),
                application.getAppliedAt(),
                application.getUpdatedAt(),
                drive == null ? null : drive.getPackageAmount(),
                drive == null ? null : drive.getSalary(),
                drive == null ? null : drive.getRequiredCgpa()
        );
    }

    private EligibilityResponse buildEligibility(Student student, PlacementDrive drive, Resume resume) {
        List<String> reasons = new ArrayList<>();

        if (student.getCgpa() == null) {
            reasons.add("CGPA required.");
        } else if (drive.getRequiredCgpa() != null && student.getCgpa() < drive.getRequiredCgpa()) {
            reasons.add("CGPA requirement not met.");
        }

        if (resume == null) {
            reasons.add("Resume not uploaded.");
        }

        return new EligibilityResponse(reasons.isEmpty(), reasons, List.of());
    }

    private Resume resolveResume(Student student, Long resumeId) {
        if (resumeId != null) {
            Resume resume = resumeRepository.findById(resumeId)
                    .orElseThrow(() -> new RuntimeException("Resume not uploaded."));
            if (!resume.getStudentId().equals(student.getId())) {
                throw new RuntimeException("Selected resume does not belong to the logged-in student.");
            }
            return resume;
        }

        return getLatestResume(student);
    }

    private Resume getLatestResume(Student student) {
        return resumeRepository.findByStudentId(student.getId())
                .stream()
                .max(Comparator.comparing(Resume::getUploadedAt, Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(null);
    }

    private List<String> validateApplicationRequest(Student student, ApplicationRequest request) {
        List<String> errors = new ArrayList<>();
        if (!hasText(student.getName())) {
            errors.add("Student Name required.");
        }
        if (!hasText(student.getEmail())) {
            errors.add("Email required.");
        }
        if (!hasText(student.getDepartment())) {
            errors.add("Department required.");
        }
        if (student.getCgpa() == null) {
            errors.add("CGPA required.");
        }
        return errors;
    }

    private String resolveCompanyName(PlacementDrive drive) {
        if (hasText(drive.getCompanyName())) {
            return drive.getCompanyName();
        }
        if (drive.getCompanyId() == null) {
            return null;
        }
        return companyRepository.findById(drive.getCompanyId())
                .map(Company::getCompanyName)
                .orElse(null);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String blankToNull(String value) {
        return hasText(value) ? value.trim() : null;
    }

    private String firstText(String first, String fallback) {
        return hasText(first) ? first : fallback;
    }

    private String normalizeStatus(String status) {
        if (!hasText(status)) {
            throw new RuntimeException("Application status is required");
        }

        String normalizedStatus = status.trim().toUpperCase();
        if (!List.of("APPLIED", "SHORTLISTED", "SELECTED", "REJECTED").contains(normalizedStatus)) {
            throw new RuntimeException("Invalid application status");
        }
        return normalizedStatus;
    }
}
