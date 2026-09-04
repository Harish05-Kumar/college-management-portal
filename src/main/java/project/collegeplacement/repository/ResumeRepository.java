package project.collegeplacement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import project.collegeplacement.entity.Resume;

import java.util.List;

public interface ResumeRepository extends JpaRepository<Resume, Long> {

    List<Resume> findByStudentId(Long studentId);

    void deleteByStudentId(Long studentId);
}
