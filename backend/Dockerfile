ARG SERVICE

FROM maven:3.9.9-eclipse-temurin-21 AS build
ARG SERVICE
WORKDIR /workspace

COPY pom.xml pom.xml
COPY platform-common/pom.xml platform-common/pom.xml
COPY user-service/pom.xml user-service/pom.xml
COPY content-service/pom.xml content-service/pom.xml
COPY gateway-service/pom.xml gateway-service/pom.xml

RUN mvn -pl "${SERVICE}" -am dependency:go-offline -DskipTests

COPY . .
RUN mvn -pl "${SERVICE}" -am package -DskipTests

FROM eclipse-temurin:21-jre
ARG SERVICE
WORKDIR /app

ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS=""

COPY --from=build /workspace/${SERVICE}/target/${SERVICE}-*.jar /app/app.jar

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
