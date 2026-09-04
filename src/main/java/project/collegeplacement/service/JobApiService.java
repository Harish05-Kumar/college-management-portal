package project.collegeplacement.service;

import io.netty.resolver.DefaultAddressResolverGroup;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import project.collegeplacement.dto.JobApiResponse;
import project.collegeplacement.dto.JobData;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobApiService {

    @Value("${rapidapi.api.key}")
    private String apiKey;

    @Value("${rapidapi.api.host}")
    private String apiHost;

    @Value("${rapidapi.api.url}")
    private String apiUrl;

    private WebClient webClient;

    private WebClient getWebClient() {
        if (webClient == null) {
            HttpClient httpClient = HttpClient.create()
                    .resolver(DefaultAddressResolverGroup.INSTANCE);

            webClient = WebClient.builder()
                    .baseUrl(apiUrl)
                    .clientConnector(new ReactorClientHttpConnector(httpClient))
                    .defaultHeader("X-RapidAPI-Key", apiKey)
                    .defaultHeader("X-RapidAPI-Host", apiHost)
                    .build();
        }
        return webClient;
    }

    public Mono<List<JobData>> fetchJobs(String query, String location, int numPages) {
        String endpoint = "/search-v2";
        String jobQuery = query != null && !query.isBlank() ? query : "software engineer";
        String jobLocation = location != null && !location.isBlank() ? location : "India";
        
        return getWebClient().get()
                .uri(uriBuilder -> uriBuilder
                        .path(endpoint)
                        .queryParam("query", jobQuery + " in " + jobLocation)
                        .queryParam("country", "in")
                        .queryParam("language", "en")
                        .queryParam("num_pages", String.valueOf(numPages))
                        .build())
                .retrieve()
                .bodyToMono(JobApiResponse.class)
                .map(JobApiResponse::getJobs)
                .onErrorResume(e -> {
                    System.err.println("Error fetching jobs from RapidAPI: " + e.getMessage());
                    e.printStackTrace();
                    return Mono.just(List.of());
                });
    }

    public Mono<List<JobData>> fetchJobsByQuery(String query) {
        return fetchJobs(query, null, 1);
    }

    public Mono<List<JobData>> fetchJobsByLocation(String location) {
        return fetchJobs(null, location, 1);
    }
}
