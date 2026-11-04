# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app
COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy ONLY the built jar file from the 'builder' stage
COPY --from=builder /app/target/cw-expense-gateway.jar ./app.jar

ARG PORT=8080
ENV PORT=${PORT}

EXPOSE ${PORT}
CMD ["java", "-jar", "app.jar"]
