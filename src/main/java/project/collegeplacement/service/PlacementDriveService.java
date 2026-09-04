package project.collegeplacement.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.collegeplacement.dto.JobData;
import project.collegeplacement.entity.Company;
import project.collegeplacement.entity.PlacementDrive;
import project.collegeplacement.repository.ApplicationRepository;
import project.collegeplacement.repository.CompanyRepository;
import project.collegeplacement.repository.PlacementDriveRepository;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PlacementDriveService {

    private static final int DESCRIPTION_LIMIT = 5000;

    private final PlacementDriveRepository placementDriveRepository;
    private final CompanyRepository companyRepository;
    private final ApplicationRepository applicationRepository;
    private final JobApiService jobApiService;

    public PlacementDrive createDrive(PlacementDrive placementDrive) {
        Company company = companyRepository.findById(placementDrive.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Company not found"));

        placementDrive.setCompanyName(company.getCompanyName());

        if (placementDrive.getRequiredCgpa() == null) {
            placementDrive.setRequiredCgpa(company.getRequiredCgpa());
        }
        if (placementDrive.getRequiredSkills() == null || placementDrive.getRequiredSkills().isBlank()) {
            placementDrive.setRequiredSkills(company.getRequiredSkills());
        }
        if (placementDrive.getPackageAmount() == null) {
            placementDrive.setPackageAmount(company.getPackageAmount());
        }

        return placementDriveRepository.save(placementDrive);
    }

    public List<PlacementDrive> getAllDrives() {
        return placementDriveRepository.findAll()
                .stream()
                .map(this::fillCompanyRequirements)
                .toList();
    }

    public long countAdminVisibleDrives() {
        return placementDriveRepository.countAdminVisibleDrives();
    }

    public List<PlacementDrive> getOpenDrives() {
        return placementDriveRepository.findAll()
                .stream()
                .filter(drive -> drive.getStatus() == null
                        || drive.getStatus().isBlank()
                        || drive.getStatus().equalsIgnoreCase("OPEN"))
                .map(this::fillCompanyRequirements)
                .toList();
    }

    public PlacementDrive getDriveById(Long id) {
        return fillCompanyRequirements(placementDriveRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Placement drive not found")));
    }

    public PlacementDrive updateDrive(Long id, PlacementDrive placementDrive) {
        PlacementDrive existingDrive = getDriveById(id);

        existingDrive.setCompanyId(placementDrive.getCompanyId());
        existingDrive.setTitle(placementDrive.getTitle());
        existingDrive.setJobRole(placementDrive.getJobRole());
        existingDrive.setDescription(placementDrive.getDescription());
        existingDrive.setResponsibilities(placementDrive.getResponsibilities());
        existingDrive.setQualifications(placementDrive.getQualifications());
        existingDrive.setBenefits(placementDrive.getBenefits());
        existingDrive.setEmploymentType(placementDrive.getEmploymentType());
        existingDrive.setWorkMode(placementDrive.getWorkMode());
        existingDrive.setExperienceRequired(placementDrive.getExperienceRequired());
        existingDrive.setJobLocation(placementDrive.getJobLocation());
        existingDrive.setNumberOfOpenings(placementDrive.getNumberOfOpenings());
        existingDrive.setSelectionProcess(placementDrive.getSelectionProcess());
        existingDrive.setBondDetails(placementDrive.getBondDetails());
        existingDrive.setPackageAmount(placementDrive.getPackageAmount());
        existingDrive.setRequiredCgpa(placementDrive.getRequiredCgpa());
        existingDrive.setRequiredSkills(placementDrive.getRequiredSkills());
        existingDrive.setDriveDate(placementDrive.getDriveDate());
        existingDrive.setApplicationDeadline(placementDrive.getApplicationDeadline());
        existingDrive.setStatus(placementDrive.getStatus());

        if (placementDrive.getCompanyId() != null) {
            companyRepository.findById(placementDrive.getCompanyId())
                    .ifPresent(company -> {
                        existingDrive.setCompanyName(company.getCompanyName());
                        if (existingDrive.getPackageAmount() == null) {
                            existingDrive.setPackageAmount(company.getPackageAmount());
                        }
                    });
        }

        return placementDriveRepository.save(existingDrive);
    }

    @Transactional
    public void deleteDrive(Long id) {
        getDriveById(id);
        applicationRepository.deleteByDriveId(id);
        placementDriveRepository.deleteById(id);
    }

    private PlacementDrive fillCompanyRequirements(PlacementDrive drive) {
        if (drive.getCompanyId() == null) {
            return drive;
        }

        if (drive.getCompanyName() == null) {
            companyRepository.findById(drive.getCompanyId())
                    .ifPresent(company -> drive.setCompanyName(company.getCompanyName()));
        }

        boolean missingCgpa = drive.getRequiredCgpa() == null;
        boolean missingSkills = drive.getRequiredSkills() == null || drive.getRequiredSkills().isBlank();
        boolean missingPackage = drive.getPackageAmount() == null;

        if (!missingCgpa && !missingSkills && !missingPackage) {
            return drive;
        }

        companyRepository.findById(drive.getCompanyId()).ifPresent(company -> {
            if (missingCgpa) {
                drive.setRequiredCgpa(company.getRequiredCgpa());
            }
            if (missingSkills) {
                drive.setRequiredSkills(company.getRequiredSkills());
            }
            if (missingPackage) {
                drive.setPackageAmount(company.getPackageAmount());
            }
        });

        return drive;
    }

    public void importJobsFromRapidAPI(String query, String location) {
        List<JobData> jobs = jobApiService.fetchJobs(query, location, 1).block();

        if (jobs == null || jobs.isEmpty()) {
            throw new RuntimeException("No jobs found from RapidAPI");
        }

        // To ensure we see the changes immediately, we can delete existing RapidAPI jobs or force update them.
        // For a clean transition, let's update them all.

        for (JobData job : jobs) {
            // Find by externalJobId
            PlacementDrive drive = placementDriveRepository.findAll().stream()
                    .filter(d -> job.getId() != null && job.getId().equals(d.getExternalJobId()))
                    .findFirst()
                    .orElse(new PlacementDrive());

            drive.setTitle(job.getTitle());
            drive.setCompanyName(job.getCompany());
            drive.setCompanyId(null);
            drive.setJobRole(job.getJobType() != null ? job.getJobType() : "Full-time");
            drive.setDescription(limitLength(job.getDescription(), DESCRIPTION_LIMIT));
            drive.setEmploymentType(job.getJobType() != null ? job.getJobType() : "Full-time");
            List<String> requirements = job.getRequirements();
            drive.setRequiredSkills(requirements != null && !requirements.isEmpty()
                    ? String.join("\n", requirements)
                    : "Requirements not specified.");
            
            if (drive.getId() == null) {
                drive.setDriveDate(LocalDate.now().plusWeeks(2));
                drive.setApplicationDeadline(LocalDate.now().plusWeeks(1));
                drive.setStatus("OPEN");
                drive.setSource("RapidAPI");
                drive.setExternalJobId(job.getId());
            }
            
            drive.setJobUrl(job.getUrl());
            drive.setLocation(job.getLocation());
            drive.setJobLocation(job.getLocation());
            drive.setSalary(job.getSalary());

            placementDriveRepository.save(drive);
        }
    }

    private String limitLength(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
