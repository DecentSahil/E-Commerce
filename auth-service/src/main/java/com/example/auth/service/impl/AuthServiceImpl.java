package com.example.auth.service.impl;

import com.example.auth.config.JwtProperties;
import com.example.auth.dto.request.*;
import com.example.auth.dto.response.AuthResponse;
import com.example.auth.dto.response.UserResponse;
import com.example.auth.entity.AccountStatus;
import com.example.auth.entity.Role;
import com.example.auth.entity.UserAuth;
import com.example.auth.event.EventEnvelope;
import com.example.auth.event.EventPublisher;
import com.example.auth.event.payload.OtpPayload;
import com.example.auth.event.payload.UserRegisteredPayload;
import com.example.auth.exception.AccountDisabledException;
import com.example.auth.exception.BadRequestException;
import com.example.auth.exception.DuplicateResourceException;
import com.example.auth.exception.ResourceNotFoundException;
import com.example.auth.mapper.UserMapper;
import com.example.auth.repository.UserAuthRepository;
import com.example.auth.security.JwtService;
import com.example.auth.security.OtpAuthenticationToken;
import com.example.auth.service.AuthService;
import com.example.auth.service.OtpService;
import com.example.auth.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import com.example.auth.dto.response.MessageResponse;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserAuthRepository userAuthRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final JwtProperties jwtProperties;
    private final EventPublisher eventPublisher;
    private final OtpService otpService;



    public void sendOtp(SendOtpRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        String otp = otpService.generateAndStoreOtp(email);

        OtpPayload payload = new OtpPayload(email, otp);

        EventEnvelope<OtpPayload> event =
                new EventEnvelope<>(
                        UUID.randomUUID(),
                        "OTP_REQUESTED",
                        1,
                        Instant.now(),
                        payload
                );

        eventPublisher.publish(
                "otp-events",
                email,
                event
        );
    }


    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {

        String normalizedEmail = request.getEmail()
                .trim()
                .toLowerCase();

        log.info(
                "User registration started | email={}",
                normalizedEmail
        );

        otpService.verifyOtp(
                normalizedEmail,
                request.getOtp()
        );

        if (userAuthRepository.existsByEmailIgnoreCase(normalizedEmail)) {

            log.warn(
                    "User registration rejected: email already exists | email={}",
                    normalizedEmail
            );

            throw new DuplicateResourceException(
                    "An account with email "
                            + normalizedEmail
                            + " already exists"
            );
        }

        UserAuth user = UserAuth.builder()
                .email(normalizedEmail)
                .passwordHash(
                        passwordEncoder.encode(request.getPassword())
                )
                .role(Role.ROLE_USER)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        UserAuth savedUser = userAuthRepository.save(user);

        log.info(
                "User account created successfully | userId={}",
                savedUser.getId()
        );

        UserRegisteredPayload payload =
                new UserRegisteredPayload(
                        savedUser.getId(),
                        savedUser.getEmail(),
                        savedUser.getRole().name()
                );

        EventEnvelope<UserRegisteredPayload> event =
                new EventEnvelope<>(
                        UUID.randomUUID(),
                        "USER_REGISTERED",
                        1,
                        Instant.now(),
                        payload
                );

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    eventPublisher.publish(
                            "auth-events",
                            savedUser.getId().toString(),
                            event
                    );
                    log.info(
                            "USER_REGISTERED event published post-commit | userId={} | eventId={}",
                            savedUser.getId(),
                            event.eventId()
                    );
                }
            });
        } else {
            eventPublisher.publish(
                    "auth-events",
                    savedUser.getId().toString(),
                    event
            );
        }

        String accessToken =
                jwtService.generateAccessToken(savedUser);

        String refreshToken =
                refreshTokenService.createRefreshToken(savedUser);

        log.info(
                "User registration completed successfully | userId={}",
                savedUser.getId()
        );

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresInMs(
                        jwtProperties.getAccessTokenExpirationMs()
                )
                .user(
                        userMapper.toUserResponse(savedUser)
                )
                .build();
    }

    @Override
    @Transactional
    public MessageResponse registerSeller(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        log.info("Seller registration started | email={}", normalizedEmail);

        otpService.verifyOtp(normalizedEmail, request.getOtp());

        if (userAuthRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.warn("Seller registration rejected: email already exists | email={}", normalizedEmail);
            throw new DuplicateResourceException("An account with email " + normalizedEmail + " already exists");
        }

        UserAuth user = UserAuth.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_SELLER)
                .accountStatus(AccountStatus.PENDING_APPROVAL)
                .build();

        UserAuth savedUser = userAuthRepository.save(user);

        log.info("Seller account created in PENDING_APPROVAL status | userId={}", savedUser.getId());

        UserRegisteredPayload payload =
                new UserRegisteredPayload(
                        savedUser.getId(),
                        savedUser.getEmail(),
                        savedUser.getRole().name()
                );

        EventEnvelope<UserRegisteredPayload> event =
                new EventEnvelope<>(
                        UUID.randomUUID(),
                        "SELLER_REGISTERED",
                        1,
                        Instant.now(),
                        payload
                );

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    eventPublisher.publish("auth-events", savedUser.getId().toString(), event);
                    log.info("SELLER_REGISTERED event published post-commit | userId={}", savedUser.getId());
                }
            });
        } else {
            eventPublisher.publish("auth-events", savedUser.getId().toString(), event);
        }

        return new MessageResponse("Seller registration submitted successfully. Your account is currently pending administrator approval. You will be able to log in once approved.");
    }


    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {

        String normalizedEmail = request.getEmail()
                .trim()
                .toLowerCase();

        log.info(
                "Password login started | email={}",
                normalizedEmail
        );

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        normalizedEmail,
                        request.getPassword()
                )
        );

        log.info(
                "Password authentication successful | email={}",
                normalizedEmail
        );

        UserAuth user = userAuthRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with email: "
                                        + normalizedEmail
                        )
                );

        if (!user.getAccountStatus().isActive()) {
            if (user.getAccountStatus() == AccountStatus.PENDING_APPROVAL) {
                log.warn("Login rejected: seller account is pending admin approval | userId={}", user.getId());
                throw new AccountDisabledException("Your seller account is pending administrator approval. You will be able to log in once approved.");
            }

            log.warn(
                    "Login rejected: account is not active | userId={} | status={}",
                    user.getId(),
                    user.getAccountStatus()
            );

            throw new AccountDisabledException(
                    "Account status is "
                            + user.getAccountStatus()
                            + ". Access denied."
            );
        }

        String accessToken =
                jwtService.generateAccessToken(user);

        String refreshToken =
                refreshTokenService.createRefreshToken(user);

        log.info(
                "Password login completed successfully | userId={}",
                user.getId()
        );

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresInMs(
                        jwtProperties.getAccessTokenExpirationMs()
                )
                .user(
                        userMapper.toUserResponse(user)
                )
                .build();
    }


    @Override
    @Transactional
    public AuthResponse loginWithOtp(OtpLoginRequest request) {

        String normalizedEmail = request.getEmail()
                .trim()
                .toLowerCase();

        log.info(
                "OTP login started | email={}",
                normalizedEmail
        );

        authenticationManager.authenticate(
                new OtpAuthenticationToken(
                        normalizedEmail,
                        request.getOtp()
                )
        );

        log.info(
                "OTP authentication successful | email={}",
                normalizedEmail
        );

        UserAuth user = userAuthRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with email: "
                                        + normalizedEmail
                        )
                );

        if (!user.getAccountStatus().isActive()) {
            if (user.getAccountStatus() == AccountStatus.PENDING_APPROVAL) {
                log.warn("OTP login rejected: seller account is pending admin approval | userId={}", user.getId());
                throw new AccountDisabledException("Your seller account is pending administrator approval. You will be able to log in once approved.");
            }

            log.warn(
                    "OTP login rejected: account is not active | userId={} | status={}",
                    user.getId(),
                    user.getAccountStatus()
            );

            throw new AccountDisabledException(
                    "Account status is "
                            + user.getAccountStatus()
                            + ". Access denied."
            );
        }

        String accessToken =
                jwtService.generateAccessToken(user);

        String refreshToken =
                refreshTokenService.createRefreshToken(user);

        log.info(
                "OTP login completed successfully | userId={}",
                user.getId()
        );

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresInMs(
                        jwtProperties.getAccessTokenExpirationMs()
                )
                .user(
                        userMapper.toUserResponse(user)
                )
                .build();
    }


    @Override
    @Transactional
    public AuthResponse refreshToken(
            RefreshTokenRequest request
    ) {

        log.info("Refresh token operation started");

        RefreshTokenService.RotatedTokenResult result =
                refreshTokenService.verifyAndRotateRefreshToken(
                        request.getRefreshToken()
                );

        UserAuth user = result.user();

        String newAccessToken =
                jwtService.generateAccessToken(user);

        log.info(
                "Refresh token operation completed successfully | userId={}",
                user.getId()
        );

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(result.newRawToken())
                .tokenType("Bearer")
                .expiresInMs(
                        jwtProperties.getAccessTokenExpirationMs()
                )
                .user(
                        userMapper.toUserResponse(user)
                )
                .build();
    }


    @Override
    @Transactional
    public void logout(String refreshToken) {

        log.info("Logout operation started");

        if (refreshToken != null && !refreshToken.isBlank()) {

            refreshTokenService.revokeRefreshToken(
                    refreshToken
            );

            log.info("Refresh token revoked successfully");
        }

        SecurityContextHolder.clearContext();

        log.info("Logout completed successfully");
    }


    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {

        log.debug(
                "Fetching current user | email={}",
                email
        );

        UserAuth user = userAuthRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with email: "
                                        + email
                        )
                );

        return userMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(UUID userId, Role newRole) {
        log.info("Updating role for userId={} to {}", userId, newRole);

        UserAuth user = userAuthRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setRole(newRole);
        UserAuth savedUser = userAuthRepository.save(user);

        UserRegisteredPayload payload =
                new UserRegisteredPayload(
                        savedUser.getId(),
                        savedUser.getEmail(),
                        savedUser.getRole().name()
                );

        EventEnvelope<UserRegisteredPayload> event =
                new EventEnvelope<>(
                        UUID.randomUUID(),
                        "USER_ROLE_UPDATED",
                        1,
                        Instant.now(),
                        payload
                );

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    eventPublisher.publish("auth-events", savedUser.getId().toString(), event);
                    log.info("USER_ROLE_UPDATED event published post-commit | userId={}", savedUser.getId());
                }
            });
        } else {
            eventPublisher.publish("auth-events", savedUser.getId().toString(), event);
        }

        return userMapper.toUserResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getPendingSellers() {
        return userAuthRepository.findByRoleAndAccountStatus(Role.ROLE_SELLER, AccountStatus.PENDING_APPROVAL)
                .stream()
                .map(userMapper::toUserResponse)
                .toList();
    }

    @Override
    @Transactional
    public UserResponse approveSeller(UUID userId) {
        UserAuth user = userAuthRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() != Role.ROLE_SELLER) {
            throw new BadRequestException("User " + userId + " is not a seller");
        }

        user.setAccountStatus(AccountStatus.ACTIVE);
        UserAuth savedUser = userAuthRepository.save(user);

        log.info("Seller approved successfully | userId={}", userId);

        UserRegisteredPayload payload =
                new UserRegisteredPayload(
                        savedUser.getId(),
                        savedUser.getEmail(),
                        savedUser.getRole().name()
                );

        EventEnvelope<UserRegisteredPayload> event =
                new EventEnvelope<>(
                        UUID.randomUUID(),
                        "SELLER_APPROVED",
                        1,
                        Instant.now(),
                        payload
                );

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    eventPublisher.publish("auth-events", savedUser.getId().toString(), event);
                    log.info("SELLER_APPROVED event published post-commit | userId={}", savedUser.getId());
                }
            });
        } else {
            eventPublisher.publish("auth-events", savedUser.getId().toString(), event);
        }

        return userMapper.toUserResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse rejectSeller(UUID userId) {
        UserAuth user = userAuthRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setAccountStatus(AccountStatus.DISABLED);
        UserAuth savedUser = userAuthRepository.save(user);

        log.info("Seller application rejected | userId={}", userId);

        return userMapper.toUserResponse(savedUser);
    }

}