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

        UserProfile profile = userProfileRepository.findByAuthUserId(userId)
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

        UserProfile profile = userProfileRepository.findByAuthUserId(userId)
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

        UserProfile profile = userProfileRepository.findByAuthUserId(userId)
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

        UserProfile profile = userProfileRepository.findByAuthUserId(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User profile not found for ID: " + userId
                        ));

        userProfileRepository.delete(profile);
    }

    @Override
    @Transactional
    public UserProfileResponse uploadAvatar(UUID authUserId, org.springframework.web.multipart.MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty avatar file.");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("Avatar file size exceeds maximum limit of 10MB.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        String contentType = file.getContentType();
        boolean isValidMime = contentType != null && contentType.startsWith("image/");
        java.util.List<String> allowedExtensions = java.util.Arrays.asList(".jpg", ".jpeg", ".png", ".webp", ".gif");
        if (!isValidMime && !allowedExtensions.contains(extension)) {
            throw new IllegalArgumentException("Only valid image formats (JPEG, PNG, WebP, GIF) are allowed.");
        }

        try {
            java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads/avatars");
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }

            String uniqueFilename = UUID.randomUUID() + (extension.isEmpty() ? ".jpg" : extension);
            java.nio.file.Path destination = uploadPath.resolve(uniqueFilename);
            java.nio.file.Files.copy(file.getInputStream(), destination, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String avatarUrl = "/api/v1/users/avatars/" + uniqueFilename;

            UserProfile profile = userProfileRepository.findByAuthUserId(authUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("User profile not found for ID: " + authUserId));

            profile.setProfilePictureUrl(avatarUrl);
            UserProfile updated = userProfileRepository.save(profile);
            log.info("User avatar uploaded successfully for user {}: {}", authUserId, avatarUrl);

            return userMapper.toResponse(updated);
        } catch (java.io.IOException e) {
            log.error("Failed to store uploaded avatar for user {}", authUserId, e);
            throw new RuntimeException("Failed to save avatar image: " + e.getMessage(), e);
        }
    }
}