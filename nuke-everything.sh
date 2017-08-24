#!/bin/bash

#Remove all containers, images, and mongo data

docker ps -a|awk '{print $1}'|xargs docker rm -f
docker images|awk '{print $3}'|xargs docker rmi
rm -fr /mnt/mongo *.tar*

