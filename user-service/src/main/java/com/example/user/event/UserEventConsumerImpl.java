package com.example.user.event;

import com.example.user.entity.UserProfile;
import com.example.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserEventConsumerImpl implements UserEventConsumer {

    private final UserProfileRepository userProfileRepository;

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
