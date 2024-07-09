set -o allexport
source .env
set +o allexport

BUILD_ARGS=""
while IFS='=' read -r key value; do
  if [[ ! -z "$key" ]]; then
    BUILD_ARGS="$BUILD_ARGS --build-arg $key=$value"
  fi
done < .env

docker build $BUILD_ARGS -t biap-client-node-js .
