# Common IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_role" {
  name = "lambda_common_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Common Policy for Secrets Manager Access
resource "aws_iam_role_policy" "lambda_secrets_manager_access" {
  name   = "lambda_secrets_manager_access"
  role   = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach AWSLambdaBasicExecutionRole to the common IAM role
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  for_each = toset([
    aws_lambda_function.jwt_authorizer.function_name,
    aws_lambda_function.login_lambda.function_name,
    aws_lambda_function.registration_lambda.function_name,
    aws_lambda_function.api.function_name
  ])
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Authorizer lambda
data "archive_file" "authorizer_zip" {
  type        = "zip"
  source_dir  = "../dist/lambdas/authorizer"
  output_path = "../dist/authorizer.zip"
}

resource "aws_s3_object" "authorizer_lambda_s3" {
  bucket = aws_s3_bucket.lambda_bucket.id
  key    = "authorizer.zip"
  source = data.archive_file.authorizer_zip.output_path
}

resource "aws_lambda_function" "jwt_authorizer" {
  function_name    = "jwtAuthorizer"
  handler          = "authorizer.jwtAuthorizer"
  runtime          = "nodejs20.x"
  role             = aws_iam_role.lambda_role.arn
  s3_bucket        = aws_s3_bucket.lambda_bucket.id
  s3_key           = aws_s3_object.authorizer_lambda_s3.key
  source_code_hash = data.archive_file.authorizer_zip.output_base64sha256

  environment {
    variables = {
      SECRET_ARN       = aws_secretsmanager_secret.app_config.arn
    }
  }
}

# Login lambda
data "archive_file" "login_zip" {
  type        = "zip"
  source_dir  = "../dist/lambdas/login"
  output_path = "../dist/login.zip"
}

resource "aws_s3_object" "login_lambda_s3" {
  bucket = aws_s3_bucket.lambda_bucket.id
  key    = "login.zip"
  source = data.archive_file.login_zip.output_path
}

resource "aws_lambda_function" "login_lambda" {
  function_name    = "login"
  handler          = "login.loginHandler"
  runtime          = "nodejs20.x"
  role             = aws_iam_role.lambda_role.arn
  s3_bucket        = aws_s3_bucket.lambda_bucket.id
  s3_key           = aws_s3_object.login_lambda_s3.key
  source_code_hash = data.archive_file.login_zip.output_base64sha256

  environment {
    variables = {
      SECRET_ARN       = aws_secretsmanager_secret.app_config.arn
    }
  }

  layers = [
    aws_lambda_layer_version.common_layer.arn
  ]
}

# Custom IAM policy for Login Lambda
resource "aws_iam_role_policy" "login_lambda_custom_policy" {
  name = "loginLambdaCustomPolicy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "execute-api:Invoke"
        ]
        Resource = "*"
      }
    ]
  })
}

# Registration lambda
data "archive_file" "registration_zip" {
  type        = "zip"
  source_dir  = "../dist/lambdas/registration"
  output_path = "../dist/registration.zip"
}

resource "aws_s3_object" "registration_lambda_s3" {
  bucket = aws_s3_bucket.lambda_bucket.id
  key    = "registration.zip"
  source = data.archive_file.registration_zip.output_path
}

resource "aws_lambda_function" "registration_lambda" {
  function_name    = "registration"
  handler          = "registration.registerUserHandler"
  runtime          = "nodejs20.x"
  role             = aws_iam_role.lambda_role.arn
  s3_bucket        = aws_s3_bucket.lambda_bucket.id
  s3_key           = aws_s3_object.registration_lambda_s3.key
  source_code_hash = data.archive_file.registration_zip.output_base64sha256

  environment {
    variables = {
      SECRET_ARN       = aws_secretsmanager_secret.app_config.arn
    }
  }

  layers = [
    aws_lambda_layer_version.common_layer.arn
  ]
}

# Custom IAM policy for Registration Lambda
resource "aws_iam_role_policy" "registration_lambda_custom_policy" {
  name = "registrationLambdaCustomPolicy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "*"
      }
    ]
  })
}

# API lambda
data "archive_file" "api_zip" {
  type        = "zip"
  source_dir  = "../dist/lambdas/api"
  output_path = "../dist/api.zip"
}

resource "aws_s3_object" "api_lambda_s3" {
  bucket = aws_s3_bucket.lambda_bucket.id
  key    = "api.zip"
  source = data.archive_file.api_zip.output_path
}

resource "aws_lambda_function" "api" {
  function_name    = "api"
  handler          = "api.apiHandler"
  runtime          = "nodejs20.x"
  role             = aws_iam_role.lambda_role.arn
  memory_size      = 128
  timeout          = 30
  s3_bucket        = aws_s3_bucket.lambda_bucket.id
  s3_key           = aws_s3_object.api_lambda_s3.key
  source_code_hash = data.archive_file.api_zip.output_base64sha256

  environment {
    variables = {
      SECRET_ARN       = aws_secretsmanager_secret.app_config.arn
    }
  }

  layers = [
    aws_lambda_layer_version.common_layer.arn
  ]
}

# Custom IAM policy for API Lambda
resource "aws_iam_policy" "lambda_exec_policy" {
  name = "lambda_exec_policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "dynamodb:*"
        ],
        Resource = [
          aws_dynamodb_table.users.arn,
          aws_dynamodb_table.tasks.arn
        ]
      },
      {
        Effect   = "Allow",
        Action   = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ],
        Resource = "*"
      },
      {
        Effect   = "Allow",
        Action   = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_exec_role_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_exec_policy.arn
}

// Layer for common files
resource "aws_lambda_layer_version" "common_layer" {
  layer_name          = "common-layer"
  compatible_runtimes = ["nodejs20.x"]
  filename            = "../dist/common-layer.zip"
}