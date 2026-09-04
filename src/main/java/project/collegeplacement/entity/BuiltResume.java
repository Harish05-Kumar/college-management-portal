package project.collegeplacement.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "built_resumes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BuiltResume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private Long studentId;

    private Long resumeId;

    private String fullName;

    private String email;

    private String phoneNumber;

    @Column(length = 1000)
    private String address;

    private String linkedInUrl;

    private String githubUrl;

    private String portfolioUrl;

    @Column(length = 3000)
    private String summary;

    @Column(length = 3000)
    private String hobbies;

    private boolean declarationAccepted;

    private Integer completionScore;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Fetch(FetchMode.SUBSELECT)
    private List<ResumeEducation> education = new ArrayList<>();

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Fetch(FetchMode.SUBSELECT)
    private List<ResumeSkill> skills = new ArrayList<>();

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Fetch(FetchMode.SUBSELECT)
    private List<ResumeProject> projects = new ArrayList<>();

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Fetch(FetchMode.SUBSELECT)
    private List<ResumeExperience> experience = new ArrayList<>();

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Fetch(FetchMode.SUBSELECT)
    private List<ResumeCertification> certifications = new ArrayList<>();

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Fetch(FetchMode.SUBSELECT)
    private List<ResumeAchievement> achievements = new ArrayList<>();

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Fetch(FetchMode.SUBSELECT)
    private List<ResumeLanguage> languages = new ArrayList<>();
}
