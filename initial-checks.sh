#!/bin/bash

check_for_failure () {
  if [ $? -ne 0 ];then
    echo $1
    exit 1
  fi
}

uname -s | grep -i linux
check_for_failure "Please run this script on Linux"

if [ "$EUID" -ne 0 ];then
  check_for_failure "Please run as root or with sudo"
fi

ethernet="eth0"

if [[ $1 && $2 ]]; then
  if [ "$1"=="--ethernet" ]; then
    ethernet="$2"
  fi
fi

ifconfig $ethernet
check_for_failure "Ethernet interface named $ethernet not found. Please specify correct ethernet name with --ethernet <name>"

docker --version
check_for_failure "Please install docker:   https://docs.docker.com/engine/installation/linux/"

docker-compose --version
check_for_failure "Please install docker-compose:   https://docs.docker.com/compose/install/"

aws s3 ls s3://bsve-integration
check_for_failure "Please install and configure awscli:   https://github.com/aws/aws-cli\nMake sure to have access to s3://bsve-integration too"

