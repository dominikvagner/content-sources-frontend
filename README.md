## Initial etc/hosts setup

In order to access the https://[env].foo.redhat.com in your browser, you have to add entries to your `/etc/hosts` file. This is a **one-time** setup that has to be done only once (unless you modify hosts) on each machine.

To setup the hosts file run following command:

```bash
yarn patch:hosts
```

Alternatively, add these lines to your /etc/hosts file:

```
127.0.0.1 prod.foo.redhat.com
::1 prod.foo.redhat.com
127.0.0.1 stage.foo.redhat.com
::1 stage.foo.redhat.com
127.0.0.1 qa.foo.redhat.com
::1 qa.foo.redhat.com
127.0.0.1 ci.foo.redhat.com
::1 ci.foo.redhat.com
```

## Getting started - Installation

1. Make sure [nvm](https://github.com/nvm-sh/nvm) is installed

2. To ensure you have the correct node version installed do: `nvm use`.
   Yarn WILL prevent you from progressing if you have not updated your node version to match the one in the .nvmrc file.

3. `yarn install`

4. `yarn build` (only required when setting up for the first time)

## Getting started - Running the app

Keep in mind that you have to be connected to the VPN for this to work, even in the offices.

1. `yarn start` to choose whether to run against stage or prod environments. <br/>
   OR <br/>
   `yarn start:stage` to run against stage environment. <br/>
   OR <br/>
   `yarn start:prod` to run against prod environment. <br/>
   OR <br/>
   `yarn local` to run against a local backend running on port 8000.<br/>

2. With a browser, open the URL listed in the terminal output, <https://stage.foo.redhat.com:1337/insights/content> for example.

### Running the app in static mode with a testing proxy

Sometimes the default development proxy started with `yarn start||local` can be
slow and unstable, which can be problematic while testing. To overcome this you
can use the [consoledot-testing-proxy](https://github.com/dvagner/consoledot-testing-proxy)
and run the app in static mode.

1. `yarn fec static` to start the app in static mode

2. `podman run -d -e HTTPS_PROXY=$RH_PROXY_URL -p 1337:1337 -v "$(pwd)/config:/config:ro,Z" --replace --name consoledot-testing-proxy quay.io/dvagner/consoledot-testing-proxy` to run the proxy against stage

## Unit Testing

`yarn verify` will run `yarn build` `yarn lint` (eslint), `yarn format:check` Prettier formatting check and `yarn test` (Jest unit tests)

One can also: `yarn test` to run the unit tests directly.

## Testing with Playwright

1. Ensure the correct node version is installed and in use: `nvm use`

2. Copy the [example env file](playwright_example.env) and create a file named:`.env`
   For local development only the BASE_URL:`https://stage.foo.redhat.com:1337` is required, which is already set in the example config.

3. Install Playwright browsers and dependencies
   `yarn playwright install`

   OR

   If using any os other than Fedora/Rhel (IE:mac, ubuntu linux):

   `yarn playwright install  --with-deps`

4. Run the backend locally, steps to do this can be found in the [backend repository](https://github.com/content-services/content-sources-backend).

   Ensure that the backend is running prior to the following steps.

5. `yarn local` will start up the front-end repository. If you do `yarn start` and choose stage, your tests will attempt to run against the stage ENV, please do not test in stage.

6. `yarn playwright test` will run the playwright test suite. `yarn playwright test --headed` will run the suite in a vnc-like browser so you can watch it's interactions.

It is recommended to test using vs-code and the [Playwright Test module for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright). But other editors do have similar plugins to for ease of use, if so desired

For running the integration tests you will need to run `yarn get-tests`, point playwright to stage directly (i.e.: set proxy and change URL, check `playwright_example.env`), set the `INTEGRATION` flag to true and run the tests.

## PR checks and linking front-end/backend-end PRs for testing

The CICD pipeline for playwright (both front-end and backend) will check in the description of the front-end PRs for the following formatted text:
`#testwith https://github.com/content-services/content-sources-backend/pull/<PR NUMBER>`

Note the space in `#testwith https`.

If a backend PR is linked, the front-end and back-end PR's in question will both use the corresponding linked branch for their Playwright tests in the PR check.

## Deploying

- The starter repo uses Travis to deploy the webpack build to another Github repo defined in `.travis.yml`
  - That Github repo has the following branches:
    - `ci-beta` (deployed by pushing to `master` or `main` on this repo)
    - `ci-stable` (deployed by pushing to `ci-stable` on this repo)
    - `qa-beta` (deployed by pushing to `qa-beta` on this repo)
    - `qa-stable` (deployed by pushing to `qa-stable` on this repo)
    - `prod-beta` (deployed by pushing to `prod-beta` on this repo)
    - `prod-stable` (deployed by pushing to `prod-stable` on this repo)
- Travis uploads results to RedHatInsight's [codecov](https://codecov.io) account. To change the account, modify CODECOV_TOKEN on <https://travis-ci.com/>.
