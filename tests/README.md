# Python environment:

1. `brew install selenium-server-standalone chromedriver`

3. `virtualenv pyenv`

4. `source pyenv/bin/activate`

5. `pip install -r requirements.txt`

# settings.ini

```
[BSVE]
USERNAME = <your email address>
PASSWORD = <your password>
TEST_URL = https://test.bsvecosystem.net/workbench/
DEVELOPER_URL = https://developer.bsvecosystem.net/
APP_NAME = <name of the bsve app>
IFRAME_SRC = <src of the iframe>

[SELENIUM]
DRIVER = <one of Firefox, Chrome or PhantomJS>
```

# Run tests

*WARNING: this will delete then attempt to redeploy the app specified in `settings.ini` under key APP_NAME*

```
nosetests
```

# TODO

1. Create a method to verify iframe contents, see `verify_iframe_content` method in `test_layout_page`

2. Within `test_create_app`, finish creating an HTML 5 app by clicking the [Create New App] button.

# Known Issues

1. If the layout/styling within the bsvecosystem changes, then the selenium test scripts will need to be updated.

2. This will only work if the `APP_NAME` is know to be unique. The bsvecosystem will append a number to duplicate names and the script will always select the first match. This shouldn't be an issue if the developer logs into the bsvecosystem and chooses a unique name. For example, calling your test app `test` probably has a good chance of not being unique. A better name would be `adfnj349adf13aga-test-app`.

3. Timing between `test_create_app` and `test_layout_page`. The first test is to create an app using the DEVELOPER_URL, then publish to the bsvecosystem testing environment. This deployment process usually completes within 30 seconds. The second test relies on the deployment to complete successfully. Currently, there isn't a method for verifying the deployment process was successful before starting the second test `test_layout_page`.
