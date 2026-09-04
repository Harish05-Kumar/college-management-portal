package project.collegeplacement.dto;

import lombok.Data;

@Data
public class ApplicationRequest {

    private Long resumeId;
    private String studentName;
    private String email;
    private String department;
    private Double cgpa;
    private String skills;
    private String phoneNumber;
    private String coverLetter;
}
