FROM ubuntu:18.04

RUN apt-get update && apt-get install -y nginx

COPY ${PROJECT_NAME} /${PROJECT_NAME}

# forward request and error logs to docker log collector
RUN mkdir -p /${PROJECT_NAME}/logs && ln -sf /dev/stdout /${PROJECT_NAME}/logs/access.log && ln -sf /dev/stderr /${PROJECT_NAME}/logs/error.log

EXPOSE {{HTTP_PORT}}

CMD ["nginx", "-p", "/${PROJECT_NAME}", "-c", "conf/nginx.conf", "-g", "daemon off;"]