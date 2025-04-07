## Como deployar a cluster en OCI

### 1. OCI
Crea el cluster en el dashboard de OCI
- 3 nodos
- 1 CPU
- 4 GB RAM


###  2. CLI

Setup de CLI
```
oci setup config
oci session authenticate
```

### 3. Imagen

Login a OCI Container Registry
```
docker login mx-queretaro-1.ocir.io
```
Hacer build y subir la imagen
```
./push_ocr.sh
```

### 4. Cluster

Obtener el kubeconfig
```
export CLUSTER_ID=

oci ce cluster create-kubeconfig --cluster-id CLUSTER_ID --file $HOME/.kube/config --region mx-queretaro-1 --token-version 2.0.0 --kube-endpoint PUBLIC_ENDPOINT
```

Revisar acceso al cluster
```
kubectl config get-contexts
oci ce node-pool list --cluster-id CLUSTER_ID
```

Aplicar los archivos de configuración
```
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/deployment.yaml
kubectl get pods
```