# Stage 1: Build the application
# CHANGED: Swapped from Alpine to Jammy for the Gradle builder
FROM gradle:8.4-jdk17-jammy AS builder
WORKDIR /app

# Copy Gradle files and source code
COPY build.gradle settings.gradle.kts ./
COPY app/src ./src

# Package the application
RUN gradle build -x test

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the built jar
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]