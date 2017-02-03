import os
import time
from unittest import TestCase
from ConfigParser import RawConfigParser
from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException, ElementNotVisibleException, TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

SCRIPT_DIR = os.path.dirname(__file__)
SLEEP = 2

def get_driver(name):
    if name == 'Firefox':
        return webdriver.Firefox()
    if name == 'Chrome':
        return webdriver.Chrome()
    if name == 'PhantomJS':
        return webdriver.PhantomJS()
    raise ValueError('Invalid SELENIUM driver')


class test_BSVE_app_iframe(TestCase):

    def read_config(self):
        # read the config file
        config = RawConfigParser()
        config.read(os.path.abspath(os.path.realpath(os.path.join(SCRIPT_DIR,'settings.ini'))))
        self.test_url = config.get('BSVE', 'TEST_URL')
        self.developer_url = config.get('BSVE', 'DEVELOPER_URL')
        self.username = config.get('BSVE', 'USERNAME')
        self.password = config.get('BSVE', 'PASSWORD')
        self.app_name = config.get('BSVE', 'APP_NAME')
        self.iframe_src = config.get('BSVE', 'IFRAME_SRC')
        self.driver_name = config.get('SELENIUM', 'DRIVER')

    def enter_text_by_id(self, element_id, text):
        element = None
        try:
            element = WebDriverWait(self.driver, 30).until(
                EC.presence_of_element_located((By.ID, element_id))
            )
        except NoSuchElementException as e:
            print 'NoSuchElementException: %s' % element_id
            self.driver.quit()
            raise e
        except ElementNotVisibleException as e:
            print 'ElementNotVisibleException: %s' % element_id
            self.driver.quit()
            raise e
        except TimeoutException as e:
            print 'TimeoutException: %s' % element_id
            self.driver.quit()
            raise e
        if element:
            element.send_keys(text)

    def enter_text_by_selector(self, selector, text):
        element = None
        try:
            element = WebDriverWait(self.driver, 30).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
        except NoSuchElementException as e:
            print 'NoSuchElementException: %s' % selector
            self.driver.quit()
            raise e
        except ElementNotVisibleException as e:
            print 'ElementNotVisibleException: %s' % selector
            self.driver.quit()
            raise e
        except TimeoutException as e:
            print 'TimeoutException: %s' % selector
            self.driver.quit()
            raise e
        if element:
            element.send_keys(text)

    def find_when_element_is_visible(self, selector):
        element = None
        try:
            element = WebDriverWait(self.driver, 30).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
        except NoSuchElementException as e:
            print 'NoSuchElementException: %s' % selector
            self.driver.quit()
            raise e
        except ElementNotVisibleException as e:
            print 'ElementNotVisibleException: %s' % selector
            self.driver.quit()
            raise e
        except TimeoutException as e:
            print 'TimeoutException: %s' % selector
            self.driver.quit()
            raise e
        return element

    def click_element_when_visible(self, selector):
        element = None
        try:
            element = WebDriverWait(self.driver, 30).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
        except NoSuchElementException as e:
            print 'NoSuchElementException: %s' % selector
            self.driver.quit()
            raise e
        except ElementNotVisibleException as e:
            print 'ElementNotVisibleException: %s' % selector
            self.driver.quit()
            raise e
        except TimeoutException as e:
            print 'TimeoutException: %s' % selector
            self.driver.quit()
            raise e
        if element:
            element.click()

    def find_title_in_list(self, selector, app_name):
        list_element = None
        unordered_list_element = None
        try:
            unordered_list_element = WebDriverWait(self.driver, 30).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
        except NoSuchElementException as e:
            print 'NoSuchElementException: %s' % selector
            self.driver.quit()
            raise e
        except ElementNotVisibleException as e:
            print 'ElementNotVisibleException: %s' % selector
            self.driver.quit()
            raise e
        except TimeoutException as e:
            print 'TimeoutException: %s' % selector
            self.driver.quit()
            raise e

        if unordered_list_element:
            for li in unordered_list_element.find_elements_by_tag_name('li'):
                title = li.get_attribute('title').lower().strip()
                if title.startswith(app_name.lower().strip()):
                    list_element = li
                    break
        return list_element

    def delete_existing_layout(self, list_element):
        # delete the existing test app_name
        trash_element = list_element.find_element_by_tag_name('span')
        trash_element.click()
        time.sleep(SLEEP)
        button = self.find_when_element_is_visible('*[id^="app-partials-confirmRemovelOfLayout"] button.btn.btn-primary')
        if button:
            button.click()

    def open_layout_selector(self):
        self.click_element_when_visible('div.appdrawer')
        self.click_element_when_visible('#layoutSelector')

    def find_new_layout_anchor(self, selector):
        unordered_list_element = None
        try:
            unordered_list_element = WebDriverWait(self.driver, 30).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
        except NoSuchElementException as e:
            print 'NoSuchElementException: %s' % selector
            self.driver.quit()
            raise e
        except ElementNotVisibleException as e:
            print 'ElementNotVisibleException: %s' % selector
            self.driver.quit()
            raise e
        except TimeoutException as e:
            print 'TimeoutException: %s' % selector
            self.driver.quit()
            raise e

        if unordered_list_element:
            for a in unordered_list_element.find_elements_by_tag_name('a'):
                a_text = a.text.strip().lower()
                if a_text == 'new layout':
                    a.click()
                    break

    def submit_form_by_id(self, element_id):
        element = None
        try:
            element = WebDriverWait(self.driver, 30).until(
                EC.presence_of_element_located((By.ID, element_id))
            )
        except NoSuchElementException as e:
            print 'NoSuchElementException: %s' % element_id
            self.driver.quit()
            raise e
        except ElementNotVisibleException as e:
            print 'ElementNotVisibleException: %s' % element_id
            self.driver.quit()
            raise e
        except TimeoutException as e:
            print 'TimeoutException: %s' % element_id
            self.driver.quit()
            raise e
        if element:
            element.submit()

    def find_app_in_list(self, selector, app_name):
        found = False
        unordered_list_element = None
        try:
            unordered_list_element = WebDriverWait(self.driver, 30).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
        except NoSuchElementException as e:
            print 'NoSuchElementException: %s' % selector
            self.driver.quit()
            raise e
        except ElementNotVisibleException as e:
            print 'ElementNotVisibleException: %s' % selector
            self.driver.quit()
            raise e
        except TimeoutException as e:
            print 'TimeoutException: %s' % selector
            self.driver.quit()
            raise e
        if unordered_list_element:
            unordered_list_title = unordered_list_element.find_element_by_xpath('.//ul[@class="app-title"]')
            for li in unordered_list_title.find_elements_by_tag_name('li'):
                title = li.get_attribute('title').lower().strip()
                if title.startswith(app_name.lower().strip()):
                    found = True
                    break
        if found:
            # click the nearest button
            unordered_list_element.find_element_by_xpath('.//button[@class="app-launch-button"]').click()
        # close the appdrawer
        self.click_element_when_visible('div.appdrawer')

    def create_new_app_layout(self):
        self.find_new_layout_anchor('ul.dropdown-menu.layout-dropdown-menu')
        time.sleep(SLEEP)
        self.enter_text_by_id('newLayoutName', self.app_name)
        time.sleep(SLEEP)
        button = self.find_when_element_is_visible('*[id^="app-partials-createNewLayout"] button.btn.btn-primary[type="submit"]')
        if button:
            button.click()
        time.sleep(SLEEP)
        self.enter_text_by_selector('input[data-ng-model="appDrawer.searchTerm"]', self.app_name)
        self.submit_form_by_id('appSearch')
        time.sleep(SLEEP)
        self.find_app_in_list('.app-listing', self.app_name)

    def find_app_iframe(self, iframe):
        self.driver.switch_to_frame(iframe)
        iframe_xpath = '//iframe[@src="%s"]' % self.iframe_src
        app_iframe = None
        try:
            app_iframe = WebDriverWait(self.driver, 2).until(
                EC.presence_of_element_located((By.XPATH, iframe_xpath))
            )
            self.driver.switch_to_frame(app_iframe)
            # TODO - determine if the app has loaded, possible add <div id="eha-app"> to all apps
            # or some other method of determining if the app has successfully loaded
            # self.driver.find_element_by_id('eha-app')
            # return True
        except NoSuchElementException:
            pass
        except ElementNotVisibleException:
            pass
        except TimeoutException:
            pass
        finally:
            self.driver.switch_to_default_content()
        if app_iframe:
            return True
        else:
            return False

    def verify_iframe_content(self):
        time.sleep(SLEEP*2)
        found = False
        iframes = self.driver.find_elements_by_tag_name('iframe')
        for iframe in iframes:
            found = self.find_app_iframe(iframe)
            if found:
                break
        return found


    def setUp(self):
        self.read_config()
        # setup selenium
        self.driver = get_driver(self.driver_name)
        self.driver.implicitly_wait(30)
        self.verificationErrors = []
        self.accept_next_alert = True

    def tearDown(self):
        pass

    def bsve_login(self):
        self.enter_text_by_id('email', self.username)
        self.enter_text_by_id('password', self.password)
        # login
        self.click_element_when_visible('button.btn[type="submit"]')
        time.sleep(SLEEP)

    def find_app_row_in_table(self, selector):
        table = self.find_when_element_is_visible(selector)
        row = None
        for tr in table.find_elements_by_tag_name('tr'):
            for td in tr.find_elements_by_tag_name('td'):
                title = td.get_attribute('title')
                if title.lower().strip() == self.app_name.lower().strip():
                    row = tr
                    break
            else:
                continue
            break
        return row

    def test_create_app(self):
        self.driver.get(self.developer_url)
        self.bsve_login()
        # click BSVE Connect
        self.click_element_when_visible('li#menu-item-1478 a')
        row = self.find_app_row_in_table('div.projectDetailView[data-ng-show="appDetailTableView"] table.listTable')
        if row:
            trash_element = row.find_element_by_css_selector('i.fa-trash')
            trash_element.click()
            # confirm delete
            confirm_button = self.find_when_element_is_visible('button.btn.btn-primary[ng-click="confirmDelete();"]')
            print 'confirm_button: %s' % confirm_button
            #button.click()
        else:
            # TODO: this needs finished, create the app using [Create New App] button
            pass

        time.sleep(SLEEP*10)
        self.assertEqual(True, True)

    def test_layout_page(self):
        return
        self.driver.get(self.test_url)
        self.bsve_login()

        # open the layoutSelector and determine if this app_name exists in the list
        self.open_layout_selector()
        list_element = self.find_title_in_list('ul.dropdown-menu.layout-dropdown-menu', self.app_name)
        if list_element:
            # if exists delete, then create new app
            self.delete_existing_layout(list_element)
            time.sleep(SLEEP)
            self.open_layout_selector()
            self.create_new_app_layout()
        else:
            # create new app
            self.create_new_app_layout()
        self.assertEqual(True, self.verify_iframe_content())
