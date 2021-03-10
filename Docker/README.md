**<span style="text-decoration:underline;">Build and run carta_backend directly from a Docker - March 2021</span>**

Here is a basic Dockerfile for creating a carta_backend build environment with a carta_backend that runs automatically as soon as the container is started.

1.

Copy the lines below into a Dockerfile. You could call it anything, for example, **Dockerfile-carta**


```
FROM ubuntu:20.04

# Install the basic packages
RUN \
  apt-get update && \
  apt-get -y upgrade && \
  DEBIAN_FRONTEND=noninteractive \
  apt-get install -y apt-utils autoconf bison build-essential cmake curl fftw3-dev flex gcc g++ \
    gdb gfortran git git-lfs googletest libblas-dev libcfitsio-dev libcurl4-gnutls-dev \
    libgrpc-dev libgrpc++-dev libgsl-dev libgtest-dev libhdf5-dev liblapack-dev libncurses-dev \
    libprotobuf-dev libpugixml-dev libreadline-dev libssl-dev libstarlink-ast-dev \
    libtool libtbb-dev libxml2-dev libxslt1-dev libzstd-dev pkg-config protobuf-compiler-grpc \
    software-properties-common unzip wcslib-dev wget uuid-dev

# Get carta dependencies
# casacore data from Kernsuite PPA
RUN \
  apt-add-repository -y -s ppa:kernsuite/kern-7 && \
  apt-get update && \
  apt-get -y install casacore-data

# carta-casacore from cartavis PPA
RUN \
  add-apt-repository -y ppa:cartavis/carta-casacore && \
  apt-get update && \
  apt-get install carta-casacore

# zfp from cartavis PPA
RUN \
  add-apt-repository -y ppa:cartavis/zfp && \
  apt-get update && \
  apt-get install zfp

# Forward port so that the webapp can properly access it from outside of the container
EXPOSE 3002
# Do the same with the gRPC service port
EXPOSE 50051

# Required for running the backend 
ENV LD_LIBRARY_PATH "/usr/lib64:/usr/local/lib:$LD_LIBRARY_PATH"
ENV CASAPATH "/usr/share/casacore linux local `hostname`"

# Create the startup scipt
RUN \
  echo "#!/bin/bash \n ./carta-backend/build/carta_backend \$@" >> /start.sh && \
  chmod 755 /start.sh

# Clone and build the carta-backend
RUN \
  git clone https://github.com/CARTAvis/carta-backend.git && \
  cd carta-backend && \
  git checkout dev && \
  git submodule update --init --recursive && \
  mkdir build && cd build && \
  cmake .. && make -j 2

# Add a non-root user and run carta_backend and startup script as this user
RUN groupadd -g 5555 carta && \
  useradd -u 5555 -g carta -ms /bin/bash carta

RUN chown -R carta:carta /carta-backend/build/carta_backend

RUN chown -R carta:carta /start.sh

USER carta

ENTRYPOINT ["/start.sh"]
```


You could change the red line above to build a different carta_backend branch.



2.

Build the Dockerfile. For example,


```
docker build -f Dockerfile-carta -t carta-backend-dev .
```


(don’t forget the dot at the end of the line)

The container name could be called anything too. In this example I am calling it “carta-backend-dev”



3. 

Now start it. For example:


```
docker run -ti -p 3002:3002 -v <frontend location>:/carta-backend/build/../share/carta/frontend
-v $PWD:/images  carta-backend-dev /images --port 3002
```


You need to replace &lt;frontend location>** **with the location of your built frontend html.



Alternative way:

docker run -ti -p 3002:3002 -v &lt;frontend location>:/frontend -v $PWD:/images carta-backend-dev /images --frontend_folder /frontend

Remember to adjust your local image directory accordingly. In this example I am just using $PWD. 

The folder name “/images” inside the container is not important and could be called anything.

Remember to also adjust the port number. The form is -p &lt;host port>:&lt;container port>

So only the green 3002 needs to be adjusted. The port inside the container could be anything. For example, this command should work exactly the same as the first command above:


```
docker run -ti -p 3002:7777 -v <frontend location>:/carta-backend/build/../share/carta/frontend -v $PWD:/zzz  carta-backend-dev /zzzz --port 7777
```




To Do:

Maybe try adding a built frontend into the container.
