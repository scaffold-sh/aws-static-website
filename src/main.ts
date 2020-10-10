// Populate "process.env"
require("dotenv-flow").config({ path: require("path").resolve(__dirname, "..") })

import { Construct } from "constructs"

import {
  App,
  S3Backend,
  TerraformOutput,
  TerraformStack,
} from "cdktf"

import {
  AwsProvider,
  DataAwsCallerIdentity,
  DataAwsRegion,
} from "./imports/providers/aws"

import ContinuousDeploymentConstruct from "./lib/constructs/continuousDeployment"
import StaticWebsiteConstruct from "./lib/constructs/staticWebsite"

/**
 * Represents your build environment variables as "key => value" format.
 */
export type EnvironmentVariables = { [key: string]: string }

/**
 * Represents the Scaffold AWS Static website infrastructure.
 * @class
 * @extends TerraformStack
 */
class ScaffoldAWSStaticWebsite extends TerraformStack {
  /**
   * Creates the Scaffold AWS Serverless Docker infrastructure.
   * @param scope The scope to attach the infrastructure to.
   * @param id An unique id used to distinguish constructs.
   */
  constructor(scope: Construct, id: string) {
    super(scope, id)

    Object.keys(process.env).forEach(environmentVariableName => {
      if (!environmentVariableName.match(/^[a-z0-9_-]+$/gi)) {
        throw new Error("Environment variable names must match /^[a-z0-9_-]+$/i format")
      }
    })

    const resourceNamesPrefix = process.env.SCAFFOLD_RESOURCE_NAMES_PREFIX

    const domainNames = process.env.DOMAIN_NAMES.split(",")
    const enableHTTPS = process.env.ENABLE_HTTPS === "true"

    const githubOauthToken = process.env.GITHUB_OAUTH_TOKEN
    const githubWebhookToken = process.env.GITHUB_WEBHOOK_TOKEN

    const githubRepo = process.env.GITHUB_REPO
    const githubRepoOwner = process.env.GITHUB_REPO_OWNER
    const githubBranch = process.env.GITHUB_BRANCH

    const hasBuildCommand = Boolean(process.env.BUILD_COMMAND)
    const buildCommand = process.env.BUILD_COMMAND || "echo No build command"
    const buildOutputDir = process.env.BUILD_OUTPUT_DIR || "."

    // Environment variables that start with "BUILD_"
    // will become your builds environment variables
    const buildsEnvironmentVariables = Object
      .keys(process.env)
      .filter(environmentVariableKey => environmentVariableKey.startsWith("BUILD_") && !["BUILD_COMMAND", "BUILD_OUTPUT_DIR"].includes(environmentVariableKey))
      .reduce((acc, environmentVariableKey) => {
        acc[environmentVariableKey.replace(/^BUILD_/, "")] = process.env[environmentVariableKey] as string
        return acc
      }, {} as EnvironmentVariables)

    const awsS3BackendKey = process.env.SCAFFOLD_AWS_S3_BACKEND_KEY
    const awsS3BackendBucket = process.env.SCAFFOLD_AWS_S3_BACKEND_BUCKET
    const awsS3BackendDynamodbTable = process.env.SCAFFOLD_AWS_S3_BACKEND_DYNAMODB_TABLE

    const awsRegion = process.env.SCAFFOLD_AWS_REGION
    const awsProfile = process.env.SCAFFOLD_AWS_PROFILE

    new S3Backend(this, {
      key: awsS3BackendKey,
      bucket: awsS3BackendBucket,
      dynamodbTable: awsS3BackendDynamodbTable,
      encrypt: true,
      region: awsRegion,
      profile: awsProfile,
    })

    new AwsProvider(this, "aws", {
      region: awsRegion,
      profile: awsProfile,
    })

    // To assign an ACM certificate
    // to a CloudFront distribution,
    // we must request the certificate
    // in the US East (N. Virginia) Region
    const AWSUSEast1Provider = new AwsProvider(this, "aws_acm", {
      alias: "aws_acm",
      region: "us-east-1",
      profile: awsProfile,
    })

    const currentRegion = new DataAwsRegion(this, "current_region", {})
    const currentAccount = new DataAwsCallerIdentity(this, "current_account", {})

    const staticWebsite = new StaticWebsiteConstruct(this, "static_website", {
      awsUsEast1Provider: AWSUSEast1Provider,
      buildsEnvironmentVariables,
      domainNames,
      resourceNamesPrefix,
      hasBuildCommand,
      enableHttps: enableHTTPS,
    })

    const continuousDeployment = new ContinuousDeploymentConstruct(this, "continuous_deployment", {
      awsProfile: awsProfile,
      buildsEnvironmentVariables: staticWebsite.buildsEnvironmentVariables,
      resourceNamesPrefix,
      currentAccount,
      currentRegion,
      currentRegionAsString: awsRegion,
      websiteS3Bucket: staticWebsite.websiteS3Bucket,
      cloudfrontDistrib: staticWebsite.cloudfrontDistribution,
      buildCommand,
      buildOutputDir: buildOutputDir,
      githubBranch,
      githubOauthToken,
      githubRepo,
      githubRepoOwner,
      githubWebhookToken,
    })

    new TerraformOutput(this, "cloudfront_distribution_uri", {
      value: staticWebsite.cloudfrontDistribution.domainName,
    })

    new TerraformOutput(this, "pipeline_execution_details_url", {
      value: continuousDeployment.pipelineExecutionDetailsUrl,
    })

    new TerraformOutput(this, "ssl_validation_dns_records", {
      value: staticWebsite.sslValidationDnsRecords,
    })
  }
}

const app = new App()
new ScaffoldAWSStaticWebsite(app, "scaffold_aws_static_website")
app.synth()
