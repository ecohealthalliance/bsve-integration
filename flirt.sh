#!/bin/bash

#Ensure data dump file is in our directory
if [ ! -f grits-net-meteor.tar ]; then
  aws s3 cp s3://bsve-integration/grits-net-meteor.tar ./grits-net-meteor.tar
fi

#Build and spin up our mongodb
./mongodb.sh

#Import the grits-net-meteor dataset
ln -s $(pwd)/grits-net-meteor.tar /var/log/grits-net-meteor.tar
cd /var/log/ && tar -xf grits-net-meteor.tar &&\ 
docker exec -t mongodb mongorestore --db grits-net-meteor /var/log/grits-net-meteor


