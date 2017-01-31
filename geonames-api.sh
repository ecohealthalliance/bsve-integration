#!/bin/bash

#Prelim cleanup
rm *.tar* /tmp/*.tar*

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

./initial-checks.sh --ethernet $ethernet || exit 1

aws s3 cp s3://bsve-integration/elasticsearch-data.tar.gz /tmp/elasticsearch-data.tar.gz
aws s3 cp s3://bsve-integration/geonames-api.tar.gz /tmp/geonames-api.tar.gz
tar -xvzf /tmp/elasticsearch-data.tar.gz -C /
gzip -d /tmp/geonames-api.tar.gz
docker load < /tmp/geonames-api.tar
rm *.tar* /tmp/*.tar*

(
  elasticsearch_data_path=/mnt/elasticsearch/data \
  ip_address=$(ip -4 route get 8.8.8.8 | awk '{print $7}') \
  docker-compose -f compose/geonames-api.yml up -d
)

echo "*****************************************************************************************"
echo "To change the domain name in the the API documentation, edit the api config file, then regenerate the docs like so:"
echo "docker exec -i geonames-api bash"
echo "vim apidoc.json"
echo "npm run docs"
echo "*****************************************************************************************"
