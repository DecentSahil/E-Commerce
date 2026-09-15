package com.example.order.client;

import com.example.order.config.ServiceClientProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;


@Slf4j
@Component
@RequiredArgsConstructor
public class ProductClientImpl implements ProductClient {

    private final RestTemplate restTemplate;
    private final ServiceClientProperties serviceClientProperties;

    @Override
    public boolean checkAvailability(UUID productId, int quantity) {
        try {
            String url = serviceClientProperties.getProductServiceUrl()
                    + "/api/v1/products/" + productId + "/availability?quantity=" + quantity;

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("available")) {
                return Boolean.TRUE.equals(response.get("available"));
            }

            log.warn("[TEMP-SYNC] Unexpected availability response format for product {}. " +
                     "Permissive fallback: assuming available.", productId);
            return true;

        } catch (Exception e) {
            log.warn("[TEMP-SYNC] Could not reach Product Service for availability check on product {}. " +
                     "Permissive fallback: assuming available. Error: {}", productId, e.getMessage());
            return true;
        }
    }

    @Override
    public BigDecimal getCurrentPrice(UUID productId) {
        try {
            String url = serviceClientProperties.getProductServiceUrl()
                    + "/api/v1/products/" + productId;

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("price")) {
                Object price = response.get("price");
                if (price instanceof Number n) {
                    return BigDecimal.valueOf(n.doubleValue());
                }
                if (price instanceof String s) {
                    return new BigDecimal(s);
                }
            }
            return null;

        } catch (Exception e) {
            log.warn("[TEMP-SYNC] Could not reach Product Service for price of product {}. " +
                     "Error: {}", productId, e.getMessage());
            return null;
        }
    }
}
