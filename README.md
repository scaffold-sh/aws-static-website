<p align="center">
  <img src="/assets/aws.jpg" alt="AWS" width="200" height="200" />
</p>

<h1 align="center">AWS Static Website</h1>

<h4 align="center">
  <a href="https://scaffold.sh/docs/infrastructures/aws/static-website">Documentation</a> |
  <a href="https://scaffold.sh">Website</a> |
  <a href="https://medium.com/scaffold">Blog</a> |
  <a href="https://twitter.com/scaffold_sh">Twitter</a> |
  <a href="https://www.linkedin.com/company/scaffold-sh">LinkedIn</a>
</h4>

<p align="center"><b>+ $1.5</b> / month &nbsp;&nbsp;&nbsp;&nbsp;  <b>~ 4min</b> / create</p>

<p align="center">
  <a href="https://github.com/scaffold-sh/cli/blob/master/package.json"><img src="https://img.shields.io/node/v/@scaffold.sh/cli" alt="Node version"></a>
  <a href="https://yarnpkg.com/en/docs/install"><img src="https://img.shields.io/badge/yarn-%3E%3D1.21-blue" alt="Yarn version"></a>
    <a href="https://aws.amazon.com/cli/?nc1=h_ls"><img src="https://img.shields.io/badge/aws-%3E%3D2.0-0b1b2c" alt="AWS version"></a>
  <a href="https://www.terraform.io/downloads.html"><img src="https://img.shields.io/badge/terraform-13.0-5c44db" alt="Terraform version"></a>
  <a href="https://github.com/hashicorp/terraform-cdk"><img src="https://img.shields.io/badge/cdktf-%3E%3D0.14-green" alt="CDKTF version"></a>
  <a href="https://github.com/scaffold-sh/aws-static-website/blob/master/LICENSE"><img src="https://img.shields.io/github/license/scaffold-sh/aws-static-website" alt="License"></a>
</p>

```console
$ scaffold aws:static-website
```

This infrastructure uses the static website hosting capabilities of **[AWS S3](https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html)** to host your static website in a **serverless way**.

Your **GitHub account** will be connected to **[CodePipeline](https://aws.amazon.com/codepipeline)** and **[CodeBuild](https://aws.amazon.com/codebuild)**, so you will be able to build, test and deploy your favorite SPA and SSG frameworks (React JS, Vue JS, Gatsby JS, Hugo...) using the usual `git push` command.

Given that the S3 website endpoints do not support HTTPS, this infrastructure uses **[CloudFront](https://aws.amazon.com/cloudfront)** coupled with **[ACM](https://aws.amazon.com/acm)** to add a fully-managed SSL certificate to your website.

To use an ACM certificate with Amazon CloudFront, the certificate [must be requested](https://docs.aws.amazon.com/acm/latest/userguide/acm-regions.html) in the US East (N. Virginia) region.

This infrastructure also uses **[SSM Parameters Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)** to store your build environment variables.

![](/assets/schema.png)

### Requirements

*   You will need a **GitHub** account to create this infrastructure. **Support for GitLab and BitBucket is coming soon.**

*   If you plan to use an apex domain for your website (i.e. a root domain that does not contain a subdomain), make sure that your domain host support the ANAME, ALIAS or naked CNAME DNS record type.

## Components

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Source</th>
            <th>Price</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><b><a href="https://docs.aws.amazon.com/AmazonS3/latest/dev/Introduction.html">S3</a></b> <sup>(one bucket)</sup><br/>S3 will be used to store your website source code.</td>
            <td><a href="https://github.com/scaffold-sh/aws-static-website/blob/master/src/lib/constructs/staticWebsite/bucket.ts">src/lib/constructs/staticWebsite/bucket.ts</a></td>
          <td><b>Usage</b></td>
        </tr>
        <tr>
            <td><b><a href="https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html">Cloudfront</a></b> <sup>(one distribution)</sup><br />CloudFront will be used to serve your website from your S3 bucket.</td>
            <td><a href="https://github.com/scaffold-sh/aws-static-website/blob/master/src/lib/constructs/staticWebsite/cdn.ts">src/lib/constructs/staticWebsite/cdn.ts</a></td>
          <td><b>Usage</b></td>
        </tr>
        <tr>
            <td><b><a href="https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html">CodePipeline</a></b> <sup>(one pipeline)</sup><br />CodePipeline will be used to manage the deployments of your website.</td>
            <td><a href="https://github.com/scaffold-sh/aws-static-website/blob/master/src/lib/constructs/continuousDeployment/pipeline.ts">src/lib/constructs/continuousDeployment/pipeline.ts</a></td>
          <td><b>$1</b>&nbsp;/&nbsp;month</td>
        </tr>
        <tr>
            <td><b><a href="https://docs.aws.amazon.com/codebuild/latest/userguide/welcome.html">CodeBuild</a></b> <sup>(one build project)</sup><br />CodeBuild will be used to run the builds of your website.</td>
            <td><a href="https://github.com/scaffold-sh/aws-static-website/blob/master/src/lib/constructs/continuousDeployment/build.ts">src/lib/constructs/continuousDeployment/build.ts</a></td>
          <td><b>+$0.5</b>&nbsp;/&nbsp;month</td>
        </tr>
        <tr>
            <td><b><a href="https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html">ACM</a></b> <sup>(one certificate)</sup><br />ACM will be used to manage the SSL certificate of your website.</td>
            <td><a href="https://github.com/scaffold-sh/aws-static-website/blob/master/src/lib/constructs/staticWebsite/ssl.ts">src/lib/constructs/staticWebsite/ssl.ts</a></td>
          <td><b>Free</b></td>
        </tr>
        <tr>
            <td><b><a href="https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html">SSM</a></b> <sup>(one parameter store)</sup><br />SSM Parameter Store will be used to store the environment variables of your builds.</td>
            <td><a href="https://github.com/scaffold-sh/aws-static-website/blob/master/src/lib/constructs/staticWebsite/environmentVariables.ts">src/lib/constructs/computing/environmentVariables.ts</a></td>
          <td><b>Usage</b></td>
        </tr>
    </tbody>
</table>

## Environment variables

These environment variables will be **automatically** configured each time you create <a href="https://scaffold.sh/docs/environments">an environment</a> (or <a href="https://scaffold.sh/docs/sandboxes">a sandbox</a>) for your infrastructure.

<table class="table table-striped table-dark">

<thead>

<tr>

<th scope="col">Name</th>

<th scope="col">Description</th>

</tr>

</thead>

<tbody>

<tr>

<th scope="row">BUILD_COMMAND</th>

<td>The command that needs to be run to build your website (e.g. npm i && npm run build) (optional).</td>

</tr>

<tr>

<th scope="row">BUILD_OUTPUT_DIR</th>

<td>The directory where the build command output your website (e.g. build/) (optional).</td>

</tr>

<tr>

<th scope="row">DOMAIN_NAMES</th>

<td>The domain name(s) that you want to use for your website.</td>

</tr>

<tr>

<th scope="row">ENABLE_HTTPS</th>

<td>We need to wait for the ACM certificate to be "issued" to enable HTTPS. See the "<a href="https://scaffold.sh/docs/infrastructures/aws/static-website/after-install">after install</a>" section to learn more.</td>

</tr>

<tr>

<th scope="row">GITHUB_BRANCH</th>

<td>The branch from which you want to deploy.</td>

</tr>

<tr>

<th scope="row">GITHUB_OAUTH_TOKEN</th>

<td>The GitHub OAuth token that will be used by CodePipeline to pull your source code from your repository.</td>

</tr>

<tr>

<th scope="row">GITHUB_REPO</th>

<td>The GitHub repository that contains your source code.</td>

</tr>

<tr>

<th scope="row">GITHUB_REPO_OWNER</th>

<td>The owner of your GitHub repository. Can be a regular user or an organization.</td>

</tr>

<tr>

<th scope="row">GITHUB_WEBHOOK_TOKEN</th>

<td>A random token that will be used by CodePipeline and GitHub to prevent impersonation.</td>

</tr>

</tbody>

</table>

### Inherited

<table class="table table-striped table-dark">

<thead>

<tr>

<th scope="col">Name</th>

<th scope="col">Description</th>

</tr>

</thead>

<tbody>

<tr>

<th scope="row">SCAFFOLD_AWS_PROFILE</th>

<td>The AWS named profile used to create your infrastructure.</td>

</tr>

<tr>

<th scope="row">SCAFFOLD_AWS_REGION</th>

<td>The AWS region where you want to create your infrastructure.</td>

</tr>

<tr>

<th scope="row">SCAFFOLD_AWS_S3_BACKEND_BUCKET</th>

<td>The AWS S3 bucket that will contain the Terraform state of your infrastructure.</td>

</tr>

<tr>

<th scope="row">SCAFFOLD_AWS_S3_BACKEND_DYNAMODB_TABLE</th>

<td>The AWS DynamoDB table that will be used to store the Terraform state locks.</td>

</tr>

<tr>

<th scope="row">SCAFFOLD_AWS_S3_BACKEND_KEY</th>

<td>The S3 bucket key under which your Terraform state will be saved.</td>

</tr>

<tr>

<th scope="row">SCAFFOLD_RESOURCE_NAMES_PREFIX</th>

<td>An unique custom prefix used to avoid name colision with existing resources.</td>

</tr>

</tbody>

</table>

## After install

**CloudFront will display a placeholder index file until the end of the first deployment.**

This infrastructure exports three Terraform outputs: `cloudfront_distribution_uri`, `pipeline_execution_details_url` and `ssl_validation_dns_records`.

The `cloudfront_distribution_uri` output value contains the URI of your CloudFront distribution. You could use it to access your website while your DNS are propagating.

The `pipeline_execution_details_url` output values contains the URL of your pipeline executions details.

The `ssl_validation_dns_records` output value contains the DNS records that you need to set in order to validate your ACM certificate (see below).

### How do I set up my domain name?

The way you will set up your domain name will vary according to the presence or absence of a subdomain.

If your domain name doesn't have any subdomains, you will need to add two DNS records:

- **Name:** <empty> or @
- **Type:** ALIASE, ANAME or CNAME
- **Value:** `cloudfront_distribution_uri`

<p></p>

- **Name:** www
- **Type:** CNAME
- **Value:** `cloudfront_distribution_uri`

If your domain name has a subdomain, you will need to add one CNAME record:

- **Name:** subdomain
- **Type:** CNAME
- **Value:** `cloudfront_distribution_uri`

### How do I set up HTTPS?

The `ssl_validation_dns_records` output value contains the DNS records that you need to set in order to validate your ACM certificate.

Once set, you will need to [wait for the status](https://console.aws.amazon.com/acm/home?region=us-east-1#/) of your certificate to switch from "pending" to "issued" to use it with your application load balancer.

You could then set the `ENABLE_HTTPS` environment variable to "true" in your local env file and run the `scaffold apply` command to update your infrastructure.

If you want to automate this process, you could use AWS Route 53 as your domain host then use the `aws_route53_record` and `aws_acm_certificate_validation` resources to wait for certificate validation. See the [Terraform documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/acm_certificate_validation) to learn more.

### How do I customize the build stage of my pipeline?

[CodeBuild uses a YAML file](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html) to describe all the steps that a stage requires. This file is located in the <kbd>templates</kbd> directory at the root of your infrastructure:

```env
# ./templates                                  
buildspec.yml
```

You could update this file directly to customize your pipeline build stage.

### How do I add environment variables to the build stage?

To add an environment variable to the build stage all you have to do is to add an environment variable that starts with `BUILD_` to your infrastructure code.

For example, let's say that you want to add a `TOKEN` variable to your build. You will first add it to your `.env` file:

```env
# .env
BUILD_TOKEN=
```

Then, given that this value is secret you choose to define it in your local env file:

```env
# .env.{environment}.local
BUILD_TOKEN=MY_SECRET_TOKEN
```

One done, you could access your environment variables in all your buildspec file:

```yaml
# templates/buildspec.yml

version: 0.2

phases:
  pre_build:
    commands:
      - echo $TOKEN
```

Remember to run the `scaffold apply` command each time you update your infrastructure code.
