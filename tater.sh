#!/bin/bash

#Build and spin up our mongodb
./mongodb.sh

#Ensure we have a copy of the grits image
if [[ ! -f tater.tar.gz && ! -f tater.tar ]]; then
  aws s3 cp s3://bsve-integration/tater.tar.gz ./tater.tar.gz
  gzip -d tater.tar.gz
fi

#Load the image
docker load < tater.tar

export LOCAL_IP=$(ifconfig eth0|grep "inet addr"|awk -F":" '{print $2}'|awk '{print $1}')

#Get and setup config files
wget https://raw.githubusercontent.com/ecohealthalliance/infrastructure/master/docker/containers/bsve-tater/bsve --output-document=tater.yml
sed -i "s/localhost/$LOCAL_IP/" tater.yml
sed -i "s/8007/80/" tater.yml

#Instantiate a new grits container
docker-compose -f tater.yml up -d

#Settings json file
docker exec -t tater mkdir /shared
echo "{  "public": {    "stripe": {      "publishableKey": "pk_live_CHANGEME"    },    "analyticsSettings": {      "Google Analytics" : {"trackingId": "UA-CHANGEME"}    },    "accounts": {      "tokenUser": "bsve-user@CHANGEME.org"    }  },  "private": {    "AWS_ACCESS_KEY": "CHANGEME",    "AWS_SECRET_KEY": "CHANGEME",    "stripe": {      "secretKey": "sk_live_CHANGEME"    },    "accounts": {      "loginToken": "CHANGEME"    },    "MAIL_URL":"smtp://CHANGEME",    "jenkins": {      "url": "CHANGEME",      "user": "CHANGEME",      "key": "CHANGEME",      "buildKey": "CHANGEME"    }  }}" > settings-production.json
docker cp settings-production.json tater:/shared/settings-production.json

echo "Step 1:"
echo "***************************************************************************************"
echo "Update /shared/settings-production.json with your appropriate values"
echo "***************************************************************************************"
echo "\n\n\n"
echo "Step 2:"
echo "***************************************************************************************"
echo "Restart the tater container"
echo "***************************************************************************************"
echo "\n\n\n"
echo "Step 3:"
echo "***************************************************************************************"
echo "To setup a default user for an empty database:"
echo "In the browser console, run:"
echo "Meteor.call('createDefaultUser', <your@email>)"
echo "Then follow the link in the email that you should receive to set the password"
echo "***************************************************************************************"
