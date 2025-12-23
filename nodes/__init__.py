"""Lattice Compositor ComfyUI Nodes"""
from .compositor_node import CompositorEditorNode

# Import API proxy to register routes (no exports needed)
from . import lattice_api_proxy  # noqa: F401

# Import layer decomposition to register routes (no exports needed)
from . import lattice_layer_decomposition  # noqa: F401

# Import vectorization service to register routes (no exports needed)
from . import lattice_vectorize  # noqa: F401

# Import ControlNet preprocessors from open-source community projects
# See controlnet_preprocessors.py for full attribution to:
# - Fannovel16 (comfyui_controlnet_aux)
# - Binyr/AIWarper (NormalCrafter)
# - Kijai (ComfyUI-WanAnimatePreprocess)
from . import controlnet_preprocessors  # noqa: F401

# Import audio stem separation service
# Inspired by filliptm's ComfyUI_Fill-Nodes
# Uses Facebook Research's Demucs model
# See lattice_stem_separation.py for full attribution
from . import lattice_stem_separation  # noqa: F401

# Import frame interpolation service
# Inspired by filliptm's ComfyUI_Fill-Nodes
# Uses RIFE (Real-time Intermediate Flow Estimation)
# See lattice_frame_interpolation.py for full attribution
from . import lattice_frame_interpolation  # noqa: F401

__all__ = ['CompositorEditorNode']
