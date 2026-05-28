package org.devpulse.ingestion;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class AppTest {

    // We mock the RabbitTemplate so the Spring context doesn't try to
    // establish a real connection to RabbitMQ during the test.
    @MockitoBean
    private RabbitTemplate rabbitTemplate;

    @Test
    void contextLoads() {
        // If the application context fails to load (e.g., due to a missing bean
        // or bad configuration), this test will fail.
    }
}