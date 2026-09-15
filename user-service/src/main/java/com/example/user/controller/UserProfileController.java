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

    private final UserProfileService userProfileService;

    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> getProfile(@PathVariable("userId") UUID userId) {
        UserProfileResponse response = userProfileService.getProfile(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @PathVariable("userId") UUID userId,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        UserProfileResponse response = userProfileService.updateProfile(userId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> patchProfile(
            @PathVariable("userId") UUID userId,
            @Valid @RequestBody PatchUserProfileRequest request) {
        UserProfileResponse response = userProfileService.patchProfile(userId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<MessageResponse> deleteProfile(@PathVariable("userId") UUID userId) {
        userProfileService.deleteProfile(userId);
        return ResponseEntity.ok(new MessageResponse("User profile deleted successfully"));
    }
}
