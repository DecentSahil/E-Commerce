package com.example.auth.dto.response;

import com.example.auth.entity.AccountStatus;
import com.example.auth.entity.Role;
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
public class UserResponse {

    private UUID id;
    private String email;
    private Role role;
    private AccountStatus accountStatus;
    private Instant createdAt;
}
