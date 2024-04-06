# VR Player

Play any 180° or 360° videos on your VR HMD using the WebXR APIs. Most common VR headsets should be supported.

Supports mono or stereo video playback with top-bottom or left-right layouts.

---

Icons by [unDraw](https://undraw.co/)

------

```
npm install
```

For debugging and development you must use HTTPS on local dev environment.

```
HTTPS=true npm start
```

For producing static web build follow this:

```
npm run build
```

After successful build process the build should be accessible at `packages/app/build` directory.

Generate self signed certificate and start serving the built web pages
```
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
npm install serve -g
serve --ssl-cert cert.pem --ssl-key key.pem -s .
```
