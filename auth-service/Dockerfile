# Stage 1: Build stage using official Maven with Eclipse Temurin JDK 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Copy dependency descriptor first to leverage Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package application jar
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal, secure runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create a non-privileged system user for container security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser:appgroup

# Copy jar artifact from builder stage
COPY --from=builder /build/target/auth-service-0.0.1-SNAPSHOT.jar app.jar

# Expose microservice application port
EXPOSE 8081

# Container-aware JVM options
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
