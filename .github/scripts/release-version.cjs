const header = /^(feat|fix|perf|refactor|docs|test|build|ci|chore|style|revert)(?:\([^()\r\n]+\))?(!)?: \S[^\r\n]*$/;

function nextVersion(previous, messages) {
  const [major, minor, patch] = previous.replace(/^v/, '').split('.').map(Number);
  let level = 0;
  for (const message of messages) {
    const match = header.exec(message.split(/\r?\n/)[0]);
    if (!match) continue;
    const breaking = match[2] || /^BREAKING[ -]CHANGE: \S/m.test(message);
    level = Math.max(level, breaking ? 2 : match[1] === 'feat' ? 1 : 0);
  }
  if (level === 2 && major > 0) return `${major + 1}.0.0`;
  if (level > 0) return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

module.exports = { header, nextVersion };
