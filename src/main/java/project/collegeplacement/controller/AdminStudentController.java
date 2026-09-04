package project.collegeplacement.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.collegeplacement.dto.AdminStudentDetailResponse;
import project.collegeplacement.dto.AdminStudentListResponse;
import project.collegeplacement.dto.ApplicationResponse;
import project.collegeplacement.service.AdminStudentService;
import project.collegeplacement.service.ApplicationService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/students")
@RequiredArgsConstructor
public class AdminStudentController {

    private final AdminStudentService adminStudentService;
    private final ApplicationService applicationService;

    @GetMapping
    public List<AdminStudentListResponse> getStudents() {
        return adminStudentService.getAllStudents();
    }

    @GetMapping("/{id}")
    public AdminStudentDetailResponse getStudentDetails(@PathVariable Long id) {
        return adminStudentService.getStudentDetails(id);
    }

    @GetMapping("/{id}/applications")
    public List<ApplicationResponse> getStudentApplications(@PathVariable Long id) {
        return applicationService.getStudentApplicationsByStudentId(id);
    }

    @DeleteMapping("/{id}")
    public String deleteStudent(@PathVariable Long id) {
        adminStudentService.deleteStudent(id);
        return "Student deleted successfully";
    }
}
