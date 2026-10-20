package com.example.user.controller;

import com.example.user.dto.request.PatchUserProfileRequest;
import com.example.user.dto.request.UpdateUserProfileRequest;
import com.example.user.dto.response.MessageResponse;
import com.example.user.dto.response.UserProfileResponse;
import com.example.user.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserProfileController {

    private static final String USER_ID_HEADER = "X-User-Id";

    private final UserProfileService userProfileService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentProfile(
            @RequestHeader(USER_ID_HEADER) UUID authUserId) {
        UserProfileResponse response = userProfileService.getProfile(authUserId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateCurrentProfile(
            @RequestHeader(USER_ID_HEADER) UUID authUserId,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        UserProfileResponse response = userProfileService.updateProfile(authUserId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/me")
    public ResponseEntity<UserProfileResponse> patchCurrentProfile(
            @RequestHeader(USER_ID_HEADER) UUID authUserId,
            @Valid @RequestBody PatchUserProfileRequest request) {
        UserProfileResponse response = userProfileService.patchProfile(authUserId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me")
    public ResponseEntity<MessageResponse> deleteCurrentProfile(
            @RequestHeader(USER_ID_HEADER) UUID authUserId) {
        userProfileService.deleteProfile(authUserId);
        return ResponseEntity.ok(new MessageResponse("User profile deleted successfully"));
    }

    @GetMapping("/{authUserId}")
    public ResponseEntity<UserProfileResponse> getProfile(@PathVariable("authUserId") UUID authUserId) {
        UserProfileResponse response = userProfileService.getProfile(authUserId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{authUserId}")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @PathVariable("authUserId") UUID authUserId,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        UserProfileResponse response = userProfileService.updateProfile(authUserId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{authUserId}")
    public ResponseEntity<UserProfileResponse> patchProfile(
            @PathVariable("authUserId") UUID authUserId,
            @Valid @RequestBody PatchUserProfileRequest request) {
        UserProfileResponse response = userProfileService.patchProfile(authUserId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{authUserId}")
    public ResponseEntity<MessageResponse> deleteProfile(@PathVariable("authUserId") UUID authUserId) {
        userProfileService.deleteProfile(authUserId);
        return ResponseEntity.ok(new MessageResponse("User profile deleted successfully"));
    }

    @PostMapping(value = "/me/avatar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfileResponse> uploadMyAvatar(
            @RequestHeader(USER_ID_HEADER) UUID authUserId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        UserProfileResponse response = userProfileService.uploadAvatar(authUserId, file);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/{authUserId}/avatar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfileResponse> uploadAvatar(
            @PathVariable("authUserId") UUID authUserId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        UserProfileResponse response = userProfileService.uploadAvatar(authUserId, file);
        return ResponseEntity.ok(response);
    }
}
