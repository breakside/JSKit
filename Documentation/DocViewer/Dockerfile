FROM ubuntu:18.04

RUN apt-get update && apt-get install -y nginx

COPY DocViewer /DocViewer

# forward request and error logs to docker log collector
RUN mkdir -p /DocViewer/logs && ln -sf /dev/stdout /DocViewer/logs/access.log && ln -sf /dev/stderr /DocViewer/logs/error.log

EXPOSE {{HTTP_PORT}}

CMD ["nginx", "-p", "/DocViewer", "-c", "conf/nginx.conf", "-g", "daemon off;"]