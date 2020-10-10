import { Construct } from "constructs"
import { Token } from "cdktf"

import {
  AcmCertificate,
  CloudfrontDistribution,
  S3Bucket,
} from "../../../imports/providers/aws"

/**
 * Represents the properties of the CDN construct.
 * @property acmCertificate The ACM certificate created for your website.
 * @property domainNames The domain names covered by the ACM certificate.
 * @property enableHttps Do HTTPS needs to be enabled?
 * @property hasBuildCommand Do your website has a build command?
 * @property resourceNamesPrefix An unique custom prefix used to avoid name colision with existing resources.
 * @property websiteS3Bucket The S3 bucket containing your website source code.
 */
export interface ICdnConstructProps {
  acmCertificate: AcmCertificate;
  domainNames: string[];
  enableHttps: boolean;
  hasBuildCommand: boolean;
  resourceNamesPrefix: string;
  websiteS3Bucket: S3Bucket;
}

/**
 * Represents the CloudFront distribution used as CDN for your website.
 * @class
 * @extends Construct
 */
class CdnConstruct extends Construct {
  /**
   * The CloudFront distribution created for your website.
   */
  readonly cloudfrontDistribution: CloudfrontDistribution

  /**
   * Creates a CDN construct.
   * @param scope The scope to attach the CDN construct to.
   * @param id An unique id used to distinguish constructs.
   * @param props The CDN construct properties.
   */
  constructor(scope: Construct, id: string, props: ICdnConstructProps) {
    super(scope, id)

    const websiteOriginID = props.resourceNamesPrefix

    const cloudfrontDistribution = new CloudfrontDistribution(this, "cloudfront_distribution", {
      enabled: true,
      defaultRootObject: "index.html",
      aliases: props.enableHttps ? props.domainNames : undefined,
      origin: [{
        domainName: props.websiteS3Bucket.bucketRegionalDomainName,
        originId: websiteOriginID,
      }],
      customErrorResponse: [{
        // If the routing is managed by a SPA framework
        // all paths must be forwarded to "index.html".
        // If the object isn’t in the bucket, S3 returns a 403 error.
        // Must match "errorDocument" website bucket property.
        errorCode: 403,
        responseCode: props.hasBuildCommand ? 200 : 403,
        responsePagePath: props.hasBuildCommand ? "/index.html" : "/error.html",
      }],
      defaultCacheBehavior: [{
        targetOriginId: websiteOriginID,
        allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        cachedMethods: ["GET", "HEAD"],
        viewerProtocolPolicy: "redirect-to-https",
        forwardedValues: [{
          queryString: false,
          cookies: [{
            forward: "none",
          }],
        }],
      }],
      restrictions: [{
        geoRestriction: [{
          restrictionType: "none",
        }],
      }],
      // HTTPS activation is a two-step process because
      // ACM certificates need to be "issued"
      // before attaching to a Cloudfront distribution
      viewerCertificate: [props.enableHttps ? {
        acmCertificateArn: Token.asString(props.acmCertificate.id),
        sslSupportMethod: "sni-only",
      } : {
        cloudfrontDefaultCertificate: true,
      }],
      dependsOn: [
        props.websiteS3Bucket,
      ],
    })

    this.cloudfrontDistribution = cloudfrontDistribution
  }
}

export default CdnConstruct
