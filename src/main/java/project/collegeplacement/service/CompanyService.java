package project.collegeplacement.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.collegeplacement.entity.Company;
import project.collegeplacement.entity.PlacementDrive;
import project.collegeplacement.repository.ApplicationRepository;
import project.collegeplacement.repository.CompanyRepository;
import project.collegeplacement.repository.PlacementDriveRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final PlacementDriveRepository placementDriveRepository;
    private final ApplicationRepository applicationRepository;

    public Company saveCompany(Company company) {
        return companyRepository.save(company);
    }

    public List<Company> getAllCompanies() {
        return companyRepository.findAll()
                .stream()
                .filter(this::isAdminCreatedCompany)
                .toList();
    }

    public Company getCompanyById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found"));
    }

    public Company updateCompany(Long id, Company company) {
        Company existingCompany = getCompanyById(id);

        existingCompany.setCompanyName(company.getCompanyName());
        existingCompany.setRequiredCgpa(company.getRequiredCgpa());
        existingCompany.setRequiredSkills(company.getRequiredSkills());
        existingCompany.setPackageAmount(company.getPackageAmount());

        return companyRepository.save(existingCompany);
    }

    @Transactional
    public void deleteCompany(Long id) {
        getCompanyById(id);
        List<PlacementDrive> drives = placementDriveRepository.findByCompanyId(id);
        drives.forEach(drive -> applicationRepository.deleteByDriveId(drive.getId()));
        applicationRepository.deleteByCompanyId(id);
        placementDriveRepository.deleteAll(drives);
        companyRepository.deleteById(id);
    }

    public List<Company> searchCompaniesByName(String companyName) {
        return companyRepository.findByCompanyNameContainingIgnoreCase(companyName)
                .stream()
                .filter(this::isAdminCreatedCompany)
                .toList();
    }

    private boolean isAdminCreatedCompany(Company company) {
        return company.getPackageAmount() != null;
    }
}
