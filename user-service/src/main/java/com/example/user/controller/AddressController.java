package com.example.user.controller;

import com.example.user.dto.request.AddressRequest;
import com.example.user.dto.response.AddressResponse;
import com.example.user.dto.response.MessageResponse;
import com.example.user.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users/addresses")
@RequiredArgsConstructor
public class AddressController {

    private static final String USER_ID_HEADER = "X-User-Id";

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<List<AddressResponse>> getAddresses(
            @RequestHeader(USER_ID_HEADER) UUID userId) {

        List<AddressResponse> addresses =
                addressService.getAddresses(userId);

        return ResponseEntity.ok(addresses);
    }

    @PostMapping
    public ResponseEntity<AddressResponse> addAddress(
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @Valid @RequestBody AddressRequest request) {

        AddressResponse response =
                addressService.addAddress(userId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<AddressResponse> updateAddress(
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @PathVariable UUID addressId,
            @Valid @RequestBody AddressRequest request) {

        AddressResponse response =
                addressService.updateAddress(
                        userId,
                        addressId,
                        request
                );

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<MessageResponse> deleteAddress(
            @RequestHeader(USER_ID_HEADER) UUID userId,
            @PathVariable UUID addressId) {

        addressService.deleteAddress(userId, addressId);

        return ResponseEntity.ok(
                new MessageResponse("Address deleted successfully")
        );
    }
}