Import-Module "$PSScriptRoot/../helper.psm1"

$esc = [char]27

Write-Host "$esc[1;36m===========================================$esc[0m"
Write-Host "$esc[1;32mWELCOME TO CODING WORKS DEPLOYMENT SCRIPT$esc[0m"
Write-Host "$esc[1;36m===========================================$esc[0m"

$confirmDeploy = Read-Host "Do you really want to deploy the application? (y/n)"
if ($confirmDeploy -ne "y" -and $confirmDeploy -ne "yes") {
    Write-Output "Deployment cancelled."
    exit 0
}

$credentialPath = "$PSScriptRoot/../../credentials.json"
$dockerUsername = ""
$branch = ""

Write-Output "=============================================="
Write-Output "Logging into docker registry, please wait..."
Write-Output "=============================================="


$loginStatus = docker login | grep "Login Succeeded"
CheckCmdStatus -Msg "Login failed, exiting..."

if ($loginStatus -ne "Login Succeeded") {
  $branch = Read-Host "Enter the branch name"
}

if (Test-Path -Path $credentialPath) {
  $credentials = Get-Content -Path $credentialPath -Raw | ConvertFrom-Json
  
  if ($credentials.Branch) {
    Write-Output "================================="
    Write-Output "Deploying the app, please wait..."
    Write-Output "================================="

    $uri = Read-Host "Enter your caprover host"
    $appName = Read-Host "Enter your app name"
    $hashedPwd = Read-Host "Enter your caprover password" -AsSecureString
    $plainPwd = Convert-SecureStringToPlainText -SecureString $hashedPwd

    caprover deploy -h "$uri" -p "$plainPwd" --appName "$appName" --branch "$($credentials.Branch)"
    CheckCmdStatus -Msg "Deploy failed, exiting..."
    
    return;
  }

  $addMoreArgs = Read-Host "Do you want to add other build arguments? (y/n)"

  if ($addMoreArgs -and ("$addMoreArgs".Trim() -eq "y" -or "$addMoreArgs".Trim() -eq "yes")) {
      while ($true) {
          $keyName = Read-Host "  Enter build arg key name (or 'q' to finish)"
          if (-not $keyName -or "$keyName".Trim() -eq "q") {
              break
          }
          $keyName = "$keyName".Trim()
          $value = Read-Host "  Enter build arg value"
          $newArg = "--build-arg $keyName=$value"
          if ($credentials.BuildArgs) {
              $credentials.BuildArgs = "$($credentials.BuildArgs) $newArg"
          } else {
              $credentials.BuildArgs = $newArg
          }
      }
      if ($credentials.PSObject.Properties['Host']) {
          $credentials.PSObject.Properties.Remove('Host')
      }
      if ($credentials.PSObject.Properties['AppName']) {
          $credentials.PSObject.Properties.Remove('AppName')
      }
      $data = $credentials | ConvertTo-Json -Depth 10
      Set-Content -Path $credentialPath -Value $data -Encoding UTF8
  }
  
  Write-Output "================================="
  Write-Output "Preparing the image..."
  Write-Output "================================="

  if ($credentials.BuildArgs) {
    Invoke-Expression "docker build $($credentials.BuildArgs) -t $($credentials.ImgName) ."
  } else {
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

  $uri = Read-Host "Enter your caprover host"
  $appName = Read-Host "Enter your app name"
  $hashedPwd = Read-Host "Enter your caprover password" -AsSecureString
  $plainPwd = Convert-SecureStringToPlainText -SecureString $hashedPwd

  caprover deploy -h "$uri" -p "$plainPwd" -i "$($credentials.ImgName)" --appName "$appName"
  CheckCmdStatus -Msg "Deploy failed, exiting..."
}
else {
  if ($branch -ne "") {
    $uri = Read-Host "Enter your caprover host"
    $appName = Read-Host "Enter your app name"
    $hashedPwd = Read-Host "Enter your caprover password" -AsSecureString
    $plainPwd = Convert-SecureStringToPlainText -SecureString $hashedPwd

    caprover deploy -h "$uri" -p "$plainPwd" --appName "$appName" --branch "$branch" 
    CheckCmdStatus -Msg "Deploy failed, exiting..."

    $fileContents = @{
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
  $imgName = Read-Host "Enter your docker image name (without docker username)"
  
  $buildArgsList = @()
  $addBuildArgs = Read-Host "Do you want to add build arguments? (y/n)"
  if ($addBuildArgs -and ("$addBuildArgs".Trim() -eq "y" -or "$addBuildArgs".Trim() -eq "yes")) {
      while ($true) {
          $keyName = Read-Host "  Enter build arg key name (or 'q' to finish)"
          if (-not $keyName -or "$keyName".Trim() -eq "q") {
              break
          }
          $keyName = "$keyName".Trim()
          $value = Read-Host "  Enter build arg value"
          $buildArgsList += "--build-arg $keyName=$value"
      }
  }
  $buildArgs = $buildArgsList -join " "

  Write-Output "========================================"
  Write-Output "Building docker image, please wait..."
  Write-Output "========================================"

  if ($buildArgs) {
    Invoke-Expression "docker build $buildArgs -t `"$dockerUsername/$imgName`" ."
  } else {
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

  $uri = Read-Host "Enter your caprover host"
  $appName = Read-Host "Enter your app name"
  $hashedPwd = Read-Host "Enter your caprover password" -AsSecureString
  $plainPwd = Convert-SecureStringToPlainText -SecureString $hashedPwd
  
  caprover deploy -h "$uri" -p "$plainPwd" -i "$dockerUsername/$imgName" --appName "$appName"
  CheckCmdStatus -Msg "Deploy failed, exiting..."

  $fileContents = @{
    ImgName   = "$dockerUsername/$imgName"
    BuildArgs = $buildArgs
  }
  $data = $fileContents | ConvertTo-Json -Depth 10
  Set-Content -Path $credentialPath -Value $data -Encoding UTF8
}

Write-Output "========================================"
Write-Output "App deployed successfully 🚀🚀🚀🚀"
Write-Output "========================================"
