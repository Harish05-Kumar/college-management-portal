package project.collegeplacement.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import project.collegeplacement.entity.BuiltResume;
import project.collegeplacement.entity.Resume;
import project.collegeplacement.service.ResumeService;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping("/upload")
    public Resume uploadResume(@RequestParam("file") MultipartFile file,
                               Authentication authentication) throws IOException {
        Resume resume = resumeService.uploadResume(authentication.getName(), file);
        resume.setData(null);
        return resume;
    }

    @GetMapping("/me")
    public List<Resume> getMyResumes(Authentication authentication) {
        return resumeService.getMyResumes(authentication.getName())
                .stream()
                .peek(resume -> resume.setData(null))
                .toList();
    }

    @GetMapping("/builder/me")
    public BuiltResume getMyBuiltResume(Authentication authentication) {
        return resumeService.getMyBuiltResume(authentication.getName());
    }

    @PostMapping("/builder")
    public BuiltResume saveBuiltResume(@RequestBody BuiltResume resume,
                                       Authentication authentication) {
        BuiltResume saved = resumeService.saveBuiltResume(authentication.getName(), resume);
        if (saved.getResumeId() != null) {
            saved.setResumeId(saved.getResumeId());
        }
        return saved;
    }

    @GetMapping("/{resumeId}/builder")
    public BuiltResume getBuiltResumeByResumeId(@PathVariable Long resumeId) {
        return resumeService.getBuiltResumeByGeneratedResumeId(resumeId);
    }

    @GetMapping("/{resumeId}/download")
    public ResponseEntity<byte[]> downloadResume(@PathVariable Long resumeId,
                                                 Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
        Resume resume = isAdmin
                ? resumeService.downloadResumeForAdmin(resumeId)
                : resumeService.downloadResume(authentication.getName(), resumeId);

        String contentType = resume.getContentType() == null
                ? MediaType.APPLICATION_OCTET_STREAM_VALUE
                : resume.getContentType();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resume.getFileName() + "\"")
                .body(resume.getData());
    }

    @DeleteMapping("/{resumeId}")
    public void deleteResume(@PathVariable Long resumeId,
                             Authentication authentication) {
        resumeService.deleteResume(authentication.getName(), resumeId);
    }
}
