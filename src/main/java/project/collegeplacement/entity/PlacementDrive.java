package project.collegeplacement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "placement_drives")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PlacementDrive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    private String companyName;

    private String title;

    private String jobRole;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String responsibilities;

    @Column(columnDefinition = "TEXT")
    private String qualifications;

    @Column(columnDefinition = "TEXT")
    private String benefits;

    private String employmentType;

    private String workMode;

    private String experienceRequired;

    private String jobLocation;

    private Integer numberOfOpenings;

    @Column(columnDefinition = "TEXT")
    private String selectionProcess;

    @Column(columnDefinition = "TEXT")
    private String bondDetails;

    private Double packageAmount;

    private Double requiredCgpa;

    private String requiredSkills;

    private LocalDate driveDate;

    private LocalDate applicationDeadline;

    private String status = "OPEN";

    // External job fields for RapidAPI integration
    private String jobUrl;

    private String source;

    private String externalJobId;

    private String location;

    private String salary;
}
