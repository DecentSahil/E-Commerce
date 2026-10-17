package com.ecommerce.notification_service.client;

import com.ecommerce.notification_service.dto.external.UserProfileDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserServiceClient {

    private final RestClient restClient;

    public Optional<UserProfileDto> getUserProfile(UUID authUserId) {
        if (authUserId == null) {
            return Optional.empty();
        }

        try {
            UserProfileDto profile = restClient.get()
                    .uri("/api/v1/users/{authUserId}", authUserId)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, resp) -> {
                        log.warn("[USER_CLIENT] User not found or client error for authUserId: {}, status: {}",
                                authUserId, resp.getStatusCode());
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (req, resp) -> {
                        log.error("[USER_CLIENT] User Service server error for authUserId: {}, status: {}",
                                authUserId, resp.getStatusCode());
                    })
                    .body(UserProfileDto.class);

            return Optional.ofNullable(profile);
        } catch (Exception ex) {
            log.error("[USER_CLIENT_ERROR] Failed to fetch user profile for authUserId: {}: {}",
                    authUserId, ex.getMessage());
            return Optional.empty();
        }
    }
}
