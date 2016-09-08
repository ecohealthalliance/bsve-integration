#!/bin/bash

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

#Ensure we have a copy of the niam and virtuoso images
if [[ ! -f niam.tar ]]; then
  aws s3 cp s3://bsve-integration/niam.tar.gz niam.tar.gz
  gzip -d niam.tar.gz
fi
if [[ ! -f virtuoso.tar ]]; then
  aws s3 cp s3://bsve-integration/virtuoso.tar.gz virtuoso.tar.gz
  gzip -d virtuoso.tar.gz
fi

# Download Raw Virtuoso DB dump
echo "Downloading Virtuoso DB..."
mkdir -p /var/virtuoso
aws s3 cp s3://promed-database/sparql-annotation-database/virtuoso/virtuoso.db.gz /var/virtuoso
cd /var/virtuoso
echo "Extracting Virtuoso DB..."
gzip -d virtuoso.db.gz

# Download Virtuoso Triple Dump
# virtuoso_data_path=/var/virtuoso
# if [[ ! -d $virtuoso_data_path/toLoad ]]; then
#   mkdir -p $virtuoso_data_path/toLoad
#   #TODO: Update dump
#   aws s3 cp --recursive s3://promed-database/sparql-annotation-database/virtuoso/dump_2016-08-05_04-39 $virtuoso_data_path/toLoad
# fi

#Load the images
docker load < virtuoso.tar
docker load < niam.tar

LOCAL_IP=$(ip -4 route get 8.8.8.8 | awk '{print $7}')

#Instantiate a new niam and virtuoso containers
sed -r "s/\{\{ip_address\}\}/$LOCAL_IP/" compose/niam.yml > /tmp/niam.yml
docker-compose -f /tmp/niam.yml up -d

#Setup up the settings json file
echo '{"public": {"analyticsSettings": {"Google Analytics" : {"trackingId": "CHANGE-ME"} } } }' > meteor-settings.json
docker cp meteor-settings.json niam-c:/shared/meteor-settings.json

#Restart niam container
docker restart niam-c

# echo "*****************************************************************************************"
# echo "The Virtuoso DB dump will take a few hours to fully load, but incremental results may be visible"
# echo "Progress can be monitored with the following command:"
# echo 'sudo docker exec -it virtuoso-c isql-v 1111 dba dba exec="select * from DB.DBA.load_list;"'
# echo "*****************************************************************************************"
echo "*****************************************************************************************"
echo "Please update settings in /mnt/niam-shared/meteor-settings.json"
echo "*****************************************************************************************"
