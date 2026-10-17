package com.example.auth.repository;

import com.example.auth.entity.AccountStatus;
import com.example.auth.entity.Role;
import com.example.auth.entity.UserAuth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAuthRepository extends JpaRepository<UserAuth, UUID> {

    Optional<UserAuth> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<UserAuth> findByRoleAndAccountStatus(Role role, AccountStatus accountStatus);
}
