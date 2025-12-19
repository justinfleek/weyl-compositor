"""
Weyl API Proxy - Secure backend proxy for AI API calls

This module provides secure proxy endpoints for OpenAI and Anthropic APIs.
API keys are read from environment variables, never exposed to the frontend.

Environment Variables:
  - OPENAI_API_KEY: OpenAI API key for GPT-4V/GPT-4o
  - ANTHROPIC_API_KEY: Anthropic API key for Claude Vision

Usage:
  Frontend calls /weyl/api/vision/openai or /weyl/api/vision/anthropic
  instead of calling external APIs directly.
"""

import os
import json
import logging
from typing import Optional

logger = logging.getLogger("weyl.api_proxy")

# API key cache (loaded from environment on first use)
_api_keys: dict[str, Optional[str]] = {
    'openai': None,
    'anthropic': None,
    '_loaded': False
}

def _load_api_keys():
    """Load API keys from environment variables"""
    global _api_keys
    if _api_keys['_loaded']:
        return

    _api_keys['openai'] = os.environ.get('OPENAI_API_KEY')
    _api_keys['anthropic'] = os.environ.get('ANTHROPIC_API_KEY')
    _api_keys['_loaded'] = True

    # Log availability (not the actual keys)
    if _api_keys['openai']:
        logger.info("OpenAI API key loaded from environment")
    if _api_keys['anthropic']:
        logger.info("Anthropic API key loaded from environment")


def get_api_key(provider: str) -> Optional[str]:
    """Get API key for a provider"""
    _load_api_keys()
    return _api_keys.get(provider)


def has_api_key(provider: str) -> bool:
    """Check if API key is available for a provider"""
    return get_api_key(provider) is not None


# Register routes when running in ComfyUI
try:
    from server import PromptServer
    from aiohttp import web
    import aiohttp

    routes = PromptServer.instance.routes

    @routes.get('/weyl/api/status')
    async def api_status(request):
        """Check which API keys are configured"""
        _load_api_keys()
        return web.json_response({
            "status": "success",
            "providers": {
                "openai": has_api_key('openai'),
                "anthropic": has_api_key('anthropic'),
            }
        })

    @routes.post('/weyl/api/vision/openai')
    async def proxy_openai(request):
        """
        Proxy requests to OpenAI API

        Expected request body:
        {
            "model": "gpt-4o" | "gpt-4-vision-preview",
            "messages": [...],
            "max_tokens": 2048,
            "temperature": 0.7
        }
        """
        api_key = get_api_key('openai')
        if not api_key:
            return web.json_response({
                "status": "error",
                "message": "OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
            }, status=503)

        try:
            data = await request.json()

            # Validate required fields
            if 'messages' not in data:
                return web.json_response({
                    "status": "error",
                    "message": "Missing 'messages' field"
                }, status=400)

            # Build request to OpenAI
            openai_request = {
                "model": data.get('model', 'gpt-4o'),
                "messages": data['messages'],
                "max_tokens": data.get('max_tokens', 2048),
                "temperature": data.get('temperature', 0.7),
            }

            # Forward to OpenAI
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'https://api.openai.com/v1/chat/completions',
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {api_key}',
                    },
                    json=openai_request,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    result = await response.json()

                    if response.status != 200:
                        return web.json_response({
                            "status": "error",
                            "message": result.get('error', {}).get('message', 'OpenAI API error'),
                            "details": result
                        }, status=response.status)

                    return web.json_response({
                        "status": "success",
                        "data": result
                    })

        except aiohttp.ClientError as e:
            logger.error(f"OpenAI API request failed: {e}")
            return web.json_response({
                "status": "error",
                "message": f"Network error: {str(e)}"
            }, status=502)
        except json.JSONDecodeError:
            return web.json_response({
                "status": "error",
                "message": "Invalid JSON in request body"
            }, status=400)
        except Exception as e:
            logger.error(f"OpenAI proxy error: {e}")
            return web.json_response({
                "status": "error",
                "message": f"Internal error: {str(e)}"
            }, status=500)

    @routes.post('/weyl/api/vision/anthropic')
    async def proxy_anthropic(request):
        """
        Proxy requests to Anthropic API

        Expected request body:
        {
            "model": "claude-3-5-sonnet-20241022",
            "messages": [...],
            "max_tokens": 2048,
            "temperature": 0.7
        }
        """
        api_key = get_api_key('anthropic')
        if not api_key:
            return web.json_response({
                "status": "error",
                "message": "Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable."
            }, status=503)

        try:
            data = await request.json()

            # Validate required fields
            if 'messages' not in data:
                return web.json_response({
                    "status": "error",
                    "message": "Missing 'messages' field"
                }, status=400)

            # Build request to Anthropic
            anthropic_request = {
                "model": data.get('model', 'claude-3-5-sonnet-20241022'),
                "messages": data['messages'],
                "max_tokens": data.get('max_tokens', 2048),
            }

            # Only add temperature if specified (Anthropic has different defaults)
            if 'temperature' in data:
                anthropic_request['temperature'] = data['temperature']

            # Forward to Anthropic
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'https://api.anthropic.com/v1/messages',
                    headers={
                        'Content-Type': 'application/json',
                        'x-api-key': api_key,
                        'anthropic-version': '2023-06-01',
                    },
                    json=anthropic_request,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    result = await response.json()

                    if response.status != 200:
                        return web.json_response({
                            "status": "error",
                            "message": result.get('error', {}).get('message', 'Anthropic API error'),
                            "details": result
                        }, status=response.status)

                    return web.json_response({
                        "status": "success",
                        "data": result
                    })

        except aiohttp.ClientError as e:
            logger.error(f"Anthropic API request failed: {e}")
            return web.json_response({
                "status": "error",
                "message": f"Network error: {str(e)}"
            }, status=502)
        except json.JSONDecodeError:
            return web.json_response({
                "status": "error",
                "message": "Invalid JSON in request body"
            }, status=400)
        except Exception as e:
            logger.error(f"Anthropic proxy error: {e}")
            return web.json_response({
                "status": "error",
                "message": f"Internal error: {str(e)}"
            }, status=500)

    @routes.post('/weyl/api/ai/agent')
    async def ai_agent(request):
        """
        AI Compositor Agent endpoint

        Handles LLM requests with tool calling support for the Weyl Compositor.
        Supports both OpenAI and Anthropic models.

        Expected request body:
        {
            "model": "gpt-4o" | "claude-sonnet" | "local",
            "messages": [...],
            "tools": [...],  // Tool definitions
            "max_tokens": 4096,
            "temperature": 0.3
        }

        Returns:
        {
            "status": "success",
            "data": {
                "content": "...",
                "toolCalls": [...]  // Parsed tool calls if any
            }
        }
        """
        try:
            data = await request.json()
            model = data.get('model', 'gpt-4o')
            messages = data.get('messages', [])
            tools = data.get('tools', [])
            max_tokens = data.get('max_tokens', 4096)
            temperature = data.get('temperature', 0.3)

            if not messages:
                return web.json_response({
                    "status": "error",
                    "message": "Missing 'messages' field"
                }, status=400)

            # Route to appropriate provider
            if model in ('gpt-4o', 'gpt-4', 'gpt-4-turbo'):
                return await _call_openai_agent(messages, tools, model, max_tokens, temperature)
            elif model in ('claude-sonnet', 'claude-3-5-sonnet-20241022'):
                return await _call_anthropic_agent(messages, tools, max_tokens, temperature)
            elif model == 'local':
                return web.json_response({
                    "status": "error",
                    "message": "Local model not yet implemented"
                }, status=501)
            else:
                return web.json_response({
                    "status": "error",
                    "message": f"Unknown model: {model}"
                }, status=400)

        except json.JSONDecodeError:
            return web.json_response({
                "status": "error",
                "message": "Invalid JSON in request body"
            }, status=400)
        except Exception as e:
            logger.error(f"AI agent error: {e}")
            return web.json_response({
                "status": "error",
                "message": f"Internal error: {str(e)}"
            }, status=500)

    async def _call_openai_agent(messages, tools, model, max_tokens, temperature):
        """Call OpenAI API with tool support"""
        api_key = get_api_key('openai')
        if not api_key:
            return web.json_response({
                "status": "error",
                "message": "OpenAI API key not configured. Set OPENAI_API_KEY environment variable."
            }, status=503)

        try:
            # Build OpenAI request with tools
            openai_request = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            }

            # Add tools if provided
            if tools:
                openai_request["tools"] = tools
                openai_request["tool_choice"] = "auto"

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'https://api.openai.com/v1/chat/completions',
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {api_key}',
                    },
                    json=openai_request,
                    timeout=aiohttp.ClientTimeout(total=120)  # Longer timeout for agent calls
                ) as response:
                    result = await response.json()

                    if response.status != 200:
                        return web.json_response({
                            "status": "error",
                            "message": result.get('error', {}).get('message', 'OpenAI API error'),
                            "details": result
                        }, status=response.status)

                    # Parse response
                    choice = result.get('choices', [{}])[0]
                    message = choice.get('message', {})
                    content = message.get('content', '')

                    # Parse tool calls if present
                    tool_calls = None
                    if 'tool_calls' in message:
                        tool_calls = []
                        for tc in message['tool_calls']:
                            tool_calls.append({
                                "id": tc['id'],
                                "name": tc['function']['name'],
                                "arguments": json.loads(tc['function'].get('arguments', '{}'))
                            })

                    return web.json_response({
                        "status": "success",
                        "data": {
                            "content": content,
                            "toolCalls": tool_calls
                        }
                    })

        except aiohttp.ClientError as e:
            logger.error(f"OpenAI agent request failed: {e}")
            return web.json_response({
                "status": "error",
                "message": f"Network error: {str(e)}"
            }, status=502)

    async def _call_anthropic_agent(messages, tools, max_tokens, temperature):
        """Call Anthropic API with tool support"""
        api_key = get_api_key('anthropic')
        if not api_key:
            return web.json_response({
                "status": "error",
                "message": "Anthropic API key not configured. Set ANTHROPIC_API_KEY environment variable."
            }, status=503)

        try:
            # Convert OpenAI-style tools to Anthropic format
            anthropic_tools = []
            for tool in tools:
                if tool.get('type') == 'function':
                    func = tool['function']
                    anthropic_tools.append({
                        "name": func['name'],
                        "description": func.get('description', ''),
                        "input_schema": func.get('parameters', {"type": "object", "properties": {}})
                    })

            # Extract system message if present
            system_message = None
            user_messages = []
            for msg in messages:
                if msg.get('role') == 'system':
                    system_message = msg.get('content', '')
                else:
                    user_messages.append(msg)

            # Build Anthropic request
            anthropic_request = {
                "model": "claude-3-5-sonnet-20241022",
                "messages": user_messages,
                "max_tokens": max_tokens,
            }

            if system_message:
                anthropic_request["system"] = system_message

            if anthropic_tools:
                anthropic_request["tools"] = anthropic_tools

            if temperature is not None:
                anthropic_request["temperature"] = temperature

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'https://api.anthropic.com/v1/messages',
                    headers={
                        'Content-Type': 'application/json',
                        'x-api-key': api_key,
                        'anthropic-version': '2023-06-01',
                    },
                    json=anthropic_request,
                    timeout=aiohttp.ClientTimeout(total=120)
                ) as response:
                    result = await response.json()

                    if response.status != 200:
                        return web.json_response({
                            "status": "error",
                            "message": result.get('error', {}).get('message', 'Anthropic API error'),
                            "details": result
                        }, status=response.status)

                    # Parse response - Anthropic uses content blocks
                    content_blocks = result.get('content', [])
                    text_content = ''
                    tool_calls = []

                    for block in content_blocks:
                        if block.get('type') == 'text':
                            text_content += block.get('text', '')
                        elif block.get('type') == 'tool_use':
                            tool_calls.append({
                                "id": block['id'],
                                "name": block['name'],
                                "arguments": block.get('input', {})
                            })

                    return web.json_response({
                        "status": "success",
                        "data": {
                            "content": text_content,
                            "toolCalls": tool_calls if tool_calls else None
                        }
                    })

        except aiohttp.ClientError as e:
            logger.error(f"Anthropic agent request failed: {e}")
            return web.json_response({
                "status": "error",
                "message": f"Network error: {str(e)}"
            }, status=502)

    logger.info("Weyl API proxy routes registered (including AI agent)")

except ImportError:
    # Not running in ComfyUI context
    pass
