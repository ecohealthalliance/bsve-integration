#!/bin/bash

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

./initial-checks.sh --ethernet $ethernet || exit 1

mkdir mongodb
cd mongodb

wget https://raw.githubusercontent.com/ecohealthalliance/infrastructure/master/docker/images/mongodb/Dockerfile
wget https://raw.githubusercontent.com/ecohealthalliance/infrastructure/master/docker/images/mongodb/mongodb.conf
wget https://raw.githubusercontent.com/ecohealthalliance/infrastructure/master/docker/images/mongodb/run.sh
wget https://raw.githubusercontent.com/ecohealthalliance/infrastructure/master/docker/containers/mongodb.yml

docker build -t mongodb .
docker-compose -f mongodb.yml up -d

