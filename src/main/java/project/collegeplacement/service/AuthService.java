package project.collegeplacement.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import project.collegeplacement.config.JwtUtil;
import project.collegeplacement.dto.JwtResponse;
import project.collegeplacement.dto.LoginRequest;
import project.collegeplacement.dto.RegistrationResponse;
import project.collegeplacement.dto.SignupRequest;
import project.collegeplacement.entity.Admin;
import project.collegeplacement.entity.Student;
import project.collegeplacement.repository.AdminRepository;
import project.collegeplacement.repository.StudentRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final StudentRepository studentRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final MailService mailService;

    private static final long MAX_PROFILE_PHOTO_SIZE = 2 * 1024 * 1024;
    private static final Path PROFILE_PHOTO_UPLOAD_DIR = Paths.get("uploads", "profile-photos");
    private static final Set<String> ALLOWED_PHOTO_EXTENSIONS = Set.of("jpg", "jpeg", "png");
    private static final Set<String> ALLOWED_PHOTO_CONTENT_TYPES = Set.of("image/jpeg", "image/png");

    public RegistrationResponse registerStudent(SignupRequest request) {
        validateRegistration(request);
        String email = request.getEmail().trim();

        if (studentRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        Student student = new Student();

        student.setName(request.getName().trim());
        student.setEmail(email);
        student.setPassword(passwordEncoder.encode(request.getPassword()));
        student.setCgpa(request.getCgpa());
        student.setDepartment(request.getDepartment().trim());
        student.setSkills(request.getSkills());
        student.setProfilePhoto(saveProfilePhoto(request.getProfilePhoto()));

        Student savedStudent = studentRepository.save(student);
        mailService.sendRegistrationEmail(savedStudent);

        return new RegistrationResponse("Student Registered Successfully", savedStudent.getProfilePhoto());
    }

    public JwtResponse loginStudent(LoginRequest request) {

        Student student = studentRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("Invalid email"));

        if (!passwordEncoder.matches(request.getPassword(), student.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtUtil.generateToken(student.getEmail(), student.getRole());

        return new JwtResponse(token, student.getEmail(), student.getRole(), student.getId(), student.getProfilePhoto());
    }

    public JwtResponse loginAdmin(LoginRequest request) {

        Admin admin = adminRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("Invalid email"));

        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtUtil.generateToken(admin.getEmail(), admin.getRole());

        return new JwtResponse(token, admin.getEmail(), admin.getRole(), admin.getId());
    }

    private void validateRegistration(SignupRequest request) {
        if (request.getName() == null || request.getName().isBlank()
                || request.getEmail() == null || request.getEmail().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()
                || request.getConfirmPassword() == null || request.getConfirmPassword().isBlank()
                || request.getDepartment() == null || request.getDepartment().isBlank()
                || request.getCgpa() == null) {
            throw new RuntimeException("All fields are required");
        }

        validateProfilePhoto(request.getProfilePhoto());

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Password and Confirm Password must match");
        }

        if (request.getCgpa() < 0 || request.getCgpa() > 10) {
            throw new RuntimeException("CGPA must be between 0 and 10");
        }
    }

    private void validateProfilePhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Passport Size Photo is required");
        }

        if (file.getSize() > MAX_PROFILE_PHOTO_SIZE) {
            throw new RuntimeException("Passport Size Photo must be 2 MB or smaller");
        }

        String extension = getExtension(file.getOriginalFilename());
        if (!ALLOWED_PHOTO_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("Passport Size Photo must be a JPG, JPEG, or PNG file");
        }

        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()
                && !ALLOWED_PHOTO_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new RuntimeException("Passport Size Photo must be a JPG, JPEG, or PNG file");
        }
    }

    private String saveProfilePhoto(MultipartFile file) {
        try {
            Files.createDirectories(PROFILE_PHOTO_UPLOAD_DIR);
            String extension = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + "." + extension;
            Path target = PROFILE_PHOTO_UPLOAD_DIR.resolve(filename).normalize();
            Files.copy(file.getInputStream(), target);
            return "/uploads/profile-photos/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Unable to save profile photo", e);
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
