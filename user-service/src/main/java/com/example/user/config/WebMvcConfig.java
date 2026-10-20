package com.example.user.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get("uploads/avatars");
        String uriPath = uploadDir.toUri().toString();
        if (!uriPath.endsWith("/")) {
            uriPath += "/";
        }

        registry.addResourceHandler("/api/v1/users/avatars/**")
                .addResourceLocations(uriPath);
    }
}
