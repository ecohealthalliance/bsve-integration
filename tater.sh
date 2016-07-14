#!/bin/bash

#Build and spin up our mongodb
./mongodb.sh

#Ensure we have a copy of the grits image
if [[ ! -f tater.tar.gz && ! -f tater.tar ]]; then
  aws s3 cp s3://bsve-integration/tater.tar.gz ./tater.tar.gz
  gzip -d tater.tar.gz
fi

#Load the image
docker load < tater.tar

export LOCAL_IP=$(ifconfig eth0|grep "inet addr"|awk -F":" '{print $2}'|awk '{print $1}')

#Get and setup config files
wget https://raw.githubusercontent.com/ecohealthalliance/infrastructure/master/docker/containers/bsve-tater/bsve --output-document=tater.yml
sed -i "s/localhost/$LOCAL_IP/" tater.yml
sed -i "s/8007/80/" tater.yml

#Instantiate a new grits container
docker-compose -f tater.yml up -d

