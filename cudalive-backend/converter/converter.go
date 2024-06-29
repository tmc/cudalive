package converter

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/tmc/cudalive/cudalive-backend/graph/model"
)

const (
	pythonVersion = "3.11"
	torchVersion  = "2.3.0"
	cacheTimeout  = 24 * time.Hour // Cache virtual environments for 24 hours
)

type Converter struct {
	baseDir    string
	cacheMutex sync.Mutex
	cacheDir   string
	logger     *log.Logger

	buf *bytes.Buffer
}

type ConversionResult struct {
	TritonCode string
	Logs       string
}

func Ptr[T any](t T) *T {
	return &t
}

func NewConverter(baseDir string) (*Converter, error) {
	if err := os.MkdirAll(baseDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create base directory: %w", err)
	}

	cacheDir := filepath.Join(baseDir, "cache")
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create cache directory: %w", err)
	}

	logger := log.New(os.Stdout, "Converter: ", log.Ldate|log.Ltime|log.Lshortfile)

	return &Converter{
		baseDir:  baseDir,
		cacheDir: cacheDir,
		logger:   logger,
		buf:      new(bytes.Buffer),
	}, nil
}

func (c *Converter) ConvertPythonToTriton(pythonVersion, pythonCode string, additionalPackages []string, updateChan chan<- *model.TritonConversionResult) (*ConversionResult, error) {
	c.buf.Reset()
	c.buf.Write([]byte("# Converted to triton by CUDALive\n"))
	c.logger.Println("Starting triton conversion process")
	c.sendUpdate(updateChan, model.UpdateTypeInitialization, "Starting triton conversion process", false, false, nil)

	// Create or get cached virtual environment
	envPath, err := c.getOrCreateVirtualEnv(additionalPackages, updateChan)
	if err != nil {
		c.sendUpdate(updateChan, model.UpdateTypeError, fmt.Sprintf("Failed to set up virtual environment: %v", err), true, false, nil)
		return nil, fmt.Errorf("failed to set up virtual environment: %w", err)
	}

	c.sendUpdate(updateChan, model.UpdateTypeConversionProgress, "Creating temporary Python file", false, false, nil)
	// Create a temporary Python file with the conversion code
	tmpfile, err := c.createTempPythonFile(pythonCode)
	if err != nil {
		c.sendUpdate(updateChan, model.UpdateTypeError, fmt.Sprintf("Failed to create temporary Python file: %v", err), true, false, nil)
		return nil, fmt.Errorf("failed to create temporary Python file: %w", err)
	}
	c.buf.Write([]byte(fmt.Sprintf("# Python script: %s\n", tmpfile.Name())))
	// defer os.Remove(tmpfile.Name())

	c.sendUpdate(updateChan, model.UpdateTypeConversionProgress, "Running conversion script", false, false, nil)
	// Run the conversion script in the virtual environment
	cmd := exec.Command(filepath.Join(envPath, "bin", "python"), tmpfile.Name())
	cmd.Env = append(os.Environ(), fmt.Sprintf("PYTHONPATH=%s", envPath))

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		c.sendUpdate(updateChan, model.UpdateTypeError, fmt.Sprintf("Failed to create stdout pipe: %v", err), true, false, nil)
		return nil, fmt.Errorf("failed to create stdout pipe: %w", err)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		c.sendUpdate(updateChan, model.UpdateTypeError, fmt.Sprintf("Failed to create stderr pipe: %v", err), true, false, nil)
		return nil, fmt.Errorf("failed to create stderr pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		c.sendUpdate(updateChan, model.UpdateTypeError, fmt.Sprintf("Failed to start conversion command: %v", err), true, false, nil)
		return nil, fmt.Errorf("failed to start conversion command: %w", err)
	}

	go c.streamOutput(stdout, updateChan, false)
	go c.streamOutput(stderr, updateChan, true)

	if err := cmd.Wait(); err != nil {
		c.sendUpdate(updateChan, model.UpdateTypeError, fmt.Sprintf("Conversion failed: %v", err), true, false, nil)
		return nil, fmt.Errorf("conversion failed: %w", err)
	}

	c.sendUpdate(updateChan, model.UpdateTypeCompletion, "Conversion completed successfully", false, true, nil)

	return &ConversionResult{
		TritonCode: "Streamed to client",
		Logs:       "Streamed to client",
	}, nil
}

func (c *Converter) sendUpdate(updateChan chan<- *model.TritonConversionResult, updateType model.UpdateType, message string, isError bool, isComplete bool, progress *float64) {
	updateChan <- &model.TritonConversionResult{
		Type:       updateType,
		Message:    message,
		IsError:    isError,
		IsComplete: isComplete,
		Timestamp:  time.Now().Format(time.RFC3339),
		Progress:   progress,
		TritonCode: Ptr(c.buf.String()),
	}
	time.Sleep(time.Millisecond * 150) // artificial delay
}

func (c *Converter) streamOutput(reader io.Reader, updateChan chan<- *model.TritonConversionResult, isError bool) {
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		updateType := model.UpdateTypeConversionProgress
		if isError {
			updateType = model.UpdateTypeError
			c.buf.Write(scanner.Bytes())
		} else {
			// add to c.buf:
			c.buf.Write(scanner.Bytes())
		}
		c.sendUpdate(updateChan, updateType, scanner.Text(), isError, false, nil)
	}
}

func (c *Converter) getOrCreateVirtualEnv(additionalPackages []string, updateChan chan<- *model.TritonConversionResult) (string, error) {
	c.cacheMutex.Lock()
	defer c.cacheMutex.Unlock()

	cacheKey := c.generateCacheKey(additionalPackages)
	envPath := filepath.Join(c.cacheDir, cacheKey)

	// Check if a valid cached environment exists
	if c.isValidCachedEnv(envPath) {
		c.logger.Printf("Using cached virtual environment: %s", envPath)
		c.sendUpdate(updateChan, model.UpdateTypeEnvironmentSetup, "Using cached virtual environment", false, false, nil)
		return envPath, nil
	}

	// Create a new virtual environment
	c.logger.Println("Creating new virtual environment (not cached)")
	c.sendUpdate(updateChan, model.UpdateTypeEnvironmentSetup, "Creating new virtual environment", false, false, nil)
	if err := c.createVirtualEnv(envPath); err != nil {
		return "", err
	}

	// Install PyTorch and additional packages
	msg := fmt.Sprintf("Installing PyTorch %s and additional packages (%s)", torchVersion, strings.Join(additionalPackages, ", "))
	c.sendUpdate(updateChan, model.UpdateTypePackageInstallation, msg, false, false, nil)
	if err := c.installPackages(envPath, additionalPackages, updateChan); err != nil {
		os.RemoveAll(envPath) // Clean up on failure
		return "", err
	}

	return envPath, nil
}

func (c *Converter) generateCacheKey(additionalPackages []string) string {
	key := fmt.Sprintf("%s-%s-%s", pythonVersion, torchVersion, strings.Join(additionalPackages, "-"))
	hash := sha256.Sum256([]byte(key))
	return hex.EncodeToString(hash[:])
}

func (c *Converter) isValidCachedEnv(envPath string) bool {
	info, err := os.Stat(envPath)
	if os.IsNotExist(err) {
		return false
	}
	return time.Since(info.ModTime()) < cacheTimeout
}

func (c *Converter) createVirtualEnv(envPath string) error {
	cmd := exec.Command("python3", "-m", "venv", envPath)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to create virtual environment: %w\nOutput: %s", err, output)
	}
	return nil
}

func (c *Converter) installPackages(envPath string, additionalPackages []string, updateChan chan<- *model.TritonConversionResult) error {
	pipPath := filepath.Join(envPath, "bin", "pip")

	// Install PyTorch
	c.sendUpdate(updateChan, model.UpdateTypePackageInstallation, fmt.Sprintf("Installing PyTorch %s", torchVersion), false, false, nil)
	cmd := exec.Command(pipPath, "install", fmt.Sprintf("torch==%s", torchVersion))
	output, err := cmd.CombinedOutput()
	if err != nil {
		c.sendUpdate(updateChan, model.UpdateTypeError, fmt.Sprintf("Failed to install PyTorch: %v", err), true, false, nil)
		return fmt.Errorf("failed to install PyTorch: %w\nOutput: %s", err, output)
	}

	// Install additional packages
	if len(additionalPackages) > 0 {
		c.sendUpdate(updateChan, model.UpdateTypePackageInstallation, fmt.Sprintf("Installing additional packages: %s", strings.Join(additionalPackages, ", ")), false, false, nil)
		args := append([]string{"install"}, additionalPackages...)
		cmd = exec.Command(pipPath, args...)
		output, err := cmd.CombinedOutput()
		if err != nil {
			c.sendUpdate(updateChan, model.UpdateTypeError, fmt.Sprintf("Failed to install additional packages: %v", err), true, false, nil)
			return fmt.Errorf("failed to install additional packages: %w\nOutput: %s", err, output)
		}
	}

	return nil
}

func (c *Converter) createTempPythonFile(pythonCode string) (*os.File, error) {
	converterCode := `
import torch
import torch._dynamo as dynamo
import logging
from io import StringIO
import sys

def convert_to_triton(python_code):
    # Set up logging to capture output code
    log_capture_string = StringIO()
    ch = logging.StreamHandler(log_capture_string)
    ch.setLevel(logging.DEBUG)
    logging.getLogger().addHandler(ch)

    # Enable output_code artifact
    torch._logging.set_logs(output_code=True)

    # Create a simple function from the Python code
    def func_to_convert():
        exec(python_code)

    # Use torch.compile to trigger TorchInductor
    optimized_func = torch.compile(func_to_convert)

    # Run the function to trigger compilation and logging
    optimized_func()

    # Get the captured log output
    log_contents = log_capture_string.getvalue()

    # Clean up logging
    logging.getLogger().removeHandler(ch)

    # Extract Triton code from the log output
    triton_code = extract_triton_code(log_contents)

    return triton_code

def extract_triton_code(log_output):
    triton_code = []
    capture = False
    for line in log_output.split('\n'):
        if line.strip().startswith('def triton_'):
            capture = True
        if capture:
            triton_code.append(line)
        if line.strip() == '':
            capture = False
    return '\n'.join(triton_code)

# Your Python code goes here
python_code = """
%s
"""

triton_code = convert_to_triton(python_code)
print(triton_code)
`
	converterCode = fmt.Sprintf(converterCode, pythonCode)

	tmpfile, err := os.CreateTemp("", "converter_*.py")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp file: %w", err)
	}
	fmt.Println("converter:", tmpfile.Name())

	if _, err := tmpfile.Write([]byte(converterCode)); err != nil {
		tmpfile.Close()
		return nil, fmt.Errorf("failed to write to temp file: %w", err)
	}

	if err := tmpfile.Close(); err != nil {
		return nil, fmt.Errorf("failed to close temp file: %w", err)
	}

	return tmpfile, nil
}

func (c *Converter) CleanupOldCaches() error {
	c.logger.Println("Starting cleanup of old cached environments")
	entries, err := os.ReadDir(c.cacheDir)
	if err != nil {
		return fmt.Errorf("failed to read cache directory: %w", err)
	}

	for _, entry := range entries {
		i, err := entry.Info()
		if err != nil {
			return fmt.Errorf("failed to get info of cache entry: %w", err)
		}
		if entry.IsDir() && time.Since(i.ModTime()) > cacheTimeout {
			envPath := filepath.Join(c.cacheDir, entry.Name())
			c.logger.Printf("Removing old cached environment: %s", envPath)
			if err := os.RemoveAll(envPath); err != nil {
				c.logger.Printf("Failed to remove old cache: %s, error: %v", envPath, err)
			}
		}
	}

	c.logger.Println("Cleanup of old cached environments completed")
	return nil
}
