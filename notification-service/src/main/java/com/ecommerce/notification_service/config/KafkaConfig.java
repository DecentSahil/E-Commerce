package com.ecommerce.notification_service.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Slf4j
@Configuration
@EnableKafka
public class KafkaConfig {

    @Bean
    public DefaultErrorHandler kafkaErrorHandler() {
        FixedBackOff backOff = new FixedBackOff(1000L, 2L);

        DefaultErrorHandler errorHandler = new DefaultErrorHandler((ConsumerRecord<?, ?> record, Exception exception) -> {
            String topic = record != null ? record.topic() : "unknown";
            Object key = record != null ? record.key() : "unknown";

            if ("otp-events".equalsIgnoreCase(topic)) {
                log.error("[KAFKA_CONSUMER_EXHAUSTED] Retries exhausted for topic={} key={} (payload redacted for security). Error: {}",
                        topic, key, exception.getMessage());
            } else {
                log.error("[KAFKA_CONSUMER_EXHAUSTED] Retries exhausted for topic={} key={}. Error: {}",
                        topic, key, exception.getMessage());
            }
        }, backOff);

        return errorHandler;
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory(
            ConsumerFactory<String, String> consumerFactory,
            DefaultErrorHandler kafkaErrorHandler) {

        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.setCommonErrorHandler(kafkaErrorHandler);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.RECORD);

        return factory;
    }
}
