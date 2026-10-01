package com.gateway.api_gateway.filter;

import com.gateway.api_gateway.security.JwtUtil;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationWebFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private WebFilterChain filterChain;

    @Mock
    private Claims claims;

    private JwtAuthenticationWebFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationWebFilter(jwtUtil);
    }

    @Test
    @DisplayName("shouldAllowPublicPathWithoutToken")
    void shouldAllowPublicPathWithoutToken() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/auth/login").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        when(filterChain.filter(any())).thenReturn(Mono.empty());

        filter.filter(exchange, filterChain).block();

        verify(filterChain).filter(any());
    }

    @Test
    @DisplayName("shouldReturnUnauthorizedForProtectedPathWithoutToken")
    void shouldReturnUnauthorizedForProtectedPathWithoutToken() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/cart").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        filter.filter(exchange, filterChain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(filterChain, never()).filter(any());
    }

    @Test
    @DisplayName("shouldReturnUnauthorizedForProtectedPathWithInvalidToken")
    void shouldReturnUnauthorizedForProtectedPathWithInvalidToken() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/cart")
                .header(HttpHeaders.AUTHORIZATION, "Bearer invalid-token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtUtil.parseToken("invalid-token")).thenThrow(new RuntimeException("Invalid token"));

        filter.filter(exchange, filterChain).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(filterChain, never()).filter(any());
    }

    @Test
    @DisplayName("shouldAllowProtectedPathWithValidToken")
    void shouldAllowProtectedPathWithValidToken() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/cart")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtUtil.parseToken("valid-token")).thenReturn(claims);
        when(claims.getSubject()).thenReturn("user@example.com");
        when(claims.get("userId", String.class)).thenReturn("12345");
        when(claims.get("role", String.class)).thenReturn("ROLE_USER");
        when(filterChain.filter(any())).thenReturn(Mono.empty());

        filter.filter(exchange, filterChain).block();

        verify(filterChain).filter(any());
    }

    @Test
    @DisplayName("shouldStripSpoofedUserHeaders")
    void shouldStripSpoofedUserHeaders() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/products")
                .header("X-User-Id", "attacker-id")
                .header("X-User-Role", "ROLE_ADMIN")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        when(filterChain.filter(any())).thenAnswer(invocation -> {
            ServerWebExchange sanitizedExchange = invocation.getArgument(0);
            assertThat(sanitizedExchange.getRequest().getHeaders().containsKey("X-User-Id")).isFalse();
            assertThat(sanitizedExchange.getRequest().getHeaders().containsKey("X-User-Role")).isFalse();
            return Mono.empty();
        });

        filter.filter(exchange, filterChain).block();

        verify(filterChain).filter(any());
    }
}
