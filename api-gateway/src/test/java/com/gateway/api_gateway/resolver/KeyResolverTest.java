package com.gateway.api_gateway.resolver;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;

import java.net.InetSocketAddress;

import static org.assertj.core.api.Assertions.assertThat;

class KeyResolverTest {

    @Test
    @DisplayName("shouldResolveIpAddressCorrectly")
    void shouldResolveIpAddressCorrectly() {
        IpKeyResolver resolver = new IpKeyResolver();
        MockServerHttpRequest request = MockServerHttpRequest.get("/")
                .remoteAddress(new InetSocketAddress("192.168.1.100", 8080))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        String ip = resolver.resolve(exchange).block();

        assertThat(ip).isEqualTo("192.168.1.100");
    }

    @Test
    @DisplayName("shouldResolveUserFromSecurityContext")
    void shouldResolveUserFromSecurityContext() {
        UserKeyResolver resolver = new UserKeyResolver();
        MockServerHttpRequest request = MockServerHttpRequest.get("/").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("alice@example.com", null);

        String userKey = resolver.resolve(exchange)
                .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth))
                .block();

        assertThat(userKey).isEqualTo("user:alice@example.com");
    }

    @Test
    @DisplayName("shouldResolveAnonymousWhenNoAuthenticationInContext")
    void shouldResolveAnonymousWhenNoAuthenticationInContext() {
        UserKeyResolver resolver = new UserKeyResolver();
        MockServerHttpRequest request = MockServerHttpRequest.get("/").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        String key = resolver.resolve(exchange).block();

        assertThat(key).isEqualTo("anonymous");
    }
}
