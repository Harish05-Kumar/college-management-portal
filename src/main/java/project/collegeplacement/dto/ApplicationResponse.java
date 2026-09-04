package project.collegeplacement.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponse {

    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String department;
    private Double cgpa;
    private String skills;
    private String phoneNumber;
    private String coverLetter;
    private Long companyId;
    private String companyName;
    private Long driveId;
    private String driveTitle;
    private String jobRole;
    private Long resumeId;
    private String resumeFileName;
    private String resumePath;
    private String status;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;
    private Double packageAmount;
    private String salary;
    private Double requiredCgpa;
}
