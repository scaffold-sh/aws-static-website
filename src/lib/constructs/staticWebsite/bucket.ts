import { Construct } from "constructs"
import { Token } from "cdktf"

import { 
  S3Bucket, 
  DataAwsIamPolicyDocument,
  S3BucketObject
} from "../../../imports/providers/aws"

export interface BucketConstructProps {
  resourceNamesPrefix: string
  hasBuildCommand: boolean
}

class BucketConstruct extends Construct {
  readonly S3Bucket: S3Bucket

  constructor(scope: Construct, name: string, props: BucketConstructProps) {
    super(scope, name)

    const websiteBucketName = `${props.resourceNamesPrefix.replace(/[^a-z0-9.-]/gi, "-")}-website-bucket`

    const websiteBucketPolicy = new DataAwsIamPolicyDocument(this, "website_bucket_policy", {
      statement: [{
        actions: ["s3:GetObject"],
        resources: [
          `arn:aws:s3:::${websiteBucketName}/*`
        ],
        principals: [{
          identifiers: ["*"],
          type: "*"
        }]
      }] 
    })

    this.S3Bucket = new S3Bucket(this, "website_bucket", {
      bucket: websiteBucketName,
      policy: websiteBucketPolicy.json,
      website: [{
        indexDocument: "index.html",
        // Routing managed by SPA framework?
        // Must match "customErrorResponse" CDN property
        errorDocument: props.hasBuildCommand ? "index.html" : "error.html"
      }],
      forceDestroy: true
    })

    new S3BucketObject(this, "website_index_placeholder_file", {
      key: "index.html",
      bucket: Token.asString(this.S3Bucket.id),
      content: "It's a placeholder index.html file waiting for your pipeline to end!",
      contentType: "text/html"
    })

    if (!props.hasBuildCommand) {
      new S3BucketObject(this, "website_error_placeholder_file", {
        key: "error.html",
        bucket: Token.asString(this.S3Bucket.id),
        content: "It's a placeholder error.html file waiting for your pipeline to end!",
        contentType: "text/html"
      })
    }
  }
}

export default BucketConstruct
