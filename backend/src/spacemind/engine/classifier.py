"""
SpaceMind OS — Request Classifier
Two-stage: fast keyword match, then Claude Haiku for ambiguous cases.
"""
from spacemind.ai.client import AIClient
from spacemind.core.constants import REQUEST_KEYWORDS, RequestType
from spacemind.core.logging import log


class RequestClassifier:
    def __init__(self, ai_client: AIClient):
        self._ai = ai_client

    def classify(self, request_text: str) -> RequestType:
        """
        Stage 1: Keyword scan (fast, free).
        Stage 2: AI classification (for ambiguous requests).
        """
        keyword_result = self._keyword_classify(request_text)
        if keyword_result != RequestType.UNKNOWN:
            log.info(f"Keyword classified as: {keyword_result}")
            return keyword_result

        # Ambiguous — fall back to AI
        log.info("Keyword classification inconclusive — calling AI classifier")
        ai_result = self._ai.classify_request(request_text)
        try:
            return RequestType(ai_result)
        except ValueError:
            log.warning(f"AI returned unknown type '{ai_result}' — defaulting to UNKNOWN")
            return RequestType.UNKNOWN

    def _keyword_classify(self, text: str) -> RequestType:
        text_lower = text.lower()
        scores: dict[RequestType, int] = {}

        for request_type, keywords in REQUEST_KEYWORDS.items():
            hits = sum(1 for kw in keywords if kw in text_lower)
            if hits > 0:
                scores[RequestType(request_type)] = hits

        if not scores:
            return RequestType.UNKNOWN

        best = max(scores, key=lambda k: scores[k])
        return best
