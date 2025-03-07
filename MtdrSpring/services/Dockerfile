FROM openjdk:22

WORKDIR /app

# Database configuration
ENV db_url="jdbc:oracle:thin:@springbootatp_high?TNS_ADMIN=/app/wallet" \
    db_user="TODOUSER" \
    dbpassword="None00010001" \
    TNS_ADMIN="/app/wallet" \
    driver_class_name="oracle.jdbc.OracleDriver"

# Create and populate wallet directory
RUN mkdir -p /app/wallet
COPY wallet /app/wallet

# Copy application files
COPY target/MyTodoList-0.0.1-SNAPSHOT.jar app.jar
COPY .env .env

EXPOSE 8080

# Run with optimized JVM settings
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:InitialRAMPercentage=50.0", \
    "-XX:+UseG1GC", \
    "-XX:MaxGCPauseMillis=200", \
    "-XX:+UseStringDeduplication", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]