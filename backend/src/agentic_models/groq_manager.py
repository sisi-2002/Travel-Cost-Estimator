import os
from typing import Any, Dict


class GroqLLMManager:
    """Minimal Groq client manager skeleton to be wired later."""

    def __init__(self) -> None:
        # Delay import to keep optional until installed
        from groq import Groq  # type: ignore

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in environment variables")

        self.client = Groq(api_key=api_key)
        self.model = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")

    def simple_chat(self, content: str) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": content}],
            temperature=0.3,
        )
        return response.choices[0].message.content  # type: ignore

    def generate_explanation(self, agent_name: str, decision_data: Dict[str, Any]) -> str:
        prompt = (
            f"As {agent_name}, explain your decision. Data: {decision_data}. "
            "Provide approach, alternatives, confidence, and risks."
        )
        return self.simple_chat(prompt)


