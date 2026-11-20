import type { Character } from '../domain/schema'
import { buildPdfDoc, TABLE_LAYOUTS, type PdfOptions } from './buildDoc'

/**
 * Generates the PDF entirely in the browser. pdfmake and its embedded Roboto
 * fonts are bundled (lazy chunk, precached by the service worker), so this
 * works offline. Nothing is uploaded or sent anywhere.
 */
export async function renderPdf(c: Character, o: PdfOptions): Promise<Blob> {
  const [{ default: pdfMake }, vfsModule] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ])
  const vfs = (vfsModule as { default?: unknown }).default ?? vfsModule
  pdfMake.addVirtualFileSystem(vfs as Parameters<typeof pdfMake.addVirtualFileSystem>[0])
  pdfMake.addTableLayouts(TABLE_LAYOUTS as unknown as Parameters<typeof pdfMake.addTableLayouts>[0])
  return pdfMake.createPdf(buildPdfDoc(c, o)).getBlob()
}
