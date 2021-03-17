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

Create an image, e.g. `carta-backend-dev:latest`
