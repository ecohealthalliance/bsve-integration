#!/bin/bash

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

./initial-checks.sh --ethernet $ethernet || exit 1

#Start promed scraper if it is not running
docker ps | grep promed-scraper
if [ $? -ne 0 ]; then
  ./promed-scraper.sh
fi

#Ensure we have a copy of the spa image
if [[ ! -f spa.tar ]]; then
  aws s3 cp s3://bsve-integration/spa.tar.gz ./spa.tar.gz
  gzip -d spa.tar.gz
fi
#Load the image
docker load < spa.tar

export LOCAL_IP=$(ifconfig $ethernet|grep "inet addr"|awk -F":" '{print $2}'|awk '{print $1}')

#Instantiate a new container
sed -r "s/\{\{ip_address\}\}/$LOCAL_IP/" compose/spa.yml > /tmp/spa.yml
docker-compose -f /tmp/spa.yml up -d

echo "*****************************************************************************************"
echo "Please update settings in /shared/settings-production.json"
echo "*****************************************************************************************"
