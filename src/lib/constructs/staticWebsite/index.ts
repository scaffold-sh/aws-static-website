import { Construct } from "constructs"
import { TerraformProvider } from "cdktf"

import { CloudfrontDistribution, S3Bucket, SsmParameter } from "../../../imports/providers/aws"
import SslConstruct from "./ssl"

import BucketConstruct from "./bucket"
import CdnConstruct from "./cdn"

import { EnvironmentVariables } from "../../../main"
import EnvironmentVariablesConstruct from "./environmentVariables"

/**
 * Represents the properties of the static website construct.
 * @property awsUsEast1Provider The AWS US East 1 provider required to create ACM certificates for CloudFront.
 * @property buildsEnvironmentVariables The environment variables of your builds as "key => value" format.
 * @property domainNames The domain names that need to be covered by the ACM certificate.
 * @property enableHttps Do HTTPS needs to be enabled?
 * @property hasBuildCommand Do your website has a build command?
 * @property resourceNamesPrefix An unique custom prefix used to avoid name colision with existing resources.
 */
export interface IStaticWebsiteConstructProps {
  awsUsEast1Provider: TerraformProvider;
  buildsEnvironmentVariables: EnvironmentVariables;
  domainNames: string[];
  enableHttps: boolean;
  hasBuildCommand: boolean;
  resourceNamesPrefix: string;
}

/**
 * Represents a DNS record.
 * @property name The name of the DNS record.
 * @property type The type of the DNS record.
 * @property value The value of the DNS record.
 */
export interface IDnsRecord {
  name: string;
  type: string;
  value: string;
}

/**
 * Represents the components required to host a static website on AWS.
 * @class
 * @extends Construct
 */
class StaticWebsiteConstruct extends Construct {
  /**
   * The builds environment variables as SSM parameters.
   */
  readonly buildsEnvironmentVariables: SsmParameter[]

  /**
   * The CloudFront distribution used for your website.
   */
  readonly cloudfrontDistribution: CloudfrontDistribution

  /**
   * The DNS records that you need to set to validate your ACM certificate.
   */
  readonly sslValidationDnsRecords: IDnsRecord[]

  /**
   * The S3 bucket containing your website source code.
   */
  readonly websiteS3Bucket: S3Bucket

  /**
   * Creates a static website construct.
   * @param scope The scope to attach the static website construct to.
   * @param id An unique id used to distinguish constructs.
   * @param props The static website construct properties.
   */
  constructor(scope: Construct, id: string, props: IStaticWebsiteConstructProps) {
    super(scope, id)

    if (props.domainNames.length === 0) {
      throw new Error("You must specify at least one domain name")
    }

    const environmentVariables = new EnvironmentVariablesConstruct(this, "environment_variables", {
      buildsEnvironmentVariables: props.buildsEnvironmentVariables,
      resourceNamesPrefix: props.resourceNamesPrefix,
    })

    this.buildsEnvironmentVariables = environmentVariables.buildsEnvironmentVariables

    const ssl = new SslConstruct(this, "ssl", {
      resourceNamesPrefix: props.resourceNamesPrefix,
      domainNames: props.domainNames,
      awsUsEast1Provider: props.awsUsEast1Provider,
    })

    this.sslValidationDnsRecords = ssl.validationDns

    const bucket = new BucketConstruct(this, "bucket", {
      resourceNamesPrefix: props.resourceNamesPrefix,
      hasBuildCommand: props.hasBuildCommand,
    })

    this.websiteS3Bucket = bucket.S3Bucket

    const cdn = new CdnConstruct(this, "cdn", {
      websiteS3Bucket: this.websiteS3Bucket,
      acmCertificate: ssl.acmCertificate,
      domainNames: props.domainNames,
      resourceNamesPrefix: props.resourceNamesPrefix,
      hasBuildCommand: props.hasBuildCommand,
      enableHttps: props.enableHttps,
    })

    this.cloudfrontDistribution = cdn.cloudfrontDistribution
  }
}

export default StaticWebsiteConstruct
