package com.example.order.client;

import com.example.order.client.dto.CartDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;
import java.util.UUID;

@Component
public class CartClientImpl implements CartClient {

    private static final Logger log = LoggerFactory.getLogger(CartClientImpl.class);

    private final RestTemplate restTemplate;
    private final String cartServiceUrl;

    public CartClientImpl(
            RestTemplate restTemplate,
            @Value("${services.cart-service.url:http://localhost:8087}") String cartServiceUrl) {
        this.restTemplate = restTemplate;
        this.cartServiceUrl = cartServiceUrl;
    }

    @Override
    public Optional<CartDto> getCart(UUID userId) {
        String url = cartServiceUrl + "/api/v1/cart";
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());
        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            ResponseEntity<CartDto> response = restTemplate.exchange(
                    url, HttpMethod.GET, requestEntity, CartDto.class);
            return Optional.ofNullable(response.getBody());
        } catch (RestClientException ex) {
            log.warn("Failed to fetch cart from {}: {}", url, ex.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public void clearCart(UUID userId) {
        String url = cartServiceUrl + "/api/v1/cart";
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId.toString());
        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        try {
            restTemplate.exchange(url, HttpMethod.DELETE, requestEntity, Void.class);
            log.info("Cleared cart for user: {}", userId);
        } catch (RestClientException ex) {
            log.warn("Failed to clear cart at {}: {}", url, ex.getMessage());
        }
    }
}
