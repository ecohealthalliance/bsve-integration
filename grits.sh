#!/bin/bash

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

./initial-checks.sh --ethernet $ethernet || exit 1

#Ensure data dump file is in our directory
if [ ! -f geonames.tar ]; then
  aws s3 cp s3://bsve-integration/geonames.tar ./geonames.tar
fi

#Build and spin up our mongodb
./mongodb.sh

#Import the geonames dataset
ln -s $(pwd)/geonames.tar /var/log/geonames.tar
cd /var/log/ && tar -xf geonames.tar &&\ 
docker exec -t mongodb mongorestore --db geonames /var/log/geonames

#Ensure we have a copy of the grits image
if [[ ! -f grits-provisioned.tar.gz && ! -f grits-provisioned.tar ]]; then
  aws s3 cp s3://bsve-integration/grits-provisioned.tar.gz ./grits-provisioned.tar.gz
  gzip -d grits-provisioned.tar.gz
fi

#Load the image
docker load < grits-provisioned.tar

export LOCAL_IP=$(ifconfig eth0|grep "inet addr"|awk -F":" '{print $2}'|awk '{print $1}')

#Get and setup config files
wget https://raw.githubusercontent.com/ecohealthalliance/grits-deploy-ansible/master/compose.yml --output-document=grits.yml
sed -i -r "s/(\b[0-9]{1,3}\.){3}[0-9]{1,3}\b/$LOCAL_IP/" grits.yml
sed -i "s/image: grits$/image: grits-provisioned/" grits.yml
sed -i "/    \- \/mnt\/grits:\/home\/grits/d" grits.yml

#Instantiate a new grits container
docker-compose -f grits.yml up -d

#Change all mongo references to use new local ip address
docker exec -t grits find /var/lib/mongo/grits/ -type f -exec sed -i -r "s/mongodb\:\/\/(\b[0-9]{1,3}\.){3}[0-9]{1,3}\b\:27017/mongodb\:\/\/$LOCAL_IP:27017/" {} \;
docker exec -t grits find /home/grits/ -type f -exec sed -i -r "s/mongodb\:\/\/(\b[0-9]{1,3}\.){3}[0-9]{1,3}\b\:27017/mongodb\:\/\/$LOCAL_IP:27017/" {} \;
docker exec -t grits find /etc/supervisor/conf.d/ -type f -exec sed -i -r "s/mongodb\:\/\/(\b[0-9]{1,3}\.){3}[0-9]{1,3}\b\:27017/mongodb\:\/\/$LOCAL_IP:27017/" {} \;
docker exec -t grits sed -i -r "s/(\b[0-9]{1,3}\.){3}[0-9]{1,3}\b:27017/$LOCAL_IP:27017/" /home/grits/diagnostic-dashboard/.scripts/autocompleteCollections.js
docker exec -t grits sed -i -r "s/ROOT_URL=\"http\:\/\/grits.eha.io\"/ROOT_URL=\"http\:\/\/$LOCAL_IP\"/" /etc/supervisor/conf.d/dashboardd.conf

#Restart all the services
docker kill grits
docker start grits

echo "*****************************************************************************************"
echo "Please update with your own bsve credentials at $GRITS_HOME/grits-api/config.py"
echo "*****************************************************************************************"
