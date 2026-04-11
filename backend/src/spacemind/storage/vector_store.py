"""
SpaceMind OS — Vector Memory Store
Lazy-loaded ChromaDB wrapper for semantic retrieval of past decompositions.
Only initialized when settings.enable_vector_memory=True.

Usage:
    vs = VectorStore.get_instance()
    vs.upsert(doc_id, text, metadata)
    results = vs.query(text, n_results=3)
"""
from __future__ import annotations

import threading
from typing import Any

from spacemind.core.logging import log

_COLLECTION_NAME = "spacemind_decompositions"
_lock = threading.Lock()
_instance: VectorStore | None = None


class VectorStore:
    """
    Singleton ChromaDB collection for decomposition embeddings.
    Uses ChromaDB's default embedding function (all-MiniLM-L6-v2).
    The database is stored under ./data/chromadb/ relative to CWD.
    """

    def __init__(self):
        import chromadb
        from chromadb.config import Settings as ChromaSettings

        self._client = chromadb.PersistentClient(
            path="./data/chromadb",
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self._collection = self._client.get_or_create_collection(
            name=_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        count = self._collection.count()
        log.info(f"[VectorStore] Initialized — {count} documents in collection")

    @classmethod
    def get_instance(cls) -> VectorStore:
        global _instance
        if _instance is None:
            with _lock:
                if _instance is None:
                    _instance = cls()
        return _instance

    def upsert(self, doc_id: str, text: str, metadata: dict[str, Any]) -> None:
        """Embed and upsert a document into the collection."""
        try:
            self._collection.upsert(
                ids=[doc_id],
                documents=[text],
                metadatas=[metadata],
            )
            log.debug(f"[VectorStore] Upserted {doc_id}")
        except Exception as e:
            log.warning(f"[VectorStore] Upsert failed for {doc_id}: {e}")

    def query(self, text: str, n_results: int = 3) -> list[dict[str, Any]]:
        """Query for semantically similar past decompositions."""
        count = self._collection.count()
        if count == 0:
            return []

        n_results = min(n_results, count)
        try:
            results = self._collection.query(
                query_texts=[text],
                n_results=n_results,
                include=["metadatas", "distances"],
            )
            cases = []
            metadatas = results.get("metadatas", [[]])[0]
            distances = results.get("distances", [[]])[0]
            for meta, dist in zip(metadatas, distances):
                if dist < 0.5:  # Only return sufficiently similar cases (cosine distance < 0.5)
                    cases.append(meta)
            return cases
        except Exception as e:
            log.warning(f"[VectorStore] Query failed: {e}")
            return []

    def count(self) -> int:
        return self._collection.count()

    def delete(self, doc_id: str) -> None:
        self._collection.delete(ids=[doc_id])
