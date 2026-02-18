#!/bin/bash
git checkout .
git pull origin main
yarn
# yarn build
pm2 reload lkm-sep-v2-graphql --update-env
