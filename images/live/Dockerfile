FROM debian:8.3

MAINTAINER Anthony K GROSS

RUN apt-get update -y && \
	apt-get upgrade -y && \
	apt-get install -y npm curl git supervisor nginx

# Installation de Node.js à partir du site officiel
RUN curl -LO "https://nodejs.org/dist/v0.12.5/node-v0.12.5-linux-x64.tar.gz" 
RUN tar -xzf node-v0.12.5-linux-x64.tar.gz -C /usr/local --strip-components=1
RUN rm node-v0.12.5-linux-x64.tar.gz

RUN rm -rf /var/lib/apt/lists/* && apt-get autoremove -y --purge

WORKDIR /src

RUN mkdir /logs -p && chmod 777 /logs -Rf

ADD entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
EXPOSE 443
EXPOSE 1337

ENTRYPOINT ["/entrypoint.sh"]