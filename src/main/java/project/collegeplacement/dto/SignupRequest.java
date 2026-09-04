package project.collegeplacement.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class SignupRequest {

    private String name;
    private String email;
    private String password;
    private String confirmPassword;
    private Double cgpa;
    private String department;
    private String skills;
    private MultipartFile profilePhoto;
}
