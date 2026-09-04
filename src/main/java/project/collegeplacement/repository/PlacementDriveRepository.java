package project.collegeplacement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import project.collegeplacement.entity.PlacementDrive;

import java.util.List;

public interface PlacementDriveRepository extends JpaRepository<PlacementDrive, Long> {

    List<PlacementDrive> findByCompanyId(Long companyId);

    List<PlacementDrive> findByStatusIgnoreCase(String status);

    @Query("""
            select count(d)
            from PlacementDrive d
            where d.source is null
               or lower(d.source) <> 'rapidapi'
            """)
    long countAdminVisibleDrives();
}
