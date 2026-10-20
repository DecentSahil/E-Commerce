# Config Server

[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.1-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Spring Cloud Config](https://img.shields.io/badge/Spring%20Cloud%20Config-2024.0.0-blue.svg)](https://spring.io/projects/spring-cloud-config)

Centralized external configuration server powered by **Spring Cloud Config Server**. Delivers version-controlled, environment-specific YAML configuration to all platform microservices from an external Git repository (`config-repo/`), supporting symmetric encryption for secrets and dynamic refresh capabilities.

---

## 1. Architectural Highlights

- **External Git Repository Integration**:
  - Serves configuration directly from the remote `ecommerce-config-repo` repository.
  - Microservices pull their profile configs on startup (e.g. `auth-service-dev.yml`).
- **Symmetric Secret Encryption & Decryption**:
  - Encrypts sensitive credentials (such as JWT secret keys and database passwords) using the `{cipher}` prefix and a master key specified via `CONFIG_ENCRYPT_KEY`.
- **Dynamic Bus Refresh**:
  - Exposes `/actuator/busrefresh` for zero-downtime configuration reloads across registered microservices over RabbitMQ / Kafka.
- **Fail-Fast & Timeout Guarantees**:
  - Configured with `clone-on-start: true` and `timeout: 10` for deterministic startup behavior.

---

## 2. Endpoints & Profile Resolution

| Port | Path | Purpose |
|---|---|---|
| `8888` | `/{application}/{profile}` | Retrieve configuration JSON for a given service and profile |
| `8888` | `/{application}-{profile}.yml` | Retrieve raw configuration YAML |
| `8888` | `/encrypt` | Encrypt plain text secret into `{cipher}` string (`POST`) |
| `8888` | `/decrypt` | Decrypt `{cipher}` string (`POST`) |
| `8888` | `/actuator/busrefresh` | Broadcast configuration reload event to all services |

### Examples
- Check auth service dev config: `http://localhost:8888/auth-service-dev.yml`
- Check gateway dev config: `http://localhost:8888/api-gateway-dev.yml`

---

## 3. Environment Variables & Configuration

| Variable | Default Value | Description |
|---|---|---|
| `SERVER_PORT` | `8888` | Config Server HTTP port |
| `CONFIG_REPO_URI` | *(required)* | Remote Git repository URL containing YAML profiles |
| `CONFIG_REPO_BRANCH` | `main` | Default Git branch to read configurations from |
| `GIT_USERNAME` | *(optional)* | Git authentication username (for private repos) |
| `GIT_TOKEN` | *(optional)* | Git personal access token / password |
| `CONFIG_ENCRYPT_KEY` | *(required for cipher)* | Master symmetric key for encrypting secrets |
| `EUREKA_SERVER_URL` | `http://localhost:8761/eureka/` | Eureka Service Registry endpoint |

---

## 4. Local Development

```bash
mvn clean spring-boot:run
```
