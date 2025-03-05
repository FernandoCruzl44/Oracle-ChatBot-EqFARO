FROM openjdk:22
WORKDIR /tmp/
ENV db_url="jdbc:oracle:thin:@springbootatp_tp?TNS_ADMIN=/app/wallet"
ENV db_user="TODOUSER"
ENV dbpassword="None01000111"
ENV TNS_ADMIN="/app/wallet"
EXPOSE 8080
COPY target/MyTodoList-0.0.1-SNAPSHOT.jar MyTodoList.jar
COPY .env .env

#### Deberiamos copiar esto en prod.
# RUN mkdir -p /app/wallet
# COPY /wallet /app/wallet

ENTRYPOINT ["java","-jar","MyTodoList.jar"]