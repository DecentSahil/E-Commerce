package com.example.user.event;

import com.example.user.entity.UserProfile;
import com.example.user.repository.UserProfileRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserEventConsumerImpl implements UserEventConsumer {

    private final UserProfileRepository userProfileRepository;

    @KafkaListener(topics = "auth-events", groupId = "user-service-group")
    public void onMessage(Map<?, ?> map) {

        log.info("[KAFKA_RECEIVED] auth-events: {}", map);

        try {
            Object payloadObj = map.get("payload");

            Map<?, ?> payload =
                    payloadObj instanceof Map<?, ?> p ? p : map;

            String userIdStr = payload.get("userId") != null
                    ? payload.get("userId").toString()
                    : null;

            String email = payload.get("email") != null
                    ? payload.get("email").toString()
                    : null;

            String role = payload.get("role") != null
                    ? payload.get("role").toString()
                    : "ROLE_USER";

            String name = payload.get("name") != null
                    ? payload.get("name").toString()
                    : null;

            if (userIdStr != null) {

                UserRegisteredEvent event =
                        UserRegisteredEvent.builder()
                                .userId(UUID.fromString(userIdStr))
                                .email(email)
                                .role(role)
                                .name(name)
                                .build();

                handleUserRegistered(event);
            }

        } catch (Exception ex) {
            log.error("Error consuming auth event: {}", ex.getMessage(), ex);
        }
    }

    @Override
    @Transactional
    public void handleUserRegistered(UserRegisteredEvent event) {
        log.info("[EVENT_RECEIVED] Processing USER_REGISTERED event for authUserId: {}, email: {}",
                event.getUserId(), event.getEmail());

        if (event.getUserId() == null) {
            log.warn("Discarding USER_REGISTERED event with null userId");
            return;
        }

        if (userProfileRepository.existsByAuthUserId(event.getUserId())) {
            log.info("User profile already exists for authUserId: {}. Skipping duplicate event.", event.getUserId());
            return;
        }

        String normalizedEmail = event.getEmail() != null ? event.getEmail().trim().toLowerCase() : "";
        if (!normalizedEmail.isBlank()) {
            java.util.Optional<UserProfile> existingByEmail = userProfileRepository.findByEmailIgnoreCase(normalizedEmail);
            if (existingByEmail.isPresent()) {
                log.warn("UserProfile already exists with email: {}. Skipping duplicate event.", normalizedEmail);
                return;
            }
        }

        String firstName = null;
        String lastName = null;
        if (event.getName() != null && !event.getName().isBlank()) {
            String[] parts = event.getName().trim().split("\\s+", 2);
            firstName = parts[0];
            if (parts.length > 1) {
                lastName = parts[1];
            }
        }

        UserProfile profile = UserProfile.builder()
                .authUserId(event.getUserId())
                .email(normalizedEmail)
                .firstName(firstName)
                .lastName(lastName)
                .build();

        userProfileRepository.save(profile);
        log.info("Created user profile for authUserId: {}, name: {} {}", event.getUserId(), firstName, lastName);
    }
}
