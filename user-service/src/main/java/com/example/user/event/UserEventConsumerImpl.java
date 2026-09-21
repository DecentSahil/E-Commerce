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
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "auth-events", groupId = "user-service-group")
    public void onMessage(Object message) {
        log.info("[KAFKA_RECEIVED] auth-events: {}", message);
        try {
            Map<?, ?> map;
            if (message instanceof String str) {
                map = objectMapper.readValue(str, Map.class);
            } else if (message instanceof Map<?, ?> m) {
                map = m;
            } else {
                map = objectMapper.convertValue(message, Map.class);
            }

            Object payloadObj = map.get("payload");
            Map<?, ?> payload = payloadObj instanceof Map<?, ?> p ? p : map;

            String userIdStr = payload.get("userId") != null ? payload.get("userId").toString() : null;
            String email = payload.get("email") != null ? payload.get("email").toString() : null;
            String role = payload.get("role") != null ? payload.get("role").toString() : "USER";

            if (userIdStr != null) {
                UserRegisteredEvent event = UserRegisteredEvent.builder()
                        .userId(UUID.fromString(userIdStr))
                        .email(email)
                        .role(role)
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

        UserProfile profile = UserProfile.builder()
                .authUserId(event.getUserId())
                .email(event.getEmail() != null ? event.getEmail().trim().toLowerCase() : "")
                .build();

        userProfileRepository.save(profile);
        log.info("Created user profile for authUserId: {}", event.getUserId());
    }
}
