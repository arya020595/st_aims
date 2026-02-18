#!/bin/bash
git checkout .
git pull origin main
rm -rf .next
yarn
yarn build
pm2 reload /doaa/ --update-env
