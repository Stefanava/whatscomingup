# IP usage reporter

IP Usage Reporter (ip-usage-reporter) (bit.ly/ip-usage) shows how much is spent on various AWS Services in IP. You can use the ip-usage-reporter to find cost savings in the IP AWS estate

## Requirements

This app requires the following to be installed to be able to run locally.

- [Node][node] (10.x.x version)

- [Vault][vault]

**Note:** You would need access to Internal Products' vault to access and use the environment variables for the app.

## Usage

### Setting up

Clone the project from the repo [https://github.com/Financial-Times/ip-usage-reporter](ip-usage-reporter).  
Navigate to the project where you have cloned it to the machine.

Next step, run this command:

```shell
npm install
```
to install the packages needed for the app locally if it is the first time running this project locally, and if the project has not been run for a while since the last time.

Then run:

```shell
npm run vault-login
```
To log into Vault,and 

```shell
npm run vault:env
```

To start the app, ensure your node version is as shown in package.json engine

```
npm run start
```

To get all the development env secret locally. The app can be accessed locally at `http://localhost:1234`.

##### Vault not connecting

If the app is not loading properly, it might be due to vault not getting the enviornment variables correctly. Please consult [Vault Wiki][vault-wiki] for more in-depth details on how to fix this particular issue.

**TL;DR Vault**: Based on the assumption that vault is setup exactly like how the [Wiki][vault-wiki] guide has instructed, then you can check if you are currently logged in on vault with this command below in command line:

```shell
vault login --method=github token=$VAULT_AUTH_GITHUB_TOKEN
```