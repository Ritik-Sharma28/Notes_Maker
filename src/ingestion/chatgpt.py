from playwright.async_api import async_playwright
import json
import logging
from src.ingestion.base_extractor import BaseExtractor

logger = logging.getLogger(__name__)

class ChatGPTExtractor(BaseExtractor):
    async def extract(self, url: str) -> list[dict]:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                )
            )
            
            logger.info(f"Navigating to {url}")
            await page.goto(url, wait_until="networkidle", timeout=30000)
            
            # Give React Router a moment to hydrate and populate the global
            await page.wait_for_timeout(2000)
            
            raw = await page.evaluate(
                """() => {
                    try {
                        return JSON.stringify(window.__reactRouterDataRouter?.state?.loaderData || null);
                    } catch (e) {
                        return null;
                    }
                }"""
            )
            
            loader_data = json.loads(raw) if raw and raw != "null" else None
            
            if not loader_data:
                logger.warning("__reactRouterDataRouter path returned nothing. Trying legacy __NEXT_DATA__...")
                next_data_raw = await page.evaluate(
                    """() => {
                        const el = document.getElementById('__NEXT_DATA__');
                        return el ? el.textContent : null;
                    }"""
                )
                if next_data_raw:
                    loader_data = json.loads(next_data_raw)
                    
            await browser.close()
            
            if not loader_data:
                raise ValueError("Could not locate conversation data via known React paths. The share link DOM may have changed.")
                
            messages = self._extract_from_loader(loader_data)
            if not messages:
                raise ValueError("Found loader data but couldn't linearize any messages. Structure may differ.")
                
            return messages

    def _extract_from_loader(self, loader_data: dict) -> list[dict]:
        trees = []
        def walk(obj, path=""):
            if isinstance(obj, dict):
                if "mapping" in obj and isinstance(obj["mapping"], dict):
                    trees.append((path, obj))
                for k, v in obj.items():
                    walk(v, f"{path}.{k}")
            elif isinstance(obj, list):
                for i, v in enumerate(obj):
                    walk(v, f"{path}[{i}]")
                    
        walk(loader_data)
        
        if not trees:
            return []
            
        _, tree_obj = trees[0]
        return self._linearize_mapping(tree_obj["mapping"])
        
    def _linearize_mapping(self, mapping: dict) -> list[dict]:
        root_id = None
        for node_id, node in mapping.items():
            if node.get("parent") is None:
                root_id = node_id
                break

        if root_id is None:
            return []

        ordered = []
        current_id = root_id
        visited = set()

        while current_id and current_id not in visited:
            visited.add(current_id)
            node = mapping.get(current_id, {})
            message = node.get("message")

            if message:
                role = message.get("author", {}).get("role")
                parts = message.get("content", {}).get("parts", [])
                text = "\n".join(p for p in parts if isinstance(p, str))
                if role in ("user", "assistant") and text.strip():
                    ordered.append({"role": role, "content": text.strip()})

            children = node.get("children", [])
            current_id = children[0] if children else None

        return ordered
