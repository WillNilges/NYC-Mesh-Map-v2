Dockerfile used for building the image that we use to build + deploy map-v2 (very meta)

```
podman build . --tag nycmeshnet/map-v2-builder:main
podman push nycmeshnet/map-v2-builder:main
```
