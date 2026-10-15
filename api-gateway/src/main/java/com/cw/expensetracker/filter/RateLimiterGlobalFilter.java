package com.cw.expensetracker.filter;

import com.cw.expensetracker.config.RateLimiterConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Spring Cloud Gateway Global Rate Limiting Filter.
 * 
 * Enforces per-client IP rate limiting at the API Gateway layer.
 * Since the downstream Node backend is an internal service accessed only via this
 * gateway, all request rate limiting is centralized here.
 * 
 * Configurable via application.yml:
 * - gateway.rate-limiter.enabled (default: true)
 * - gateway.rate-limiter.max-requests (default: 100)
 * - gateway.rate-limiter.window-seconds (default: 60 = 1 minute)
 */
@Component
public class RateLimiterGlobalFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(RateLimiterGlobalFilter.class);

    @Value("${gateway.rate-limiter.enabled:true}")
    private boolean enabled;

    @Value("${gateway.rate-limiter.max-requests:100}")
    private int maxRequests;

    @Value("${gateway.rate-limiter.window-seconds:60}")
    private long windowSeconds;

    // In-memory sliding window request buckets per client IP
    private final Map<String, RequestBucket> buckets = new ConcurrentHashMap<>();
    private final AtomicLong requestCounter = new AtomicLong(0);

    @Override
    public int getOrder() {
        // High precedence: execute before NettyRoutingFilter and RouteToRequestUrlFilter
        return Ordered.HIGHEST_PRECEDENCE + 50;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!enabled) {
            return chain.filter(exchange);
        }

        String path = exchange.getRequest().getURI().getPath();

        // Exempt health check endpoints from rate limiting
        if (path.equals("/health") || path.startsWith("/actuator")) {
            return chain.filter(exchange);
        }

        // Extract client IP (respecting X-Forwarded-For from BFF/proxies)
        String clientIp = RateLimiterConfig.extractClientIp(exchange);
        long windowMillis = windowSeconds * 1000L;

        // Perform periodic cleanup of expired buckets every 500 requests
        if (requestCounter.incrementAndGet() % 500 == 0) {
            cleanExpiredBuckets(windowMillis);
        }

        RequestBucket bucket = buckets.computeIfAbsent(clientIp, k -> new RequestBucket(System.currentTimeMillis()));
        int currentCount = bucket.recordRequest(windowMillis);
        long remainingSeconds = bucket.getRemainingSeconds(windowMillis);
        long resetEpochSeconds = bucket.getResetEpochSeconds(windowMillis);

        if (currentCount > maxRequests) {
            logger.warn("Rate limit exceeded for client IP [{}] on path [{}]. Requests: {}/{}, Window: {}s. Returning HTTP 429.",
                    clientIp, path, currentCount, maxRequests, windowSeconds);

            ServerHttpResponse response = exchange.getResponse();
            response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);

            HttpHeaders headers = response.getHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Retry-After", String.valueOf(Math.max(1, remainingSeconds)));
            headers.set("X-RateLimit-Limit", String.valueOf(maxRequests));
            headers.set("X-RateLimit-Remaining", "0");
            headers.set("X-RateLimit-Reset", String.valueOf(resetEpochSeconds));

            String windowLabel = (windowSeconds <= 60) ? "1 minute" : (windowSeconds / 60) + " minutes";
            String errorJson = String.format(
                    "{\"status\":\"error\",\"statusCode\":429,\"message\":\"Too many requests from this IP, please try again after %s.\",\"error\":\"Rate limit exceeded. Maximum %d requests allowed per %s.\",\"retryAfterSeconds\":%d,\"limit\":%d}",
                    windowLabel,
                    maxRequests,
                    windowLabel,
                    Math.max(1, remainingSeconds),
                    maxRequests
            );

            byte[] bytes = errorJson.getBytes(StandardCharsets.UTF_8);
            DataBuffer buffer = response.bufferFactory().wrap(bytes);
            return response.writeWith(Mono.just(buffer));
        }

        // Within allowed rate limit: attach headers to response and forward down chain
        int remainingTokens = Math.max(0, maxRequests - currentCount);
        exchange.getResponse().beforeCommit(() -> {
            HttpHeaders headers = exchange.getResponse().getHeaders();
            headers.set("X-RateLimit-Limit", String.valueOf(maxRequests));
            headers.set("X-RateLimit-Remaining", String.valueOf(remainingTokens));
            headers.set("X-RateLimit-Reset", String.valueOf(resetEpochSeconds));
            return Mono.empty();
        });

        return chain.filter(exchange);
    }

    private void cleanExpiredBuckets(long windowMillis) {
        long now = System.currentTimeMillis();
        buckets.entrySet().removeIf(entry -> (now - entry.getValue().getWindowStartTime()) > (windowMillis * 2));
    }

    /**
     * Internal thread-safe sliding window counter for a client IP.
     */
    private static class RequestBucket {
        private final AtomicInteger count = new AtomicInteger(0);
        private final AtomicLong windowStartTime = new AtomicLong(0);

        public RequestBucket(long startTime) {
            this.windowStartTime.set(startTime);
        }

        public int recordRequest(long windowMillis) {
            long now = System.currentTimeMillis();
            long start = windowStartTime.get();

            if (now - start >= windowMillis) {
                // Window has expired, attempt to reset start time and counter
                if (windowStartTime.compareAndSet(start, now)) {
                    count.set(1);
                    return 1;
                }
            }

            return count.incrementAndGet();
        }

        public long getWindowStartTime() {
            return windowStartTime.get();
        }

        public long getRemainingSeconds(long windowMillis) {
            long now = System.currentTimeMillis();
            long elapsed = now - windowStartTime.get();
            long remaining = (windowMillis - elapsed) / 1000L;
            return Math.max(0, remaining);
        }

        public long getResetEpochSeconds(long windowMillis) {
            return (windowStartTime.get() + windowMillis) / 1000L;
        }
    }
}
