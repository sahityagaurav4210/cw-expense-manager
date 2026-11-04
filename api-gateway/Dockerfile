# Stage 1: Build the application
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /app
COPY . .

# Cache-busting argument (forces re-execution of mvnw)
ARG CACHE_DATE=1

RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw clean install -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy ONLY the built jar file from the 'builder' stage
COPY --from=builder /app/target/cw-expense-gateway.jar ./app.jar

ARG PORT=8080
ENV PORT=${PORT}

EXPOSE ${PORT}
CMD ["java", "-jar", "app.jar"]