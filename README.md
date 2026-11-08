# Easily install DoomTools in your GitHub Actions

`electricbrass/setup-doomtools` sets up https://github.com/MTrop/DoomTools in GitHub Actions workflows.

# Usage

To simply install the latest version of DoomTools:
```yaml
steps:
  - uses: electricbrass/setup-doomtools@main
```

On Windows runners, this will install the CMD version for use from PowerShell. Otherwise it will install the Bash version.

To install the Bash version on Windows, or the CMD version on non-Windows, `distribution` can be specified as either `bash` or `cmd`:
```yaml
steps:
  - uses: electricbrass/setup-doomtools@main
    with:
      distribution: bash
```

A specific release of DoomTools can be installed too:
```yaml
steps:
  - uses: electricbrass/setup-doomtools@main
    with:
      version: 2026-10-30
```

### Note: This action assumes your runner environment already has Java

If not, https://github.com/actions/setup-java can be used to install it.