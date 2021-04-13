resource "aws_lb_listener_rule" "service" {
  listener_arn = data.aws_lb_listener.service-listener.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.service.arn
  }

  condition {
    path_pattern {
      values = [join("", [var.base_path, "/*"])]
    }
  }
}

resource "aws_lb_target_group" "service" {
  name        = "${var.service}-${var.environment}"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.vpc.id
  target_type = "ip"

  health_check {
    healthy_threshold   = "3"
    interval            = "30"
    protocol            = "HTTP"
    matcher             = "200"
    timeout             = "3"
    path                = join("", [var.base_path, var.health_check_path])
    unhealthy_threshold = "2"
  }
}