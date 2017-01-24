Python environment:

1. `brew install selenium-server-standalone chromedriver`
3. `virtualenv pyenv`
4. `source pyenv/bin/activate`
5. `pip install -r requirements.txt`

settings.ini

```
[BSVE]
USERNAME = <your email address>
PASSWORD = <your password>
URL = https://test.bsvecosystem.net/workbench/

[SELENIUM]
DRIVER = <one of Firefox, Chrome or PhantomJS>
```

Run tests

```
nosetests
```
