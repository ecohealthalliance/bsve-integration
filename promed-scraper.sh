#!/bin/bash
# This starts the promed-mail scraper and downloads data dumps of pre-processed promed articles.

#Preliminary cleanup in case of previous runs
docker rm -f  promed-scraper mongodb || true
docker rmi promed-scraper mongodb || true
rm *.tar*

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

export MIN_RAM="2000000"
./initial-checks.sh --ethernet $ethernet || exit 1

#Build and spin up our mongodb
./mongodb.sh --ethernet $ethernet

#Download and import ProMED mongo dump
mkdir -p promed_dump
aws s3 cp s3://promed-database/bsve/dump /mnt/mongo/dump --recursive

#Load mongo dump
docker exec -i mongodb mongorestore --dir /var/lib/dump
rm -fr promed_dump

#Ensure we have a copy of the promed scraper image
aws s3 cp s3://bsve-integration/promed-scraper.tar.gz ./promed-scraper.tar.gz
gzip -d promed-scraper.tar.gz

#Load the image
docker load < promed-scraper.tar
rm promed-scraper.tar

export LOCAL_IP=$(ifconfig $ethernet|grep "inet addr"|awk -F":" '{print $2}'|awk '{print $1}')

#Instantiate a new container
sed -r "s/\{\{ip_address\}\}/$LOCAL_IP/" compose/promed-scraper.yml > /tmp/promed-scraper.yml
docker-compose -f /tmp/promed-scraper.yml up -d

./backfill-spa-niam.sh --exclude-t11

echo "*****************************************************************************************"
echo "In order to run the promed scraper against foreign language feeds you will need to have a valid Google Translate API key.  Once you have obtained this key, bash into the promed-mail docker container and set the 'google_api_key' value in the promed_mail_scraper/config.py file." 
echo "*****************************************************************************************"

echo "*****************************************************************************************"
echo "The ProMED-mail scraper will connect to promedmail.org daily to download new articles"
echo "*****************************************************************************************"
