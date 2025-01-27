FROM mongo:latest

COPY init.sql /docker-entrypoint-initdb.d/
COPY backup/dump.sql /backup/

EXPOSE 27017

