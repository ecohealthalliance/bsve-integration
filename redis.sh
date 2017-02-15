#!/bin/bash

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

export MIN_RAM="2000000"
./initial-checks.sh --ethernet $ethernet || exit 1

mkdir redis
cd redis

wget https://raw.githubusercontent.com/ecohealthalliance/infrastructure/master/docker/images/redis/Dockerfile

docker build -t redis .
docker-compose -f ../compose/grits.yml up -d redis

