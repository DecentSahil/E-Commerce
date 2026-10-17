package com.ecommerce.notification_service.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.notification")
public class NotificationMailProperties {

    private Mail mail = new Mail();
    private UserService userService = new UserService();

    @Data
    public static class Mail {
        private String from = "noreply@ecommerce.com";
        private String senderName = "AI E-Commerce Platform";
        private String frontendUrl = "http://localhost:3000";
        private String supportEmail = "support@ecommerce.com";
    }

    @Data
    public static class UserService {
        private String url = "http://localhost:8082";
    }
}
