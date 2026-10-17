package com.ecommerce.notification_service.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserProfileDto {
    private UUID id;
    private UUID authUserId;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
}
