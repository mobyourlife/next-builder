#!/bin/sh

docker rm -f mobyourlife-builder
docker rmi -f mobyourlife-builder

docker build -t mobyourlife-builder .

docker run \
  --name mobyourlife-builder \
  --restart=always \
  --link mob-db-mongo:db \
  --link mob-mq-rabbit:mq \
  -e MOB_MONGO_FACEBOOK_DATABASE='mongodb://db:27017/mobyourlife_facebook' \
  -e MOB_RABBITMQ_URL='amqp://mq' \
  -d \
  mobyourlife-builder

docker logs mobyourlife-builder -f
