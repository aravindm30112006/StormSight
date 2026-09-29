"""
ConvLSTM Nowcasting Model — SIH 26072
Implements ConvLSTM encoder-decoder for radar extrapolation.
Falls back to numpy-based inference if PyTorch is not available.
"""

import numpy as np

# ── Try importing PyTorch (optional for demo mode) ────────
try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("WARNING: PyTorch not found -- using NumPy-based ConvLSTM simulation (demo mode)")



# ════════════════════════════════════════════════════════════
#  PyTorch Implementation (used when torch is available)
# ════════════════════════════════════════════════════════════
if TORCH_AVAILABLE:
    class ConvLSTMCell(nn.Module):
        """Single ConvLSTM cell with input, forget, output and cell gates."""

        def __init__(self, input_dim, hidden_dim, kernel_size, bias=True):
            super().__init__()
            self.hidden_dim = hidden_dim
            padding = kernel_size[0] // 2, kernel_size[1] // 2
            # Single conv projects concatenated [input, hidden] → 4 gate maps
            self.conv = nn.Conv2d(
                in_channels=input_dim + hidden_dim,
                out_channels=4 * hidden_dim,
                kernel_size=kernel_size,
                padding=padding,
                bias=bias,
            )

        def forward(self, x, state):
            h, c = state
            gates = self.conv(torch.cat([x, h], dim=1))
            i, f, o, g = torch.split(gates, self.hidden_dim, dim=1)
            i, f, o = torch.sigmoid(i), torch.sigmoid(f), torch.sigmoid(o)
            g = torch.tanh(g)
            c_next = f * c + i * g
            h_next = o * torch.tanh(c_next)
            return h_next, c_next

        def init_hidden(self, batch, h, w):
            dev = self.conv.weight.device
            return (
                torch.zeros(batch, self.hidden_dim, h, w, device=dev),
                torch.zeros(batch, self.hidden_dim, h, w, device=dev),
            )

    class ConvLSTM(nn.Module):
        """Multi-layer stacked ConvLSTM."""

        def __init__(self, input_dim, hidden_dim, kernel_size, num_layers, bias=True):
            super().__init__()
            self.cells = nn.ModuleList()
            for i in range(num_layers):
                in_d = input_dim if i == 0 else hidden_dim
                self.cells.append(ConvLSTMCell(in_d, hidden_dim, kernel_size, bias))

        def forward(self, seq, hidden=None):
            # seq: (B, T, C, H, W)
            B, T, C, H, W = seq.shape
            if hidden is None:
                hidden = [cell.init_hidden(B, H, W) for cell in self.cells]
            outputs = []
            for t in range(T):
                x = seq[:, t]
                for i, cell in enumerate(self.cells):
                    x, c = cell(x, hidden[i])
                    hidden[i] = (x, c)
                outputs.append(x.unsqueeze(1))
            return torch.cat(outputs, dim=1), hidden

    class NowcastingModel(nn.Module):
        """
        ConvLSTM encoder-decoder for radar nowcasting.

        Input:  (B, T_in=6,  C=1, H=64, W=64)  — 6 radar frames
        Output: (B, T_out=18, H=64, W=64)        — 18 forecast frames (10-min steps)
        """

        def __init__(self, hidden_dim=16):
            super().__init__()
            self.encoder = ConvLSTM(1, hidden_dim, (3, 3), num_layers=2)
            self.decoder = ConvLSTM(hidden_dim, hidden_dim, (3, 3), num_layers=2)
            self.head = nn.Sequential(
                nn.Conv2d(hidden_dim, hidden_dim, 3, padding=1),
                nn.ReLU(),
                nn.Conv2d(hidden_dim, 1, 1),
                nn.ReLU(),  # reflectivity ≥ 0
            )

        def forward(self, x, pred_len=18):
            B, _, _, H, W = x.shape
            # Encode past frames
            _, hidden = self.encoder(x)
            # Decode future frames autoregressively
            outputs = []
            dec_in = torch.zeros(B, 1, 16, H, W, device=x.device)
            for _ in range(pred_len):
                dec_out, hidden = self.decoder(dec_in, hidden)
                frame = self.head(dec_out[:, 0])  # (B, 1, H, W)
                outputs.append(frame.unsqueeze(1))
                dec_in = dec_out
            return torch.cat(outputs, dim=1).squeeze(2)  # (B, T, H, W)


# ════════════════════════════════════════════════════════════
#  NumPy Fallback (runs when torch is not installed)
# ════════════════════════════════════════════════════════════
class _NumpyNowcastingModel:
    """
    Pure-NumPy ConvLSTM approximation for demo mode.
    Uses spatial smoothing + temporal extrapolation to mimic
    deep learning nowcast outputs without requiring PyTorch.
    """

    def predict(self, frames_np: np.ndarray, pred_len: int = 18) -> np.ndarray:
        """
        frames_np: (T_in, H, W) array of reflectivity values
        Returns:   (pred_len, H, W) array of forecast frames
        """
        from scipy.ndimage import gaussian_filter

        T, H, W = frames_np.shape
        # Compute optical-flow-like motion via frame difference
        if T >= 2:
            motion = frames_np[-1] - frames_np[-2]
        else:
            motion = np.zeros((H, W))

        outputs = []
        current = frames_np[-1].copy()
        for step in range(pred_len):
            decay = 1.0 - (step / (pred_len * 1.5))
            next_frame = current + motion * decay
            # Apply slight smoothing to mimic DL output blur
            next_frame = gaussian_filter(next_frame, sigma=0.8)
            next_frame = np.clip(next_frame, 0, 70)
            outputs.append(next_frame)
            current = next_frame
        return np.stack(outputs, axis=0)


def load_or_init_model():
    """
    Returns a NowcastingModel (PyTorch if available, else NumPy fallback).
    Initializes with random weights — in production, load pretrained weights here.
    """
    if TORCH_AVAILABLE:
        model = NowcastingModel(hidden_dim=16)
        model.eval()
        return model
    else:
        return _NumpyNowcastingModel()
