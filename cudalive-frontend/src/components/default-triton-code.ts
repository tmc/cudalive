// default-triton-code.ts
export const defaultTritonCode = `
import triton
import triton.language as tl

@triton.jit
def example_kernel(x_ptr, y_ptr, n):
    # Triton kernel code...
    pass

# More Triton code...
`;