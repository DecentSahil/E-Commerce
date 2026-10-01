package com.gateway.api_gateway.filter;

import com.gateway.api_gateway.security.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Slf4j
@Component
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE)
public class JwtAuthenticationWebFilter implements WebFilter {

    private final JwtUtil jwtUtil;

    private static final List<String> PUBLIC_PREFIXES = List.of(
            "/api/v1/auth/",
            "/api/v1/products",
            "/api/v1/listings",
            "/api/v1/brands",
            "/api/v1/categories"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {

        String path = exchange.getRequest().getURI().getPath();
        String method = exchange.getRequest().getMethod().name();

        ServerWebExchange sanitized = exchange.mutate()
                .request(req -> req
                        .headers(h -> {
                            h.remove("X-User-Id");
                            h.remove("X-User-Role");
                            h.remove("X-User-Email");
                            h.remove("X-User-Name");
                        })
                )
                .build();

        boolean isPublic = isPublicPath(path, method);

        String authHeader = sanitized.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            if (isPublic) {
                return chain.filter(sanitized);
            }
            sanitized.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return sanitized.getResponse().setComplete();
        }

        String token = authHeader.substring(7);
        try {
            Claims claims = jwtUtil.parseToken(token);

            String email = claims.getSubject();
            String userId = claims.get("userId", String.class);
            String role = claims.get("role", String.class);

            List<SimpleGrantedAuthority> authorities = (role != null && !role.isBlank())
                    ? List.of(new SimpleGrantedAuthority(role.startsWith("ROLE_") ? role : "ROLE_" + role))
                    : List.of();

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email != null ? email : "",
                            null,
                            authorities
                    );

            Map<String, Object> details = new HashMap<>();
            if (userId != null) details.put("userId", userId);
            if (role != null) details.put("role", role);
            authentication.setDetails(details);

            log.debug("JWT validated — userId={}, role={}, path={}", userId, role, path);

            return chain.filter(sanitized)
                    .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication));

        } catch (Exception e) {
            log.warn("JWT validation failed for path={}: {}", path, e.getMessage());
            if (isPublic) {
                return chain.filter(sanitized);
            }
            sanitized.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return sanitized.getResponse().setComplete();
        }
    }


    private boolean isPublicPath(String path, String method) {
        if (path.startsWith("/api/v1/auth/")) {
            return true;
        }
        if ("GET".equalsIgnoreCase(method)
                && (path.equals("/api/v1/recommendations")
                || path.equals("/api/v1/recommendations/trending")
                || path.startsWith("/api/v1/recommendations/products/"))) {
            return true;
        }
        if ("GET".equalsIgnoreCase(method)) {
            for (String prefix : PUBLIC_PREFIXES) {
                if (path.startsWith(prefix)) {
                    return true;
                }
            }
        }
        return false;
    }
}
