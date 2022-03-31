FROM node:14-alpine

ADD dist/wormhole-apollo-server.tar.gz /opt/

WORKDIR /opt/wormhole-apollo-server

CMD [ 'yarn', 'serve' ]
