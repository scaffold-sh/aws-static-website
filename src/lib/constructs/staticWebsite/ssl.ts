import { Construct } from "constructs"
import { TerraformProvider } from "cdktf"

import { AcmCertificate } from "../../../imports/providers/aws"
import { DNSRecord } from "."

export interface SSLConstructProps {
  resourceNamesPrefix: string,
  domainNames: string[],
  AWSUSEast1Provider: TerraformProvider
}

class SSLConstruct extends Construct {
  readonly validationDNS: DNSRecord[]
  readonly ACMCertificate: AcmCertificate

  constructor(scope: Construct, name: string, props: SSLConstructProps) {
    super(scope, name)

    if (!props.domainNames.length) {
      throw new Error("You must specify at least one domain name")
    }

    this.ACMCertificate = new AcmCertificate(this, "website_certificate", {
      provider: props.AWSUSEast1Provider,
      domainName: props.domainNames[0],
      subjectAlternativeNames: props.domainNames.slice(1),
      validationMethod: "DNS",
      tags: {
        Name: `${props.resourceNamesPrefix}_acm_certificate`
      },
      lifecycle: {
        createBeforeDestroy: true
      }
    })

    this.validationDNS = props.domainNames.map((_, index) => {
      const certificateResource = [
        this.ACMCertificate.terraformResourceType,
        this.ACMCertificate.friendlyUniqueId,
        "domain_validation_options"
      ].join(".")

      // Raw Terraform.
      // Dirty fix while waiting for the CDKTF 
      // to support AWS provider 3.0+ version.
      return {
        name: "${tolist(" + certificateResource + ")[" + index + "].resource_record_name}",
        type: "${tolist(" + certificateResource + ")[" + index + "].resource_record_type}",
        value: "${tolist(" + certificateResource + ")[" + index + "].resource_record_value}"
      }
    })
  }
}

export default SSLConstruct
