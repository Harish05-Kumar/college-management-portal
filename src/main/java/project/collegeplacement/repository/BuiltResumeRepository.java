package project.collegeplacement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import project.collegeplacement.entity.BuiltResume;

import java.util.Optional;

public interface BuiltResumeRepository extends JpaRepository<BuiltResume, Long> {

    Optional<BuiltResume> findByStudentId(Long studentId);

    Optional<BuiltResume> findByResumeId(Long resumeId);
}
