package com.example.order.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;


@Getter
@Setter
@ConfigurationProperties(prefix = "application.services")
public class ServiceClientProperties {


    private String productServiceUrl;
}
