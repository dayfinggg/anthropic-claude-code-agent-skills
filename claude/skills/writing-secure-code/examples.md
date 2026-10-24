# Secure code examples

Three pairs show failures that a quick read tends to miss.

## Contents

- Fail-open authorization in C#
- Partial writes and leaked errors in Go
- JWT validation in Python

## Fail-open authorization in C#

Before

```csharp
public async Task<bool> CanEditAsync(string userId, string documentId)
{
    try
    {
        return await _policyClient.IsAllowedAsync(userId, "document:edit", documentId);
    }
    catch (Exception ex)
    {
        _logger.LogWarning(ex, "Policy service unavailable, allowing edit");
        return true;
    }
}
```

After

```csharp
public async Task<bool> CanEditAsync(string userId, string documentId)
{
    try
    {
        return await _policyClient.IsAllowedAsync(userId, "document:edit", documentId);
    }
    catch (HttpRequestException ex)
    {
        _logger.LogError(ex, "Policy check failed for document {DocumentId}, denying edit", documentId);
        return false;
    }
}
```

An outage granted edit rights to everyone. This is CWE-636. The check now denies when it cannot decide. It catches only the expected failure, so other errors reach the global handler.

## Partial writes and leaked errors in Go

Before

```go
func (s *TransferService) Transfer(ctx context.Context, from, to string, amountMinor int64) error {
	if err := s.accounts.Debit(ctx, from, amountMinor); err != nil {
		return err
	}
	return s.accounts.Credit(ctx, to, amountMinor)
}

// In the handler, a failed transfer answers with the raw error.
http.Error(w, err.Error(), http.StatusInternalServerError)
```

After

```go
func (s *TransferService) Transfer(ctx context.Context, from, to string, amountMinor int64) error {
	return s.unitOfWork.Run(ctx, func(accounts AccountStore) error {
		if err := accounts.Debit(ctx, from, amountMinor); err != nil {
			return fmt.Errorf("debit %s: %w", from, err)
		}
		if err := accounts.Credit(ctx, to, amountMinor); err != nil {
			return fmt.Errorf("credit %s: %w", to, err)
		}
		return nil
	})
}

// In the handler, the client gets a fixed message and the log gets the details.
h.logger.ErrorContext(r.Context(), "transfer failed", "error", err)
http.Error(w, "The transfer could not be completed.", http.StatusInternalServerError)
```

A failed credit left the debit in place. The raw error could show SQL or account details, which is CWE-209. Both steps now commit or roll back together.

## JWT validation in Python

Before

```python
import jwt


def subject_of(token: str) -> str:
    claims = jwt.decode(token, options={"verify_signature": False})
    return claims["sub"]
```

After

```python
import jwt


def subject_of(token: str, public_key: str, issuer: str, audience: str) -> str:
    claims = jwt.decode(
        token,
        public_key,
        algorithms=["RS256"],
        issuer=issuer,
        audience=audience,
        options={"require": ["exp", "iss", "aud", "sub"]},
    )
    return claims["sub"]
```

The fixed algorithm list stops the token from choosing `none`. It also stops an HMAC algorithm keyed with the public key. This is CWE-347. Required claims reject tokens that never expire. Issuer and audience checks reject tokens minted for another service. PyJWT raises a subclass of `jwt.InvalidTokenError` for each failure. The caller maps it to 401.
