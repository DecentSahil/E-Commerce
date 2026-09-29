package com.example.order.client;

import com.example.order.client.dto.AddressDto;

import java.util.Optional;
import java.util.UUID;

public interface UserClient {

    Optional<AddressDto> getAddress(
            UUID userId,
            UUID addressId
    );
}