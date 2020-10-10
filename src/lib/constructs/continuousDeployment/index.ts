import { Construct } from "constructs"

import {
  CloudfrontDistribution,
  DataAwsCallerIdentity,
  DataAwsRegion,
  S3Bucket,
  SsmParameter,
} from "../../../imports/providers/aws"

import BuildConstruct from "./build"
import PipelineConstruct from "./pipeline"

/**
 * Represents the properties of the continuous deployment construct.
 * @property awsProfile The AWS named profile used to create your infrastructure.
 * @property buildCommand The command used to build your website.
 * @property buildOutputDir The directory where the build command will output your website.
 * @property buildsEnvironmentVariables The builds environment variables as SSM parameters.
 * @property cloudfrontDistribution The CloudFront distribution used as CDN for your website.
 * @property currentAccount The AWS named profile used to create your infrastructure.
 * @property currentRegion The AWS region used to create your infrastructure as data object.
 * @property currentRegionAsString The AWS region used to create your infrastructure as string.
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
  buildOutputDir: string;
  buildsEnvironmentVariables: SsmParameter[];
  cloudfrontDistrib: CloudfrontDistribution;
  currentAccount: DataAwsCallerIdentity;
  currentRegion: DataAwsRegion;
  currentRegionAsString: string;
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
   * The URL to the deployment pipeline execution details on AWS.
   */
  readonly pipelineExecutionDetailsUrl: string

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
      buildsEnvironmentVariables: props.buildsEnvironmentVariables,
      resourceNamesPrefix: props.resourceNamesPrefix,
      currentAccount: props.currentAccount,
      currentRegion: props.currentRegion,
      pipelineS3Bucket,
      websiteS3Bucket: props.websiteS3Bucket,
      buildCommand: props.buildCommand,
      buildOutputDir: props.buildOutputDir,
      cloudfrontDistribution: props.cloudfrontDistrib,
    })

    const pipeline = new PipelineConstruct(this, "pipeline", {
      awsProfile: props.awsProfile,
      resourceNamesPrefix: props.resourceNamesPrefix,
      currentRegionAsString: props.currentRegionAsString,
      websiteS3Bucket: props.websiteS3Bucket,
      codebuildProject: build.codebuildProject,
      selfS3Bucket: pipelineS3Bucket,
      githubBranch: props.githubBranch,
      githubRepo: props.githubRepo,
      githubRepoOwner: props.githubRepoOwner,
      githubOauthToken: props.githubOauthToken,
      githubWebhookToken: props.githubWebhookToken,
    })

    this.pipelineExecutionDetailsUrl = pipeline.executionDetailsUrl
  }
}

export default ContinuousDeploymentConstruct
