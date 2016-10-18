#!/bin/bash

ethernet="eth0"
repo_dir=$(pwd)

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

./initial-checks.sh --ethernet $ethernet || exit 1

#Build and spin up our mongodb
./mongodb.sh --ethernet $ethernet

#Ensure we have a copy of the grits image
if [[ ! -f grits.tar.gz && ! -f grits.tar ]]; then
  aws s3 cp s3://bsve-integration/grits.tar.gz ./grits.tar.gz
  gzip -d grits.tar.gz
fi

#Load the image
docker load < grits.tar

#Instantiate a new grits container
cd $repo_dir &&\
docker-compose -f compose/grits.yml up -d

echo "Step 1:"
echo "*****************************************************************************************"
echo "In the grits container, please update all of the appropriate settings in /source-vars.sh"
echo "HING: Look for CHANGEME"
echo ""
echo ""
echo "Step 2:"
echo "*****************************************************************************************"
echo "Update apache config to use your SSL cert, or disable"
echo ""
echo ""
echo "Step 3:"
echo "*****************************************************************************************"
echo "In the grits container do: 'source /source-vars.sh && /scripts/first-run.sh'"
echo ""
echo ""
echo "Step 4:"
echo "*****************************************************************************************"
echo "Afterwards please restart the entire grits container."
echo "You may need to manually exec in and do 'supervisorctl start all'"
echo "Grits app will be available at http://$LOCAL_IP/new?compact=true&bsveAccessKey=loremipsumhello714902&hideBackButton=true"
