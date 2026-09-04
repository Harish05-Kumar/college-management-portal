package project.collegeplacement.dto;

import project.collegeplacement.entity.BuiltResume;
import project.collegeplacement.entity.Resume;
import project.collegeplacement.entity.Student;

import java.time.LocalDateTime;
import java.util.List;

public record AdminStudentDetailResponse(
        Long id,
        String name,
        String email,
        String department,
        Double cgpa,
        String skills,
        String profilePhotoUrl,
        LocalDateTime registrationDate,
        List<ResumeSummary> resumes,
        BuiltResume resumeBuilder
) {

    public static AdminStudentDetailResponse from(Student student, List<Resume> resumes, BuiltResume resumeBuilder) {
        return new AdminStudentDetailResponse(
                student.getId(),
                student.getName(),
                student.getEmail(),
                student.getDepartment(),
                student.getCgpa(),
                student.getSkills(),
                student.getProfilePhoto(),
                student.getRegisteredAt(),
                resumes.stream().map(ResumeSummary::from).toList(),
                resumeBuilder
        );
    }

    public record ResumeSummary(
            Long id,
            String sourceType,
            String fileName,
            String contentType,
            Long fileSize,
            LocalDateTime uploadedAt
    ) {
        public static ResumeSummary from(Resume resume) {
            return new ResumeSummary(
                    resume.getId(),
                    resume.getSourceType(),
                    resume.getFileName(),
                    resume.getContentType(),
                    resume.getFileSize(),
                    resume.getUploadedAt()
            );
        }
    }
}
