package com.example.order.client;

import java.math.BigDecimal;
import java.util.UUID;


public interface ProductClient {


    boolean checkAvailability(UUID productId, int quantity);


    BigDecimal getCurrentPrice(UUID productId);
}
