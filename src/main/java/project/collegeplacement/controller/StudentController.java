package project.collegeplacement.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import project.collegeplacement.entity.Student;
import project.collegeplacement.service.StudentService;

import java.util.List;

@RestController
@RequestMapping("/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @PostMapping
    public Student saveStudent(@RequestBody Student student) {
        return studentService.saveStudent(student);
    }

    @GetMapping
    public List<Student> getAllStudents() {
        return studentService.getAllStudents();
    }

    @GetMapping("/{id}")
    public Student getStudentById(@PathVariable Long id) {
        return studentService.getStudentById(id);
    }

    @GetMapping("/me")
    public Student getCurrentStudent(Authentication authentication) {
        return getAuthenticatedStudent(authentication);
    }

    @GetMapping("/profile")
    public Student getCurrentStudentProfile(Authentication authentication) {
        return getAuthenticatedStudent(authentication);
    }

    private Student getAuthenticatedStudent(Authentication authentication) {
        Student student = studentService.getStudentByEmail(authentication.getName());
        student.setPassword(null);
        return student;
    }

    @DeleteMapping("/{id}")
    public String deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return "Student deleted successfully";
    }
}
