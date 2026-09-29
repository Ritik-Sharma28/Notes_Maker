"""
PDF Renderer — converts markdown notes into PDF using Playwright.

WeasyPrint requires GTK3 libraries which are problematic on Windows.
Instead, we use Playwright (already a project dependency for chat extraction)
to render the styled HTML and print it to PDF. This produces pixel-perfect
PDFs that match the browser preview exactly.
"""
import tempfile
import os
import logging
from src.export.html_renderer import render_html

logger = logging.getLogger(__name__)


async def render_pdf_async(title: str, markdown_content: str) -> str:
    """Render a markdown note into a PDF file asynchronously. Returns the file path."""
    from playwright.async_api import async_playwright

    html_str = render_html(title, markdown_content)

    # Create a temporary PDF file
    fd, path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            await page.set_content(html_str, wait_until="networkidle")

            # Wait for fonts to load
            await page.wait_for_timeout(1500)

            await page.pdf(
                path=path,
                format="A4",
                margin={"top": "20mm", "right": "15mm", "bottom": "20mm", "left": "15mm"},
                print_background=True,
            )

            await browser.close()

        logger.info(f"PDF generated: {path}")
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        with open(path, "w") as f:
            f.write(f"PDF generation failed: {e}\n")
            f.write("Make sure Playwright browsers are installed: python -m playwright install chromium\n")

    return path


def render_pdf(title: str, markdown_content: str) -> str:
    """Sync wrapper for backward compatibility. Use render_pdf_async when possible."""
    import asyncio
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(render_pdf_async(title, markdown_content))
    finally:
        loop.close()
