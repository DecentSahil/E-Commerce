package com.example.order.dto;

import lombok.Builder;
import lombok.Data;


@Data
@Builder
public class ShippingAddressResponse {

    private String fullName;
    private String phone;
    private String line1;
    private String line2;
    private String city;
    private String state;
    private String postalCode;
    private String countryCode;
}
