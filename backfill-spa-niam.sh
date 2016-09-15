# This will backfill the NIAM and SPA databases by scraping and processing
# ProMED articles published since the database dump was created.
# If the NIAM database is not running, this script can still backfill the SPA
# database, however it will encounter an error once it reaches the tasks
# involving the NIAM database. The NIAM database depends on data from the SPA
# database.
sudo apt-get install -y dateutils
database_dump_date=2016-7-1
last_n_days=`dateutils.ddiff $database_dump_date now`
extra_vars='mongo_url=$MONGO_URL SPARQLDB_URL=$SPARQLDB_URL last_n_days='$last_n_days
docker exec -it promed-scraper bash -c "/usr/local/bin/ansible-playbook --connection=local /promed_mail_scraper/ansible/site.yml --tags=promed,download-classifier,t11 --skip-tags=preloadable --extra-vars \"$extra_vars\""
