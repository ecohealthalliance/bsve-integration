#!/bin/bash

#Preliminary cleanup in case of previous runs
docker rm -f  birt mongodb || true
docker rmi birt mongodb || true
rm -fr *.tar* /var/log/dump

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

export MIN_RAM="8000000"
./initial-checks.sh --ethernet $ethernet || exit 1

#Ensure data dump file is in our directory
aws s3 cp s3://bsve-integration/birt-data.tar.gz ./birt-data.tar.gz

#Build and spin up our mongodb
./mongodb.sh --ethernet $ethernet

#Import the birt dataset
ln -s $(pwd)/birt-data.tar.gz /var/log/birt-data.tar.gz
cd /var/log/ && tar -zxf birt-data.tar.gz &&\ 
docker exec mongodb mongorestore --db birt /var/log/dump/birt
rm -fr /var/log/dump
cd -

#Ensure we have a copy of the birt image
aws s3 cp s3://bsve-integration/birt.tar.gz ./birt.tar.gz
gzip -d birt.tar.gz

#Load the image
docker load < birt.tar
rm birt.tar

export LOCAL_IP=$(ifconfig $ethernet|grep "inet addr"|awk -F":" '{print $2}'|awk '{print $1}')

#Setup config files
sed -i -r "s/(\b[0-9]{1,3}\.){3}[0-9]{1,3}\b/$LOCAL_IP/" compose/birt.yml

#Instantiate a new birt container
docker-compose -f compose/birt.yml up -d birt

##Setup up the settings json file
#echo '{"public": {"analyticsSettings": {"Google Analytics" : {"trackingId": "CHANGE-ME"} } } }' > settings-production.json
#docker exec birt mkdir /shared
#docker cp settings-production.json birt:/shared/settings-production.json

#Restart birt
#docker kill birt
#docker start birt

echo "*****************************************************************************************"
echo "Please update settings in /shared/settings-production.json"
echo "*****************************************************************************************"
echo ""
echo ""
echo ""
echo "*****************************************************************************************"
echo "Please also not that the app may take serveral minutes to load depending on the amount of data in the database"
echo "*****************************************************************************************"

