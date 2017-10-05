This repository contains scripts for deploying EHA GRITS apps on ubuntu AWS instances
that have docker, docker-compose and the aws CLI installed instance.
Super-user privileges are required to run the scripts. To deploy GRITS for example
run the following commands:
```
sudo su
./grits.sh
```

The scripts download docker images and other application data from EHA hosted AWS buckets.

This repository also contains a tool for generating BSVE wrappers for the GRITS apps.
It is documented here in https://github.com/ecohealthalliance/bsve-integration/tree/master/wrapper-gen/README.md
