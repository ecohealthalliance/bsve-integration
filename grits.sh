#!/bin/bash

#Ensure data dump file is in our directory
if [ ! -f geonames.tar ]; then
  aws s3 cp s3://bsve-integration/geonames.tar ./geonames.tar
fi

#Build and spin up our mongodb
./mongodb.sh

#Import the geonames dataset
mv -v ./geonames.tar /var/log
cd /var/log/ && tar -xf geonames.tar &&\ 
docker exec -t mongodb mongorestore --db geonames /var/log/geonames

#Ensure we have a copy of the grits image
if [[ ! -f grits-provisioned.tar.gz && ! -f grits-provisioned.tar ]]; then
  aws s3 cp s3://bsve-integration/grits-provisioned.tar.gz ./grits-provisioned.tar.gz
  gzip -d grits-provisioned.tar.gz
fi

docker load < grits-provisioned.tar

#Get and setup config files
export LOCAL_IP=$(ifconfig eth0|grep "inet addr"|awk -F":" '{print $2}'|awk '{print $1}')
wget https://raw.githubusercontent.com/ecohealthalliance/grits-deploy-ansible/master/compose.yml --output-document=grits.yml
sed -i "s/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/$LOCAL_IP/" grits.yml
sed -i "s/image: grits/image: grits-provisioned/" grits.yml

docker-compose -f grits.yml up -d

docker exec -t grits sed -i "s/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/$LOCAL_IP/" /var/lib/mongo/grits/grits-api/config.py
docker exec -t grits sed -i "s/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/$LOCAL_IP/" /var/lib/mongo/grits/grits_config
docker exec -t grits sed -i "s/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/$LOCAL_IP/" /etc/supervisor/conf.d/girderd.conf

docker exec -t grits service supervisor restart

echo "*****************************************************************************************"
echo "Please update with your own bsve credentials at $GRITS_HOME/grits-api/config.py"
echo "*****************************************************************************************"
