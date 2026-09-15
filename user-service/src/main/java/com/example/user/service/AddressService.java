package com.example.user.service;

import com.example.user.dto.request.AddressRequest;
import com.example.user.dto.response.AddressResponse;

import java.util.List;
import java.util.UUID;

public interface AddressService {

    List<AddressResponse> getAddresses(UUID authUserId);

    AddressResponse addAddress(UUID authUserId, AddressRequest request);

    AddressResponse updateAddress(UUID authUserId, UUID addressId, AddressRequest request);

    void deleteAddress(UUID authUserId, UUID addressId);
}
