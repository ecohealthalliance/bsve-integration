#!/bin/bash
# This starts the promed-mail scraper and downloads data dumps of pre-processed promed articles.
ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

./initial-checks.sh --ethernet $ethernet || exit 1

#Build and spin up our mongodb
./mongodb.sh --ethernet $ethernet

#Download and import ProMED mongo dump
if [[ ! -d promed_dump ]]; then
  mkdir -p promed_dump
  aws s3 cp s3://promed-database/bsve/dump /mnt/mongo/dump --recursive
fi
#Load mongo dump
docker exec -ti mongodb mongorestore --dir /var/lib/dump

#Ensure we have a copy of the promed scraper image
if [[ ! -f promed-scraper.tar ]]; then
  aws s3 cp s3://bsve-integration/promed-scraper.tar.gz ./promed-scraper.tar.gz
  gzip -d promed-scraper.tar.gz
fi
#Load the image
docker load < promed-scraper.tar

export LOCAL_IP=$(ifconfig $ethernet|grep "inet addr"|awk -F":" '{print $2}'|awk '{print $1}')

#Instantiate a new container
sed -r "s/\{\{ip_address\}\}/$LOCAL_IP/" compose/promed-scraper.yml > /tmp/promed-scraper.yml
docker-compose -f /tmp/promed-scraper.yml up -d

./backfill-spa-niam.sh

echo "*****************************************************************************************"
echo "The ProMED-mail scraper will connect to promedmail.org daily to download new articles"
echo "*****************************************************************************************"
