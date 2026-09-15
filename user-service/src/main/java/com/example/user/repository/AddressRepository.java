package com.example.user.repository;

import com.example.user.entity.Address;
import com.example.user.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AddressRepository extends JpaRepository<Address, UUID> {

    List<Address> findByUserOrderByCreatedAtDesc(UserProfile user);

    Optional<Address> findByIdAndUser(UUID id, UserProfile user);
}
