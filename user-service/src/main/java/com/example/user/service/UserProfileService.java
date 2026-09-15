package com.example.user.service;

import com.example.user.dto.request.CreateUserProfileRequest;
import com.example.user.dto.request.PatchUserProfileRequest;
import com.example.user.dto.request.UpdateUserProfileRequest;
import com.example.user.dto.response.UserProfileResponse;

import java.util.UUID;

public interface UserProfileService {

    UserProfileResponse createProfile(CreateUserProfileRequest request);

    UserProfileResponse getProfile(UUID authUserId);

    UserProfileResponse updateProfile(UUID authUserId, UpdateUserProfileRequest request);

    UserProfileResponse patchProfile(UUID authUserId, PatchUserProfileRequest request);

    void deleteProfile(UUID authUserId);
}
