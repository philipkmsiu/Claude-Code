export async function readClipboardText(): Promise<string> {
  try {
    if (navigator.clipboard?.readText) {
      return await navigator.clipboard.readText()
    }
  } catch {
    // Permission denied or insecure context — caller can fall back to paste.
  }
  return ''
}
