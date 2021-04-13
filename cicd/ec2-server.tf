# resource "aws_key_pair" "ssh-key-pair" {
#   key_name   = local.ssh_key_name
#   public_key = file("~/.ssh/${local.ssh_key_name}.pub")
# }

# resource "aws_lb_listener" "ec2_listener" {
#   load_balancer_arn = data.aws_lb.services_alb.arn
#   port              = "80"
#   protocol          = "HTTP"

#   # default_action {
#   #   type = "fixed-response"

#   #   fixed_response {
#   #     content_type = "text/plain"
#   #     message_body = "Fixed response content"
#   #     status_code  = "200"
#   #   }
#   # }

#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.alb_tg_ec2_80.arn
#   }
# }

# # resource "aws_lb_listener_rule" "ec2_rule" {
# #   listener_arn = aws_lb_listener.ec2_listener.arn
# #   priority     = 100

# #   action {
# #     type             = "forward"
# #     target_group_arn = aws_lb_target_group.alb_tg_ec2_80.arn
# #   }

# #   condition {
# #     path_pattern {
# #       values = ["/testing/*"]
# #     }
# #   }
# # }

# resource "aws_lb_target_group" "alb_tg_ec2_80" {
#   port        = "80"
#   protocol    = "HTTP"
#   target_type = "instance"
#   vpc_id      = data.aws_vpc.vpc.id

#   tags = {
#     Name = "${var.alb_name}_tg_ec2_80"
#   }

#   lifecycle {
#     create_before_destroy = true
#   }

# }

# resource "aws_lb_target_group_attachment" "test" {
#   target_group_arn = aws_lb_target_group.alb_tg_ec2_80.arn
#   target_id        = aws_instance.webserver.id
#   port             = 80
# }

# resource "aws_instance" "webserver" {
#   ami           = local.amazon_linux_aim
#   instance_type = "t2.micro"
#   subnet_id     = tolist(data.aws_subnet_ids.public_subnet_az1.ids)[0]

#   vpc_security_group_ids = [data.aws_security_group.ec2_sg.id]

#   key_name = local.ssh_key_name

#   user_data = <<-EOF
#               #!/bin/bash
#               sudo yum install -y httpd
#               sudo systemctl start httpd
#               EOF
# }

# resource "aws_cloudwatch_metric_alarm" "nlb_healthyhosts" {
#   alarm_name          = "webserver_health_alarm"
#   comparison_operator = "LessThanThreshold"
#   evaluation_periods  = "1"
#   metric_name         = "HealthyHostCount"
#   namespace           = "AWS/ApplicationELB"
#   period              = "60"
#   statistic           = "Minimum"
#   threshold           = "1"
#   alarm_description   = "Number of healthy nodes in Target Group"
#   actions_enabled     = "true"
#   alarm_actions       = ["arn:aws:sns:${var.aws_region}:${var.aws_devops_account}:dev-ops-sns"]
#   ok_actions          = ["arn:aws:sns:${var.aws_region}:${var.aws_devops_account}:dev-ops-sns"]
#   dimensions = {
#     TargetGroup  = aws_lb_target_group.alb_tg_ec2_80.arn_suffix
#     LoadBalancer = data.aws_lb.services_alb.arn_suffix
#   }

#   tags = {
#     type = "alarm"
#     application = "ec2_webserver"
#   }
# }