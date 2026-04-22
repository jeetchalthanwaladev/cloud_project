# Deployment Guide — Learning Platform

## 1. Create DynamoDB Table

In the AWS Console (or via CLI):
```bash
aws dynamodb create-table \
  --table-name Courses \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

---

## 2. Build Frontend

```bash
cd frontend

# Edit .env for production:
# REACT_APP_API_URL=http://<EC2_PUBLIC_IP>:8000

npm install
npm run build
```

Output: `build/` folder ready for S3.

---

## 3. Upload to S3

```bash
aws s3 mb s3://learning-platform-frontend
aws s3 sync build/ s3://learning-platform-frontend --acl public-read

# Enable static hosting:
aws s3 website s3://learning-platform-frontend \
  --index-document index.html \
  --error-document index.html
```

Bucket URL: `http://learning-platform-frontend.s3-website-us-east-1.amazonaws.com`

---

## 4. Setup EC2

1. Launch an EC2 instance (Amazon Linux 2 / Ubuntu)
2. Attach an **IAM Role** with `AmazonDynamoDBFullAccess` policy
3. Open **Security Group** port `8000` (TCP inbound)
4. SSH in and install:

```bash
sudo yum install python3-pip -y   # Amazon Linux
# OR: sudo apt install python3-pip -y  # Ubuntu

cd ~
git clone <your-repo-url> app
cd app/backend

pip3 install -r requirements.txt
```

5. (Optional) Set CORS to your S3 domain:
```bash
export ALLOWED_ORIGINS="http://learning-platform-frontend.s3-website-us-east-1.amazonaws.com"
```

---

## 5. Run Backend on EC2

```bash
cd ~/app/backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

For background execution:
```bash
nohup uvicorn main:app --host 0.0.0.0 --port 8000 &
```

Verify: `curl http://localhost:8000/health` → `{"status":"ok"}`

---

## Environment Variables (Backend)

| Variable | Default | Description |
|---|---|---|
| `AWS_REGION` | `us-east-1` | DynamoDB region |
| `DYNAMO_TABLE` | `Courses` | DynamoDB table name |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS origins |
