package org.devpulse.alerts.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${devpulse.rabbitmq.exchange}")
    private String exchangeName;

    @Value("${devpulse.rabbitmq.queue.system-alert}")
    private String systemAlertQueueName;

    @Value("${devpulse.rabbitmq.routing.system-alert}")
    private String systemAlertRoutingKey;

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(exchangeName);
    }

    @Bean
    public Queue systemAlertQueue() {
        return new Queue(systemAlertQueueName, true);
    }

    @Bean
    public Binding systemAlertBinding(Queue systemAlertQueue, TopicExchange exchange) {
        return BindingBuilder.bind(systemAlertQueue).to(exchange).with(systemAlertRoutingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
