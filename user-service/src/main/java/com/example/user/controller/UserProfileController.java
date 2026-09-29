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
}
