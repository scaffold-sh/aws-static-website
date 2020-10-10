import { Construct } from "constructs"
import { Token } from "cdktf"

import {
  DataAwsIamPolicyDocument,
  S3Bucket,
  S3BucketObject,
} from "../../../imports/providers/aws"

/**
 * Represents the properties of the bucket construct.
 * @property hasBuildCommand Do your website has a build command?
 * @property resourceNamesPrefix An unique custom prefix used to avoid name colision with existing resources.
 */
export interface IBucketConstructProps {
  hasBuildCommand: boolean;
  resourceNamesPrefix: string;
}

/**
 * Represents the S3 bucket that will contain your website source code.
 * @class
 * @extends Construct
 */
class BucketConstruct extends Construct {
  /**
   * The S3 bucket containing your website source code.
   */
  readonly S3Bucket: S3Bucket

  /**
   * Creates a bucket construct.
   * @param scope The scope to attach the Bucket construct to.
   * @param id An unique id used to distinguish constructs.
   * @param props The Bucket construct properties.
   */
  constructor(scope: Construct, id: string, props: IBucketConstructProps) {
    super(scope, id)

    const websiteBucketName = `${props.resourceNamesPrefix.replace(/[^a-z0-9.-]/gi, "-")}-website-bucket`

    const websiteBucketPolicy = new DataAwsIamPolicyDocument(this, "s3_bucket_policy", {
      statement: [{
        actions: ["s3:GetObject"],
        resources: [
          `arn:aws:s3:::${websiteBucketName}/*`,
        ],
        principals: [{
          identifiers: ["*"],
          type: "*",
        }],
      }],
    })

    this.S3Bucket = new S3Bucket(this, "s3_bucket", {
      bucket: websiteBucketName,
      policy: websiteBucketPolicy.json,
      website: [{
        indexDocument: "index.html",
        // Routing managed by SPA framework?
        // Must match "customErrorResponse" CDN property
        errorDocument: props.hasBuildCommand ? "index.html" : "error.html",
      }],
      forceDestroy: true,
    })

    new S3BucketObject(this, "s3_index_placeholder_file", {
      key: "index.html",
      bucket: Token.asString(this.S3Bucket.id),
      content: "It's a placeholder index.html file waiting for your pipeline to end!",
      contentType: "text/html",
    })

    if (!props.hasBuildCommand) {
      new S3BucketObject(this, "s3_error_placeholder_file", {
        key: "error.html",
        bucket: Token.asString(this.S3Bucket.id),
        content: "It's a placeholder error.html file waiting for your pipeline to end!",
        contentType: "text/html",
      })
    }
  }
}

export default BucketConstruct
