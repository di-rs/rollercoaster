# Test Plan for Bun Build --compile Migration

## Pre-merge Testing Checklist

### 1. Local Build Testing

#### Test npm Package Build
```bash
cd ~/projects/rollercoaster
bun install
bun run build

# Verify output
ls -la dist/
# Should see: dist/index.mjs

# Test the built package
node dist/index.mjs --help
node dist/index.mjs --version
```

#### Test Standalone Executable Build (Current Platform)
```bash
bun run build:bin

# Verify output
ls -lh dist/
# Should see: dist/rollercoaster (binary file, ~90-100MB)

# Make executable and test
chmod +x dist/rollercoaster
./dist/rollercoaster --help
./dist/rollercoaster --version
./dist/rollercoaster  # Test interactive UI
```

#### Test Cross-Platform Builds
```bash
# Build all platforms
bun run build:bin:macos-arm64
bun run build:bin:macos-x64
bun run build:bin:linux-x64
bun run build:bin:windows-x64

# Verify all executables exist
ls -lh dist/
# Should see:
# - rollercoaster-macos-arm64
# - rollercoaster-macos-x64
# - rollercoaster-linux-x64
# - rollercoaster-windows-x64.exe

# Check file sizes (should be ~90-100MB each)
du -h dist/rollercoaster-*
```

#### Test Build All
```bash
rm -rf dist/
bun run build:all

# Verify npm package + all executables exist
ls -la dist/
```

### 2. Functional Testing

#### Test Executable Functionality
```bash
cd ~/projects/rollercoaster
./dist/rollercoaster --help
./dist/rollercoaster --version

# Test in a project directory with package.json
cd ~/projects/some-project-with-scripts
~/projects/rollercoaster/dist/rollercoaster

# Test fuzzy search
~/projects/rollercoaster/dist/rollercoaster test
~/projects/rollercoaster/dist/rollercoaster bld

# Test task execution
~/projects/rollercoaster/dist/rollercoaster build
```

#### Compare npm vs Standalone Behavior
```bash
# Test npm-installed version
npm link  # or bun link
rollercoaster --help

# Test standalone version
./dist/rollercoaster --help

# Both should produce identical output
```

### 3. GitHub Actions Testing

#### Check Workflow Syntax
```bash
# Validate workflow files
cd ~/projects/rollercoaster
cat .github/workflows/build.yml | grep -E 'build:bin|verify'
cat .github/workflows/release.yml | grep -E 'build:bin|rollercoaster-'
```

#### Test Build Workflow
1. Push branch to GitHub ✅ (already done)
2. Check GitHub Actions for build workflow
3. Verify all jobs pass (lint, test, build)
4. Check that build artifacts include executable

#### Test Release Workflow (After Merge)
1. Create a test release or merge to master
2. Verify executables are built
3. Check GitHub release assets include:
   - rollercoaster-macos-arm64
   - rollercoaster-macos-x64
   - rollercoaster-linux-x64
   - rollercoaster-windows-x64.exe
4. Verify Homebrew formula is updated

### 4. Installation Testing

#### Test Direct Download (After Release)
```bash
# macOS Apple Silicon
curl -L https://github.com/di-rs/rollercoaster/releases/latest/download/rollercoaster-macos-arm64 -o rollercoaster
chmod +x rollercoaster
./rollercoaster --version

# macOS Intel
curl -L https://github.com/di-rs/rollercoaster/releases/latest/download/rollercoaster-macos-x64 -o rollercoaster
chmod +x rollercoaster
./rollercoaster --version

# Linux
curl -L https://github.com/di-rs/rollercoaster/releases/latest/download/rollercoaster-linux-x64 -o rollercoaster
chmod +x rollercoaster
./rollercoaster --version
```

#### Test Homebrew Installation (After Formula Update)
```bash
# Update tap
brew update

# Install from tap
brew install di-rs/tap/rollercoaster

# Verify installation
which rollercoaster
rollercoaster --version
rollercoaster --help

# Check dependencies
brew deps di-rs/tap/rollercoaster
# Should NOT show node or bun as dependency
```

#### Test npm Installation (Backwards Compatibility)
```bash
# Install from npm
npm install -g @di/rollercoaster

# Verify installation
which rollercoaster
rollercoaster --version
rollercoaster --help
```

### 5. Platform-Specific Testing

#### macOS (Apple Silicon)
```bash
# Download arm64 binary
curl -L https://github.com/di-rs/rollercoaster/releases/latest/download/rollercoaster-macos-arm64 -o rollercoaster-test
chmod +x rollercoaster-test

# Test execution
./rollercoaster-test --version
./rollercoaster-test --help

# Check architecture
file rollercoaster-test
# Should show: Mach-O 64-bit executable arm64

# Test in real project
cd ~/projects/some-project
./rollercoaster-test
```

#### macOS (Intel)
```bash
# Download x64 binary
curl -L https://github.com/di-rs/rollercoaster/releases/latest/download/rollercoaster-macos-x64 -o rollercoaster-test
chmod +x rollercoaster-test

# Test execution
./rollercoaster-test --version

# Check architecture
file rollercoaster-test
# Should show: Mach-O 64-bit executable x86_64
```

#### Linux (x86_64)
```bash
# Download binary
curl -L https://github.com/di-rs/rollercoaster/releases/latest/download/rollercoaster-linux-x64 -o rollercoaster-test
chmod +x rollercoaster-test

# Test execution
./rollercoaster-test --version

# Check architecture
file rollercoaster-test
ldd rollercoaster-test  # Check dependencies
```

#### Windows (x86_64)
```powershell
# Download binary
Invoke-WebRequest -Uri "https://github.com/di-rs/rollercoaster/releases/latest/download/rollercoaster-windows-x64.exe" -OutFile "rollercoaster-test.exe"

# Test execution
.\rollercoaster-test.exe --version
.\rollercoaster-test.exe --help
```

### 6. Performance Testing

#### Startup Time Comparison
```bash
# Test npm package startup
time node dist/index.mjs --version

# Test standalone executable startup
time ./dist/rollercoaster --version

# Standalone should be faster due to bytecode compilation
```

#### Binary Size Check
```bash
ls -lh dist/
# Verify executable sizes are reasonable (~90-100MB)
# Check with --minify flag is working
```

### 7. Edge Cases & Error Handling

#### Test without Node.js (if possible)
```bash
# In environment without node
which node  # Should fail
./dist/rollercoaster --version  # Should still work
```

#### Test in Different Directories
```bash
# Root directory
cd /
~/projects/rollercoaster/dist/rollercoaster

# Home directory
cd ~
./projects/rollercoaster/dist/rollercoaster

# Inside a git repo
cd ~/projects/rollercoaster
./dist/rollercoaster
```

#### Test with Different Project Types
```bash
# npm project
cd ~/projects/npm-project
~/projects/rollercoaster/dist/rollercoaster

# pnpm project
cd ~/projects/pnpm-project
~/projects/rollercoaster/dist/rollercoaster

# yarn project
cd ~/projects/yarn-project
~/projects/rollercoaster/dist/rollercoaster

# bun project
cd ~/projects/bun-project
~/projects/rollercoaster/dist/rollercoaster

# Taskfile project
cd ~/projects/taskfile-project
~/projects/rollercoaster/dist/rollercoaster
```

## Post-Release Testing

### 1. Monitor GitHub Release
- Check release page for all binary assets
- Verify download counts
- Monitor issue tracker for installation problems

### 2. Test Homebrew Update
- Verify formula syntax
- Test installation on clean machine
- Check for version updates

### 3. User Feedback
- Ask early adopters to test binaries
- Monitor Discord/Slack for issues
- Check Twitter/social media for feedback

## Known Limitations

1. **Binary Size** - Standalone executables are ~90-100MB due to embedded Bun runtime
2. **Cross-compilation** - All builds must be done from a machine with Bun installed
3. **First Run** - May be slower due to OS security checks (macOS Gatekeeper, Windows SmartScreen)

## Expected Results

✅ npm package build produces `dist/index.mjs`
✅ Standalone executable works without Node.js
✅ All platforms build successfully
✅ Executables are optimized (minified, bytecode)
✅ Backwards compatibility maintained
✅ GitHub Actions build and release successfully
✅ Homebrew formula updated correctly
✅ Download links work for all platforms

## Troubleshooting

### Issue: "bun: command not found"
```bash
# Install bun
curl -fsSL https://bun.sh/install | bash
```

### Issue: "Permission denied"
```bash
chmod +x dist/rollercoaster
```

### Issue: macOS "unidentified developer"
```bash
# Allow unsigned binary (for development)
xattr -d com.apple.quarantine dist/rollercoaster
```

### Issue: Binary too large
```bash
# This is expected - Bun runtime is embedded
# Current size: ~90-100MB
# Future: May be optimized in newer Bun versions
```

## Success Criteria

- [ ] All local builds complete successfully
- [ ] Executables run without Node.js
- [ ] npm installation still works
- [ ] GitHub Actions workflows pass
- [ ] Executables uploaded to GitHub releases
- [ ] Homebrew formula updated
- [ ] Documentation updated
- [ ] No breaking changes

## Review Checklist

Before merging PR:
- [ ] All tests pass
- [ ] Code review approved
- [ ] CI/CD passing
- [ ] Documentation updated
- [ ] Migration guide reviewed
- [ ] Test plan executed
- [ ] Performance acceptable
- [ ] No regressions in npm installation
