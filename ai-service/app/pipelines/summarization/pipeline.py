import re

class SummarizationPipeline:
    def __init__(self):
        pass
        
    def run(self, title: str, description: str, category: str = "") -> str:
        """
        Generates a lightweight, deterministic 1-2 sentence summary of a complaint
        using rule-based text extraction to avoid heavy NLP dependencies.
        """
        if not description:
            return title.strip() if title else "No details provided."
            
        desc = description.strip()
        
        # Simple sentence extraction (split by period, exclamation, question mark)
        sentences = [s.strip() for s in re.split(r'[.!?]+', desc) if len(s.strip()) > 5]
        
        if not sentences:
            return title.strip() if title else desc[:100] + "..."
            
        # Combine title and first meaningful sentence
        clean_title = title.strip()
        if clean_title.endswith(('.', '!', '?')):
            clean_title = clean_title[:-1]
            
        # If the first sentence is very similar to the title, just use the first sentence
        first_sentence = sentences[0]
        
        if len(first_sentence) < 15 and len(sentences) > 1:
            first_sentence += ". " + sentences[1]
            
        # Capitalize first letter
        first_sentence = first_sentence[0].upper() + first_sentence[1:]
        
        if clean_title.lower() in first_sentence.lower():
            summary = f"{first_sentence}."
        else:
            summary = f"Reported '{clean_title}': {first_sentence}."
            
        # Ensure it doesn't exceed a reasonable length
        if len(summary) > 150:
            summary = summary[:147] + "..."
            
        # Prepend category context if available
        if category and category.lower() not in summary.lower():
            summary = f"[{category}] {summary}"
            
        return summary
