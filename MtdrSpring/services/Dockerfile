FROM openjdk:22

WORKDIR /app

# Database configuration
ENV db_url="jdbc:oracle:thin:@springbootatp_tp?TNS_ADMIN=/app/wallet" \
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
ENTRYPOINT ["java", "-jar", "app.jar"]