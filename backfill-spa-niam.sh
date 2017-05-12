#!/bin/bash
echo "*****************************************************************************************"
echo "Backfilling the NIAM and SPA databases by scraping and processing"
echo "ProMED articles published since their database dumps were created..."
echo "This will probably take several hours."
echo "If the NIAM database is not running, this script can still backfill the SPA"
echo "database, however it will display an error once it reaches the tasks"
echo "involving the NIAM database."
echo "*****************************************************************************************"

key="$1"
if [ $key == "--exclude-t11" ];then
  tags='promed,download-classifier';
  echo "Excluding T11"
else
  tags='promed,download-classifier,t11'
fi

sudo apt-get install -y dateutils
database_dump_date=2016-7-20
last_n_days=`dateutils.ddiff $database_dump_date now`
extra_vars='max_items_to_process=-1 mongo_url=$MONGO_URL SPARQLDB_URL=$SPARQLDB_URL last_n_days='$last_n_days

docker exec -i promed-scraper bash -c "/usr/local/bin/ansible-playbook --connection=local /promed_mail_scraper/ansible/site.yml --tags=$tags --skip-tags=preloadable --extra-vars \"$extra_vars\""
