package project.collegeplacement.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class JobApiResponse {
    private JobApiData data;
    private String message;

    public List<JobData> getJobs() {
        return data == null || data.getJobs() == null ? List.of() : data.getJobs();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class JobApiData {
        private List<JobData> jobs;
        private String cursor;
    }
}
