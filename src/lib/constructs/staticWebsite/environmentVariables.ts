import { Construct } from "constructs"

import {
  SsmParameter,
} from "../../../imports/providers/aws"

import { EnvironmentVariables } from "../../../main"
import escapeTemplateForTerraform from "../../../utils/escapeTemplateForTerraform"

/**
 * Represents the properties of the environment variables construct.
 * @property buildsEnvironmentVariables The environment variables of your builds as "key => value" format.
 * @property resourceNamesPrefix An unique custom prefix used to avoid name colision with existing resources.
 */
export interface IEnvironmentVariablesProps {
  buildsEnvironmentVariables: EnvironmentVariables;
  resourceNamesPrefix: string;
}

/**
 * Represents the SSM parameters that will store the
 * environment variables of your builds.
 * @class
 * @extends Construct
 */
export class EnvironmentVariablesConstruct extends Construct {
  /**
   * The builds SSM parameters.
   */
  readonly buildsEnvironmentVariables: SsmParameter[]

  /**
   * Creates an environment variables construct.
   * @param scope The scope to attach the environment variables construct to.
   * @param id An unique id used to distinguish constructs.
   * @param props The environment variables construct properties.
   */
  constructor(scope: Construct, id: string, props: IEnvironmentVariablesProps) {
    super(scope, id)

    this.buildsEnvironmentVariables = []

    Object.keys(props.buildsEnvironmentVariables).forEach(environmentVariableName => {
      this.buildsEnvironmentVariables.push(new SsmParameter(this, `ssm_parameter_builds_${environmentVariableName.toLowerCase()}`, {
        // <!> Must match build role IAM policy ressources
        name: `/${props.resourceNamesPrefix}/builds-env/${environmentVariableName}`,
        type: "SecureString",
        value: escapeTemplateForTerraform(props.buildsEnvironmentVariables[environmentVariableName]),
        // <!> Used in builds project to
        // access environment variable name
        tags: {
          name: environmentVariableName,
        },
      }))
    })
  }
}

export default EnvironmentVariablesConstruct
