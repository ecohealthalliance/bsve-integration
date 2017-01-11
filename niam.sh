#!/bin/bash

#Preliminary cleanup in case of previous runs
docker rm -f  niam-c virtuoso-c || true
docker rmi birt niam virtuoso || true

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

./initial-checks.sh --ethernet $ethernet || exit 1

if [ "$(docker ps | grep virtuoso-c)" ]; then
  echo "The existing Virtuoso container must be stopped"
  exit 1
fi

if [ $(free|grep 'Mem\|Swap'|awk '{s+=$2} END {printf "%.0f", s}') -lt "15000000" ]; then
  echo "At least 15GB of combined RAM and Swap is required to load the Virtuoso database"
  exit 1
fi

if [ $(df --output=avail | tail -n +2 | awk '{s+=$1} END {printf "%.0f", s/1024/1024}') -lt "100" ]; then
  echo "At least 100GB of hard drive space is required to load the full Virtuoso database"
  exit 1
fi

aws s3 ls s3://promed-database/sparql-annotation-database/virtuoso/ | grep virtuoso.db.gz
if [ $? -ne 0 ];then
  echo "The virtuoso DB dump could not be found on s3."
  echo "You probably don't have permission to access to the bucket it is stored in."
  exit 1
fi

#Ensure we have a copy of the niam and virtuoso images
aws s3 cp s3://bsve-integration/niam.tar.gz niam.tar.gz
gzip -d niam.tar.gz

aws s3 cp s3://bsve-integration/virtuoso.tar.gz virtuoso.tar.gz
gzip -d virtuoso.tar.gz

#Clear out any preexisting dump data
rm -fr /var/virtuoso || true

# Download Raw Virtuoso DB dump
echo "Downloading Virtuoso DB..."
mkdir -p /var/virtuoso
aws s3 cp s3://promed-database/sparql-annotation-database/virtuoso/virtuoso.db.gz /var/virtuoso
echo "Extracting Virtuoso DB..."
(cd /var/virtuoso && gzip -d virtuoso.db.gz)

#Load the images
docker load < virtuoso.tar
docker load < niam.tar
rm virtuoso.tar niam.tar

LOCAL_IP=$(ip -4 route get 8.8.8.8 | awk '{print $7}')

#Instantiate a new niam and virtuoso containers
sed -r "s/\{\{ip_address\}\}/$LOCAL_IP/" compose/niam.yml > /tmp/niam.yml
docker-compose -f /tmp/niam.yml up -d

#Setup up the settings json file
echo '{"public": {"analyticsSettings": {} } }' > meteor-settings.json
docker cp meteor-settings.json niam-c:/shared/meteor-settings.json

#Restart niam container
docker restart niam-c

#Start promed scraper if it is not running to keep the NIAM data up-to-date
docker ps | grep promed-scraper
if [ $? -ne 0 ]; then
  ./promed-scraper.sh
fi

echo "Done"
