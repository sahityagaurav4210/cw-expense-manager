function Convert-SecureStringToPlainText {
    param (
        [System.Security.SecureString]$SecureString
    )
  
    $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToGlobalAllocUnicode($SecureString)
    try {
        [System.Runtime.InteropServices.Marshal]::PtrToStringUni($ptr)
    }
    finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeGlobalAllocUnicode($ptr)
    }
}

function CheckCmdStatus {
    param (
        [string]$Msg
    )
    if ($LASTEXITCODE -ne 0) {
        Write-Error $Msg
        exit $LASTEXITCODE
    }
}
  
Export-ModuleMember -Function Convert-SecureStringToPlainText, CheckCmdStatus