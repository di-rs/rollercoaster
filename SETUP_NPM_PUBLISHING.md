# npm Publishing Setup with Trusted Publishing

As of December 2025, npm has deprecated classic authentication tokens in favor of **Trusted Publishing with OIDC**. This document explains how to set up the new authentication method for this repository.

## What Changed

- ❌ **Old**: Classic npm tokens stored as GitHub secrets (`NPM_TOKEN`)
- ✅ **New**: OIDC-based trusted publishing (no long-lived tokens needed)

## Benefits

- 🔒 **More Secure**: No long-lived tokens that can be exposed or leaked
- 🚀 **Automatic Provenance**: Each publish includes cryptographic proof of origin
- 🎯 **Zero Token Management**: No need to rotate or manage tokens
- 🔐 **Short-lived Credentials**: Each publish uses workflow-specific tokens

## Setup Instructions

### 1. Configure Trusted Publisher on npmjs.com

1. Go to your package settings on npmjs.com: https://www.npmjs.com/package/@di-rs/rollercoaster/access
2. Scroll to the **"Trusted Publisher"** section
3. Click **"GitHub Actions"** button
4. Fill in the configuration:
   - **Organization or user**: `di-rs` (or your GitHub username/org)
   - **Repository**: `rollercoaster`
   - **Workflow filename**: `release.yml` (must include .yml extension)
   - **Environment name**: (leave empty unless using GitHub environments)
5. Save the configuration

### 2. Workflow Configuration

The workflow has been updated with:

```yaml
permissions:
  contents: write
  pull-requests: write
  id-token: write  # Required for npm trusted publishing with OIDC
```

The publish step no longer requires `NPM_TOKEN`:

```yaml
- name: Publish to npm
  run: bun run release
  # No NPM_TOKEN needed - uses OIDC authentication automatically
```

### 3. Remove Old Secrets (Optional but Recommended)

After confirming trusted publishing works:

1. Go to repository settings → Secrets and variables → Actions
2. Delete the `NPM_TOKEN` secret (it's no longer used)
3. Consider enabling "Require two-factor authentication and disallow tokens" in your npm package settings for maximum security

## How It Works

1. When the workflow runs, GitHub generates a short-lived OIDC token
2. The npm CLI (v11.5.1+) automatically detects the OIDC environment
3. npm verifies the token matches your trusted publisher configuration
4. If valid, the publish proceeds with automatic provenance generation

## Requirements

- ✅ npm CLI v11.5.1 or later (Node.js 24 includes this)
- ✅ GitHub-hosted runners (self-hosted not yet supported)
- ✅ `id-token: write` permission in workflow
- ✅ Trusted publisher configured on npmjs.com

## Troubleshooting

### "Unable to authenticate" error

- Verify the workflow filename in npmjs.com matches exactly: `release.yml`
- Check that `id-token: write` permission is present
- Ensure you're using GitHub-hosted runners (not self-hosted)
- Confirm the repository and organization names match exactly

### Provenance not generated

- Provenance is only generated for:
  - Public repositories
  - Public packages
  - When using trusted publishing
- To disable provenance: set `NPM_CONFIG_PROVENANCE=false` environment variable

### Private dependencies

Trusted publishing only handles the `npm publish` command. If you have private dependencies to install, you'll still need a **read-only** token for `npm install`:

```yaml
- run: bun install
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_READ_TOKEN }}
```

## Homebrew Publishing

The Homebrew tap update step remains unchanged and still uses `HOMEBREW_GITHUB_API_TOKEN` secret. Trusted publishing only affects npm publishing.

## References

- [npm Trusted Publishers Documentation](https://docs.npmjs.com/trusted-publishers/)
- [GitHub Blog: npm trusted publishing with OIDC](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
- [GitHub Actions OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

## Migration Checklist

- [ ] Configure trusted publisher on npmjs.com
- [ ] Verify workflow has `id-token: write` permission
- [ ] Remove `NPM_TOKEN` from publish step (done in this PR)
- [ ] Test publish on a branch or tag
- [ ] Delete old `NPM_TOKEN` secret after confirming it works
- [ ] (Optional) Enable "disallow tokens" in npm package settings
