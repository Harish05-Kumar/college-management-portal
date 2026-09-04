package project.collegeplacement.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import project.collegeplacement.dto.PlacementDriveDto;
import project.collegeplacement.entity.PlacementDrive;
import project.collegeplacement.service.JobApiService;
import project.collegeplacement.service.PlacementDriveService;

import java.util.List;

@RestController
@RequestMapping("/placement-drives")
@RequiredArgsConstructor
public class PlacementDriveController {

    private final PlacementDriveService placementDriveService;
    private final JobApiService jobApiService;

    @PostMapping
    public PlacementDriveDto createDrive(@RequestBody PlacementDriveDto placementDrive) {
        return toDto(placementDriveService.createDrive(toEntity(placementDrive)));
    }

    @GetMapping
    public List<PlacementDriveDto> getAllDrives() {
        return placementDriveService.getAllDrives().stream()
                .map(this::toDto)
                .toList();
    }

    @GetMapping("/open")
    public List<PlacementDriveDto> getOpenDrives() {
        return placementDriveService.getOpenDrives().stream()
                .map(this::toDto)
                .toList();
    }

    @GetMapping("/count")
    public long countAdminVisibleDrives() {
        return placementDriveService.countAdminVisibleDrives();
    }

    @GetMapping("/{id}")
    public PlacementDriveDto getDriveById(@PathVariable Long id) {
        return toDto(placementDriveService.getDriveById(id));
    }

    @PutMapping("/{id}")
    public PlacementDriveDto updateDrive(@PathVariable Long id, @RequestBody PlacementDriveDto placementDrive) {
        return toDto(placementDriveService.updateDrive(id, toEntity(placementDrive)));
    }

    @DeleteMapping("/{id}")
    public String deleteDrive(@PathVariable Long id) {
        placementDriveService.deleteDrive(id);
        return "Placement drive deleted successfully";
    }

    @PostMapping("/import-jobs")
    public String importJobsFromRapidAPI(@RequestParam(required = false) String query,
                                          @RequestParam(required = false) String location) {
        try {
            placementDriveService.importJobsFromRapidAPI(query, location);
            return "Jobs imported successfully from RapidAPI";
        } catch (Exception e) {
            return "Error importing jobs: " + e.getMessage();
        }
    }

    private PlacementDriveDto toDto(PlacementDrive drive) {
        PlacementDriveDto dto = new PlacementDriveDto();
        dto.setId(drive.getId());
        dto.setCompanyId(drive.getCompanyId());
        dto.setCompanyName(drive.getCompanyName());
        dto.setTitle(drive.getTitle());
        dto.setJobRole(drive.getJobRole());
        dto.setDescription(drive.getDescription());
        dto.setResponsibilities(drive.getResponsibilities());
        dto.setQualifications(drive.getQualifications());
        dto.setBenefits(drive.getBenefits());
        dto.setEmploymentType(drive.getEmploymentType());
        dto.setWorkMode(drive.getWorkMode());
        dto.setExperienceRequired(drive.getExperienceRequired());
        dto.setJobLocation(drive.getJobLocation());
        dto.setNumberOfOpenings(drive.getNumberOfOpenings());
        dto.setSelectionProcess(drive.getSelectionProcess());
        dto.setBondDetails(drive.getBondDetails());
        dto.setPackageAmount(drive.getPackageAmount());
        dto.setRequiredCgpa(drive.getRequiredCgpa());
        dto.setRequiredSkills(drive.getRequiredSkills());
        dto.setDriveDate(drive.getDriveDate());
        dto.setApplicationDeadline(drive.getApplicationDeadline());
        dto.setStatus(drive.getStatus());
        dto.setJobUrl(drive.getJobUrl());
        dto.setSource(drive.getSource());
        dto.setExternalJobId(drive.getExternalJobId());
        dto.setLocation(drive.getLocation());
        dto.setSalary(drive.getSalary());
        return dto;
    }

    private PlacementDrive toEntity(PlacementDriveDto dto) {
        PlacementDrive drive = new PlacementDrive();
        drive.setId(dto.getId());
        drive.setCompanyId(dto.getCompanyId());
        drive.setCompanyName(dto.getCompanyName());
        drive.setTitle(dto.getTitle());
        drive.setJobRole(dto.getJobRole());
        drive.setDescription(dto.getDescription());
        drive.setResponsibilities(dto.getResponsibilities());
        drive.setQualifications(dto.getQualifications());
        drive.setBenefits(dto.getBenefits());
        drive.setEmploymentType(dto.getEmploymentType());
        drive.setWorkMode(dto.getWorkMode());
        drive.setExperienceRequired(dto.getExperienceRequired());
        drive.setJobLocation(dto.getJobLocation());
        drive.setNumberOfOpenings(dto.getNumberOfOpenings());
        drive.setSelectionProcess(dto.getSelectionProcess());
        drive.setBondDetails(dto.getBondDetails());
        drive.setPackageAmount(dto.getPackageAmount());
        drive.setRequiredCgpa(dto.getRequiredCgpa());
        drive.setRequiredSkills(dto.getRequiredSkills());
        drive.setDriveDate(dto.getDriveDate());
        drive.setApplicationDeadline(dto.getApplicationDeadline());
        drive.setStatus(dto.getStatus());
        drive.setJobUrl(dto.getJobUrl());
        drive.setSource(dto.getSource());
        drive.setExternalJobId(dto.getExternalJobId());
        drive.setLocation(dto.getLocation());
        drive.setSalary(dto.getSalary());
        return drive;
    }
}
