package project.collegeplacement.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import project.collegeplacement.dto.AdminStudentDetailResponse;
import project.collegeplacement.dto.AdminStudentListResponse;
import project.collegeplacement.entity.BuiltResume;
import project.collegeplacement.entity.Resume;
import project.collegeplacement.entity.Student;
import project.collegeplacement.repository.ApplicationRepository;
import project.collegeplacement.repository.BuiltResumeRepository;
import project.collegeplacement.repository.ResumeRepository;
import project.collegeplacement.repository.StudentRepository;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminStudentService {

    private final StudentRepository studentRepository;
    private final ResumeRepository resumeRepository;
    private final BuiltResumeRepository builtResumeRepository;
    private final ApplicationRepository applicationRepository;

    public List<AdminStudentListResponse> getAllStudents() {
        return studentRepository.findAll()
                .stream()
                .map(AdminStudentListResponse::from)
                .toList();
    }

    public AdminStudentDetailResponse getStudentDetails(Long id) {
        Student student = getStudent(id);
        List<Resume> resumes = resumeRepository.findByStudentId(id)
                .stream()
                .sorted(Comparator.comparing(Resume::getUploadedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        BuiltResume builtResume = builtResumeRepository.findByStudentId(id).orElse(null);
        return AdminStudentDetailResponse.from(student, resumes, builtResume);
    }

    @Transactional
    public void deleteStudent(Long id) {
        getStudent(id);
        applicationRepository.deleteByStudentId(id);
        builtResumeRepository.findByStudentId(id).ifPresent(builtResumeRepository::delete);
        resumeRepository.deleteByStudentId(id);
        studentRepository.deleteById(id);
    }

    private Student getStudent(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }
}
