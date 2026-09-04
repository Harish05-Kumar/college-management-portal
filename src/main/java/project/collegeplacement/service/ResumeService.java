package project.collegeplacement.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import project.collegeplacement.entity.BuiltResume;
import project.collegeplacement.entity.Resume;
import project.collegeplacement.entity.ResumeAchievement;
import project.collegeplacement.entity.ResumeCertification;
import project.collegeplacement.entity.ResumeEducation;
import project.collegeplacement.entity.ResumeExperience;
import project.collegeplacement.entity.ResumeLanguage;
import project.collegeplacement.entity.ResumeProject;
import project.collegeplacement.entity.ResumeSkill;
import project.collegeplacement.entity.Student;
import project.collegeplacement.repository.BuiltResumeRepository;
import project.collegeplacement.repository.ResumeRepository;
import project.collegeplacement.repository.StudentRepository;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final BuiltResumeRepository builtResumeRepository;
    private final StudentRepository studentRepository;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9+()\\-\\s]{7,20}$");
    private static final Pattern URL_PATTERN = Pattern.compile("^(https?://).+", Pattern.CASE_INSENSITIVE);

    public Resume uploadResume(String studentEmail, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Resume file is required");
        }
        if (!MediaType.APPLICATION_PDF_VALUE.equalsIgnoreCase(file.getContentType())
                && (file.getOriginalFilename() == null || !file.getOriginalFilename().toLowerCase().endsWith(".pdf"))) {
            throw new RuntimeException("Only PDF resumes are supported.");
        }

        Student student = getStudentByEmail(studentEmail);

        Resume resume = new Resume();
        resume.setStudentId(student.getId());
        resume.setSourceType("UPLOADED");
        resume.setFileName(file.getOriginalFilename());
        resume.setContentType(file.getContentType());
        resume.setFileSize(file.getSize());
        resume.setUploadedAt(LocalDateTime.now());
        resume.setData(file.getBytes());

        return resumeRepository.save(resume);
    }

    public BuiltResume getMyBuiltResume(String studentEmail) {
        Student student = getStudentByEmail(studentEmail);
        return builtResumeRepository.findByStudentId(student.getId())
                .orElseGet(() -> buildProfileDefaults(student));
    }

    public BuiltResume getBuiltResumeByGeneratedResumeId(Long resumeId) {
        return builtResumeRepository.findByResumeId(resumeId)
                .orElseThrow(() -> new RuntimeException("Built resume not found"));
    }

    public BuiltResume saveBuiltResume(String studentEmail, BuiltResume request) {
        Student student = getStudentByEmail(studentEmail);
        validateBuiltResume(request);

        BuiltResume resume = builtResumeRepository.findByStudentId(student.getId()).orElseGet(BuiltResume::new);
        boolean isNew = resume.getId() == null;
        resume.setStudentId(student.getId());
        resume.setFullName(trim(request.getFullName()));
        resume.setEmail(trim(request.getEmail()));
        resume.setPhoneNumber(trim(request.getPhoneNumber()));
        resume.setAddress(trim(request.getAddress()));
        resume.setLinkedInUrl(trim(request.getLinkedInUrl()));
        resume.setGithubUrl(trim(request.getGithubUrl()));
        resume.setPortfolioUrl(trim(request.getPortfolioUrl()));
        resume.setSummary(trim(request.getSummary()));
        resume.setHobbies(trim(request.getHobbies()));
        resume.setDeclarationAccepted(request.isDeclarationAccepted());
        resume.setCompletionScore(calculateCompletionScore(request));
        if (isNew) {
            resume.setCreatedAt(LocalDateTime.now());
        }
        resume.setUpdatedAt(LocalDateTime.now());

        replaceEducation(resume, request.getEducation());
        replaceSkills(resume, request.getSkills());
        replaceProjects(resume, request.getProjects());
        replaceExperience(resume, request.getExperience());
        replaceCertifications(resume, request.getCertifications());
        replaceAchievements(resume, request.getAchievements());
        replaceLanguages(resume, request.getLanguages());

        BuiltResume saved = builtResumeRepository.save(resume);
        Resume generated = saveGeneratedPdf(student, saved);
        saved.setResumeId(generated.getId());
        return builtResumeRepository.save(saved);
    }

    public List<Resume> getMyResumes(String studentEmail) {
        Student student = getStudentByEmail(studentEmail);
        return resumeRepository.findByStudentId(student.getId());
    }

    public Resume downloadResume(String studentEmail, Long resumeId) {
        Student student = getStudentByEmail(studentEmail);
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        if (!resume.getStudentId().equals(student.getId())) {
            throw new RuntimeException("Resume does not belong to current student");
        }

        return resume;
    }

    public Resume getLatestResumeForStudent(Student student) {
        return resumeRepository.findByStudentId(student.getId())
                .stream()
                .max(Comparator.comparing(Resume::getUploadedAt, Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(null);
    }

    public void deleteResume(String studentEmail, Long resumeId) {
        Student student = getStudentByEmail(studentEmail);
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));
        if (!resume.getStudentId().equals(student.getId())) {
            throw new RuntimeException("Resume does not belong to current student");
        }
        if ("BUILT".equalsIgnoreCase(resume.getSourceType())) {
            BuiltResume builtResume = builtResumeRepository.findByStudentId(student.getId())
                    .orElseThrow(() -> new RuntimeException("Built resume not found"));
            builtResume.setResumeId(null);
            builtResumeRepository.save(builtResume);
        }
        resumeRepository.delete(resume);
    }

    public Resume downloadResumeForAdmin(Long resumeId) {
        return resumeRepository.findById(resumeId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));
    }

    private BuiltResume buildProfileDefaults(Student student) {
        BuiltResume resume = new BuiltResume();
        resume.setStudentId(student.getId());
        resume.setFullName(student.getName());
        resume.setEmail(student.getEmail());
        resume.setCompletionScore(0);

        ResumeEducation education = new ResumeEducation();
        education.setDepartment(student.getDepartment());
        education.setCgpa(student.getCgpa());
        resume.getEducation().add(education);

        if (hasText(student.getSkills())) {
            for (String skill : student.getSkills().split(",")) {
                if (hasText(skill)) {
                    ResumeSkill resumeSkill = new ResumeSkill();
                    resumeSkill.setName(skill.trim());
                    resume.getSkills().add(resumeSkill);
                }
            }
        }

        return resume;
    }

    private Resume saveGeneratedPdf(Student student, BuiltResume builtResume) {
        byte[] pdf = generatePdf(builtResume);
        Resume resume = Optional.ofNullable(builtResume.getResumeId())
                .flatMap(resumeRepository::findById)
                .orElseGet(Resume::new);
        resume.setStudentId(student.getId());
        resume.setBuiltResumeId(builtResume.getId());
        resume.setSourceType("BUILT");
        resume.setFileName(safeFileName(builtResume.getFullName()) + "_Resume.pdf");
        resume.setContentType(MediaType.APPLICATION_PDF_VALUE);
        resume.setFileSize((long) pdf.length);
        resume.setUploadedAt(LocalDateTime.now());
        resume.setData(pdf);
        return resumeRepository.save(resume);
    }

    private byte[] generatePdf(BuiltResume resume) {
        try {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 42, 42, 36, 36);
            PdfWriter.getInstance(document, output);
            document.open();

            Font nameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font contactFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

            Paragraph name = new Paragraph(nullToBlank(resume.getFullName()), nameFont);
            name.setAlignment(Element.ALIGN_CENTER);
            document.add(name);

            Paragraph contact = new Paragraph(buildContactLine(resume), contactFont);
            contact.setAlignment(Element.ALIGN_CENTER);
            contact.setSpacingAfter(10);
            document.add(contact);

            addSection(document, "PROFESSIONAL SUMMARY", resume.getSummary(), sectionFont, bodyFont);
            addEducation(document, resume, sectionFont, bodyFont, boldFont);
            addListSection(document, "TECHNICAL SKILLS", resume.getSkills().stream().map(ResumeSkill::getName).toList(), sectionFont, bodyFont, true);
            addProjects(document, resume, sectionFont, bodyFont, boldFont);
            addExperience(document, resume, sectionFont, bodyFont, boldFont);
            addListSection(document, "CERTIFICATIONS", resume.getCertifications().stream().map(ResumeCertification::getName).toList(), sectionFont, bodyFont, false);
            addListSection(document, "ACHIEVEMENTS", resume.getAchievements().stream().map(ResumeAchievement::getDescription).toList(), sectionFont, bodyFont, false);
            addListSection(document, "LANGUAGES", resume.getLanguages().stream().map(ResumeLanguage::getName).toList(), sectionFont, bodyFont, true);
            addSection(document, "HOBBIES", resume.getHobbies(), sectionFont, bodyFont);

            document.close();
            return output.toByteArray();
        } catch (DocumentException e) {
            throw new RuntimeException("Unable to generate resume PDF", e);
        }
    }

    private void addEducation(Document document, BuiltResume resume, Font sectionFont, Font bodyFont, Font boldFont) {
        List<ResumeEducation> education = resume.getEducation().stream().filter(this::hasEducation).toList();
        if (education.isEmpty()) return;
        addSectionTitle(document, "EDUCATION", sectionFont);
        for (ResumeEducation item : education) {
            document.add(new Paragraph(firstText(item.getDegree(), "Degree") + " - " + firstText(item.getDepartment(), "Department"), boldFont));
            document.add(new Paragraph(join(" | ", item.getCollegeName(), item.getUniversity(), item.getGraduationYear(), item.getCgpa() == null ? null : "CGPA: " + item.getCgpa()), bodyFont));
        }
    }

    private void addProjects(Document document, BuiltResume resume, Font sectionFont, Font bodyFont, Font boldFont) {
        List<ResumeProject> projects = resume.getProjects().stream().filter(project -> hasText(project.getProjectName())).toList();
        if (projects.isEmpty()) return;
        addSectionTitle(document, "PROJECTS", sectionFont);
        for (ResumeProject project : projects) {
            document.add(new Paragraph(project.getProjectName(), boldFont));
            addParagraph(document, project.getDescription(), bodyFont);
            addParagraph(document, join(" | ", project.getTechnologiesUsed(), project.getRole(), project.getDuration(), project.getGithubLink()), bodyFont);
        }
    }

    private void addExperience(Document document, BuiltResume resume, Font sectionFont, Font bodyFont, Font boldFont) {
        List<ResumeExperience> experience = resume.getExperience().stream().filter(item -> hasText(item.getCompany()) || hasText(item.getRole())).toList();
        if (experience.isEmpty()) return;
        addSectionTitle(document, "INTERNSHIP / EXPERIENCE", sectionFont);
        for (ResumeExperience item : experience) {
            document.add(new Paragraph(join(" - ", item.getCompany(), item.getRole(), item.getDuration()), boldFont));
            addParagraph(document, item.getDescription(), bodyFont);
        }
    }

    private void addSection(Document document, String title, String value, Font sectionFont, Font bodyFont) {
        if (!hasText(value)) return;
        addSectionTitle(document, title, sectionFont);
        addParagraph(document, value, bodyFont);
    }

    private void addListSection(Document document, String title, List<String> values, Font sectionFont, Font bodyFont, boolean inline) {
        List<String> cleanValues = values.stream().filter(this::hasText).map(String::trim).toList();
        if (cleanValues.isEmpty()) return;
        addSectionTitle(document, title, sectionFont);
        if (inline) {
            addParagraph(document, String.join(", ", cleanValues), bodyFont);
            return;
        }
        for (String value : cleanValues) {
            addParagraph(document, "• " + value, bodyFont);
        }
    }

    private void addSectionTitle(Document document, String title, Font font) {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Phrase(title, font));
        cell.setBorder(PdfPCell.BOTTOM);
        cell.setPaddingTop(8);
        cell.setPaddingBottom(3);
        table.addCell(cell);
        document.add(table);
    }

    private void addParagraph(Document document, String text, Font font) {
        if (hasText(text)) {
            Paragraph paragraph = new Paragraph(text.trim(), font);
            paragraph.setSpacingAfter(3);
            document.add(paragraph);
        }
    }

    private void validateBuiltResume(BuiltResume resume) {
        if (!hasText(resume.getFullName())) throw new RuntimeException("Name is required.");
        if (!hasText(resume.getEmail()) || !EMAIL_PATTERN.matcher(resume.getEmail()).matches()) throw new RuntimeException("Valid email is required.");
        if (!hasText(resume.getPhoneNumber()) || !PHONE_PATTERN.matcher(resume.getPhoneNumber()).matches()) throw new RuntimeException("Valid phone number is required.");
        if (resume.getEducation() == null || resume.getEducation().stream().noneMatch(this::hasEducation)) throw new RuntimeException("Education is required.");
        if (resume.getSkills() == null || resume.getSkills().stream().noneMatch(skill -> hasText(skill.getName()))) throw new RuntimeException("At least one skill is required.");
        if (resume.getProjects() == null || resume.getProjects().stream().noneMatch(project -> hasText(project.getProjectName()))) throw new RuntimeException("At least one project is required.");
        if (!resume.isDeclarationAccepted()) throw new RuntimeException("Declaration must be accepted.");
        validateUrl("LinkedIn URL", resume.getLinkedInUrl());
        validateUrl("GitHub URL", resume.getGithubUrl());
        validateUrl("Portfolio URL", resume.getPortfolioUrl());
        if (resume.getProjects() != null) {
            resume.getProjects().forEach(project -> validateUrl("Project GitHub Link", project.getGithubLink()));
        }
    }

    private void validateUrl(String label, String value) {
        if (hasText(value) && !URL_PATTERN.matcher(value.trim()).matches()) {
            throw new RuntimeException(label + " must start with http:// or https://.");
        }
    }

    private int calculateCompletionScore(BuiltResume resume) {
        int score = 0;
        if (hasText(resume.getFullName()) && hasText(resume.getEmail()) && hasText(resume.getPhoneNumber())) score += 15;
        if (hasText(resume.getSummary())) score += 10;
        if (resume.getEducation() != null && resume.getEducation().stream().anyMatch(this::hasEducation)) score += 15;
        if (resume.getSkills() != null && resume.getSkills().stream().anyMatch(skill -> hasText(skill.getName()))) score += 15;
        if (resume.getProjects() != null && resume.getProjects().stream().anyMatch(project -> hasText(project.getProjectName()))) score += 15;
        if (resume.getExperience() != null && resume.getExperience().stream().anyMatch(item -> hasText(item.getCompany()) || hasText(item.getRole()))) score += 10;
        if (resume.getCertifications() != null && resume.getCertifications().stream().anyMatch(item -> hasText(item.getName()))) score += 5;
        if (resume.getAchievements() != null && resume.getAchievements().stream().anyMatch(item -> hasText(item.getDescription()))) score += 5;
        if (resume.getLanguages() != null && resume.getLanguages().stream().anyMatch(item -> hasText(item.getName()))) score += 5;
        if (resume.isDeclarationAccepted()) score += 5;
        return Math.min(score, 100);
    }

    private void replaceEducation(BuiltResume resume, List<ResumeEducation> items) {
        resume.getEducation().clear();
        if (items == null) return;
        items.stream().filter(this::hasEducation).forEach(item -> {
            item.setId(null);
            item.setResume(resume);
            resume.getEducation().add(item);
        });
    }

    private void replaceSkills(BuiltResume resume, List<ResumeSkill> items) {
        resume.getSkills().clear();
        if (items == null) return;
        items.stream().filter(item -> hasText(item.getName())).forEach(item -> {
            item.setId(null);
            item.setName(trim(item.getName()));
            item.setResume(resume);
            resume.getSkills().add(item);
        });
    }

    private void replaceProjects(BuiltResume resume, List<ResumeProject> items) {
        resume.getProjects().clear();
        if (items == null) return;
        items.stream().filter(item -> hasText(item.getProjectName())).forEach(item -> {
            item.setId(null);
            item.setResume(resume);
            resume.getProjects().add(item);
        });
    }

    private void replaceExperience(BuiltResume resume, List<ResumeExperience> items) {
        resume.getExperience().clear();
        if (items == null) return;
        items.stream().filter(item -> hasText(item.getCompany()) || hasText(item.getRole()) || hasText(item.getDescription())).forEach(item -> {
            item.setId(null);
            item.setResume(resume);
            resume.getExperience().add(item);
        });
    }

    private void replaceCertifications(BuiltResume resume, List<ResumeCertification> items) {
        resume.getCertifications().clear();
        if (items == null) return;
        items.stream().filter(item -> hasText(item.getName())).forEach(item -> {
            item.setId(null);
            item.setName(trim(item.getName()));
            item.setResume(resume);
            resume.getCertifications().add(item);
        });
    }

    private void replaceAchievements(BuiltResume resume, List<ResumeAchievement> items) {
        resume.getAchievements().clear();
        if (items == null) return;
        items.stream().filter(item -> hasText(item.getDescription())).forEach(item -> {
            item.setId(null);
            item.setDescription(trim(item.getDescription()));
            item.setResume(resume);
            resume.getAchievements().add(item);
        });
    }

    private void replaceLanguages(BuiltResume resume, List<ResumeLanguage> items) {
        resume.getLanguages().clear();
        if (items == null) return;
        items.stream().filter(item -> hasText(item.getName())).forEach(item -> {
            item.setId(null);
            item.setName(trim(item.getName()));
            item.setResume(resume);
            resume.getLanguages().add(item);
        });
    }

    private Student getStudentByEmail(String email) {
        return studentRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    private boolean hasEducation(ResumeEducation education) {
        return education != null
                && (hasText(education.getCollegeName()) || hasText(education.getDegree()) || hasText(education.getDepartment())
                || hasText(education.getUniversity()) || education.getCgpa() != null || hasText(education.getGraduationYear()));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String trim(String value) {
        return hasText(value) ? value.trim() : null;
    }

    private String nullToBlank(String value) {
        return value == null ? "" : value;
    }

    private String firstText(String first, String fallback) {
        return hasText(first) ? first.trim() : fallback;
    }

    private String join(String separator, Object... values) {
        StringBuilder builder = new StringBuilder();
        for (Object value : values) {
            if (value == null || !hasText(String.valueOf(value))) continue;
            if (!builder.isEmpty()) builder.append(separator);
            builder.append(String.valueOf(value).trim());
        }
        return builder.toString();
    }

    private String buildContactLine(BuiltResume resume) {
        return join(" | ", resume.getEmail(), resume.getPhoneNumber(), resume.getAddress(), resume.getLinkedInUrl(), resume.getGithubUrl(), resume.getPortfolioUrl());
    }

    private String safeFileName(String value) {
        String clean = hasText(value) ? value.trim().replaceAll("[^A-Za-z0-9]+", "_") : "Student";
        return clean.replaceAll("^_+|_+$", "");
    }
}
