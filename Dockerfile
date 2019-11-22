FROM jrottenberg/ffmpeg:3.3-alpine
FROM node:11.11-alpine
LABEL version="2.1.4" author="Johann Laur"
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache --virtual .gyp \
    opus \
    python \
    make \
    g++ \
    && npm install --only=prod \
    && apk del .gyp
COPY . .
# ffmpeg bindings
COPY --from=0 / /
# expose ports for http*s
EXPOSE 443 80
CMD node index -w -s
