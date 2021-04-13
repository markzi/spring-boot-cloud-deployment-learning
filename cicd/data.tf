
data "aws_vpc" "vpc" {
  tags = {
    Name        = var.environment
    Environment = var.environment
  }
}

data "aws_lb" "services_alb" {
  name = "services-alb"
}

data "aws_subnet_ids" "private_subnets" {
  vpc_id = data.aws_vpc.vpc.id

  tags = {
    Type = "${var.environment}_private_subnet"
  }
}

output "aws_subnets_ids_private_subnets" {
  value = data.aws_subnet_ids.private_subnets
}

data "aws_security_group" "alb-security-group" {
  tags = {
    Application = "ecs"
  }
}

output "aws_security_group_alb-security-group" {
  value = data.aws_security_group.alb-security-group
}

data "aws_lb" "service" {
  tags = {
    Name        = "alb"
    Type        = "public"
    Environment = var.environment
  }
}

data "aws_lb_listener" "service-listener" {
  load_balancer_arn = data.aws_lb.service.arn
  port              = 8080
}