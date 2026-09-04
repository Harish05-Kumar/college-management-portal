package project.collegeplacement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "resumes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long studentId;

    private Long builtResumeId;

    private String sourceType;

    private String fileName;

    private String contentType;

    private Long fileSize;

    private LocalDateTime uploadedAt;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] data;
}
