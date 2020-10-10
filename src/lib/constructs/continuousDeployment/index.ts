import { Construct } from "constructs"

import {
  CloudfrontDistribution,
  DataAwsCallerIdentity,
  DataAwsRegion,
  S3Bucket,
} from "../../../imports/providers/aws"

import BuildConstruct from "./build"
import PipelineConstruct from "./pipeline"

/**
 * Represents the properties of the continuous deployment construct.
 * @property awsProfile The AWS named profile used to create your infrastructure.
 * @property buildCommand The command used to build your website.
 * @property buildOutput The directory where the build command will output your website.
 * @property cloudfrontDistribution The CloudFront distribution used as CDN for your website.
 * @property currentAccount The AWS named profile used to create your infrastructure.
 * @property currentRegion The AWS region used to create your infrastructure.
 * @property githubBranch The GitHub branch from which you want to deploy.
 * @property githubOauthToken The GitHub OAuth token used by your pipeline to access your repository.
 * @property githubRepo The GitHub repository used as source for your pipeline.
 * @property githubRepoOwner The GitHub repository owner (an user or an organization).
 * @property githubWebhookToken A random token that will be used by CodePipeline and GitHub to prevent impersonation.
 * @property resourceNamesPrefix An unique custom prefix used to avoid name colision with existing resources.
 * @property websiteS3Bucket The S3 bucket containing your website source code.
 */
export interface IContinuousDeploymentConstructProps {
  awsProfile: string;
  buildCommand: string;
  buildOutput: string;
  cloudfrontDistrib: CloudfrontDistribution;
  currentAccount: DataAwsCallerIdentity;
  currentRegion: DataAwsRegion;
  githubBranch: string;
  githubOauthToken: string;
  githubRepo: string;
  githubRepoOwner: string;
  githubWebhookToken: string;
  resourceNamesPrefix: string;
  websiteS3Bucket: S3Bucket;
}

/**
 * Represents the components required to
 * build and deploy your website on AWS S3.
 * @class
 * @extends Construct
 */
export class ContinuousDeploymentConstruct extends Construct {
  /**
   * Creates a continuous deployment construct.
   * @param scope The scope to attach the continuous deployment construct to.
   * @param id An unique id used to distinguish constructs.
   * @param props The continuous deployment construct properties.
   */
  constructor(scope: Construct, id: string, props: IContinuousDeploymentConstructProps) {
    super(scope, id)

    const pipelineS3Bucket = new S3Bucket(this, "pipeline_bucket", {
      acl: "private",
      bucket: `${props.resourceNamesPrefix.replace(/[^a-z0-9.-]/gi, "-")}-codepipeline-bucket`,
      forceDestroy: true,
    })

    const build = new BuildConstruct(this, "build", {
      resourceNamesPrefix: props.resourceNamesPrefix,
      currentAccount: props.currentAccount,
      currentRegion: props.currentRegion,
      pipelineS3Bucket,
      websiteS3Bucket: props.websiteS3Bucket,
      buildCommand: props.buildCommand,
      buildOutput: props.buildOutput,
      cloudfrontDistribution: props.cloudfrontDistrib,
    })

    new PipelineConstruct(this, "pipeline", {
      awsProfile: props.awsProfile,
      resourceNamesPrefix: props.resourceNamesPrefix,
      currentRegion: props.currentRegion,
      websiteS3Bucket: props.websiteS3Bucket,
      codebuildProject: build.codebuildProject,
      selfS3Bucket: pipelineS3Bucket,
      githubBranch: props.githubBranch,
      githubRepo: props.githubRepo,
      githubRepoOwner: props.githubRepoOwner,
      githubOauthToken: props.githubOauthToken,
      githubWebhookToken: props.githubWebhookToken,
    })
  }
}

export default ContinuousDeploymentConstruct
