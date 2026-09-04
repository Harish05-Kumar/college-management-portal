package project.collegeplacement.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class JobData {
    private String job_id;
    private String job_title;
    private String employer_name;
    private String job_description;
    private String job_city;
    private String job_country;
    private String job_apply_link;
    private String job_employment_type;
    private String job_salary;
    private Double job_min_salary;
    private Double job_max_salary;
    private String job_salary_currency;
    private String job_posted_at_datetime_utc;
    private List<String> job_required_skills;
    private Map<String, List<String>> job_highlights;

    // Convenience methods for mapping
    public String getId() {
        return job_id;
    }

    public String getTitle() {
        return job_title;
    }

    public String getCompany() {
        return employer_name;
    }

    public String getDescription() {
        return job_description;
    }

    public String getLocation() {
        return job_city != null ? job_city : job_country;
    }

    public String getUrl() {
        return job_apply_link;
    }

    public String getJobType() {
        return job_employment_type;
    }

    public String getSalary() {
        if (job_salary != null && !job_salary.isBlank()) {
            return job_salary;
        }

        if (job_min_salary == null && job_max_salary == null) {
            return null;
        }

        String currency = job_salary_currency == null || job_salary_currency.isBlank()
                ? ""
                : job_salary_currency + " ";

        if (job_min_salary != null && job_max_salary != null) {
            return currency + trimSalary(job_min_salary) + " - " + trimSalary(job_max_salary);
        }

        return currency + trimSalary(job_min_salary != null ? job_min_salary : job_max_salary);
    }

    public String getPostedDate() {
        return job_posted_at_datetime_utc;
    }

    public List<String> getSkills() {
        return job_required_skills;
    }

    public List<String> getRequirements() {
        Set<String> requirements = new LinkedHashSet<>();

        if (job_required_skills != null) {
            job_required_skills.stream()
                    .filter(this::hasText)
                    .map(String::trim)
                    .forEach(requirements::add);
        }

        if (job_highlights != null) {
            job_highlights.entrySet().stream()
                    .filter(entry -> isRequirementSection(entry.getKey()))
                    .map(Map.Entry::getValue)
                    .filter(values -> values != null)
                    .flatMap(List::stream)
                    .filter(this::hasText)
                    .map(String::trim)
                    .forEach(requirements::add);
        }

        return new ArrayList<>(requirements);
    }

    private boolean isRequirementSection(String section) {
        if (section == null) {
            return false;
        }

        String normalized = section.toLowerCase();
        return normalized.contains("qualification")
                || normalized.contains("requirement")
                || normalized.contains("skill")
                || normalized.contains("technology")
                || normalized.contains("technologies");
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String trimSalary(Double value) {
        if (value == null) {
            return "";
        }
        if (value % 1 == 0) {
            return String.valueOf(value.longValue());
        }
        return String.valueOf(value);
    }
}
