package project.collegeplacement.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/index.html", "/assets/**", "/uploads/**", "/favicon.ico", "/error").permitAll()
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/api/admin/students/**").hasRole("ADMIN")
                        .requestMatchers("/students/me", "/students/profile").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET, "/companies/**", "/placement-drives/**").hasAnyRole("ADMIN", "STUDENT")
                        .requestMatchers("/companies/**", "/students/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/placement-drives/import-jobs").hasAnyRole("ADMIN", "STUDENT")
                        .requestMatchers(HttpMethod.PUT, "/placement-drives/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/placement-drives/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/placement-drives/**").hasAnyRole("ADMIN", "STUDENT")
                        .requestMatchers(HttpMethod.GET, "/resumes/*/download", "/resumes/*/builder").hasAnyRole("ADMIN", "STUDENT")
                        .requestMatchers(HttpMethod.GET, "/resumes/me", "/resumes/builder/me").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.POST, "/resumes/upload", "/resumes/builder").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.DELETE, "/resumes/**").hasRole("STUDENT")
                        .requestMatchers("/applications/apply/**", "/applications/eligible/**", "/applications/student/**").hasRole("STUDENT")
                        .requestMatchers("/applications/**").hasRole("ADMIN")
                        .anyRequest().permitAll()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8080"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
