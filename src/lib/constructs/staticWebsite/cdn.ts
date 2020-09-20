import { Construct } from "constructs"
import { Token } from "cdktf"

import { 
  CloudfrontDistribution, 
  S3Bucket, 
  AcmCertificate
} from "../../../imports/providers/aws"

export interface CDNConstructProps {
  resourceNamesPrefix: string,
  websiteS3Bucket: S3Bucket,
  ACMCertificate: AcmCertificate,
  domainNames: string[],
  hasBuildCommand: boolean,
  enableHTTPS: boolean
}

class CDNConstruct extends Construct {
  readonly cloudfrontDistrib: CloudfrontDistribution

  constructor(scope: Construct, name: string, props: CDNConstructProps) {
    super(scope, name)

    const websiteOriginID = props.resourceNamesPrefix

    const cloudfrontDistribution = new CloudfrontDistribution(this, "website_distribution", {
      enabled: true,
      defaultRootObject: "index.html",
      aliases: props.enableHTTPS ? props.domainNames : undefined,
      origin: [{
        domainName: props.websiteS3Bucket.bucketRegionalDomainName,
        originId: websiteOriginID
      }],
      customErrorResponse: [{
        // If the routing is managed by a SPA framework 
        // all paths must be forwarded to "index.html".
        // If the object isn’t in the bucket, S3 returns a 403 error.
        // Must match "errorDocument" website bucket property.
        errorCode: 403,
        responseCode: props.hasBuildCommand ? 200 : 403,
        responsePagePath: props.hasBuildCommand ? "/index.html" : "/error.html"
      }],
      defaultCacheBehavior: [{
        targetOriginId: websiteOriginID,
        allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        cachedMethods: ["GET", "HEAD"],
        viewerProtocolPolicy: "redirect-to-https",
        forwardedValues: [{
          queryString: false,
          cookies: [{
            forward: "none"
          }]
        }]
      }],
      restrictions: [{
        geoRestriction: [{
          restrictionType: "none"
        }]
      }], 
      // HTTPS activation is a two-step process because
      // ACM certificates need to be "issued" 
      // before attaching to a Cloudfront distribution
      viewerCertificate: [props.enableHTTPS ? {
        acmCertificateArn: Token.asString(props.ACMCertificate.id),
        sslSupportMethod: "sni-only"
      } : {
        cloudfrontDefaultCertificate: true
      }],
      dependsOn: [
        props.websiteS3Bucket
      ]
    })

    this.cloudfrontDistrib = cloudfrontDistribution
  }
}

export default CDNConstruct
