variable "environment" {
  description = "A name to describe the environment we're creating."
}

variable "service" {
  description = "A name to describe the service of this application ( application name )."
}

variable "aws_profile" {
  description = "The AWS-CLI profile for the account to create resources in."
}
variable "aws_region" {
  description = "The AWS region to create resources in."
}

variable "aws_devops_account" {
  type        = string
  description = "The AWS devops account number"
}

variable "availability_zones" {
  description = "The AWS availability zones to create subnets in."
  type        = list(any)
}
variable "container_port" {
  type        = number
  description = "The port the application runs on"
}

variable "container_image" {
  type        = string
  description = "The port the application runs on"
}

variable "base_path" {
  type        = string
  description = "The base path the application is served from"
}
variable "health_check_path" {
  type        = string
  description = "The path to the health check exposed by the application"
}

# Application configuration | variables-app.tf
# variable "app_name" {
#   type        = string
#   description = "Application name"
#   default     = "spring-boot-cloud-deployment-learning"
# }
# variable "app_environment" {
#   type        = string
#   description = "Application environment"
# }

# # ECS cluster variables
# variable "cluster_runner_type" {
#   type        = string
#   description = "EC2 instance type of ECS Cluster Runner"
#   default     = "t2.micro"
# }
# variable "cluster_runner_count" {
#   type        = string
#   description = "Number of EC2 instances for ECS Cluster Runner"
#   default     = "1"
# }

# variable "alb_name" {
#   default = "services-alb"
# }

# variable "service_name" {
#   default = "spring-boot-cloud-deployment-learning"
# }

# variable "cluster_name" {
#   default = "spring-boot-cloud-deployment-learning"
# }

# variable "domain_prefix" {
# }

# variable "wait_time" {
#   default = 5
# }

# variable "desired_task_number" {
#   default = 1
# }

# variable "docker_container_port" {
#   default = 8080
# }

# variable "cpu" {
#   default = 256
# }

# variable "memoryHardLimit" {
#   default = 512
# }

# variable "memorySoftLimit" {
#   default = 400
# }

# variable "max_task_number" {
#   default = 2
# }

# variable "min_task_number" {
#   default = 1
# }