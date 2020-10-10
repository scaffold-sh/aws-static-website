import { Construct } from "constructs"
import { TerraformProvider } from "cdktf"

import { AcmCertificate } from "../../../imports/providers/aws"
import { IDnsRecord } from "."

/**
 * Represents the properties of the SSL construct.
 * @property awsUsEast1Provider The AWS US East 1 provider required to create ACM certificates for CloudFront.
 * @property domainNames The domain names that need to be covered by the ACM certificate.
 * @property resourceNamesPrefix An unique custom prefix used to avoid name colision with existing resources.
 */
export interface ISslConstructProps {
  awsUsEast1Provider: TerraformProvider;
  domainNames: string[];
  resourceNamesPrefix: string;
}

/**
 * Represents the ACM certificate used to add SSL to your website.
 * @class
 * @extends Construct
 */
class SslConstruct extends Construct {
  /**
   * The ACM certificate created for your website.
   */
  readonly acmCertificate: AcmCertificate

  /**
   * The DNS records that you need to set to validate your ACM certificate.
   */
  readonly validationDns: IDnsRecord[]

  /**
   * Creates a SSL construct.
   * @param scope The scope to attach the SSL construct to.
   * @param id An unique id used to distinguish constructs.
   * @param props The SSL construct properties.
   */
  constructor(scope: Construct, id: string, props: ISslConstructProps) {
    super(scope, id)

    if (props.domainNames.length === 0) {
      throw new Error("You must specify at least one domain name")
    }

    this.acmCertificate = new AcmCertificate(this, "acm_certificate", {
      provider: props.awsUsEast1Provider,
      domainName: props.domainNames[0],
      subjectAlternativeNames: props.domainNames.slice(1),
      validationMethod: "DNS",
      tags: {
        Name: `${props.resourceNamesPrefix}_acm_certificate`,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    })

    this.validationDns = props.domainNames.map((_, index) => {
      // Raw Terraform while waiting for the CDKTF to support complex types
      return {
        name: `\${tolist(${this.acmCertificate.fqn}.domain_validation_options)["${index}"].resource_record_name}`,
        type: `\${tolist(${this.acmCertificate.fqn}.domain_validation_options)["${index}"].resource_record_type}`,
        value: `\${tolist(${this.acmCertificate.fqn}.domain_validation_options)["${index}"].resource_record_value}`,
      }
    })
  }
}

export default SslConstruct
