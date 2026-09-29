"""
HTML Renderer — converts markdown notes into premium styled HTML.

Uses:
- markdown-it-py for CommonMark rendering
- Pygments for syntax highlighting
- Jinja2 for template rendering
- Custom CSS for dark-mode premium styling
"""
from datetime import datetime
from markdown_it import MarkdownIt
from jinja2 import Environment, FileSystemLoader
from src.config.constants import BASE_DIR
from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import get_lexer_by_name


def _highlight_code(code: str, name: str, attrs: str) -> str:
    """Pygments-based syntax highlighting for code blocks."""
    if name and name != "mermaid":
        try:
            lexer = get_lexer_by_name(name)
        except Exception:
            lexer = get_lexer_by_name("text")
        formatter = HtmlFormatter(cssclass="codehilite", wrapcode=True)
        return highlight(code, lexer, formatter)

    # Mermaid blocks — render as <pre class="mermaid"> for client-side rendering
    if name == "mermaid":
        return f'<pre class="mermaid">{code}</pre>'

    # Fallback for unknown/no language
    lexer = get_lexer_by_name("text")
    formatter = HtmlFormatter(cssclass="codehilite", wrapcode=True)
    return highlight(code, lexer, formatter)


# Initialize markdown-it with highlighting
md = MarkdownIt("commonmark", {"highlight": _highlight_code}).enable("table")


def render_html(title: str, markdown_content: str) -> str:
    """Render a markdown note into a complete, styled HTML page."""
    html_content = md.render(markdown_content)

    # Load templates
    template_dir = BASE_DIR / "src" / "export" / "templates"
    env = Environment(loader=FileSystemLoader(str(template_dir)))
    template = env.get_template("note.html")

    # Load the CSS
    css_path = template_dir / "styles.css"
    main_css = css_path.read_text(encoding="utf-8")

    # Pygments CSS (minimal — we override most in our custom CSS)
    pygments_css = HtmlFormatter(cssclass="codehilite").get_style_defs()

    return template.render(
        title=title,
        content=html_content,
        pygments_css=pygments_css,
        main_css=main_css,
        generated_at=datetime.now().strftime("%B %d, %Y"),
    )
