# <span style="text-decoration:underline;">Deploy a carta-backend-dev Docker on Kubenete - March 2021</span>

After preparing a basic Docker container of carta_backend, we apply Kubectl on creating a service on native/virtual nodes. We could aggreget many node into a working cluster. The Kubenete could easly deploy a NGINX on high availability cluster.

## 1.
To start a service via `/k8s/deployment` :
```
$ kubectl apply -f deployment.yaml
```
### Customise to your environment
The path `- mountPath: /Images` and `- hostPath: path: </CARTA/Images>` should be changed to the directory in your running envirenment, `- mountPath:` denotes the imgae location inside Docker container and `- hostPath: path:` denotes the image location in your native system.

## 2.
To stop a service via `/k8s/deployment` :
```
$ kubectl delete -f deployment.yaml
```

## Deploy on MacOS
Download from https://docs.docker.com/docker-for-mac/install/

## Deploy on Ubuntu
Install Docker and minikube, please refer to https://howtoforge.com/how-to-install-kubernetes-with-minikube-ubuntu-20-04/

Login Docker by `$ docker login`

Create an image, e.g. `carta-dev:latest`

Use `$ docker images` to confirm the new image is there, if not try `$ eval $(minikube docker-env)` to switch node.
Then re-create the image. So that we could run a local image here.

If there is any issue about mounting your `/Images`, please try `$ minikube mount <local/images/path>:CARTA/Images` to establish a tunnel.

Finally, we could get a hyperlink address by `$ minikube service carta-dev-service`.

If the image contains only backend, we could get a ws address by`$ minikube service carta-dev-service --url`, which will return `http://<ip>:<port>`. We could compose to `ws::/<ip>:<port>`.
