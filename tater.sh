#!/bin/bash

#Preliminary cleanup in case of previous runs
docker rm -f  tater mongodb || true
docker rmi tater mongodb || true
rm *.tar*

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

export MIN_RAM="4000000"
./initial-checks.sh --ethernet $ethernet || exit 1

#Build and spin up our mongodb
./mongodb.sh --ethernet $ethernet

#Grab a copy of the tater image
aws s3 cp s3://bsve-integration/tater.tar.gz ./tater.tar.gz
gzip -d tater.tar.gz

#Load the image
docker load < tater.tar
rm tater.tar*

export LOCAL_IP=$(ifconfig $ethernet|grep "inet addr"|awk -F":" '{print $2}'|awk '{print $1}')

#Get and setup config files
wget https://raw.githubusercontent.com/ecohealthalliance/infrastructure/master/docker/containers/bsve-tater/bsve --output-document=tater.yml
sed -i "s/localhost/$LOCAL_IP/" tater.yml
sed -i "s/8007/80/" tater.yml

#Instantiate a new grits container
docker-compose -f tater.yml up -d

#Settings json file
docker exec tater mkdir /shared
wget https://raw.githubusercontent.com/ecohealthalliance/tater/master/settings-bsve.json
docker cp settings-bsve.json tater:/shared/settings-production.json

echo ""
echo ""
echo ""
echo "Step 1:"
echo "***************************************************************************************"
echo "Update /shared/settings-production.json with your appropriate values"
echo "***************************************************************************************"
echo ""
echo ""
echo ""
echo "Step 2:"
echo "***************************************************************************************"
echo "Restart the tater container"
echo "***************************************************************************************"
echo ""
echo ""
echo ""
echo "Step 3:"
echo "***************************************************************************************"
echo "To setup a default user for an empty database:"
echo "In the browser console, run:"
echo "Meteor.call('createDefaultUser', <your@email>)"
echo "Then follow the link in the email that you should receive to set the password"
echo "***************************************************************************************"
