# Spring Application with AWS Deployments


## Introduction

This project is to learn how to deploy an application ( deosn't have to be spring boot ) to AWS. It relies on the infrastructure that is created in this project [AWS Infrastructure Learning](https://github.com/markzi/aws-infrastructure-learning)

### Setup

* Lookups resources created from this project [AWS Infrastructure Learning](https://github.com/markzi/aws-infrastructure-learning)
* Auto scaling ECS Service

### TODO

* Jenkins CICD
* CodeDeploy Application
  * Blue/Green
  * Canary
* Shared ECR 

## Useful commands

* build and push local docker image to ECR
```
docker build -t spring-boot-cloud-deployment-learning .
docker tag spring-boot-cloud-deployment-learning:latest <aws account number>.dkr.ecr.eu-west-2.amazonaws.com/spring-boot-cloud-deployment-learning:latest
aws --profile <aws profile> ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin <aws account number>.dkr.ecr.eu-west-2.amazonaws.com
docker push <aws account number>.dkr.ecr.eu-west-2.amazonaws.com/spring-boot-cloud-deployment-learning:latest
```

Format the files
```
terraform fmt
```

Validate
```
terraform validate
```

Plan
```
terraform plan --out default.plan -var-file="development.tfvars"
```

Apply
```
terraform apply "default.plan"
```

Destroy
```
terraform destroy -var-file="development.tfvars"
```
