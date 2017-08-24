#!/bin/bash

#Preliminary cleanup in case of previous runs
docker rm -f  grits mongodb redis || true
docker rmi grits mongodb redis || true
rm -fr *.tar*  /var/log/*.tar* /var/log/mongodb

ethernet="eth0"
repo_dir=$(pwd)

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

export MIN_RAM="7500000"
./initial-checks.sh --ethernet $ethernet || exit 1

#Build and spin up our mongodb
./mongodb.sh --ethernet $ethernet

#Build and spin up redis
./redis.sh --ethernet $ethernet


#Ensure we have a copy of the grits image
aws s3 cp s3://bsve-integration/grits.tar.gz ./grits.tar.gz
gzip -d grits.tar.gz

#Load the image
docker load < grits.tar
rm grits.tar

#Start geonames api
./geonames-api.sh --ethernet $ethernet

#Instantiate a new grits container
cd $repo_dir && (
  ip_address=$(ip -4 route get 8.8.8.8 | awk '{print $7}') \
  docker-compose -f compose/grits.yml up -d grits
)

#Reusable function for executing inside of docker container
function inside_container { docker exec -i grits "$@"; }

#Find the AWS credentials
if [ -f ~/.aws/credentials ]; then
  AWS_CRED_FILE=~/.aws/credentials
elif [ -f ~/.aws/config ]; then
  AWS_CRED_FILE=~/.aws/config
else
  echo "Could not file AWS credentials file"
  exit 1
fi
export AWS_CRED_FILE

#Configure settings
inside_container sed -i "/AWS/d" /source-vars.sh
inside_container mkdir /root/.aws
docker cp $AWS_CRED_FILE grits:/root/.aws/config

#Modify Apache config to be more compatible with BSVE hosting
inside_container sed -i "1,7d" /etc/apache2/conf-enabled/proxy.conf
inside_container sed -i "s/443/80/" /etc/apache2/conf-enabled/proxy.conf
inside_container sed -i "/SSL/d" /etc/apache2/conf-enabled/proxy.conf

#Run setup scripts
inside_container bash -c "source /source-vars.sh && /scripts/update-settings.sh"
inside_container bash -c "source /source-vars.sh && /scripts/disease-label-autocomplete.sh"
inside_container bash -c "source /source-vars.sh && /scripts/classifiers.sh"

#Restart container
docker kill grits && docker start grits
echo "Sleeping 10 secs, and then starting all services"
sleep 10
#Sometimes services crash when they all start up at the same time.
#Usually this fixes the problem if it's not config related.
inside_container supervisorctl start all

echo "*****************************************************************************************"
echo "Grits should be running with a few default settings. To change these settings:"
echo "Step 1: Edit /source-vars.sh"
echo "Step 2: Inside the container do: source /source-vars.sh && /scripts/update-settings.sh"
echo "Step 3: Restart the entire container"
echo "*****************************************************************************************"
echo ""
echo ""
echo "Grits app will be available at http://<hostname-or-ip>/new?compact=true&bsveAccessKey=loremipsumhello714902&hideBackButton=true"

