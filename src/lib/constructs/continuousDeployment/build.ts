import { resolve } from "path"
import { readFileSync } from "fs"

import { Token } from "cdktf"
import { Construct } from "constructs"

import * as YAML from "yaml"

import {
  CloudfrontDistribution,
  CodebuildProject,
  DataAwsCallerIdentity,
  DataAwsIamPolicyDocument,
  DataAwsRegion,
  IamRole,
  IamRolePolicy,
  S3Bucket,
} from "../../../imports/providers/aws"

/**
 * Represents the properties of the build construct.
 * @property buildCommand The command used to build your website.
 * @property buildOutput The directory where the build command will output your website.
 * @property cloudfrontDistribution The CloudFront distribution used as CDN for your website.
 * @property currentAccount The AWS named profile used to create your infrastructure.
 * @property currentRegion The AWS region used to create your infrastructure.
 * @property pipelineS3Bucket The S3 bucket containing your pipeline artifacts.
 * @property resourceNamesPrefix An unique custom prefix used to avoid name colision with existing resources.
 * @property websiteS3Bucket The S3 bucket containing your website source code.
 */
export interface IBuildConstructProps {
  buildCommand: string;
  buildOutput: string;
  cloudfrontDistribution: CloudfrontDistribution;
  currentAccount: DataAwsCallerIdentity;
  currentRegion: DataAwsRegion;
  pipelineS3Bucket: S3Bucket;
  resourceNamesPrefix: string;
  websiteS3Bucket: S3Bucket;
}

/**
 * Represents the CodeBuild project that will build and deploy your website.
 * @class
 * @extends Construct
 */
export class BuildConstruct extends Construct {
  /**
   * The CodeBuild project used to build and deploy your website.
   */
  readonly codebuildProject: CodebuildProject

  /**
   * Creates a build construct.
   * @param scope The scope to attach the build construct to.
   * @param id An unique id used to distinguish constructs.
   * @param props The build construct properties.
   */
  constructor(scope: Construct, id: string, props: IBuildConstructProps) {
    super(scope, id)

    const buildLogsGroup = `${props.resourceNamesPrefix}_codebuild_logs_group`

    const buildAssumeRolePolicyDocument = new DataAwsIamPolicyDocument(this, "codebuild_assume_role_policy", {
      version: "2012-10-17",
      statement: [{
        effect: "Allow",
        principals: [{
          type: "Service",
          identifiers: [
            "codebuild.amazonaws.com",
          ],
        }],
        actions: [
          "sts:AssumeRole",
        ],
      }],
    })

    const buildRole = new IamRole(this, "codebuild_role", {
      assumeRolePolicy: buildAssumeRolePolicyDocument.json,
      name: `${props.resourceNamesPrefix}_codebuild_role`,
      forceDetachPolicies: true,
    })

    const buildRolePolicyDocument = new DataAwsIamPolicyDocument(this, "codebuild_role_policy_document", {
      version: "2012-10-17",
      statement: [{
        effect: "Allow",
        actions: [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:GetBucketAcl",
          "s3:GetBucketLocation",
        ],
        resources: [
          Token.asString(props.pipelineS3Bucket.arn),
          `${Token.asString(props.pipelineS3Bucket.arn)}/*`,
        ],
      }, {
        effect: "Allow",
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: [
          `arn:aws:logs:${props.currentRegion.name}:${props.currentAccount.accountId}:log-group:${buildLogsGroup}`,
          `arn:aws:logs:${props.currentRegion.name}:${props.currentAccount.accountId}:log-group:${buildLogsGroup}:*`,
        ],
      }, {
        effect: "Allow",
        actions: [
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:PutObject",
          "s3:ListBucket",
        ],
        resources: [
          `${Token.asString(props.websiteS3Bucket.arn)}`,
          `${Token.asString(props.websiteS3Bucket.arn)}/*`,
        ],
      }, {
        effect: "Allow",
        actions: [
          "cloudfront:CreateInvalidation",
        ],
        resources: [
          "*",
        ],
      }],
    })

    new IamRolePolicy(this, "codebuild_role_policy", {
      name: `${props.resourceNamesPrefix}_codebuild_role_policy`,
      policy: buildRolePolicyDocument.json,
      role: Token.asString(buildRole.id),
    })

    const buildspec = readFileSync(resolve(__dirname, "..", "..", "..", "..", "templates", "buildspec.yml")).toString()
    const parsedBuildSpec = YAML.parse(buildspec)

    parsedBuildSpec.env.variables.AWS_S3_WEBSITE_BUCKET = props.websiteS3Bucket.bucket
    parsedBuildSpec.env.variables.AWS_CLOUDFRONT_DISTRIB_ID = Token.asString(props.cloudfrontDistribution.id)

    parsedBuildSpec.env.variables.BUILD_COMMAND = props.buildCommand
    parsedBuildSpec.env.variables.BUILD_OUTPUT = props.buildOutput

    this.codebuildProject = new CodebuildProject(this, "codebuild_project", {
      artifacts: [{
        type: "CODEPIPELINE",
      }],
      buildTimeout: 60,
      cache: [{
        modes: [
          "LOCAL_SOURCE_CACHE",
        ],
        type: "LOCAL",
      }],
      environment: [{
        computeType: "BUILD_GENERAL1_SMALL",
        image: "aws/codebuild/standard:1.0",
        type: "LINUX_CONTAINER",
      }],
      logsConfig: [{
        cloudwatchLogs: [{
          groupName: buildLogsGroup,
          streamName: `${props.resourceNamesPrefix}_codebuild_logs_stream`,
        }],
      }],
      name: `${props.resourceNamesPrefix}_codebuild_build_project`,
      serviceRole: buildRole.arn,
      source: [{
        buildspec: YAML.stringify(parsedBuildSpec),
        type: "CODEPIPELINE",
      }],
      dependsOn: [
        buildRole,
        props.cloudfrontDistribution,
      ],
    })
  }
}

export default BuildConstruct
