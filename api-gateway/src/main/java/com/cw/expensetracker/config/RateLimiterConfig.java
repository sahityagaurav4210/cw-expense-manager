package com.cw.expensetracker.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.util.List;

/**
 * Rate Limiter Configuration for Spring Boot API Gateway.
 * Provides client IP resolution across direct clients and proxies/BFF.
 */
@Configuration
public class RateLimiterConfig {

    private static final Logger logger = LoggerFactory.getLogger(RateLimiterConfig.class);

    /**
     * Resolves the rate-limiting key based on the client's IP address.
     * Checks X-Forwarded-For and X-Real-IP headers before falling back to RemoteAddress.
     */
    @Bean
    @Primary
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String clientIp = extractClientIp(exchange);
            logger.debug("Resolved client IP for rate limiting: {}", clientIp);
            return Mono.just(clientIp);
        };
    }

    /**
     * Extracts the real client IP address from the request exchange.
     * Supports reverse proxies, BFF, and load balancers.
     */
    public static String extractClientIp(ServerWebExchange exchange) {
        // 1. Check X-Forwarded-For header (first entry is original client IP)
        List<String> xForwardedFor = exchange.getRequest().getHeaders().get("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            String headerVal = xForwardedFor.get(0);
            if (headerVal != null && !headerVal.isBlank()) {
                String clientIp = headerVal.split(",")[0].trim();
                if (!clientIp.equalsIgnoreCase("unknown") && !clientIp.isBlank()) {
                    return clientIp;
                }
            }
        }

        // 2. Check X-Real-IP header
        String xRealIp = exchange.getRequest().getHeaders().getFirst("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank() && !xRealIp.equalsIgnoreCase("unknown")) {
            return xRealIp.trim();
        }

        // 3. Fallback to direct RemoteAddress
        InetSocketAddress remoteAddress = exchange.getRequest().getRemoteAddress();
        if (remoteAddress != null && remoteAddress.getAddress() != null) {
            return remoteAddress.getAddress().getHostAddress();
        }

        return "127.0.0.1";
    }
}
