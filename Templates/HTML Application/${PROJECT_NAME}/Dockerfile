FROM ubuntu:16.04

RUN apt-get update && apt-get install -y nginx=1.10.3-0ubuntu0.16.04.2

COPY www /jskitapp/www
COPY conf /jskitapp/conf

# forward request and error logs to docker log collector
RUN mkdir -p /jskitapp/logs && ln -sf /dev/stdout /jskitapp/logs/access.log && ln -sf /dev/stderr /jskitapp/logs/error.log

EXPOSE 8080

CMD ["nginx", "-p", "/jskitapp", "-c", "conf/nginx.conf", "-g", "daemon off;"]