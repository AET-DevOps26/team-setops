package org.devpulse.alerts;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        // 1. Tell Spring to use an in-memory H2 database for testing instead of Postgres
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        // 2. Stop the RabbitMQ listener from trying to connect to a broker
        "spring.rabbitmq.listener.simple.auto-startup=false"
})
class AppTest {

    @Test
    void contextLoads() {
        // This just verifies the Spring context boots up correctly
    }
}