package com.example.order.client;

import com.example.order.client.dto.AddressDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

@FeignClient(name = "USER-SERVICE")
public interface UserFeignClient {

    @GetMapping("/api/v1/users/addresses/{addressId}")
    AddressDto getAddress(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable("addressId") UUID addressId
    );
}