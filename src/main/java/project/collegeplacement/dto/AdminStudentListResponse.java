package project.collegeplacement.dto;

import project.collegeplacement.entity.Student;

public record AdminStudentListResponse(
        Long id,
        String name,
        String department,
        String email,
        String profilePhotoUrl
) {

    public static AdminStudentListResponse from(Student student) {
        return new AdminStudentListResponse(
                student.getId(),
                student.getName(),
                student.getDepartment(),
                student.getEmail(),
                student.getProfilePhoto()
        );
    }
}
