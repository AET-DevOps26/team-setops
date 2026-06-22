# Stage 1: Build the application
FROM gradle:jdk25-noble AS builder
WORKDIR /workspace

# Copy the entire service directory (including the 'app' folder and any root settings.gradle.kts)
COPY . .

# Move into the app subdirectory to execute the build
WORKDIR /workspace/app

# Package the application
RUN gradle build -x test

# Stage 2: Run the application
FROM eclipse-temurin:25-jre-noble
WORKDIR /app

# Copy the built jar from the app's build directory
# (Using wildcard in case the version number changes the jar name)
COPY --from=builder /workspace/app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]