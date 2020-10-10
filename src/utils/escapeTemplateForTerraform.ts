/**
 * Escapes template to use with Terraform.
 * @param template The template that you want to escape.
 *
 * @returns The escaped template.
 */
const escapeTemplateForTerraform = (template: string) => {
  return template.replace(/\$\{/gi, "$$${")
}

export default escapeTemplateForTerraform
