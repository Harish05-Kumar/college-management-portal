package project.collegeplacement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    private String password;

    private Double cgpa;

    private String department;

    private String skills;

    private String profilePhoto;

    private LocalDateTime registeredAt;

    private String role = "ROLE_STUDENT";

    @PrePersist
    void onCreate() {
        if (registeredAt == null) {
            registeredAt = LocalDateTime.now();
        }
    }

    @Transient
    public String getProfilePhotoUrl() {
        return profilePhoto;
    }
}
