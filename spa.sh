#!/bin/bash

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

./initial-checks.sh --ethernet $ethernet || exit 1

if [ ! -f /shared/.aws/config ];then
  echo "The ProMED scraper requires you to place your AWS credentials in"
  echo "/shared/.aws/config so that they can be used within the Docker container."
  echo "The following command should do it if your user has an aws config file set up:"
  echo "cp -r ~/.aws /shared"
  exit 1
fi

#Build and spin up our mongodb
./mongodb.sh --ethernet $ethernet

#Download and import ProMED mongo dump
if [[ ! -d promed_dump ]]; then
  mkdir -p promed_dump
  aws s3 cp --recursive s3://promed-database/bsve/dump /mnt/mongo/dump
fi
#Load mongo dump
docker exec -ti mongorestore --dir /mnt/mongo/dump

#Ensure we have a copy of the spa image
if [[ ! -f spa.tar ]]; then
  aws s3 cp s3://bsve-integration/spa.tar.gz ./spa.tar.gz
  gzip -d spa.tar.gz
fi
#Load the image
docker load < spa.tar

#Ensure we have a copy of the promed scraper image
if [[ ! -f promed-scraper.tar ]]; then
  aws s3 cp s3://bsve-integration/promed-scraper.tar.gz ./promed-scraper.tar.gz
  gzip -d promed-scraper.tar.gz
fi
#Load the image
docker load < promed-scraper.tar

export LOCAL_IP=$(ifconfig $ethernet|grep "inet addr"|awk -F":" '{print $2}'|awk '{print $1}')

#Instantiate a new container
sed -r "s/\{\{ip_address\}\}/$LOCAL_IP/" compose/spa.yml > /tmp/spa.yml
docker-compose -f /tmp/spa.yml up -d

#Run cron script for testing
docker exec -ti promed-scraper bash cronjob.sh

echo "*****************************************************************************************"
echo "Please update settings in /shared/settings-production.json"
echo "*****************************************************************************************"
echo ""
echo "*****************************************************************************************"
echo "The ProMED-mail scraper will connect to promedmail.org daily to download new articles an then process them"
echo "*****************************************************************************************"
