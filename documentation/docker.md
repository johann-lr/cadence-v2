# Docker and Cadence

Important for running cadence in a docker container:

-   Create image with shell script: `./docker.sh`
-   Copy cadence.tar and docker-compose.yml on your machine/server
-   `docker load -i cadence.tar``
-   Or: `docker pull jhnlr/cadence`
-   Use `docker-compose up`

**If your image is available on [Docker Hub](https://hub.docker.com) (in a private repository), the repo's user and password have to be specified in the docker-compose file**
