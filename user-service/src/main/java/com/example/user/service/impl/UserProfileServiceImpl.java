package com.example.user.service.impl;

import com.example.user.dto.request.CreateUserProfileRequest;
import com.example.user.dto.request.PatchUserProfileRequest;
import com.example.user.dto.request.UpdateUserProfileRequest;
import com.example.user.dto.response.UserProfileResponse;
import com.example.user.entity.UserProfile;
import com.example.user.exception.DuplicateResourceException;
import com.example.user.exception.ResourceNotFoundException;
import com.example.user.mapper.UserMapper;
import com.example.user.repository.UserProfileRepository;
import com.example.user.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;


@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public UserProfileResponse createProfile(CreateUserProfileRequest request) {

        if (userProfileRepository.existsByAuthUserId(request.getAuthUserId())) {
            throw new DuplicateResourceException(
                    "Profile already exists for authUserId: "
                            + request.getAuthUserId()
            );
        }

        UserProfile userProfile = UserProfile.builder()
                .authUserId(request.getAuthUserId())
                .email(request.getEmail() != null
                        ? request.getEmail().trim().toLowerCase()
                        : "")
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .profilePictureUrl(request.getProfilePictureUrl())
                .build();

        UserProfile saved = userProfileRepository.save(userProfile);

        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {

        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User profile not found for ID: " + userId
                        ));

        return userMapper.toResponse(profile);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(
            UUID userId,
            UpdateUserProfileRequest request) {

        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User profile not found for ID: " + userId
                        ));

        profile.setFirstName(request.getFirstName());
        profile.setLastName(request.getLastName());
        profile.setPhoneNumber(request.getPhoneNumber());
        profile.setProfilePictureUrl(request.getProfilePictureUrl());

        UserProfile updated = userProfileRepository.save(profile);

        return userMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public UserProfileResponse patchProfile(
            UUID userId,
            PatchUserProfileRequest request) {

        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User profile not found for ID: " + userId
                        ));

        if (request.getFirstName() != null) {
            profile.setFirstName(request.getFirstName());
        }

        if (request.getLastName() != null) {
            profile.setLastName(request.getLastName());
        }

        if (request.getPhoneNumber() != null) {
            profile.setPhoneNumber(request.getPhoneNumber());
        }

        if (request.getProfilePictureUrl() != null) {
            profile.setProfilePictureUrl(request.getProfilePictureUrl());
        }

        UserProfile updated = userProfileRepository.save(profile);

        return userMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteProfile(UUID userId) {

        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User profile not found for ID: " + userId
                        ));

        userProfileRepository.delete(profile);
    }
}