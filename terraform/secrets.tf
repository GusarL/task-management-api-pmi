resource "aws_secretsmanager_secret" "app_config" {
  name = "app/config"
}

resource "random_password" "jwt_secret" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret_version" "app_config_version" {
  secret_id = aws_secretsmanager_secret.app_config.id
  secret_string = jsonencode({
    DYNAMODB_USERS_TABLE = aws_dynamodb_table.users.name,
    DYNAMODB_TASKS_TABLE = aws_dynamodb_table.tasks.name,
    JWT_SECRET           = random_password.jwt_secret.result
  })
}