# Clean old folder
Remove-Item -Recurse -Force lambda_upload -ErrorAction SilentlyContinue

# Create fresh folder
mkdir lambda_upload

# Install dependencies
pip install -r requirements.txt -t lambda_upload

# Copy backend code
Copy-Item main.py lambda_upload/

# Go inside folder
Set-Location lambda_upload

# Remove old zip if exists
Remove-Item function.zip -ErrorAction SilentlyContinue

# Create deployment zip
Compress-Archive -Path * -DestinationPath function.zip

# Upload to AWS Lambda
aws lambda update-function-code `
  --function-name face-auth-backend-v2 `
  --zip-file fileb://function.zip `
  --region us-east-1

Write-Host "Backend deployed successfully!"