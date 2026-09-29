package com.example.order.client;

import com.example.order.client.dto.AddressDto;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserClientImpl implements UserClient {

    private final UserFeignClient userFeignClient;

    @Override
    public Optional<AddressDto> getAddress(
            UUID userId,
            UUID addressId) {

        try {

            AddressDto address =
                    userFeignClient.getAddress(
                            userId,
                            addressId
                    );

            return Optional.ofNullable(address);

        } catch (FeignException.NotFound e) {

            log.warn(
                    "Address not found. userId={} addressId={}",
                    userId,
                    addressId
            );

            return Optional.empty();

        } catch (Exception e) {

            log.error(
                    "Failed to retrieve address. userId={} addressId={}",
                    userId,
                    addressId,
                    e
            );

            throw e;
        }
    }
}