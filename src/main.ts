// Populate "process.env"
require("dotenv-flow").config({path: require("path").resolve(__dirname, "..")})

import { Construct } from "constructs"

import { 
  App, 
  TerraformStack,
  TerraformOutput,
  S3Backend
} from "cdktf"

import { 
  AwsProvider,
  DataAwsRegion,
  DataAwsCallerIdentity
} from "./imports/providers/aws"

import ContinuousDeploymentConstruct from "./lib/constructs/continuousDeployment"
import StaticWebsiteConstruct from "./lib/constructs/staticWebsite"

class ScaffoldAWSStaticWebsite extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name)

    const resourceNamesPrefix = process.env.SCAFFOLD_RESOURCE_NAMES_PREFIX

    const domainNames = process.env.DOMAIN_NAMES.split(",")
    const enableHTTPS = process.env.ENABLE_HTTPS === "true"

    const githubOauthToken = process.env.GITHUB_OAUTH_TOKEN
    const githubWebhookToken = process.env.GITHUB_WEBHOOK_TOKEN

    const githubRepo = process.env.GITHUB_REPO
    const githubRepoOwner = process.env.GITHUB_REPO_OWNER
    const githubBranch = process.env.GITHUB_BRANCH
    
    const hasBuildCommand = !!process.env.BUILD_COMMAND
    const buildCommand = process.env.BUILD_COMMAND || "echo No build command"
    const buildOutput = process.env.BUILD_OUTPUT_DIR || "."

    new S3Backend(this, {
      key: process.env.SCAFFOLD_AWS_S3_BACKEND_KEY,
      bucket: process.env.SCAFFOLD_AWS_S3_BACKEND_BUCKET,
      dynamodbTable: process.env.SCAFFOLD_AWS_S3_BACKEND_DYNAMODB_TABLE,
      encrypt: true,
      region: process.env.SCAFFOLD_AWS_REGION,
      profile: process.env.SCAFFOLD_AWS_PROFILE
    })

    new AwsProvider(this, "aws", {
      region: process.env.SCAFFOLD_AWS_REGION,
      profile: process.env.SCAFFOLD_AWS_PROFILE
    })

    // To assign an ACM certificate 
    // to a CloudFront distribution, 
    // we must request the certificate 
    // in the US East (N. Virginia) Region
    const AWSUSEast1Provider = new AwsProvider(this, "aws_acm", {
      alias: "aws_acm",
      region: "us-east-1",
      profile: process.env.SCAFFOLD_AWS_PROFILE
    })

    const currentRegion = new DataAwsRegion(this, "current_region", {})
    const currentAccount = new DataAwsCallerIdentity(this, "current_account", {})

    const staticWebsite = new StaticWebsiteConstruct(this, "static_website", {
      AWSUSEast1Provider, 
      domainNames,
      resourceNamesPrefix,
      hasBuildCommand,
      enableHTTPS
    })

    new ContinuousDeploymentConstruct(this, "continuous_deployment", {
      AWSProfile: process.env.SCAFFOLD_AWS_PROFILE,
      resourceNamesPrefix,
      currentAccount,
      currentRegion,
      websiteS3Bucket: staticWebsite.websiteS3Bucket,
      cloudfrontDistrib: staticWebsite.cloudfrontDistrib,
      buildCommand,
      buildOutput,
      githubBranch,
      githubOauthToken,
      githubRepo,
      githubRepoOwner,
      githubWebhookToken
    })

    new TerraformOutput(this, "website_url", {
      value: staticWebsite.url
    })

    new TerraformOutput(this, "ssl_validation_dns_records", {
      value: staticWebsite.SSLValidationDNSRecords
    })
  }
}

const app = new App()
new ScaffoldAWSStaticWebsite(app, "scaffold_aws_static_website")
app.synth()
