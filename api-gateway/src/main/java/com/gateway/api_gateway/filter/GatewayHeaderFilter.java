package com.gateway.api_gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Map;


@Component
public class GatewayHeaderFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .flatMap(authentication -> {

                    String email = authentication.getName();
                    String role = authentication.getAuthorities().isEmpty() ? null :
                            authentication.getAuthorities().iterator().next().getAuthority();

                    Map<String, Object> details = (Map<String, Object>) authentication.getDetails();

                    String userId = details != null && details.get("userId") != null
                            ? String.valueOf(details.get("userId")) : null;

                    ServerWebExchange mutated = exchange.mutate()
                            .request(request -> {
                                if (userId != null && !userId.isBlank()) {
                                    request.header("X-User-Id", userId);
                                }
                                if (email != null && !email.isBlank()) {
                                    request.header("X-User-Email", email);
                                }
                                if (role != null && !role.isBlank()) {
                                    request.header("X-User-Role", role);
                                }
                            })
                            .build();

                    return chain.filter(mutated);
                })
                .switchIfEmpty(chain.filter(exchange));
    }

    @Override
    public int getOrder() {
        return -1;
    }
}