package project.collegeplacement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long studentId;

    private Long companyId;

    private Long driveId;

    private Long resumeId;

    private String studentName;

    private String studentEmail;

    private String department;

    private Double cgpa;

    @Column(length = 2000)
    private String skills;

    private String resumePath;

    private String companyName;

    private String driveTitle;

    private String jobRole;

    private String phoneNumber;

    @Column(length = 5000)
    private String coverLetter;

    private String status;

    private LocalDateTime appliedAt;

    private LocalDateTime updatedAt;
}
