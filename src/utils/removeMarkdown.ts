export function removeMarkdown(text: string): string {
  if (!text) {
    return '';
  }
  return text
    // Remove fenced code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]*)`/g, '$1')
    // Remove images
    .replace(/!\[[^\]]*\]\([^\)]*\)/g, '')
    // Remove links but keep text
    .replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1')
    // Remove headings
    .replace(/^#{1,6}\s+/gm, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove emphasis and strong
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Remove strikethrough
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove unordered list markers
    .replace(/^\s*[-+*]\s+/gm, '')
    // Remove ordered list numbers
    .replace(/^\s*\d+\.\s+/gm, '')
    // Trim remaining markdown characters
    .replace(/[*_`~]/g, '')
    .trim();
}
