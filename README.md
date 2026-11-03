# Web application assignments

The portal and the three assignments are served by one Nginx container.
Task 03 is built with Node and Vite during the Docker build. Its current
space weather data is simulated.

## Project layout

- `portal/`: the landing page and its assignment menu.
- `shared/header.js`: the reusable header used by the task pages.
- `Task01/`, `Task02/`, `Task03/`: the application source files.
- `Dockerfile`: builds Task 03 and copies the public files into Nginx.
- `nginx.conf`: serves the portal and task directories.
- `compose.yaml`: builds and runs the web container from source.
- `compose.deploy.yaml`: runs the prebuilt image on the VPS.

## Run from source

Docker and the Compose plugin must be installed. To run locally or manually
from a complete copy of the project, run from the repository root:

```sh
docker compose up -d --build
docker compose ps
curl -i http://127.0.0.1:9001/
```

By default the container listens only on `127.0.0.1:9001`, so it is not
directly accessible from the internet. To change the host port, set
`APP_PORT` when starting Compose, for example:

```sh
APP_PORT=8081 docker compose up -d --build
```

Use the same port in the reverse proxy configuration. For subsequent Compose
commands, set the same variable or put `APP_PORT=8081` in a local `.env` file.
Do not put secrets in frontend files: everything copied into the public
directory can be downloaded by visitors.

## Connect the subdomain

Point `sfedu.ticusco.com` to the VPS and configure the VPS's existing HTTPS
reverse proxy to forward requests for that hostname to `127.0.0.1:9001`.
The container itself does not provide TLS or obtain certificates. Keep any
existing sites and proxy configuration intact.

For example, inside an **existing HTTPS server block** for
`sfedu.ticusco.com`, an Nginx host proxy can use:

```nginx
location / {
    proxy_pass http://127.0.0.1:9001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

The host proxy also needs a valid certificate for the subdomain and access
on port 443; configure these according to the VPS setup. If the VPS does not
already have an HTTPS proxy, install and configure one before publishing.
Validate the proxy configuration before reloading it.

After deployment, check the portal and each task over HTTPS, including
`https://sfedu.ticusco.com/task03/`, and check that CSS, JavaScript and
images load. Task directories use a trailing slash.

## Automatic deployment with GitHub Actions

The workflow in `.github/workflows/deploy.yml` runs on pushes to `master`.
GitHub Actions checks out the triggering commit, builds its Docker image,
and sends the image and `compose.deploy.yaml` over SSH. The VPS loads the
image and starts the service from `/home/data-visualization`. It does not need
Git, a repository checkout, Node, or access to a container registry.
The Nginx runtime uses the Debian-based image to avoid an Alpine `pwritev2`
compatibility problem observed on older CentOS hosts.

Before the first run:

1. Install Docker and the Compose plugin on the VPS. Ensure
   `/home/data-visualization` exists or can be created by the deployment
   user, is writable by that user, and has enough free space for the image.
   The user must be able to run Docker and Compose without an interactive
   prompt. Membership in the Docker group grants root-equivalent access.
2. Add the deployment SSH public key to the user's `authorized_keys`.
   The workflow assumes SSH port 22.
3. Configure the GitHub Actions secrets `DEPLOY_HOST`, `DEPLOY_USER`, and
   `DEPLOY_KEY` (the complete private key). Keep the key out of the repository.
4. Push the workflow and all application files to `master`; check the run in
   the GitHub Actions tab. The workflow deploys tracked files from the push.

The GitHub-hosted runner builds an x86-64 image, so the VPS must have the
same architecture (`uname -m` should report `x86_64`). Both Compose files
default to port 9001; keep their port settings synchronized. On the VPS,
`APP_PORT` can be set in `/home/data-visualization/.env` if needed. The
workflow replaces `compose.deploy.yaml` on each deployment.

The workflow accepts a previously unknown SSH host key automatically. GitHub
hosted runners are fresh for each run, so the server's identity is not
verified against a trusted fingerprint; a machine-in-the-middle could
impersonate the VPS. Pinning a verified host key is recommended.

## Add another task

1. Add its source in a new directory, for example `Task04/`.
2. Add a list item linking to `/task04/` in `portal/index.html`.
3. Add a `COPY` instruction in the final stage of `Dockerfile` that copies
   only its public files to `/usr/share/nginx/html/task04/`. For example,
   for a task with only `index.html`:

   ```dockerfile
   COPY Task04/index.html /usr/share/nginx/html/task04/index.html
   ```

   Include any CSS, JavaScript, images or other files the task needs. Do not
   copy source directories wholesale if they contain private files.
4. If the task requires a build, add a build stage and copy its build output
   instead. Configure its asset base for `/task04/`; for Vite, one option is
   `npm run build -- --base=/task04/`. If it uses client-side routes, add an
   appropriate Nginx fallback for that task. Tasks requiring a backend or a
   database will need additional services and configuration.
5. Commit and push the updated project to `master` for automatic deployment,
   or rebuild manually with `docker compose up -d --build`. Check the new
   link and its assets.

New folders are not published automatically: the menu and Dockerfile must be
updated for each task.

## Reuse the task header

For a plain HTML task served through the portal, add this near the beginning
of the body:

```html
<assignment-header><a href="/">Back to main menu</a></assignment-header>
<script type="module" src="/shared/header.js"></script>
```

The link remains available if JavaScript cannot load. The shared script is
published at `/shared/header.js` by Docker; a standalone development server
for an individual task must also serve that path to display the styled
header. For a React/Vite task in this repository, import `shared/header.js`
from the component and render the same element, as Task 03 does. Its build
stage must include the shared source.
