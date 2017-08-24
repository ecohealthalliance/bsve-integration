#!/bin/bash

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

export MIN_RAM="4000000"
./initial-checks.sh --ethernet $ethernet || exit 1

#Import mongodb image
aws s3 cp s3://bsve-integration/mongodb.tar.gz ./mongodb.tar.gz &&\
gzip -d mongodb.tar.gz &&\
docker load < mongodb.tar &&\

#Start mongodb container
docker-compose -f compose/mongodb.yml up -d

