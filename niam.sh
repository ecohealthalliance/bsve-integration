#!/bin/bash

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

./initial-checks.sh --ethernet $ethernet || exit 1

if [ $(df --output=avail | tail -n +2 | awk '{s+=$1} END {printf "%.0f", s/1024/1024}') -lt "70" ];then
  echo "At least 70GB of hard drive space is required to load the full Virtuoso database"
  exit 1
fi

#Ensure we have a copy of the niam and virtuoso images
if [[ ! -f niam.tar ]]; then
  aws s3 cp s3://bsve-integration/niam.tar.gz niam.tar.gz
  gzip -d niam.tar.gz
fi
if [[ ! -f virtuoso.tar ]]; then
  aws s3 cp s3://bsve-integration/virtuoso.tar.gz virtuoso.tar.gz
  gzip -d virtuoso.tar.gz
fi

#Downlod Virtuoso Dump
virtuoso_data_path=/mnt/virtuoso
if [[ ! -d $virtuoso_data_path/toLoad ]]; then
  mkdir -p $virtuoso_data_path/toLoad
  #TODO: Update dump
  aws s3 cp --recursive s3://promed-database/sparql-annotation-database/virtuoso/dump_2016-07-15_15-27 $virtuoso_data_path/toLoad
fi

#Load the images
docker load < virtuoso.tar
docker load < niam.tar

LOCAL_IP=$(ip -4 route get 8.8.8.8 | awk '{print $7}')

#Instantiate a new niam and virtuoso containers
sed -r "s/\{\{ip_address\}\}/$LOCAL_IP/" compose/niam.yml > /tmp/niam.yml
docker-compose -f /tmp/niam.yml up -d

echo "*****************************************************************************************"
echo "The DB dump takes a long time to fully load, but incremental results should be visible"
echo "*****************************************************************************************"
echo "*****************************************************************************************"
echo "Please update settings in /mnt/niam-shared/meteor-settings.json"
echo "*****************************************************************************************"
