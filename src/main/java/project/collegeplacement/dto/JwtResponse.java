package project.collegeplacement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {

    private String token;
    private String email;
    private String role;
    private Long userId;
    private String profilePhotoUrl;

    public JwtResponse(String token) {
        this.token = token;
    }

    public JwtResponse(String token, String email, String role) {
        this.token = token;
        this.email = email;
        this.role = role;
    }

    public JwtResponse(String token, String email, String role, Long userId) {
        this.token = token;
        this.email = email;
        this.role = role;
        this.userId = userId;
    }
}
