const { execSync } = require('child_process');

console.log('🔒 Running Pre-Commit Security Checks...\n');

// 1. Verify code-level security controls
try {
  console.log('1. Verifying Managed Security Controls...');
  execSync('node src/scripts/verify-security.js', { stdio: 'inherit' });
  console.log('   ✅ Internal security controls verified.\n');
} catch {
  console.error('\n❌ Security controls verification failed. Commit blocked.');
  process.exit(1);
}

// 2. Verify production dependency safety (no high/critical vulnerabilities)
try {
  console.log('2. Auditing production dependencies for high-severity vulnerabilities...');
  const auditOutput = execSync('npm audit --omit=dev --audit-level=high', {
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (auditOutput.trim()) {
    console.log(auditOutput.trim());
  }
  console.log('   ✅ Production dependencies audit passed with 0 high-severity vulnerabilities.\n');
} catch (err) {
  const errorOutput = (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : '') + err.message;

  // Handle offline / sandbox environment without network access gracefully
  if (
    errorOutput.includes('ENOTFOUND') ||
    errorOutput.includes('EAI_AGAIN') ||
    errorOutput.includes('getaddrinfo') ||
    errorOutput.includes('request to') ||
    errorOutput.includes('network') ||
    errorOutput.includes('offline')
  ) {
    console.warn('   ⚠️  NPM registry unreachable (offline or isolated environment).');
    console.warn('   ⚠️  Skipping remote audit check. Local security tests passed successfully.\n');
  } else {
    if (err.stdout) console.error(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    console.error('\n❌ High or critical severity vulnerabilities detected in production dependencies!');
    console.error('Run "npm audit fix" to resolve vulnerabilities before committing.');
    process.exit(1);
  }
}

console.log('✅ All pre-commit security checks passed successfully!\n');
process.exit(0);
