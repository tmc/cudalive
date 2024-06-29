// default-python-code.ts
export const defaultPythonCode = `import torch
import os

@torch.compile
def apply_sin_four_times(input_tensor):
    for _ in range(4):
        input_tensor = torch.sin(input_tensor)
    return input_tensor

input_tensor = torch.randn(1, 100)
result = apply_sin_four_times(input_tensor)

print(f"Result shape: {result.shape}")
print(f"Result device: {result.device}")
`;
