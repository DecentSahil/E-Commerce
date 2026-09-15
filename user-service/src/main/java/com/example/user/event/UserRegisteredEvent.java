package com.example.user.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRegisteredEvent {

    @Builder.Default
    private String eventType = "USER_REGISTERED";

    private UUID userId;
    private String email;
    private String role;

    @Builder.Default
    private Instant timestamp = Instant.now();
}
