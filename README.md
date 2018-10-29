# roads.utah.gov
Roads viewer app for PLPCO

# Deployment
1. Fill out `secrets.json`.
1. Add PLPCO pallet to forklift.
1. Install and configure permission proxy and create application using `permission_proxy_config.json`.
1. Publish [image services](`src/app/config.js`) to `PLPCO` folder.
1. Publish `maps/*.mxd` to `PLPCO/<mxdName>/MapServer`.
1. Make `PLPCO/RoadsSecure`, `PLPCO/Videos` and all image services private to the `plpco_admin` & `plpco_user` roles.
1. `grunt build-prod && grunt deploy-prod`

## Adding a County-specific Viewer
1. Create a new permission proxy application using `permission_proxy_config.json` appending the county (lowercase, no spaces) to the application name (e.g. `plpco_washington`).
1. Update maps in `maps` to display only the data that you want to show up in the app.
1. Publish `maps/*.mxd` to `PLPCO_<countyname>/<mxdName>/MapServer` _except for `BackgroundLayers.mxd`_.
1. Make `PLPCO_<countyname>/RoadsSecure` and `PLPCO_<countyname>/Videos` private to the `plpco_admin` & `plpco_user` roles for the newly created permission proxy application. Also, add these roles to the image services for the base application.
1. Load the new viewer by using a URL parameter like this: https://roads.utah.gov/?county=washington.
