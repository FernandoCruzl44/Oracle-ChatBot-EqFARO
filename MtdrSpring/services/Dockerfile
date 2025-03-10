FROM openjdk:22

WORKDIR /app

ENV db_url="jdbc:oracle:thin:@springbootatp_tp?TNS_ADMIN=/app/wallet" \
    db_user="TODOUSER" \
    dbpassword="None00010001" \
    TNS_ADMIN="/app/wallet" \
    driver_class_name="oracle.jdbc.OracleDriver"

RUN mkdir -p /app/wallet
COPY wallet /app/wallet


COPY target/MyTodoList-0.0.1-SNAPSHOT.jar app.jar
COPY .env .env

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]