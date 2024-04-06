# openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
serve --ssl-cert cert.pem --ssl-key key.pem -s packages/app/build/
