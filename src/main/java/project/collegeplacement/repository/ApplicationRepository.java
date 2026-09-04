package project.collegeplacement.repository;

import project.collegeplacement.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByStudentId(Long studentId);

    List<Application> findByStudentIdOrderByAppliedAtDesc(Long studentId);

    List<Application> findByCompanyId(Long companyId);

    List<Application> findByDriveId(Long driveId);

    boolean existsByStudentIdAndDriveId(Long studentId, Long driveId);

    void deleteByStudentId(Long studentId);

    void deleteByCompanyId(Long companyId);

    void deleteByDriveId(Long driveId);
}
