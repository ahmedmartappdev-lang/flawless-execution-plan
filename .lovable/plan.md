

# Fix: Login OTP SMS Not Delivered

## Root Cause

The edge function logs show:
```
SMS API status: 200 response: {"Response":{"Message":"Message ID: 155554314"},"Status":"OK"}
```

The Nimbus API **accepts** the message (returns OK with a Message ID), but the SMS is **never delivered** to the phone. Two issues:

1. **Wrong API format**: The code uses a GET request with URL query params, but `NIMBUS_API_BASE_URL` may be set to the JSON POST endpoint. The Nimbus docs show these are different URLs with different request formats.

2. **DLT template mismatch** (most likely cause of non-delivery): In India's DLT system, the telecom operator silently drops any SMS whose body doesn't **exactly** match the registered template. The current hardcoded message is:
   ```
   Your OTP for login is 123456. Valid for 5 minutes.
   ```
   If this doesn't match the template registered under `NIMBUS_TEMPLATE_ID` character-for-character, the message is accepted by Nimbus but silently discarded by the telecom.

## Plan

### 1. Switch to the JSON POST API (reliable, structured responses)

Update `supabase/functions/send-otp/index.ts`:

- Change from GET with query params to **POST JSON** to `http://nimbusit.biz/Api/smsapi/SendSms`
- Send a proper JSON body with `Content-Type: application/json`
- Parse the structured JSON response and check `Status` field directly (`"OK"`, `"WARNING"`, `"ERROR"`) instead of string-matching for error keywords
- Only treat `Status: "OK"` as success; treat `"WARNING"` and `"ERROR"` as failures with the provider's message

```text
Current flow (GET):
  fetch("http://nimbusit.biz/api/SmsApi/SendSingleApi?UserID=...&Phno=...&Msg=...")

New flow (POST JSON):
  fetch("http://nimbusit.biz/Api/smsapi/SendSms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      UserId, Password, SenderID, Phno, Msg, EntityID, TemplateID
    })
  })
```

### 2. Hardcode the correct Nimbus JSON API URL

Instead of relying on `NIMBUS_API_BASE_URL` (which may be set to the GET endpoint), hardcode the JSON POST URL: `http://nimbusit.biz/Api/smsapi/SendSms`. This removes ambiguity.

### 3. Parse response properly

```typescript
const result = await smsResponse.json();
if (result.Status !== "OK") {
  // Cleanup OTP, return error with result.Response.Message
}
```

### 4. Template text alignment (critical for delivery)

The SMS message text MUST exactly match the DLT-registered template. After deploying the fix, the user needs to:
- Check their DLT portal for the exact template text registered under `NIMBUS_TEMPLATE_ID`
- Update the message string in the edge function to match exactly (including punctuation, spacing, and variable placeholder format)

## Files Changed

- `supabase/functions/send-otp/index.ts` — switch to POST JSON API, parse structured response, hardcode API URL

## Important Note for the User

Even after this code fix, if the SMS template text in the code doesn't match your DLT-registered template **exactly**, the telecom will still silently drop the message. You will need to share the exact registered template text so we can match it in the code.

