# kube-ldap
A [Webhook Token Authentication](https://kubernetes.io/docs/admin/authentication/#webhook-token-authentication) plugin for kubernetes,  written in javascript, to use LDAP as authentication source.

## Description
The kube-ldap webhook token authentication plugin can be used to integrate username/password authentication via LDAP for your kubernetes cluster.
It exposes two API endpoints:
* /auth
 * HTTP basic authenticated requests to this endpoint result in a JSON Web Token, signed by the webhook, including the username, uid and group memberships of the authenticated user.
 * The issued token can be used for authenticating to kubernetes.
* /token
  * Is called by kubernetes (see [TokenReview](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.9/#tokenreview-v1-authentication)) to verify the token used for authentication.
  * Verifies the integrity of the JWT (using the signature) and returns a TokenReview response containing the username, uid and group memberships of the authenticated user.

## Development
### Requirements
* nodejs
* yarn

### Development Server
During development an auto-reloading development server (using babel watch) can be used:
```
yarn start
```

### Test
To run automated tests using jest you can use yarn:
```
yarn test
```

### Build
kube-ldap can be built via yarn, to get native nodejs code, or via docker (which uses yarn), to get a docker image.

Either way the build process lints the code (including flow type annotations) before building. When building via docker the process also includes running the automated tests.
If any of these steps fail, the build will fail too.

#### yarn
When using yarn, it places the build output in `./build/` directory.
```
yarn build
```

#### docker
When using docker, the `./Dockerfile` is used to build an image.
```
docker -t kube-ldap build .
```

## Deployment
The recommended way to deploy kube-ldap is deplyoing kube-ldap in kubernetes itself using the [kube-ldap docker image](https://hub.docker.com/r/gyselroth/kube-ldap/).

Example YAML for kubernetes (secrets, deployment and service):
```
apiVersion: v1
data:
  key: #base64 encoded jwt key (see "Configuration" in README)
kind: Secret
metadata:
  name: kube-ldap-jwt-key
  namespace: kube-system
type: Opaque
---
apiVersion: v1
data:
  binddn: #base64 encoded bind dn (see "Configuration" in README)
  bindpw: #base64 encoded bind password (see "Configuration" in README)
kind: Secret
metadata:
  name: kube-ldap-ldap-bind-credentials
  namespace: kube-system
type: Opaque
---
apiVersion: apps/v1beta2
kind: Deployment
metadata:
  labels:
    k8s-app: kube-ldap
  name: kube-ldap
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      k8s-app: kube-ldap
  template:
    metadata:
      labels:
        k8s-app: kube-ldap
    spec:
      containers:
      - env:
        - name: LDAP_URI
          value: #ldap uri (see "Configuration" in README)
        - name: LDAP_BINDDN
          valueFrom:
            secretKeyRef:
              name: kube-ldap-ldap-bind-credentials
              key: binddn
        - name: LDAP_BINDPW
          valueFrom:
            secretKeyRef:
              name: kube-ldap-ldap-bind-credentials
              key: bindpw
        - name: LDAP_BASEDN
          value: #ldap base dn (see "Configuration" in README)
        - name: LDAP_FILTER
          value: #ldap filter(see "Configuration" in README)
        - name: LOGLEVEL
          value: info
        - name: JWT_KEY
          valueFrom:
            secretKeyRef:
              name: kube-ldap-jwt-key
              key: key
        - name: JWT_TOKEN_LIFETIME
          value: #jwt token lifetime (see "Configuration" in README)
        image: gyselroth/kube-ldap
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
            scheme: HTTP
          initialDelaySeconds: 5
          periodSeconds: 10
        name: kube-ldap
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  labels:
    k8s-app: kube-ldap
  name: kube-ldap
  namespace: kube-system
spec:
  ports:
  - port: 8080
    protocol: TCP
    targetPort: 8080
  selector:
    k8s-app: kube-ldap
  type: ClusterIP
```


## Configuration
### kube-ldap
kube-ldap itself can be configured via environment variables.

List of configurable values:

|Setting|Description|Environment Variable| Default Value|
|-------|-----------|--------------------|--------------|
|`config.port`|HTTP port to listen|`PORT`|8080|
|`config.loglevel`|Loglevel for winston logger|`LOGLEVEL`|debug|
|`config.ldap.uri`|URI of LDAP server|`LDAP_URI`|ldap://ldap.example.com|
|`config.ldap.binddn`|DN of LDAP bind user connection|`LDAP_BINDDN`|uid=bind,dc=example,dc=com|
|`config.ldap.bindpw`|Password of LDAP bind user|`LDAP_BINDPW`|secret|
|`config.ldap.baseDn`|Base DN for LDAP search|`LDAP_BASEDN`|dc=example,dc=com|
|`config.ldap.filter`|Filter for LDAP search|`LDAP_FILTER`|(uid=%s)|
|`config.jwt.key`|Key for signing the JWT. **DO NOT USE THE DEFAULT VALUE IN PRODUCTION**|`JWT_KEY`|secret|
|`config.jwt.tokenLifetime`|Seconds until token a expires|`JWT_TOKEN_LIFETIME`|28800|

### kubernetes
Configure your kubernetes apiserver to use the kube-ldap [webhook for authentication](https://kubernetes.io/docs/admin/authentication/#webhook-token-authentication) using the following configuration file.
```
# clusters refers to the remote service.
clusters:
  - name: kube-ldap
    cluster:
      server: https://your-kube-ldap-url/token

# users refers to the API server's webhook configuration.
users:
  - name: apiserver

# kubeconfig files require a context. Provide one for the API server.
current-context: webhook
contexts:
- context:
    cluster: kube-ldap
    user: apiserver
  name: webhook
```

### kubectl
To configure `kubectl` initially:
```
curl TOKEN=$(https://your-kube-ldap-url/auth -u your-username)
kubectl config set-cluster your-cluster --server=https://your-apiserver-url [...]
kubectl config set-credentials your-cluster-ldap --token="$TOKEN"
kubectl config set-context your-cluster --cluster=your-cluster --user=your-cluster-ldap
```

To refresh your token after expiration:
```
curl TOKEN=$(https://your-kube-ldap-url/auth -u your-username)
kubectl config set-credentials your-cluster-ldap --token="$TOKEN"
```
