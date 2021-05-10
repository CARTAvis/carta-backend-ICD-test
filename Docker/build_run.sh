
# IMAGE_NAME="carta-backend-dev"
# docker build -f Dockerfile-carta_U20.04 -t $IMAGE_NAME .
IMAGE_NAME="carta-dev"
docker build -f Dockerfile-carta-with-frontend_U20.04 -t $IMAGE_NAME .

echo $IMAGE_NAME is running
CONTAINER_ID=$(docker run --restart=on-failure --cpus=2 -it -p 3002:3002 -v ~/CARTA/Images/:/Images $IMAGE_NAME /Images --verbosity 6)
# docker cp build.sh $CONTAINER_ID:/build.sh
# docker exec -t $CONTAINER_ID /bin/sh -c '/bin/sh /build.sh'
echo $CONTAINER_ID
# docker stop $CONTAINER_ID