import re
import math
from typing import List, Dict

def tokenize(text: str) -> List[str]:
    """Tokenize and normalize text for vector similarity."""
    clean = re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower())
    tokens = [w for w in clean.split() if len(w) > 2]
    return tokens

def compute_tf(tokens: List[str]) -> Dict[str, float]:
    tf: Dict[str, float] = {}
    total = len(tokens) or 1
    for t in tokens:
        tf[t] = tf.get(t, 0.0) + 1.0 / total
    return tf

def cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    """Compute cosine similarity between two term-frequency sparse vectors."""
    dot_product = 0.0
    for term, val in vec1.items():
        if term in vec2:
            dot_product += val * vec2[term]
            
    norm1 = math.sqrt(sum(v * v for v in vec1.values()))
    norm2 = math.sqrt(sum(v * v for v in vec2.values()))
    
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
        
    return dot_product / (norm1 * norm2)

def calculate_text_similarity(text1: str, text2: str) -> float:
    """Calculate semantic/keyword similarity between two civic descriptions."""
    tokens1 = tokenize(text1)
    tokens2 = tokenize(text2)
    tf1 = compute_tf(tokens1)
    tf2 = compute_tf(tokens2)
    return min(1.0, max(0.0, cosine_similarity(tf1, tf2)))
