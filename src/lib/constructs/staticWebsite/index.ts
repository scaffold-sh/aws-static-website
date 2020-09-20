import { Construct } from "constructs"
import { TerraformProvider } from "cdktf"

import { S3Bucket, CloudfrontDistribution } from "../../../imports/providers/aws"
import SSLConstruct from "./ssl"

import BucketConstruct from "./bucket"
import CDNConstruct from "./cdn"

export interface StaticWebsiteConstructProps {
  resourceNamesPrefix: string,
  domainNames: string[],
  hasBuildCommand: boolean,
  AWSUSEast1Provider: TerraformProvider,
  enableHTTPS: boolean
}

export interface DNSRecord {
  name: string,
  type: string,
  value: string
}

class StaticWebsiteConstruct extends Construct {
  readonly websiteS3Bucket: S3Bucket
  readonly url: string

  readonly SSLValidationDNSRecords: DNSRecord[]
  readonly cloudfrontDistrib: CloudfrontDistribution

  constructor(scope: Construct, name: string, props: StaticWebsiteConstructProps) {
    super(scope, name)

    if (!props.domainNames.length) {
      throw new Error("You must specify at least one domain name")
    }

    const ssl = new SSLConstruct(this, "ssl", {
      resourceNamesPrefix: props.resourceNamesPrefix,
      domainNames: props.domainNames,
      AWSUSEast1Provider: props.AWSUSEast1Provider
    })

    const bucket = new BucketConstruct(this, "bucket", {
      resourceNamesPrefix: props.resourceNamesPrefix,
      hasBuildCommand: props.hasBuildCommand
    })

    this.websiteS3Bucket = bucket.S3Bucket

    const cdn = new CDNConstruct(this, "cdn", {
      websiteS3Bucket: this.websiteS3Bucket,
      ACMCertificate: ssl.ACMCertificate,
      domainNames: props.domainNames,
      resourceNamesPrefix: props.resourceNamesPrefix,
      hasBuildCommand: props.hasBuildCommand,
      enableHTTPS: props.enableHTTPS
    })

    this.cloudfrontDistrib = cdn.cloudfrontDistrib

    this.url = `https://${this.cloudfrontDistrib.domainName}` 

    this.SSLValidationDNSRecords = ssl.validationDNS
  }
}

export default StaticWebsiteConstruct
