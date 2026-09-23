import json
import asyncio
from typing import Dict, Set, Callable, Any
from backend.app.core.logging import logger

# In-memory pub/sub registry for WebSocket and background worker event fanout
_subscribers: Dict[str, Set[Callable]] = {}

def publish_event(channel: str, message: Any):
    """Publish an event to local and distributed subscribers."""
    payload = json.dumps(message, default=str) if not isinstance(message, str) else message
    if channel in _subscribers:
        for callback in list(_subscribers[channel]):
            try:
                if asyncio.iscoroutinefunction(callback):
                    asyncio.create_task(callback(payload))
                else:
                    callback(payload)
            except Exception as e:
                logger.error(f"Error dispatching pubsub callback on channel {channel}: {e}")

def subscribe_event(channel: str, callback: Callable):
    if channel not in _subscribers:
        _subscribers[channel] = set()
    _subscribers[channel].add(callback)

def unsubscribe_event(channel: str, callback: Callable):
    if channel in _subscribers and callback in _subscribers[channel]:
        _subscribers[channel].remove(callback)
