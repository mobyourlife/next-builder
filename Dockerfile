FROM node:boron
MAINTAINER Filipe Oliveira <contato@fmoliveira.com.br>

ADD . /var/src/

RUN npm install --prefix /var/src/

ENV NODE_ENV production

ENTRYPOINT [ "node", "/var/src/bootstrap.js" ]
