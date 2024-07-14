// default-python-code.ts
export const defaultPythonCode = `import torch
import torch.nn as nn
import torch.nn.functional as F
device = "cuda" if torch.cuda.is_available() else "cpu"

# Example Usage:
query, key, value = torch.randn(2, 3, 8, device=device), torch.randn(2, 3, 8, device=device), torch.randn(2, 3, 8, device=device)

@torch.compile
def scaled_dot_product_attention(query, key, value):
    return F.scaled_dot_product_attention(query, key, value)

result = scaled_dot_product_attention(query, key, value)
print(f"Result shape: {result.shape}")
print(f"Result device: {result.device}")`;
