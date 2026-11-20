import type { PdfPage } from './parse'

/** Minimal shape of a pdf.js document (browser or Node build). */
export type PdfDoc = {
  numPages: number
  getPage: (n: number) => Promise<{
    getViewport: (o: { scale: number }) => { width: number }
    getTextContent: () => Promise<{ items: unknown[] }>
  }>
}

/** Positioned text of pages [from, to] — runs on the player's own PDF, locally. */
export async function extractPages(
  doc: PdfDoc,
  from: number,
  to: number,
  onProgress?: (done: number, total: number) => void,
): Promise<PdfPage[]> {
  const out: PdfPage[] = []
  const last = Math.min(to, doc.numPages)
  for (let n = from; n <= last; n++) {
    const page = await doc.getPage(n)
    const width = page.getViewport({ scale: 1 }).width
    const tc = await page.getTextContent()
    const items = (tc.items as { str?: string; transform?: number[]; width?: number }[])
      .filter((i) => typeof i.str === 'string' && Array.isArray(i.transform))
      .map((i) => ({
        str: i.str!,
        x: i.transform![4]!,
        y: i.transform![5]!,
        ...(typeof i.width === 'number' ? { w: i.width } : {}),
      }))
    out.push({ page: n, width, items })
    onProgress?.(n - from + 1, last - from + 1)
  }
  return out
}

/**
 * Browser entry point: reads every page of the PDF the player picked
 * (careers, weapon tables and qualities). pdf.js is loaded on demand.
 */
export async function readRulebookPages(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<PdfPage[]> {
  const pdfjs = await import('pdfjs-dist')
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
  const data = new Uint8Array(await file.arrayBuffer())
  const doc = (await pdfjs.getDocument({ data, disableFontFace: true })
    .promise) as unknown as PdfDoc
  return extractPages(doc, 1, doc.numPages, onProgress)
}
