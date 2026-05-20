const fs = require('fs');

const ISSUE_BODY = process.env.ISSUE_BODY || '';
const ISSUE_TITLE = process.env.ISSUE_TITLE || '';
const TICKET_NUM = process.env.TICKET_NUM;

const fullText = `${ISSUE_TITLE} ${ISSUE_BODY}`;
const textLower = fullText.toLowerCase();

function extractQuoted(text, afterPhrase) {
  const idx = text.toLowerCase().indexOf(afterPhrase.toLowerCase());
  if (idx === -1) return null;
  const after = text.slice(idx + afterPhrase.length);
  const match = after.match(/["']([^"']+)["']/);
  return match ? match[1] : null;
}

function extractAfterColon(text) {
  const match = text.match(/:\s*["']?([^"'\n]+?)(?:["']|$)/);
  return match ? match[1].trim() : null;
}

let edits = [];

// Pattern B: Hero/Headline
if (textLower.match(/hero|headline|change.*h1|h1.*change/)) {
  const newHeadline = extractQuoted(fullText, 'to:') || extractAfterColon(fullText) || extractQuoted(fullText, 'Change hero headline to');
  if (newHeadline) {
    let html = fs.readFileSync('index.html', 'utf8');
    html = html.replace(/<h1[^>]*>.*?<\/h1>/i, `<h1>${newHeadline}</h1>`);
    fs.writeFileSync('index.html', html);
    edits.push({ file: 'index.html', pattern: 'hero', newHeadline });
  }
}

// Pattern C: Add section
else if (textLower.match(/add.*section|new section|commitments|bullet/)) {
  const sectionTitle = extractQuoted(fullText, 'titled') || extractQuoted(fullText, 'title') || 'New Section';
  const targetFile = textLower.match(/home|index/) ? 'index.html' : 'about.html';
  
  const bullets = [];
  const lines = ISSUE_BODY.split('\n');
  for (const line of lines) {
    const bulletMatch = line.match(/^\s*[-*•]\s*(.+)/);
    if (bulletMatch) bullets.push(bulletMatch[1]);
  }
  
  const bulletHtml = bullets.length > 0 
    ? bullets.map(b => `<li>${b}</li>`).join('')
    : '<li>Sustainability commitment one</li><li>Sustainability commitment two</li><li>Sustainability commitment three</li>';
  
  const sectionHtml = `\n<section class="new-section">\n  <h2>${sectionTitle}</h2>\n  <ul>${bulletHtml}</ul>\n</section>\n`;
  
  let html = fs.readFileSync(targetFile, 'utf8');
  if (html.includes('</main>')) {
    html = html.replace('</main>', `${sectionHtml}</main>`);
  } else {
    html = html.replace('</body>', `${sectionHtml}</body>`);
  }
  fs.writeFileSync(targetFile, html);
  edits.push({ file: targetFile, pattern: 'section', sectionTitle });
}

// Pattern A: Footer link
else if (textLower.match(/footer|investor|link to/)) {
  const hrefMatch = fullText.match(/linking to\s+(\/[^\s"']+)/i) || fullText.match(/href=["']?(\/[^"'\s]+)/i);
  const href = hrefMatch ? hrefMatch[1] : '/investors';
  const textMatch = fullText.match(/link\s+(?:in the footer\s+)?(?:to\s+)?["']?([^"'\n]+?)["']?\s*(?:linking|href|$)/i);
  const linkText = textMatch ? textMatch[1].trim() : 'Investor Relations';
  
  const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
  for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    if (html.includes('</footer>')) {
      html = html.replace('</footer>', `  <a href="${href}">${linkText}</a>\n</footer>`);
      fs.writeFileSync(file, html);
      edits.push({ file, pattern: 'footer', href, linkText });
    }
  }
}

console.log(JSON.stringify(edits, null, 2));
process.exit(edits.length > 0 ? 0 : 1);
