package project.collegeplacement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlacementDriveDto {

    private Long id;
    private Long companyId;
    private String companyName;
    private String title;
    private String jobRole;
    private String description;
    private String responsibilities;
    private String qualifications;
    private String benefits;
    private String employmentType;
    private String workMode;
    private String experienceRequired;
    private String jobLocation;
    private Integer numberOfOpenings;
    private String selectionProcess;
    private String bondDetails;
    private Double packageAmount;
    private Double requiredCgpa;
    private String requiredSkills;
    private LocalDate driveDate;
    private LocalDate applicationDeadline;
    private String status;
    private String jobUrl;
    private String source;
    private String externalJobId;
    private String location;
    private String salary;
}
