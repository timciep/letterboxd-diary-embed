# Usage: bin/flush_diary_cache_local.sh <username>
# Description: Flushes the diary cache for the given username in the local environment

# Error if username not provided or help passed as argument
if [ -z "$1" ] || [ "$1" == "-h" ] || [ "$1" == "--help" ] || [ "$1" == "help" ];
  then
    echo "Usage: ./bin/flush_diary_cache_local.sh <username>"
    exit 1
fi

npx wrangler kv:key delete $1 --binding letterboxd_diary_cache --local