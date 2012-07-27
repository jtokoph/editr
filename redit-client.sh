#!/usr/bin/env bash
# Heavily copy/pasted from https://github.com/aurora/rmate/blob/master/rmate

host="${REDIT_HOST:-localhost}"
port="${REDIT_PORT:-32123}"
hostname=`hostname`
force=false

function showusage {
    echo "Usage: $0 [-H hostname] [-p port] [-f] file

 -H  connect to host (default: $host)
 -p  port number to use for connection (default: $port)
 -f  open even if file is not writable
 -h  display this usage information
"
}

while getopts H:p:fh OPTIONS; do
    case $OPTIONS in
        H)
            host=$OPTARG;;
        p)
            port=$OPTARG;;
        f)
            force=true;;
        h)
            showusage
            exit 1;;
        ?)
            showusage
            exit 1;;
        *)
            showusage
            exit 1;;
    esac
done

filename="${@:$OPTIND}"

if [ "$filename" = "" ]; then
    echo "No file given"
    showusage
    exit 1
fi

if [ -d "$filename" ]; then
    echo "Cannot edit a directory"
    showusage
    exit 1
fi

if [ ! -e "$filename" ]; then
    exists="no"
else
    exists="yes"
fi

if [ -f "$filename" ] && [ ! -w "$filename" ]; then
    if [[ $force = false ]]; then
        echo "File $filename is not writable! Use -f to open anyway."
        exit 1
    fi
fi

response=`curl --silent --fail -X POST --data-binary "@$filename" -H "X-Exists: $exists" -H "X-Hostname: $hostname" "$host:$port/$filename"`

responseCode=$?
if [[ responseCode -eq 0 ]]; then
    # Bash variables get trailing new lines removed
    # The server adds a trailing character to preserve new lines
    # here we strip away the extra character
    echo -n "${response%X}" > "$filename"
fi
