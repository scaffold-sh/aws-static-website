import { Token } from "cdktf"
import { Construct } from "constructs"

import {
  CodebuildProject,
  Codepipeline,
  CodepipelineWebhook,
  DataAwsIamPolicyDocument,
  DataAwsRegion,
  IamRole,
  IamRolePolicy,
  S3Bucket,
} from "../../../imports/providers/aws"

import * as Null from "../../../imports/providers/null"

/**
 * Represents the properties of the pipeline construct.
 * @property awsProfile The AWS named profile used to create your infrastructure.
 * @property codebuildProject The CodeBuild project used to build and deploy your website.
 * @property currentRegion The AWS region used to create your infrastructure.
 * @property githubBranch The GitHub branch from which you want to deploy.
 * @property githubOauthToken The GitHub OAuth token used by your pipeline to access your repository.
 * @property githubRepo The GitHub repository used as source for your pipeline.
 * @property githubRepoOwner The GitHub repository owner (an user or an organization).
 * @property githubWebhookToken A random token that will be used by CodePipeline and GitHub to prevent impersonation.
 * @property resourceNamesPrefix An unique custom prefix used to avoid name colision with existing resources.
 * @property selfS3Bucket The S3 bucket containing your pipeline artifacts.
 * @property websiteS3Bucket The S3 bucket containing your website source code.
 */
export interface IPipelineConstructProps {
  awsProfile: string;
  codebuildProject: CodebuildProject;
  currentRegion: DataAwsRegion;
  githubBranch: string;
  githubOauthToken: string;
  githubRepo: string;
  githubRepoOwner: string;
  githubWebhookToken: string;
  resourceNamesPrefix: string;
  selfS3Bucket: S3Bucket;
  websiteS3Bucket: S3Bucket;
}

/**
 * Represents the deployment pipeline of your infrastructure.
 * @class
 * @extends Construct
 */
export class PipelineConstruct extends Construct {
  /**
   * Creates a pipeline construct.
   * @param scope The scope to attach the pipeline construct to.
   * @param id An unique id used to distinguish constructs.
   * @param props The pipeline construct properties.
   */
  constructor(scope: Construct, id: string, props: IPipelineConstructProps) {
    super(scope, id)

    const pipelineAssumeRolePolicyDocument = new DataAwsIamPolicyDocument(this, "codepipeline_assume_role_policy", {
      version: "2012-10-17",
      statement: [{
        effect: "Allow",
        principals: [{
          type: "Service",
          identifiers: [
            "codepipeline.amazonaws.com",
          ],
        }],
        actions: [
          "sts:AssumeRole",
        ],
      }],
    })

    const pipelineRole = new IamRole(this, "codepipeline_role", {
      assumeRolePolicy: pipelineAssumeRolePolicyDocument.json,
      name: `${props.resourceNamesPrefix}_codepipeline_role`,
      forceDetachPolicies: true,
    })

    const pipelineRolePolicyDocument = new DataAwsIamPolicyDocument(this, "codepipeline_role_policy_document", {
      version: "2012-10-17",
      statement: [{
        effect: "Allow",
        actions: [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetBucketVersioning",
          "s3:PutObject",
        ],
        resources: [
          Token.asString(props.selfS3Bucket.arn),
          `${Token.asString(props.selfS3Bucket.arn)}/*`,
        ],
      },

      {
        effect: "Allow",
        actions: [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild",
        ],
        resources: [
          props.codebuildProject.arn,
        ],
      }],
    })

    new IamRolePolicy(this, "codepipeline_role_policy", {
      name: `${props.resourceNamesPrefix}_codepipeline_role_policy`,
      policy: pipelineRolePolicyDocument.json,
      role: Token.asString(pipelineRole.id),
      dependsOn: [
        props.codebuildProject,
      ],
    })

    const pipelineSourceActionName = `${props.resourceNamesPrefix}_source`
    const pipeline = new Codepipeline(this, "codepipeline_pipeline", {
      name: `${props.resourceNamesPrefix}_codepipeline_pipeline`,
      roleArn: pipelineRole.arn,
      artifactStore: [{
        location: Token.asString(props.selfS3Bucket.bucket),
        type: "S3",
      }],
      stage: [{
        name: "Source",
        action: [{
          category: "Source",
          name: pipelineSourceActionName,
          // See below
          configuration: {},
          outputArtifacts: [
            "source_output",
          ],
          owner: "ThirdParty",
          provider: "GitHub",
          version: "1",
        }],
      }, {
        name: "BuildAndDeploy",
        action: [{
          category: "Build",
          name: `${props.resourceNamesPrefix}_build_and_deploy`,
          // See below
          configuration: {},
          inputArtifacts: [
            "source_output",
          ],
          owner: "AWS",
          provider: "CodeBuild",
          version: "1",
        }],
      }],
      dependsOn: [
        pipelineRole,
        props.codebuildProject,
      ],
    })

    // Fix https://github.com/hashicorp/terraform-cdk/issues/291

    pipeline.addOverride("stage.0.action.0.configuration", {
      Branch: props.githubBranch,
      OAuthToken: props.githubOauthToken,
      Owner: props.githubRepoOwner,
      PollForSourceChanges: false,
      Repo: props.githubRepo,
    })

    pipeline.addOverride("stage.1.action.0.configuration", {
      ProjectName: props.codebuildProject.name,
    })

    // ---

    const pipelineWebhook = new CodepipelineWebhook(this, "codepipeline_webhook", {
      name: `${props.resourceNamesPrefix}_codepipeline_webhook`,
      targetAction: pipelineSourceActionName,
      targetPipeline: pipeline.name,
      authentication: "GITHUB_HMAC",
      authenticationConfiguration: [{
        secretToken: props.githubWebhookToken,
      }],
      filter: [{
        jsonPath: "$.ref",
        matchEquals: "refs/heads/{Branch}",
      }],
      dependsOn: [
        pipeline,
      ],
    })

    // The GitHub provider doesn't support the
    // creation of webhooks for personal accounts.
    // To avoid requiring an organization, we use a "null" resource
    // that will call the "register-webhook-with-third-party" command directly.

    const registerWebhook = new Null.Resource(this, "register_webhook", {
      triggers: {
        webhook: Token.asString(pipelineWebhook.id),
      },

      dependsOn: [
        pipelineWebhook,
      ],
    })

    registerWebhook.addOverride(
      "provisioner.local-exec.command",
      `aws codepipeline register-webhook-with-third-party --webhook-name ${pipelineWebhook.name} --profile ${props.awsProfile} --region ${props.currentRegion.name}`
    )

    // ---

    const startPipeline = new Null.Resource(this, "start_pipeline", {
      dependsOn: [
        registerWebhook,
      ],
    })

    startPipeline.addOverride(
      "provisioner.local-exec.command",
      `aws codepipeline start-pipeline-execution --name ${pipeline.name} --profile ${props.awsProfile} --region ${props.currentRegion.name}`
    )
  }
}

export default PipelineConstruct
