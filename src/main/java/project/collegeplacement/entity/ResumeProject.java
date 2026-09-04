package project.collegeplacement.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resume_projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResumeProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_builder_id")
    @JsonBackReference
    private BuiltResume resume;

    private String projectName;

    @Column(length = 3000)
    private String description;

    @Column(length = 1000)
    private String technologiesUsed;

    private String githubLink;
    private String role;
    private String duration;
}
