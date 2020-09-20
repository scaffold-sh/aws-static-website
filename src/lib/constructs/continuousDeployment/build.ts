import { resolve } from "path"
import { readFileSync } from "fs"

import { Token } from "cdktf"
import { Construct } from "constructs"

import * as YAML from "yaml"

import { 
  IamRole, 
  DataAwsIamPolicyDocument, 
  IamRolePolicy, 
  CodebuildProject,
  DataAwsRegion,
  DataAwsCallerIdentity,
  S3Bucket,
  CloudfrontDistribution
} from "../../../imports/providers/aws"

export interface BuildConstructProps {
  resourceNamesPrefix: string,
  pipelineS3Bucket: S3Bucket,
  websiteS3Bucket: S3Bucket,
  currentRegion: DataAwsRegion,
  currentAccount: DataAwsCallerIdentity,
  cloudfrontDistrib: CloudfrontDistribution,
  buildCommand: string,
  buildOutput: string
}

export class BuildConstruct extends Construct {
  readonly project: CodebuildProject

  constructor(scope: Construct, id: string, props: BuildConstructProps) {
    super(scope, id)

    const buildLogsGroup = `${props.resourceNamesPrefix}_codebuild_logs_group`

    const buildAssumeRolePolicyDocument = new DataAwsIamPolicyDocument(this, "build_assume_role_policy", {
      version: "2012-10-17",
      statement: [{
        effect: "Allow",
        principals: [{
          type: "Service",
          identifiers: [
            "codebuild.amazonaws.com"
          ]
        }],
        actions: [
          "sts:AssumeRole"
        ]
      }]
    })

    const buildRole = new IamRole(this, "build_role", {
      assumeRolePolicy: buildAssumeRolePolicyDocument.json,
      name: `${props.resourceNamesPrefix}_codebuild_role`,
      forceDetachPolicies: true
    })

    const buildRolePolicyDocument = new DataAwsIamPolicyDocument(this, "build_role_policy_document", {
      version: "2012-10-17",
      statement: [{
        effect: "Allow",
        actions: [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
          "s3:GetBucketAcl",
          "s3:GetBucketLocation"
        ],
        resources: [
          Token.asString(props.pipelineS3Bucket.arn),
          `${Token.asString(props.pipelineS3Bucket.arn)}/*`
        ]
      }, {
        effect: "Allow",
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        resources: [
          `arn:aws:logs:${props.currentRegion.name}:${props.currentAccount.accountId}:log-group:${buildLogsGroup}`,
          `arn:aws:logs:${props.currentRegion.name}:${props.currentAccount.accountId}:log-group:${buildLogsGroup}:*`,
        ]
      }, {
        effect: "Allow",
        actions: [
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:PutObject",
          "s3:ListBucket"
        ],
        resources: [
          `${Token.asString(props.websiteS3Bucket.arn)}`,
          `${Token.asString(props.websiteS3Bucket.arn)}/*`
        ]
      }, {
        effect: "Allow",
        actions: [
          "cloudfront:CreateInvalidation"
        ],
        resources: [
          "*"
        ]
      }]
    })

    new IamRolePolicy(this, "build_role_policy", {
      name: `${props.resourceNamesPrefix}_codebuild_role_policy`,
      policy: buildRolePolicyDocument.json,
      role: Token.asString(buildRole.id)
    })

    const buildspec = readFileSync(resolve(__dirname, "..", "..", "..", "..", "templates", "buildspec.yml")).toString()
    const parsedBuildSpec = YAML.parse(buildspec)

    parsedBuildSpec.env.variables.AWS_S3_WEBSITE_BUCKET = props.websiteS3Bucket.bucket
    parsedBuildSpec.env.variables.AWS_CLOUDFRONT_DISTRIB_ID = Token.asString(props.cloudfrontDistrib.id)

    parsedBuildSpec.env.variables.BUILD_COMMAND = props.buildCommand
    parsedBuildSpec.env.variables.BUILD_OUTPUT = props.buildOutput

    this.project = new CodebuildProject(this, "build_project", {
      artifacts: [{
        type: "CODEPIPELINE"
      }],
      buildTimeout: 60,
      cache: [{
        modes: [
          "LOCAL_SOURCE_CACHE"
        ],
        type: "LOCAL"
      }],
      environment: [{
        computeType: "BUILD_GENERAL1_SMALL",
        image: "aws/codebuild/standard:1.0",
        type: "LINUX_CONTAINER"
      }],
      logsConfig: [{
        cloudwatchLogs: [{
          groupName: buildLogsGroup,
          streamName: `${props.resourceNamesPrefix}_codebuild_logs_stream`
        }]
      }],
      name: `${props.resourceNamesPrefix}_codebuild_build_project`,
      serviceRole: buildRole.arn,
      source: [{
        buildspec: YAML.stringify(parsedBuildSpec),
        type: "CODEPIPELINE"
      }],
      dependsOn: [
        buildRole,
        props.cloudfrontDistrib
      ]
    })
  }
}

export default BuildConstruct
