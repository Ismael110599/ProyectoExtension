function formatMessage(text) {
  const regex = /```[\s\S]*?```/g;
  const fragments = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      fragments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const code = match[0].slice(3, -3);
    fragments.push({ type: 'code', content: code });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    fragments.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return fragments;
}
window.formatMessage = formatMessage;
