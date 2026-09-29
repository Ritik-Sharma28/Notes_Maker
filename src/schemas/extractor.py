from pydantic import BaseModel, Field

class CodeBlockExtract(BaseModel):
    label: str = Field(description="A short descriptive label for what this code demonstrates")
    language: str = Field(description="The programming language, e.g., python, javascript, bash")
    code: str = Field(description="The actual source code, preserved exactly as in the conversation")

class ComparisonTableExtract(BaseModel):
    title: str = Field(description="Title describing what is being compared")
    headers: list[str] = Field(description="Column headers for the comparison")
    rows: list[list[str]] = Field(description="Each row is a list of cell values matching the headers")

class TopicGroup(BaseModel):
    topic_guess: str = Field(
        description="A clear, specific title for this topic. Use the most descriptive name possible. "
                    "e.g., 'Server Components vs Client Components in Next.js' not just 'Components'"
    )
    angle: str = Field(
        description="The specific perspective or intent behind this part of the conversation. "
                    "Examples: 'definition', 'beginner explanation', 'comparison with X', "
                    "'deep dive', 'troubleshooting', 'practical example'. "
                    "This helps differentiate 'What is Node.js?' from 'Node.js vs Express.js'"
    )
    key_question: str = Field(
        description="The core question the user was trying to answer in this segment. "
                    "e.g., 'What is the difference between SSR and CSR?'"
    )
    raw_facts: list[str] = Field(
        description="List of every factual statement, definition, explanation, and insight "
                    "extracted from this segment. Extract LOSSLESSLY — do NOT summarize, "
                    "compress, or paraphrase. Each fact should be a complete, standalone statement. "
                    "Include nuances, caveats, and corrections the user made mid-conversation."
    )
    code_blocks: list[CodeBlockExtract] = Field(default_factory=list)
    comparison_tables: list[ComparisonTableExtract] = Field(default_factory=list)

class ExtractorOutput(BaseModel):
    groups: list[TopicGroup]
