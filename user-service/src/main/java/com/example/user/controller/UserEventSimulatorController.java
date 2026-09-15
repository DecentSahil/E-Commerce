package com.example.user.controller;

import com.example.user.dto.response.MessageResponse;
import com.example.user.event.UserEventConsumer;
import com.example.user.event.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/v1/users/events")
@RequiredArgsConstructor
public class UserEventSimulatorController {

    private final UserEventConsumer userEventConsumer;

    @PostMapping("/user-registered")
    public ResponseEntity<MessageResponse> simulateUserRegisteredEvent(@RequestBody UserRegisteredEvent event) {
        userEventConsumer.handleUserRegistered(event);
        return ResponseEntity.ok(new MessageResponse("USER_REGISTERED event simulated successfully."));
    }
}
