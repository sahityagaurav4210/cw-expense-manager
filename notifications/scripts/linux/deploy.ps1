Import-Module "$PSScriptRoot\..\helper.psm1"

$esc = [char]27

Write-Host "$esc[1;36m====================================================$esc[0m"
Write-Host " $esc[1;32mWELCOME TO CODING WORKS DEPLOYMENT SCRIPT$esc[0m"
Write-Host "$esc[1;36m====================================================$esc[0m"

$confirmDeploy = (Read-Host "Do you really want to deploy the application? (y/n)").ToLower().Trim()
if ($confirmDeploy -ne "y" -and $confirmDeploy -ne "yes") {
  Write-Output "Deployment cancelled."
  exit 0
}


$credentialPath = "$PSScriptRoot\..\..\credentials.json"
$dockerUsername = ""
$branch = ""

Write-Output "=============================================="
Write-Output "Logging into docker registry, please wait..."
Write-Output "=============================================="

$loginStatus = docker login | findstr "Login Succeeded"

if ($loginStatus -ne "Login Succeeded") {
  $branch = Read-Host "Enter the branch name"
}

if (Test-Path -Path $credentialPath) {
  $credentials = Get-Content -Path $credentialPath -Raw | ConvertFrom-Json
  
  if ($credentials.Branch) {
    Write-Output "Deploying the app, please wait..."

    caprover deploy -h "$($credentials.Host)" -p "$($credentials.Password)" --appName "$($credentials.AppName)" --branch "$($credentials.Branch)"
    CheckCmdStatus -Msg "Deploy failed, exiting..."
    
    return;
  }

  $addMoreArgs = (Read-Host "Do you want to add other build arguments? (y/n)").ToLower().Trim()
  if ($addMoreArgs -eq "y" -or $addMoreArgs -eq "yes") {
    while ($true) {
      $keyName = Read-Host "  Enter build arg key name (or 'q' to finish)"
      if ($keyName -eq "q") {
        break
      }
      if ($keyName) {
        $value = Read-Host "  Enter build arg value"
        $newArg = "--build-arg $keyName=$value"
        if ($credentials.BuildArgs) {
          $credentials.BuildArgs = "$($credentials.BuildArgs) $newArg"
        }
        else {
          $credentials.BuildArgs = $newArg
        }
      }
    }
    $data = $credentials | ConvertTo-Json -Depth 10
    Set-Content -Path $credentialPath -Value $data -Encoding UTF8
  }
  
  Write-Output "================================="
  Write-Output "Preparing the image..."
  Write-Output "================================="

  if ($credentials.BuildArgs) {
    Invoke-Expression "docker build $($credentials.BuildArgs) -t $($credentials.ImgName) ."
  }
  else {
    docker build -t $($credentials.ImgName) .
  }
  CheckCmdStatus -Msg "Build failed, exiting..."

  Write-Output "================================="
  Write-Output "Pushing the image, please wait..."
  Write-Output "================================="

  docker push $($credentials.ImgName)
  CheckCmdStatus -Msg "Build upload failed, exiting..."

  Write-Output "================================="
  Write-Output "Deploying the app, please wait..."
  Write-Output "================================="

  $hashedPwd = Read-Host "Enter your caprover password" -AsSecureString
  $plainPwd = Convert-SecureStringToPlainText -SecureString $hashedPwd

  caprover deploy -h "$($credentials.Host)" -p "$plainPwd" -i "$($credentials.ImgName)" --appName "$($credentials.AppName)"
  CheckCmdStatus -Msg "Deploy failed, exiting..."
}
else {
  if ($branch -ne "") {
    $uri = Read-Host "Enter your caprover host"
    $hashedPwd = Read-Host "Enter your caprover password" -AsSecureString
    $appName = Read-Host "Enter your app name" 
    $plainPwd = Convert-SecureStringToPlainText -SecureString $hashedPwd

    caprover deploy -h "$uri" -p "$plainPwd" --appName "$appName" --branch "$branch" 
    CheckCmdStatus -Msg "Deploy failed, exiting..."

    $fileContents = @{
      Host     = $uri
      Password = $plainPwd
      AppName  = $appName
      Branch   = $branch
    }
    $data = $fileContents | ConvertTo-Json -Depth 10
  
    Set-Content -Path $credentialPath -Value $data -Encoding UTF8
    return;
  }

  Write-Output "================================="
  Write-Output "Enter your credentials"
  Write-Output "================================="
  
  $dockerUsername = Read-Host "Enter your docker username"
  $uri = Read-Host "Enter your caprover host"
  $hashedPwd = Read-Host "Enter your caprover password" -AsSecureString
  $appName = Read-Host "Enter your app name" 
  $imgName = Read-Host "Enter your docker image name (without docker username)"
  
  Write-Output "Enter docker image build args:"
  $viteApiBaseUrl = Read-Host "  VITE_API_BASE_URL"
  $port = Read-Host "  PORT"
  $viteWhatsappLink = Read-Host "  VITE_WHATSAPP_CHANNEL_LINK"
  $viteTelegramLink = Read-Host "  VITE_TELEGRAM_CHANNEL_LINK"
  $viteProdAdminPanelUrl = Read-Host "  VITE_PRODUCTION_ADMIN_PANEL_URL"
  $viteAppVersion = Read-Host "  VITE_APP_VERSION"

  $buildArgsList = @()
  if ($viteApiBaseUrl) { $buildArgsList += "--build-arg VITE_API_BASE_URL=$viteApiBaseUrl" }
  if ($port) { $buildArgsList += "--build-arg PORT=$port" }
  if ($viteWhatsappLink) { $buildArgsList += "--build-arg VITE_WHATSAPP_CHANNEL_LINK=$viteWhatsappLink" }
  if ($viteTelegramLink) { $buildArgsList += "--build-arg VITE_TELEGRAM_CHANNEL_LINK=$viteTelegramLink" }
  if ($viteProdAdminPanelUrl) { $buildArgsList += "--build-arg VITE_PRODUCTION_ADMIN_PANEL_URL=$viteProdAdminPanelUrl" }
  if ($viteAppVersion) {
    $buildArgsList += "--build-arg VITE_APP_VERSION=$viteAppVersion"
  }
  $buildArgs = $buildArgsList -join " "

  Write-Output "========================================"
  Write-Output "Building docker image, please wait..."
  Write-Output "========================================"

  if ($buildArgs) {
    Invoke-Expression "docker build $buildArgs -t `"$dockerUsername/$imgName`" ."
  }
  else {
    docker build -t "$dockerUsername/$imgName" .
  }
  CheckCmdStatus -Msg "Build failed, exiting..."

  Write-Output "========================================"
  Write-Output "Pushing the docker image, please wait..."
  Write-Output "========================================"

  docker push "$dockerUsername/$imgName"
  CheckCmdStatus -Msg "Build upload, exiting..."
  
  Write-Output "================================="
  Write-Output "Deploying the app, please wait..."
  Write-Output "================================="

  $plainPwd = Convert-SecureStringToPlainText -SecureString $hashedPwd
  
  caprover deploy -h "$uri" -p "$plainPwd" -i "$dockerUsername/$imgName" --appName "$appName"
  CheckCmdStatus -Msg "Deploy failed, exiting..."

  $fileContents = @{
    Host      = $uri
    AppName   = $appName
    ImgName   = "$dockerUsername/$imgName"
    BuildArgs = $buildArgs
  }
  $data = $fileContents | ConvertTo-Json -Depth 10
  Set-Content -Path $credentialPath -Value $data -Encoding UTF8
}

Write-Output "========================================"
Write-Host   "App deployed successfully 🚀🚀🚀🚀"
Write-Output "========================================"