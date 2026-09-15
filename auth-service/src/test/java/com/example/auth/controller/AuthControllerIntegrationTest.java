package com.example.auth.controller;

import com.example.auth.dto.request.LoginRequest;
import com.example.auth.dto.request.RefreshTokenRequest;
import com.example.auth.dto.request.RegisterRequest;
import com.example.auth.dto.response.AuthResponse;
import com.example.auth.entity.Role;
import com.example.auth.repository.RefreshTokenRepository;
import com.example.auth.repository.UserAuthRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserAuthRepository userAuthRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        userAuthRepository.deleteAll();
    }

    @Test
    @DisplayName("1. Successful user registration returns 201 Created and JWT tokens")
    void testSuccessfulRegistration() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("john.doe@example.com")
                .password("SecurePass123!")
                .role(Role.ROLE_USER)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.user.email", is("john.doe@example.com")))
                .andExpect(jsonPath("$.user.role", is("ROLE_USER")))
                .andExpect(jsonPath("$.user.accountStatus", is("ACTIVE")));
    }

    @Test
    @DisplayName("2. Duplicate email registration returns 409 Conflict")
    void testDuplicateEmailRegistration() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("duplicate@example.com")
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    @DisplayName("3. Successful login returns 200 OK and valid JWT tokens")
    void testSuccessfulLogin() throws Exception {
        // Register user first
        RegisterRequest registerReq = RegisterRequest.builder()
                .email("login.user@example.com")
                .password("StrongSecret99#")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = LoginRequest.builder()
                .email("login.user@example.com")
                .password("StrongSecret99#")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.user.email", is("login.user@example.com")));
    }

    @Test
    @DisplayName("4. Login with invalid password returns 401 Unauthorized")
    void testLoginWithInvalidPassword() throws Exception {
        RegisterRequest registerReq = RegisterRequest.builder()
                .email("wrongpass@example.com")
                .password("CorrectPassword1!")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = LoginRequest.builder()
                .email("wrongpass@example.com")
                .password("WrongPassword999!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("5. Registration with invalid email or short password returns 400 Bad Request")
    void testInvalidRegistrationValidation() throws Exception {
        RegisterRequest invalidReq = RegisterRequest.builder()
                .email("not-an-email")
                .password("short")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors.email", notNullValue()))
                .andExpect(jsonPath("$.validationErrors.password", notNullValue()));
    }

    @Test
    @DisplayName("6. Accessing protected endpoint with invalid/expired JWT returns 401 Unauthorized")
    void testInvalidJwtAccess() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer invalid.jwt.token.here"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));
    }

    @Test
    @DisplayName("7. Refresh token flow rotates refresh token and issues fresh access token")
    void testRefreshTokenFlow() throws Exception {
        RegisterRequest registerReq = RegisterRequest.builder()
                .email("refresh.flow@example.com")
                .password("MyRefreshPass123!")
                .build();

        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse authResponse = objectMapper.readValue(
                registerResult.getResponse().getContentAsString(),
                AuthResponse.class
        );

        String originalRefreshToken = authResponse.getRefreshToken();

        // Request refresh token
        RefreshTokenRequest refreshReq = RefreshTokenRequest.builder()
                .refreshToken(originalRefreshToken)
                .build();

        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.user.email", is("refresh.flow@example.com")))
                .andReturn();

        AuthResponse rotatedResponse = objectMapper.readValue(
                refreshResult.getResponse().getContentAsString(),
                AuthResponse.class
        );

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));
    }

    @Test
    @DisplayName("8. Logout revokes the refresh token")
    void testLogoutRevocation() throws Exception {
        RegisterRequest registerReq = RegisterRequest.builder()
                .email("logout.user@example.com")
                .password("LogoutSecret123!")
                .build();

        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse authResponse = objectMapper.readValue(
                registerResult.getResponse().getContentAsString(),
                AuthResponse.class
        );

        RefreshTokenRequest logoutReq = RefreshTokenRequest.builder()
                .refreshToken(authResponse.getRefreshToken())
                .build();

        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + authResponse.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Successfully logged out")));

        // Attempting to refresh with revoked token fails
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutReq)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("9. Protected /api/v1/auth/me returns authenticated user details")
    void testProtectedMeEndpoint() throws Exception {
        RegisterRequest registerReq = RegisterRequest.builder()
                .email("me.user@example.com")
                .password("MeEndpointPass1!")
                .build();

        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse authResponse = objectMapper.readValue(
                registerResult.getResponse().getContentAsString(),
                AuthResponse.class
        );

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + authResponse.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("me.user@example.com")))
                .andExpect(jsonPath("$.role", is("ROLE_USER")))
                .andExpect(jsonPath("$.accountStatus", is("ACTIVE")));
    }

    @Test
    @DisplayName("10. Role-based authorization: USER gets 403 on admin endpoint, ADMIN gets 200 OK")
    void testRoleBasedAuthorization() throws Exception {
        RegisterRequest userReq = RegisterRequest.builder()
                .email("regular.user@example.com")
                .password("UserPassword1!")
                .role(Role.ROLE_USER)
                .build();

        MvcResult userResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse userAuth = objectMapper.readValue(
                userResult.getResponse().getContentAsString(),
                AuthResponse.class
        );

        // Register ADMIN
        RegisterRequest adminReq = RegisterRequest.builder()
                .email("admin.user@example.com")
                .password("AdminPassword1!")
                .role(Role.ROLE_ADMIN)
                .build();

        MvcResult adminResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminReq)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse adminAuth = objectMapper.readValue(
                adminResult.getResponse().getContentAsString(),
                AuthResponse.class
        );

        // Regular user accessing admin endpoint -> 403 Forbidden
        mockMvc.perform(get("/api/v1/auth/admin/stats")
                        .header("Authorization", "Bearer " + userAuth.getAccessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));

        // Admin user accessing admin endpoint -> 200 OK
        mockMvc.perform(get("/api/v1/auth/admin/stats")
                        .header("Authorization", "Bearer " + adminAuth.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.adminAccess", is("GRANTED")));
    }
}
