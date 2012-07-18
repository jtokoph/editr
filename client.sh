#!/usr/bin/env bash

filename=$1

verbose=false
force=false
host="${REDIT_HOST:-localhost}"
port="${REDIT_PORT:-32123}"
hostname=`hostname`

if [ "$filename" = "" ]; then
    echo "No file given"
    exit 1
fi

if [ -d $filename ]; then
    echo "Cannot edit a directory"
    exit 1
fi

if [ ! -e $filename ]; then
    exists="no"
else
    exists="yes"
fi

response=`curl --silent --fail -X POST -d @$filename -H "X-Exists: $exists" -H "X-Hostname: $hostname" $host:$port/$filename`
responseCode=$?
if [[ responseCode -eq 0 ]]; then
    echo -n $response > $filename
fi
