# Service Registry (Eureka Server)

[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.1-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Eureka Server](https://img.shields.io/badge/Spring%20Cloud-Eureka%20Server-blue.svg)](https://spring.io/projects/spring-cloud-netflix)

Centralized service registration and dynamic discovery server powered by **Spring Cloud Netflix Eureka**. Manages real-time instance heartbeats, dynamic lease renewal, and enables client-side load balancing for Spring Cloud Gateway (`lb://<service-name>`) and OpenFeign clients.

---

## 1. Architectural Highlights

- **Dynamic Discovery & Heartbeat Lease Monitoring**:
  - Automatically registers microservice instances on startup.
  - Monitors client heartbeats (every 30 seconds by default) and evicts dead nodes automatically.
- **Client-Side Load Balancing Coordination**:
  - Provides the current server registry to OpenFeign and Spring Cloud Gateway so client traffic can be distributed without an external physical load balancer.
- **Web Management Dashboard**:
  - Web UI available at `http://localhost:8761` to inspect active nodes, IP addresses, uptime, and system status.

---

## 2. Ports & Endpoints

| Port | Path | Purpose |
|---|---|---|
| `8761` | `/` | Eureka Web Management Dashboard |
| `8761` | `/eureka/apps` | Service instance registry JSON/XML API |
| `8761` | `/actuator/health` | Service registry health check endpoint |

---

## 3. Environment Variables & Configuration

| Variable | Default Value | Description |
|---|---|---|
| `SERVER_PORT` | `8761` | Eureka Server port |
| `EUREKA_HOSTNAME` | `localhost` | Hostname for the Eureka instance |

---

## 4. Local Development

```bash
mvn clean spring-boot:run
```

Once started, navigate to `http://localhost:8761` in your browser to verify service registrations.
