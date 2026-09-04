package project.collegeplacement.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resume_education")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResumeEducation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_builder_id")
    @JsonBackReference
    private BuiltResume resume;

    private String collegeName;
    private String degree;
    private String department;
    private String university;
    private Double cgpa;
    private String graduationYear;
}
