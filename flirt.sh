#!/bin/bash

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

./initial-checks.sh --ethernet $ethernet || exit 1

#Ensure data dump file is in our directory
if [ ! -f grits-net-meteor.tar ]; then
  aws s3 cp s3://bsve-integration/grits-net-meteor.tar ./grits-net-meteor.tar
fi

#Build and spin up our mongodb
./mongodb.sh --ethernet $ethernet

#Import the grits-net-meteor dataset
ln -s $(pwd)/grits-net-meteor.tar /var/log/grits-net-meteor.tar
cd /var/log/ && tar -xf grits-net-meteor.tar &&\ 
docker exec -t mongodb mongorestore --db grits-net-meteor /var/log/grits-net-meteor

#Ensure we have a copy of the flirt image
if [[ ! -f flirt.tar.gz && ! -f flirt.tar ]]; then
  aws s3 cp s3://bsve-integration/flirt.tar.gz ./flirt.tar.gz
  gzip -d flirt.tar.gz
fi

#Load the image
docker load < flirt.tar

export LOCAL_IP=$(ifconfig $ethernet|grep "inet addr"|awk -F":" '{print $2}'|awk '{print $1}')

#Get and setup config files
wget https://raw.githubusercontent.com/ecohealthalliance/infrastructure/master/docker/containers/flirt.yml
sed -i -r "s/(\b[0-9]{1,3}\.){3}[0-9]{1,3}\b/$LOCAL_IP/" flirt.yml
sed -i "/  volumes\:/d" flirt.yml
sed -i "/    \- \/shared\:\/shared\:ro/d" flirt.yml

#Instantiate a new flirt container
docker-compose -f flirt.yml up -d

#Setup up the settings json file
echo '{"public": {"analyticsSettings": {"Google Analytics" : {"trackingId": "CHANGE-ME"} } } }' > settings-production.json
docker exec -t flirt mkdir /shared
docker cp settings-production.json flirt:/shared/settings-production.json

#Restart flirt
docker kill flirt
docker start flirt

echo "*****************************************************************************************"
echo "Please update settings in /shared/settings-production.json"
echo "*****************************************************************************************"
echo ""
echo ""
echo ""
echo "*****************************************************************************************"
echo "Please also not that the app may take serveral minutes to load depending on the amount of data in the database"
echo "*****************************************************************************************"

