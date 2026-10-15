#!/usr/bin/env bash
# Parse command options and generate templates/sample output locally with CLI v2.
set -euo pipefail
aws --version
case "$(aws --version 2>&1)" in
  aws-cli/2.*) ;;
  *) printf 'This tour requires AWS CLI v2.\n' >&2; exit 1 ;;
esac

# Isolate the tour from real profiles, credential helpers and cloud endpoints.
export AWS_CONFIG_FILE=/dev/null AWS_SHARED_CREDENTIALS_FILE=/dev/null
export AWS_ACCESS_KEY_ID=offline AWS_SECRET_ACCESS_KEY=offline AWS_SESSION_TOKEN=offline
export AWS_EC2_METADATA_DISABLED=true AWS_DEFAULT_REGION=us-east-1 AWS_PAGER=''
export AWS_IGNORE_CONFIGURED_ENDPOINT_URLS=true
unset AWS_PROFILE AWS_DEFAULT_PROFILE

preview() {
  printf '\nOffline model: aws %s\n' "$*"
  aws "$@" --region us-east-1 --endpoint-url http://127.0.0.1:9 \
    --no-sign-request --no-cli-pager --generate-cli-skeleton input > /dev/null
}

preview sts get-caller-identity
preview ec2 describe-instances --filters Name=instance-state-name,Values=running
preview iam get-role --role-name example-app-role
preview s3api head-object --bucket example-build-artifacts --key releases/app.zip
preview logs filter-log-events --log-group-name /aws/lambda/example-handler --filter-pattern '"ERROR"'
preview lambda get-function-configuration --function-name example-handler
preview cloudformation describe-stacks --stack-name example-app-dev
preview ssm get-parameter --name /example/dev/api-base-url
preview secretsmanager describe-secret --secret-id example/dev/database
preview ecr describe-images --repository-name example-app
preview ecs describe-services --cluster example-dev --services example-api
preview eks describe-cluster --name example-dev
preview cloudwatch describe-alarms --state-value ALARM
preview dynamodb get-item --table-name example-orders --key '{"PK":{"S":"ORDER#123"},"SK":{"S":"META"}}'

printf '\nJMESPath on generated EC2 sample data (not your account):\n'
aws ec2 describe-instances --region us-east-1 --endpoint-url http://127.0.0.1:9 \
  --no-sign-request --generate-cli-skeleton output \
  --query 'Reservations[].Instances[].{Id:InstanceId,Type:InstanceType}' --output table --no-cli-pager
printf '\nOffline tour complete. No AWS resources were accessed.\n'
