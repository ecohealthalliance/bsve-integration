generate.sh requires the unix zip program which can be installed like so:

```
sudo apt-get install zip
```

# To create BSVE wrappers for EHA Apps use the following commands:

```bash
#Note the extra url path required for GRITS
./generate.sh "https://*GRITS URL HERE*/new?compact=true&bsveAccessKey=loremipsumhello714902&hideBackButton=true" "GRITS" grits.zip 
./generate.sh https://*EIDR URL HERE* EIDR-Connect eidr-c.zip
./generate.sh https://*EIDR URL HERE*/extract-incidents "EIDR-Connect Extract Incidents" eidr-c-extract.zip
./generate.sh https://*NIAM URL HERE* "Novel Infectious Agent Monitor;ProMED-mail" niam.zip
./generate.sh https://*FLIRT URL HERE* FLIRT flirt.zip
./generate.sh https://*SPA URL HERE* "SPA;ProMED-mail" spa.zip
./generate.sh https://*BIRT URL HERE* BIRT birt.zip
./generate.sh https://*TATER URL HERE*/authenticate?userAccessKey=CHANGEME TATER tater.zip
```
