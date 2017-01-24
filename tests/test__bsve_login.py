import os
import time
from unittest import TestCase
from ConfigParser import RawConfigParser
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

SCRIPT_DIR = os.path.dirname(__file__)

def get_driver(name):
    if name == 'Firefox':
        return webdriver.Firefox()
    if name == 'Chrome':
        return webdriver.Chrome()
    if name == 'PhantomJS':
        return webdriver.PhantomJS()
    raise ValueError('Invalid SELENIUM driver')


class TestBSVELogin(TestCase):

    def read_config(self):
        # read the config file
        config = RawConfigParser()
        config.read(os.path.abspath(os.path.realpath(os.path.join(SCRIPT_DIR,'settings.ini'))))
        self.url = config.get('BSVE', 'URL')
        self.username = config.get('BSVE', 'USERNAME')
        self.password = config.get('BSVE', 'PASSWORD')
        self.driver_name = config.get('SELENIUM', 'DRIVER')

    def enter_text_by_id(self, element_id, text):
        element = None
        try:
            element = WebDriverWait(self.driver, 30).until(
                EC.presence_of_element_located((By.ID, element_id))
            )
        except NoSuchElementException as e:
            self.driver.quit()
            raise e
        if element:
            element.send_keys(text)

    def click_submit_button(self, selector):
        element = None
        try:
            element = WebDriverWait(self.driver, 30).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
        except NoSuchElementException as e:
            self.driver.quit()
            raise e
        if element:
            element.click()

    def setUp(self):
        self.read_config()
        # setup selenium
        self.driver = get_driver(self.driver_name)
        self.driver.implicitly_wait(30)
        self.verificationErrors = []
        self.accept_next_alert = True

    def tearDown(self):
        pass

    def test_login_page(self):
        self.driver.get(self.url)
        self.enter_text_by_id('email', self.username)
        self.enter_text_by_id('password', self.password)
        self.click_submit_button('button.btn[type="submit"]')
        time.sleep(30)
        self.assertEqual(True, True)
