#!/bin/bash

./initial-checks.sh

mkdir mongodb
cd mongodb

wget https://raw.githubusercontent.com/ecohealthalliance/infrastructure/master/docker/images/mongodb/Dockerfile
wget https://raw.githubusercontent.com/ecohealthalliance/infrastructure/master/docker/images/mongodb/mongodb.conf
wget https://raw.githubusercontent.com/ecohealthalliance/infrastructure/master/docker/images/mongodb/run.sh
wget https://raw.githubusercontent.com/ecohealthalliance/infrastructure/master/docker/containers/mongodb.yml

docker build -t mongodb .
docker-compose -f mongodb.yml up -d

