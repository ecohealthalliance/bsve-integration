#!/bin/bash

uname -s | grep -i linux || (echo "Please run this script on Linux" && exit 1)

if [ "$EUID" -ne 0 ]
  then echo "Please run as root or with sudo"
  exit 1
fi

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

ifconfig $ethernet || (echo "Ethernet device named $ethernet not found. Please specify correct ethernet name with --ethernet <name>" && exit 1)

docker --version || (echo "Please install docker:   https://docs.docker.com/engine/installation/linux/" && exit 1)

docker-compose --version || (echo "Please install docker-compose:   https://docs.docker.com/compose/install/" && exit 1)

aws s3 ls s3://bsve-integration || (echo "Please install and configure awscli:   https://github.com/aws/aws-cli" && echo "Make sure to have access to s3://bsve-integration too" && exit 1)

