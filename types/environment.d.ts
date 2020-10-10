declare global {
  namespace NodeJS {
    /**
     * Represents the environment variables of your infrastructure.
     * @property BUILD_COMMAND The command that needs to be run to build your website.
     * @property BUILD_OUTPUT_DIR The directory where the build command output your website.
     * @property DOMAIN_NAMES The domain names that need to be covered by your ACM certificate.
     * @property ENABLE_HTTPS Do HTTPS needs to be enabled?
     * @property GITHUB_BRANCH The branch from which you want to deploy.
     * @property GITHUB_OAUTH_TOKEN The GitHub OAuth token that will be used by CodePipeline to pull your source code from your repository.
     * @property GITHUB_REPO The GitHub repository that contains your source code.
     * @property GITHUB_REPO_OWNER The owner of your GitHub repository. Can be a regular user or an organization.
     * @property GITHUB_WEBHOOK_TOKEN A random token that will be used by CodePipeline and GitHub to prevent impersonation.
     * @property NODE_ENV The current loaded environment.
     * @property SCAFFOLD_AWS_PROFILE The AWS named profile used to create your infrastructure.
     * @property SCAFFOLD_AWS_REGION The AWS region where you want to create your infrastructure.
     * @property SCAFFOLD_AWS_S3_BACKEND_BUCKET The AWS S3 bucket that will contain the Terraform state of your infrastructure.
     * @property SCAFFOLD_AWS_S3_BACKEND_DYNAMODB_TABLE The AWS DynamoDB table that will be used to store the Terraform state locks.
     * @property SCAFFOLD_AWS_S3_BACKEND_KEY The S3 bucket key under which your Terraform state will be saved.
     * @property SCAFFOLD_RESOURCE_NAMES_PREFIX An unique custom prefix used to avoid name colision with existing resources.
     */
    // eslint-disable-next-line @typescript-eslint/interface-name-prefix
    interface ProcessEnv {
      BUILD_COMMAND: string;
      BUILD_OUTPUT_DIR: string;
      DOMAIN_NAMES: string;
      ENABLE_HTTPS: string;
      GITHUB_BRANCH: string;
      GITHUB_OAUTH_TOKEN: string;
      GITHUB_REPO: string;
      GITHUB_REPO_OWNER: string;
      GITHUB_WEBHOOK_TOKEN: string;
      NODE_ENV: string;
      SCAFFOLD_AWS_PROFILE: string;
      SCAFFOLD_AWS_REGION: string;
      SCAFFOLD_AWS_S3_BACKEND_BUCKET: string;
      SCAFFOLD_AWS_S3_BACKEND_DYNAMODB_TABLE: string;
      SCAFFOLD_AWS_S3_BACKEND_KEY: string;
      SCAFFOLD_RESOURCE_NAMES_PREFIX: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
