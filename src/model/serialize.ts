/** @author Dogan Kusluoglu */

export function exportDoc(doc: any): string {
  return JSON.stringify(doc, null, 2);
}

export function importDoc(json: string): any {
  try {
    const parsed = JSON.parse(json);
    if (parsed.version !== 1) {
      throw new Error('Unsupported document version');
    }
    return parsed;
  } catch (error) {
    console.error('Failed to import document:', error);
    throw new Error('Invalid document format');
  }
}

export function downloadJson(filename: string, text: string) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
