package com.memesee.content.media.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.retry.MessageRecoverer;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.boot.autoconfigure.amqp.SimpleRabbitListenerContainerFactoryConfigurer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
@ConditionalOnProperty(prefix = "app.media.processing", name = "async-enabled", havingValue = "true")
@EnableConfigurationProperties(MediaProcessingQueueProperties.class)
public class MediaProcessingRabbitConfiguration {

    @Bean
    public DirectExchange mediaProcessingExchange(MediaProcessingQueueProperties properties) {
        return new DirectExchange(properties.getExchange(), true, false);
    }

    @Bean
    public DirectExchange mediaProcessingDeadLetterExchange(MediaProcessingQueueProperties properties) {
        return new DirectExchange(properties.getDeadLetterExchange(), true, false);
    }

    @Bean
    public Queue mediaVariantProcessingQueue(MediaProcessingQueueProperties properties) {
        return QueueBuilder.durable(properties.getName())
                .deadLetterExchange(properties.getDeadLetterExchange())
                .deadLetterRoutingKey(properties.getDeadLetterRoutingKey())
                .build();
    }

    @Bean
    public Queue mediaVariantProcessingDeadLetterQueue(MediaProcessingQueueProperties properties) {
        return QueueBuilder.durable(properties.getDeadLetterName()).build();
    }

    @Bean
    public Binding mediaVariantProcessingBinding(
            Queue mediaVariantProcessingQueue,
            DirectExchange mediaProcessingExchange,
            MediaProcessingQueueProperties properties
    ) {
        return BindingBuilder.bind(mediaVariantProcessingQueue)
                .to(mediaProcessingExchange)
                .with(properties.getRoutingKey());
    }

    @Bean
    public Binding mediaVariantProcessingDeadLetterBinding(
            Queue mediaVariantProcessingDeadLetterQueue,
            DirectExchange mediaProcessingDeadLetterExchange,
            MediaProcessingQueueProperties properties
    ) {
        return BindingBuilder.bind(mediaVariantProcessingDeadLetterQueue)
                .to(mediaProcessingDeadLetterExchange)
                .with(properties.getDeadLetterRoutingKey());
    }

    @Bean
    public Jackson2JsonMessageConverter mediaProcessingMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(
            ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter mediaProcessingMessageConverter
    ) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(mediaProcessingMessageConverter);
        return rabbitTemplate;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            SimpleRabbitListenerContainerFactoryConfigurer configurer,
            ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter mediaProcessingMessageConverter,
            MediaProcessingQueueProperties properties,
            MessageRecoverer rabbitMediaVariantProcessingFailureRecoverer
    ) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        configurer.configure(factory, connectionFactory);
        factory.setMessageConverter(mediaProcessingMessageConverter);
        factory.setDefaultRequeueRejected(false);
        factory.setAdviceChain(RetryInterceptorBuilder.stateless()
                .maxAttempts(Math.max(1, properties.getMaxAttempts()))
                .backOffOptions(
                        Math.max(0L, properties.getInitialIntervalMs()),
                        Math.max(1.0d, properties.getMultiplier()),
                        Math.max(0L, properties.getMaxIntervalMs())
                )
                .recoverer(rabbitMediaVariantProcessingFailureRecoverer)
                .build());
        return factory;
    }
}
