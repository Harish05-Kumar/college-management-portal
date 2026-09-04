package project.collegeplacement.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import project.collegeplacement.dto.JwtResponse;
import project.collegeplacement.dto.LoginRequest;
import project.collegeplacement.dto.RegistrationResponse;
import project.collegeplacement.dto.SignupRequest;
import project.collegeplacement.service.AuthService;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/test")
    public String test() {
        return "Working";
    }

    @GetMapping("/hello")
    public String hello() {
        System.out.println("HELLO HIT");
        return "hello";
    }

    @PostMapping("/dummy")
    public String dummy() {
        System.out.println("DUMMY HIT");
        return "dummy";
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public RegistrationResponse register(@ModelAttribute SignupRequest request) {
        System.out.println("REGISTER API HIT");
        return authService.registerStudent(request);
    }

    @PostMapping({"/login", "/student/login"})
    public JwtResponse login(@RequestBody LoginRequest request) {
        return authService.loginStudent(request);
    }

    @PostMapping("/admin/login")
    public JwtResponse adminLogin(@RequestBody LoginRequest request) {
        return authService.loginAdmin(request);
    }
}
