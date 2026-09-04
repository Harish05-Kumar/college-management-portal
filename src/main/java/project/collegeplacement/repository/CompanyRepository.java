package project.collegeplacement.repository;

import project.collegeplacement.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    List<Company> findByCompanyNameContainingIgnoreCase(String companyName);

    List<Company> findByRequiredCgpaLessThanEqual(Double cgpa);
}
