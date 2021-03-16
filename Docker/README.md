# Build and run carta_backend directly from a Docker - March 2021

Here is a basic Dockerfile for creating a carta_backend build environment with a carta_backend that runs automatically as soon as the container is started.

## 1.

The lines below is a part of Dockerfile. For example, **Dockerfile-carta**


```
...

# Clone and build the carta-backend
RUN \
  git clone https://github.com/CARTAvis/carta-backend.git && \
  cd carta-backend && \
  git checkout dev && \
  git submodule update --init --recursive && \
  mkdir build && cd build && \
  cmake .. && make -j 2

...
```


You could change the `git checkout dev` above to `git checkout master` for instance in order to build a different carta_backend branch.



## 2.

Install Docker app.

On MacOS, the Docker Desktop app only assigns 2GB of RAM to Docker by default. This is insufficient to build the carta_backend using parallel make (e.g. make -j 2). The consequence of insufficient RAM is the build message c++: fatal error: Killed signal terminated program cc1plus.
To assign more RAM to Docker, go to Docker > Preferences > Resources, and drag the Memory slider up to at least 8GB. 8GB seems to be OK for a -j2 build, but more would be better. Click Apply & Restart on the bottom right corner of the Preferences Window.

Build the Dockerfile. For example,

```
docker build -f Dockerfile-carta -t carta-backend-dev .
```


(don’t forget the dot at the end of the line)

The container name could be called anything too. In this example I am calling it “carta-backend-dev”



## 3. 

Now start it. For example:


```
docker run -ti -p 3002:3002 -v <frontend location>:/carta-backend/build/../share/carta/frontend
-v $PWD:/images  carta-backend-dev /images --port 3002
```


You need to replace <frontend location> with the location of your built frontend html.



## Alternative way:

docker run -ti -p 3002:3002 -v <frontend location>:/frontend -v $PWD:/images carta-backend-dev /images --frontend_folder /frontend

Remember to adjust your local image directory accordingly. In this example I am just using $PWD. 

The folder name “/images” inside the container is not important and could be called anything.

Remember to also adjust the port number. The form is -p <host port>:<container port>

So only the green 3002 needs to be adjusted. The port inside the container could be anything. For example, this command should work exactly the same as the first command above:


```
docker run -ti -p 3002:7777 -v <frontend location>:/carta-backend/build/../share/carta/frontend -v $PWD:/zzz  carta-backend-dev /zzzz --port 7777
```




## To Do:

Maybe try adding a built frontend into the container.
