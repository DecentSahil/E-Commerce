package com.example.user.mapper;

import com.example.user.dto.response.AddressResponse;
import com.example.user.dto.response.UserProfileResponse;
import com.example.user.entity.UserProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class UserMapper {

    private final AddressMapper addressMapper;

    public UserProfileResponse toResponse(UserProfile profile) {
        if (profile == null) {
            return null;
        }

        List<AddressResponse> addressResponses = profile.getAddresses() != null
                ? profile.getAddresses().stream().map(addressMapper::toResponse).toList()
                : Collections.emptyList();

        return UserProfileResponse.builder()
                .id(profile.getId())
                .authUserId(profile.getAuthUserId())
                .email(profile.getEmail())
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .phoneNumber(profile.getPhoneNumber())
                .profilePictureUrl(profile.getProfilePictureUrl())
                .addresses(addressResponses)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
