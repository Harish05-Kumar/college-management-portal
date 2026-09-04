package project.collegeplacement.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resume_achievements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResumeAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_builder_id")
    @JsonBackReference
    private BuiltResume resume;

    @Column(length = 1000)
    private String description;
}
