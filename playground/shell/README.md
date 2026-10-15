# Shell playground

Run this self-contained Bash tour from the repository root:

```sh
bash playground/shell/main.sh
```

Requires Bash and common Unix tools (`mktemp`, `sort`, `uniq`, `find`, `wc`). It demonstrates quoting, environment variables, redirects, pipes, conditions, and loops. It writes only to a temporary directory and removes it on exit. The terminal catalog targets Bash/Zsh-style commands; this executable tour specifically uses Bash.

## AWS CLI offline tour

With [AWS CLI v2 installed](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), run:

```sh
bash playground/shell/aws.sh
```

This parses options and generates input templates for 14 representative service commands with `--generate-cli-skeleton input`, then runs a JMESPath projection on generated EC2 sample output. It uses dummy credentials, empty configuration files and a loopback-only endpoint. It requires no account and makes no AWS API calls. Input template generation checks command/option availability, not parameter semantics, IAM permissions, resource existence, real service responses or every example. Verified with AWS CLI **2.38.1**; generated skeletons can change between versions. Only the EC2 example uses an output skeleton because some other CLI v2.38.1 generated responses fail their own model constraints.

The catalog targets AWS CLI v2 with Bash/Zsh quoting. Live service examples require your own authenticated profile, permissions, region and resources; sample names and account IDs must be replaced. SSO needs IAM Identity Center setup; ECR login needs Docker; SSM sessions need the Session Manager plugin; kubectl is separate from the EKS CLI. Examples explain writes and sensitive output; S3 sync/upload and CloudFormation/EKS changes start with preview flags where supported.

## Manual extension test

1. Install the integration VSIX, reload VS Code, close the old terminal, and create a new **Zsh** integrated terminal so the live hook loads.
2. Open Syntaxiser's Context tab. Type `git` and pause without Enter: only Git examples and up to two Git quick references should appear.
3. Add ` diff` and pause: Git status/diff should lead. Clear the line with Ctrl-U: general terminal examples should return.
4. Type `cargo test` or `go test` without executing: matching tool examples should lead. These tools are not needed for this typing test.
5. Run `bash playground/shell/main.sh`. It should print sorted fruit, the temporary file, a count of three lines, and a completion message.
6. Search `TypeScript`, browse the Terminal reference, and pin an example. Move the cursor in a Rust or Go file: editor suggestions should resume while the pin remains.
7. In a terminal without the Zsh hook, execute `git --version` with VS Code shell integration enabled: executed-command suggestions should still work. Other shells currently do not have live input suggestions.

The live hook reports recognized tool/subcommand cues only; arguments and raw input are not written. A focus-only return to an already selected terminal may need **Syntaxiser: Use Active Terminal Context**.

## Manual AWS extension test (no account needed)

1. In a new Zsh terminal, type `aws` without Enter: AWS command/help content should appear.
2. Type `aws s3 sync ./dist/ s3://example/ --dryrun` without Enter: the sync preview and S3 sync overview should lead. Change to `aws logs tail` or `aws lambda invoke`: the matching service should lead.
3. Type `aws --profile private --region ap-southeast-2 ec2 describe-instances` without Enter: EC2 inventory should lead. Profile/region values and resource arguments are discarded from contextual cues.
4. Search `SSO login`, `S3 backup`, `JMESPath`, `AWS pagination`, `partition key`, `aws ecr`, and `aws secretsmanager`. Check practical examples and separately authored overviews.
5. Browse Reference → **AWS CLI: setup and data** and **AWS CLI: common services**. Open S3 sync, DynamoDB and Lambda overviews, then pin a practical AWS example and switch to an editor.
6. Run the offline tour above with shell integration enabled. It must finish without credentials or cloud access. In a Bash terminal, `aws --version` should also select AWS help content after execution.
7. In a shell-script editor, place the cursor on `aws dynamodb query --table-name example` and then `aws ssm get-parameter --name /private`. The correct service examples should lead.
