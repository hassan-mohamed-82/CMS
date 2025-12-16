# API Endpoint Test Script
# CMS API Testing

$UserToken = Get-Content "token.txt"
$AdminToken = Get-Content "admin_token.txt"
$BaseUrl = "http://localhost:3000/api"

$Headers = @{
    "Content-Type" = "application/json"
}

$UserHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $UserToken"
}

$AdminHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $AdminToken"
}

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers,
        [object]$Body = $null,
        [string]$Description
    )
    
    Write-Host "`n============================================" -ForegroundColor Cyan
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "$Method $Url" -ForegroundColor Gray
    Write-Host "============================================" -ForegroundColor Cyan
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "SUCCESS" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 5
        return @{ Success = $true; Response = $response }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "FAILED (Status: $statusCode)" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
        return @{ Success = $false; Error = $_.ErrorDetails.Message }
    }
}

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "      CMS API ENDPOINT TESTING          " -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# ==========================================
# PUBLIC ENDPOINTS (No Auth Required)
# ==========================================

Write-Host "`n### PUBLIC ENDPOINTS ###" -ForegroundColor Magenta

# Test API
Test-Endpoint -Method "GET" -Url "$BaseUrl/test" -Headers $Headers -Description "API Test Endpoint"

# User Plans (Public)
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/plans" -Headers $Headers -Description "Get All Plans (User - Public)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/plans/1" -Headers $Headers -Description "Get Plan by ID (User - Public)"

# User Templates (Public)
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/templates" -Headers $Headers -Description "Get All Templates (User - Public)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/templates/1" -Headers $Headers -Description "Get Template by ID (User - Public)"

# ==========================================
# USER AUTH ENDPOINTS
# ==========================================

Write-Host "`n### USER AUTH ENDPOINTS ###" -ForegroundColor Magenta

# Signup (Already tested)
# Test-Endpoint -Method "POST" -Url "$BaseUrl/user/auth/local/signup" -Headers $Headers -Body @{name="Test2";email="test2@example.com";password="Test123456";phoneNumber="9876543210"} -Description "User Signup"

# Login
Test-Endpoint -Method "POST" -Url "$BaseUrl/user/auth/local/login" -Headers $Headers -Body @{email="testuser@example.com";password="Test123456"} -Description "User Login"

# Forgot Password
Test-Endpoint -Method "POST" -Url "$BaseUrl/user/auth/local/forgot-password" -Headers $Headers -Body @{email="testuser@example.com"} -Description "Forgot Password"

# ==========================================
# USER PROTECTED ENDPOINTS
# ==========================================

Write-Host "`n### USER PROTECTED ENDPOINTS ###" -ForegroundColor Magenta

# Payment Methods
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/payment-method" -Headers $UserHeaders -Description "Get All Payment Methods (User)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/payment-method/1" -Headers $UserHeaders -Description "Get Payment Method by ID (User)"

# Activities
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/activities" -Headers $UserHeaders -Description "Get All Activities (User)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/activities/1" -Headers $UserHeaders -Description "Get Activity by ID (User)"

# Subscriptions
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/subscriptions" -Headers $UserHeaders -Description "Get All Subscriptions (User)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/subscriptions/1" -Headers $UserHeaders -Description "Get Subscription by ID (User)"

# Payments
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/payments" -Headers $UserHeaders -Description "Get All Payments (User)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/payments/1" -Headers $UserHeaders -Description "Get Payment by ID (User)"

# Websites
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/websites" -Headers $UserHeaders -Description "Get All Websites (User)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/websites/1" -Headers $UserHeaders -Description "Get Website by ID (User)"

# Promocode User
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/promocodeuser" -Headers $UserHeaders -Description "Get Promocode User (User)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/user/promocodeuser/1" -Headers $UserHeaders -Description "Get Promocode User by ID (User)"

# ==========================================
# ADMIN AUTH ENDPOINTS
# ==========================================

Write-Host "`n### ADMIN AUTH ENDPOINTS ###" -ForegroundColor Magenta

Test-Endpoint -Method "POST" -Url "$BaseUrl/admin/auth/login" -Headers $Headers -Body @{email="admin@example.com";password="admin123"} -Description "Admin Login"

# ==========================================
# ADMIN PROTECTED ENDPOINTS
# ==========================================

Write-Host "`n### ADMIN PROTECTED ENDPOINTS ###" -ForegroundColor Magenta

# Plans
$planResult = Test-Endpoint -Method "POST" -Url "$BaseUrl/admin/plans" -Headers $AdminHeaders -Body @{name="Basic Plan";description="Basic subscription plan";monthlyPrice=10;quarterlyPrice=25;semiAnnuallyPrice=45;yearlyPrice=80;isActive=$true} -Description "Create Plan (Admin)"
$planId = if ($planResult.Success) { $planResult.Response.data.plan.id } else { 1 }

Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/plans" -Headers $AdminHeaders -Description "Get All Plans (Admin)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/plans/$planId" -Headers $AdminHeaders -Description "Get Plan by ID (Admin)"
Test-Endpoint -Method "PUT" -Url "$BaseUrl/admin/plans/$planId" -Headers $AdminHeaders -Body @{name="Updated Basic Plan";monthlyPrice=15} -Description "Update Plan (Admin)"

# Payment Methods
$pmResult = Test-Endpoint -Method "POST" -Url "$BaseUrl/admin/payment-method" -Headers $AdminHeaders -Body @{name="PayPal";discription="PayPal payment method";isActive=$true} -Description "Create Payment Method (Admin)"
$pmId = if ($pmResult.Success) { $pmResult.Response.data.paymentMethod.id } else { 1 }

Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/payment-method" -Headers $AdminHeaders -Description "Get All Payment Methods (Admin)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/payment-method/$pmId" -Headers $AdminHeaders -Description "Get Payment Method by ID (Admin)"
Test-Endpoint -Method "PUT" -Url "$BaseUrl/admin/payment-method/$pmId" -Headers $AdminHeaders -Body @{name="PayPal Updated"} -Description "Update Payment Method (Admin)"

# Activities
$actResult = Test-Endpoint -Method "POST" -Url "$BaseUrl/admin/activities" -Headers $AdminHeaders -Body @{name="Restaurant";isActive=$true} -Description "Create Activity (Admin)"
$actId = if ($actResult.Success) { $actResult.Response.data.activity.id } else { 1 }

Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/activities" -Headers $AdminHeaders -Description "Get All Activities (Admin)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/activities/$actId" -Headers $AdminHeaders -Description "Get Activity by ID (Admin)"
Test-Endpoint -Method "PUT" -Url "$BaseUrl/admin/activities/$actId" -Headers $AdminHeaders -Body @{name="Restaurant Updated"} -Description "Update Activity (Admin)"

# Subscriptions
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/subscriptions" -Headers $AdminHeaders -Description "Get All Subscriptions (Admin)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/subscriptions/1" -Headers $AdminHeaders -Description "Get Subscription by ID (Admin)"

# Templates
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/templates" -Headers $AdminHeaders -Description "Get All Templates (Admin)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/templates/1" -Headers $AdminHeaders -Description "Get Template by ID (Admin)"

# Payments
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/payments" -Headers $AdminHeaders -Description "Get All Payments (Admin)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/payments/1" -Headers $AdminHeaders -Description "Get Payment by ID (Admin)"

# Websites
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/websites" -Headers $AdminHeaders -Description "Get All Websites (Admin)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/websites/1" -Headers $AdminHeaders -Description "Get Website by ID (Admin)"

# Promocodes
$promoResult = Test-Endpoint -Method "POST" -Url "$BaseUrl/admin/promocode" -Headers $AdminHeaders -Body @{code="SUMMER2024";discountPercentage=20;maxUsageCount=100;startDate="2024-01-01";endDate="2024-12-31";isActive=$true;plans=@()} -Description "Create Promocode (Admin)"
$promoId = if ($promoResult.Success) { $promoResult.Response.data.promocode.id } else { 1 }

Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/promocode" -Headers $AdminHeaders -Description "Get All Promocodes (Admin)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/promocode/$promoId" -Headers $AdminHeaders -Description "Get Promocode by ID (Admin)"
Test-Endpoint -Method "PUT" -Url "$BaseUrl/admin/promocode/$promoId" -Headers $AdminHeaders -Body @{code="SUMMER2024UPDATED";discountPercentage=25} -Description "Update Promocode (Admin)"

# Users (Admin)
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/users" -Headers $AdminHeaders -Description "Get All Users (Admin)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/users/1" -Headers $AdminHeaders -Description "Get User by ID (Admin)"

# Promocode Users
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/promocodeuser" -Headers $AdminHeaders -Description "Get All Promocode Users (Admin)"
Test-Endpoint -Method "GET" -Url "$BaseUrl/admin/promocodeuser/1" -Headers $AdminHeaders -Description "Get Promocode User by ID (Admin)"

# ==========================================
# CLEANUP / DELETE TESTS (Optional)
# ==========================================

Write-Host "`n### CLEANUP TESTS ###" -ForegroundColor Magenta

# Uncomment to test deletes
# Test-Endpoint -Method "DELETE" -Url "$BaseUrl/admin/plans/$planId" -Headers $AdminHeaders -Description "Delete Plan (Admin)"
# Test-Endpoint -Method "DELETE" -Url "$BaseUrl/admin/payment-method/$pmId" -Headers $AdminHeaders -Description "Delete Payment Method (Admin)"
# Test-Endpoint -Method "DELETE" -Url "$BaseUrl/admin/activities/$actId" -Headers $AdminHeaders -Description "Delete Activity (Admin)"
# Test-Endpoint -Method "DELETE" -Url "$BaseUrl/admin/promocode/$promoId" -Headers $AdminHeaders -Description "Delete Promocode (Admin)"

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "      TESTING COMPLETE!                 " -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
