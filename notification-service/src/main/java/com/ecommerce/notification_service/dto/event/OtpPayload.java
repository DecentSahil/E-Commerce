package com.ecommerce.notification_service.dto.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OtpPayload {
    private String email;
    private String otp;

    @Override
    public String toString() {
        return "OtpPayload(email=" + email + ", otp=***REDACTED***)";
    }
}
