package project.collegeplacement.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import project.collegeplacement.dto.ApplicationRequest;
import project.collegeplacement.dto.ApplicationResponse;
import project.collegeplacement.dto.EligibilityResponse;
import project.collegeplacement.entity.Application;
import project.collegeplacement.service.ApplicationService;

import java.util.List;

@RestController
@RequestMapping("/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping("/apply/{driveId}")
    public Application applyForDrive(@PathVariable Long driveId,
                                     @RequestBody(required = false) ApplicationRequest request,
                                     Authentication authentication) {
        return applicationService.applyForDrive(getAuthenticatedEmail(authentication), driveId, request);
    }

    @GetMapping("/eligible/{driveId}")
    public boolean checkEligibility(@PathVariable Long driveId, Authentication authentication) {
        return applicationService.checkEligibility(getAuthenticatedEmail(authentication), driveId);
    }

    @GetMapping("/eligibility/{driveId}")
    public EligibilityResponse getEligibility(@PathVariable Long driveId, Authentication authentication) {
        return applicationService.getEligibility(getAuthenticatedEmail(authentication), driveId);
    }

    @GetMapping
    public List<ApplicationResponse> getAllApplications() {
        return applicationService.getAllApplications();
    }

    @GetMapping("/count")
    public long getApplicationCount() {
        return applicationService.getApplicationCount();
    }

    @GetMapping("/student/me")
    public List<ApplicationResponse> getMyApplications(Authentication authentication) {
        return applicationService.getStudentApplications(getAuthenticatedEmail(authentication));
    }

    @GetMapping("/drive/{driveId}")
    public List<ApplicationResponse> getDriveApplications(@PathVariable Long driveId) {
        return applicationService.getDriveApplications(driveId);
    }

    @PutMapping("/{applicationId}/status")
    public Application updateStatus(@PathVariable Long applicationId, @RequestParam String status) {
        return applicationService.updateStatus(applicationId, status);
    }

    @PatchMapping("/{applicationId}/status")
    public Application patchStatus(@PathVariable Long applicationId, @RequestParam String status) {
        return applicationService.updateStatus(applicationId, status);
    }

    @PostMapping("/{applicationId}/send-email")
    public void sendStatusEmail(@PathVariable Long applicationId) {
        applicationService.sendStatusEmail(applicationId);
    }

    @DeleteMapping("/{applicationId}")
    public void deleteApplication(@PathVariable Long applicationId) {
        applicationService.deleteApplication(applicationId);
    }

    private String getAuthenticatedEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new RuntimeException("Student account is not authenticated.");
        }
        return authentication.getName();
    }
}
