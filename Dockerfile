FROM adoptopenjdk/openjdk11:alpine-slim

ENV APP_NAME spring-boot-cloud-deployment-learning

LABEL maintainer="Mark Homan"
RUN apk update

# install tini
RUN apk add --no-cache tini
COPY target/*.jar /bin/app.jar
VOLUME /bin
EXPOSE 8080
# use tini to avoid zombie processes and allow better shutdown
ENTRYPOINT ["/sbin/tini", "-e", "143", "-g", "--"]
CMD ["java", "-jar", "/bin/app.jar"]