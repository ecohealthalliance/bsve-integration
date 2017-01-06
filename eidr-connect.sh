#!/bin/bash

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

./initial-checks.sh --ethernet $ethernet || exit 1

export REPO_ROOT=$(pwd) 

#Ensure data dump file is in our directory
aws s3 cp s3://bsve-integration/spa-mongodump.tar ./spa-mongodump.tar 

#Build and spin up our mongodb
./mongodb.sh --ethernet $ethernet

#Import the spa mongo data
ln -s $(pwd)/spa-mongodump.tar /var/log/spa-mongodump.tar
cd /var/log/ && tar -xf spa-mongodump.tar && docker exec -t mongodb mongorestore /var/log/dump

#Include promed scraper
cd $REPO_ROOT
./promed-scraper.sh --ethernet $ethernet

#Download the docker image
aws s3 cp s3://bsve-integration/eidr-connect.tar.gz ./eidr-connect.tar.gz
gzip -d eidr-connect.tar.gz

#Load the image
docker load < eidr-connect.tar

export LOCAL_IP=$(ifconfig $ethernet|grep "inet addr"|awk -F":" '{print $2}'|awk '{print $1}')
cd $REPO_ROOT

#Get and setup config files
sed -i -r "s/(\b[0-9]{1,3}\.){3}[0-9]{1,3}\b/$LOCAL_IP/" compose/eidr-connect.yml

#Make a default settings file
mkdir /shared
echo "MAIL_URL=CHANGEME" > /shared/sensitive-environment-vars.env

#Instantiate a new flirt container
docker-compose -f compose/eidr-connect.yml up -d eidr-connect-bsve.eha.io




