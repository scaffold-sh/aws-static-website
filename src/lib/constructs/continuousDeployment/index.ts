import { Construct } from "constructs"

import {
  S3Bucket,
  DataAwsRegion,
  DataAwsCallerIdentity,
  CloudfrontDistribution
} from "../../../imports/providers/aws"

import BuildConstruct from "./build"
import PipelineConstruct from "./pipeline"

export interface ContinuousDeploymentConstructProps {
  AWSProfile: string,
  currentRegion: DataAwsRegion,
  currentAccount: DataAwsCallerIdentity,
  resourceNamesPrefix: string,
  websiteS3Bucket: S3Bucket,
  buildCommand: string,
  buildOutput: string,
  cloudfrontDistrib: CloudfrontDistribution,
  githubBranch: string,
  githubRepo: string,
  githubRepoOwner: string,
  githubOauthToken: string,
  githubWebhookToken: string
}

export class ContinuousDeploymentConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ContinuousDeploymentConstructProps) {
    super(scope, id)

    const pipelineS3Bucket = new S3Bucket(this, "pipeline_bucket", {
      acl: "private",
      bucket: `${props.resourceNamesPrefix.replace(/[^a-z0-9.-]/gi, "-")}-codepipeline-bucket`,
      forceDestroy: true
    })

    const build = new BuildConstruct(this, "build", {
      resourceNamesPrefix: props.resourceNamesPrefix,
      currentAccount: props.currentAccount,
      currentRegion: props.currentRegion,
      pipelineS3Bucket,
      websiteS3Bucket: props.websiteS3Bucket,
      buildCommand: props.buildCommand,
      buildOutput: props.buildOutput,
      cloudfrontDistrib: props.cloudfrontDistrib
    })

    new PipelineConstruct(this, "pipeline", {
      AWSProfile: props.AWSProfile,
      resourceNamesPrefix: props.resourceNamesPrefix,
      currentRegion: props.currentRegion,
      websiteS3Bucket: props.websiteS3Bucket,
      codebuildProject: build.project,
      selfS3Bucket: pipelineS3Bucket,
      githubBranch: props.githubBranch,
      githubRepo: props.githubRepo,
      githubRepoOwner: props.githubRepoOwner,
      githubOauthToken: props.githubOauthToken,
      githubWebhookToken: props.githubWebhookToken
    })
  }
}

export default ContinuousDeploymentConstruct
