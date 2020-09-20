declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string,
      SCAFFOLD_RESOURCE_NAMES_PREFIX: string,
      DOMAIN_NAMES: string,
      ENABLE_HTTPS: string,
      BUILD_COMMAND: string,
      BUILD_OUTPUT_DIR: string,
      GITHUB_REPO_OWNER: string,
      GITHUB_REPO: string,
      GITHUB_BRANCH: string,
      GITHUB_OAUTH_TOKEN: string,
      GITHUB_WEBHOOK_TOKEN: string,
      SCAFFOLD_AWS_REGION: string,
      SCAFFOLD_AWS_PROFILE: string,
      SCAFFOLD_AWS_S3_BACKEND_KEY: string,
      SCAFFOLD_AWS_S3_BACKEND_BUCKET: string,
      SCAFFOLD_AWS_S3_BACKEND_DYNAMODB_TABLE: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
