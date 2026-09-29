from src.ingestion.base_extractor import BaseExtractor

class RawPasteExtractor(BaseExtractor):
    async def extract(self, text: str) -> list[dict]:
        # Very simple heuristic: split by 'User:' and 'AI:' 
        # For a robust version, we'd use a small LLM or strict regex
        messages = []
        lines = text.split('\n')
        
        current_role = "user"
        current_content = []
        
        for line in lines:
            if line.lower().startswith("user:"):
                if current_content:
                    messages.append({"role": current_role, "content": "\n".join(current_content).strip()})
                current_role = "user"
                current_content = [line[5:].strip()]
            elif line.lower().startswith("ai:") or line.lower().startswith("assistant:"):
                if current_content:
                    messages.append({"role": current_role, "content": "\n".join(current_content).strip()})
                current_role = "assistant"
                prefix_len = 3 if line.lower().startswith("ai:") else 10
                current_content = [line[prefix_len:].strip()]
            else:
                current_content.append(line)
                
        if current_content:
            messages.append({"role": current_role, "content": "\n".join(current_content).strip()})
            
        return messages
