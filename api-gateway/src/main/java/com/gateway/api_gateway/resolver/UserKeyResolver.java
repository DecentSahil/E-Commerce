package com.gateway.api_gateway.resolver;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class UserKeyResolver implements KeyResolver {

    @Override
    public Mono<String> resolve(ServerWebExchange exchange) {

        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> "user:" + ctx.getAuthentication().getName())
                .switchIfEmpty(Mono.just("anonymous"));
    }
}