FROM node:8.16.0-alpine

RUN apk --no-cache add ca-certificates wget && \
  wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub && \
  wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.27-r0/glibc-2.27-r0.apk && \
  apk add glibc-2.27-r0.apk && \
  apk del wget

COPY . /srv/www/kube-ldap
RUN cd /srv/www/kube-ldap && \
  yarn install && \
  yarn run test && \
  yarn run build && \
  yarn install --production=true

CMD ["node", "/srv/www/kube-ldap/build/index.js"]
