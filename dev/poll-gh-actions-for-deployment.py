#!/usr/bin/env python3
import json
import logging
import os
import subprocess
import sys
from contextlib import contextmanager
from io import BytesIO
from shutil import rmtree
from time import strptime
from urllib.request import Request, urlopen
from zipfile import ZipFile

TOKEN = os.environ.get('TOKEN')
USER = os.environ.get('USER')
REPO = os.environ.get('REPO')
ARTIFACT_NAME = os.environ.get('ARTIFACT_NAME')
TARGET_FOLDER = os.environ.get('TARGET_FOLDER')
AFTER_HOOK = os.environ.get('AFTER_HOOK')
LOCK_FILE = os.environ.get('LOCK_FILE')
TIMESTAMP_FILE = os.environ.get('TIMESTAMP_FILE')
DEBUG = os.environ.get('DEBUG') == 1

logging.root.setLevel(logging.DEBUG if DEBUG else logging.INFO)

if not LOCK_FILE:
    logging.error('Can\'t proceed as lock file is not set.')
    sys.exit(1)

if os.path.exists(LOCK_FILE):
    logging.error('Can\'t proceed as lock file %s already exists. Is another deployment running?', LOCK_FILE)
    sys.exit(1)


def request(url):
    req = Request(url)
    req.add_header('Authorization', f'token {TOKEN}')
    return urlopen(req)


@contextmanager
def lock_file():
    open(LOCK_FILE, 'w').close()
    try:
        yield
    finally:
        try:
            os.remove(LOCK_FILE)
        except IOError:
            sys.stderr.write(f'Failed to delete lock file {LOCK_FILE}')
            sys.exit(1)


@contextmanager
def is_deployment_needed(run):
    is_needed = False
    with open(TIMESTAMP_FILE, 'a+') as timestamp_file:
        try:
            timestamp_file.seek(0)
            deployed_timestamp = timestamp_file.read()
            logging.debug('deployed_timestamp = %s', deployed_timestamp)

            try:
                deployed_time = strptime(deployed_timestamp, '%Y-%m-%dT%H:%M:%SZ')
            except ValueError:
                logging.warning('Can\'t parse deployed_timestamp. Treating as outdated deployment...', exc_info=True)
                deployed_time = None
            commit_timestamp = run['head_commit']['timestamp']
            logging.debug('commit_timestamp = %s', commit_timestamp)
            commit_time = strptime(commit_timestamp, '%Y-%m-%dT%H:%M:%SZ')

            is_needed = deployed_time is None or commit_time > deployed_time
            logging.debug('deployment needed = %s', is_needed)
            yield is_needed
        finally:
            if is_needed:
                timestamp_file.seek(0)
                timestamp_file.truncate()
                timestamp_file.write(commit_timestamp)


def request_last_workflow_run():
    response = request(f'https://api.github.com/repos/{USER}/{REPO}/actions/runs?status=completed&conclusion=successful&per_page=1')
    content = json.load(response)

    runs = content['workflow_runs']
    if len(runs) == 0:
        logging.error('Error: Can\'t find any completed and successful workflow run')
        sys.exit(1)

    return runs[0]


def request_artifact(run):
    artifacts_url = run['artifacts_url']
    response = request(artifacts_url)
    content = json.load(response)

    artifacts = content['artifacts']
    artifact = next(filter(lambda a: a['name'] == ARTIFACT_NAME, artifacts), None)
    if not artifact:
        logging.error('Error: Can\'t find artifact with name %s', ARTIFACT_NAME)
        sys.exit(1)

    return request(artifact['archive_download_url'])


def main():
    with lock_file():
        run = request_last_workflow_run()

        with is_deployment_needed(run) as needed:
            if not needed:
                logging.info('No new deployment needed')
                sys.exit(0)

            artifact = request_artifact(run)

            if os.path.exists(TARGET_FOLDER):
                rmtree(TARGET_FOLDER)

            z = ZipFile(BytesIO(artifact.read()))
            z.extractall(TARGET_FOLDER)

            if os.path.exists(AFTER_HOOK):
                subprocess.call(AFTER_HOOK)
            else:
                logging.warning('Can\'t find AFTER_HOOK file %s', AFTER_HOOK)

            logging.info('Deployment has finished')


main()
