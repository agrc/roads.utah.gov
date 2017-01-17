# roads.utah.gov
Roads viewer app for PLPCO

# Deployment Steps
1. Fill out `secrets.json`.
1. Add PLPCO pallet to forklift.
1. Install and configure permission proxy and create application using `permission_proxy_config.json`.
1. Publish [image services](`src/app/config.js`) to `PLPCO` folder.
1. Publish `maps/*.mxd` to `PLPCO/<mxdName/MapServer`.
1. Make `PLPCO/RoadsSecure/MapServer` and all image services private to the `plpco_admin` & `plpco_user` roles.
1. `grunt build-prod && grunt deploy-prod`
