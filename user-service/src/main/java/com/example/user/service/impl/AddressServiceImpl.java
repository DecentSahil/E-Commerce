package com.example.user.service.impl;

import com.example.user.dto.request.AddressRequest;
import com.example.user.dto.response.AddressResponse;
import com.example.user.entity.Address;
import com.example.user.entity.UserProfile;
import com.example.user.exception.ResourceNotFoundException;
import com.example.user.mapper.AddressMapper;
import com.example.user.repository.AddressRepository;
import com.example.user.repository.UserProfileRepository;
import com.example.user.service.AddressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AddressServiceImpl implements AddressService {

    private final UserProfileRepository userProfileRepository;
    private final AddressRepository addressRepository;
    private final AddressMapper addressMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getAddresses(UUID userId) {

        UserProfile user = getUserProfileOrThrow(userId);

        return addressRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(addressMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AddressResponse addAddress(
            UUID userId,
            AddressRequest request) {

        UserProfile user = getUserProfileOrThrow(userId);

        if (request.isDefault()) {
            unsetDefaultAddresses(user);
        }

        Address address = addressMapper.toEntity(request);

        address.setUser(user);

        Address saved = addressRepository.save(address);

        return addressMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(
            UUID userId,
            UUID addressId,
            AddressRequest request) {

        UserProfile user = getUserProfileOrThrow(userId);

        Address address = addressRepository
                .findByIdAndUser(addressId, user)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Address not found with ID: " + addressId
                        ));

        if (request.isDefault() && !address.isDefault()) {
            unsetDefaultAddresses(user);
        }

        address.setAddressType(request.getAddressType());
        address.setAddressLine1(request.getAddressLine1());
        address.setAddressLine2(request.getAddressLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPostalCode(request.getPostalCode());
        address.setCountry(request.getCountry());
        address.setDefault(request.isDefault());

        Address updated = addressRepository.save(address);

        return addressMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteAddress(
            UUID userId,
            UUID addressId) {

        UserProfile user = getUserProfileOrThrow(userId);

        Address address = addressRepository
                .findByIdAndUser(addressId, user)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Address not found with ID: " + addressId
                        ));

        addressRepository.delete(address);
    }

    private UserProfile getUserProfileOrThrow(UUID userId) {

        return userProfileRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User profile not found for ID: " + userId
                        ));
    }

    private void unsetDefaultAddresses(UserProfile user) {

        List<Address> addresses =
                addressRepository.findByUserOrderByCreatedAtDesc(user);

        for (Address address : addresses) {

            if (address.isDefault()) {
                address.setDefault(false);
                addressRepository.save(address);
            }
        }
    }
}