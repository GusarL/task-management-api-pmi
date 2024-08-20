provider "aws" {
  region = "eu-central-1"
}

resource "random_pet" "lambda_bucket_name" {
  prefix = "task-management-pmi"
  length = 4
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket = random_pet.lambda_bucket_name.id
}