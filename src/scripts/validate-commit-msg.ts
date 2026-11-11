import fs from 'fs';

const commitMsgFile = process.argv[2];

if (!commitMsgFile) {
  console.error('Error: No commit message file path provided.');
  process.exit(1);
}

const rawMessage = fs.readFileSync(commitMsgFile, 'utf8').trim();
// Ignore comment lines from git templates
const commitMessage =
  rawMessage
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => !line.startsWith('#') && line.length > 0)[0] || '';

// Allow automated merge commits
if (commitMessage.startsWith('Merge ') || commitMessage.startsWith('Revert "')) {
  process.exit(0);
}

const COMMIT_PATTERN = /^(feat|fix|docs|style|refactor|test|chore|perf|hotfix|err|revert)(\([a-zA-Z0-9_\-.]+\))?:\s+.+$/;

if (!COMMIT_PATTERN.test(commitMessage)) {
  console.error('\n❌ [INVALID COMMIT MESSAGE]');
  console.error('------------------------------------------------------------');
  console.error('Your commit message does not match the required structured prefix format:');
  console.error('   <prefix>(optional-scope): <description>\n');
  console.error('Allowed Prefixes:');
  console.error('   feat, fix, docs, style, refactor, test, chore, perf, hotfix, err, revert\n');
  console.error('Expected Formats:');
  console.error('   feat: implement autocomplete search');
  console.error('   fix(experience): resolve datepicker alignment issue');
  console.error('   hotfix: patch critical production cookie leak\n');
  console.error('Your Message:');
  console.error(`   "${commitMessage}"`);
  console.error('------------------------------------------------------------\n');
  process.exit(1);
}

process.exit(0);
