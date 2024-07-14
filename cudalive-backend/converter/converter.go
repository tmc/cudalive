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
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/davecgh/go-spew/spew"
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
	// c.buf.Reset()
	// c.buf.Write([]byte("# Converted to triton by CUDALive\n"))
	c.logger.Println("Starting triton conversion process")
	c.sendUpdate(updateChan, model.UpdateTypeInitialization, "Starting triton conversion process", false, false, Ptr(5.0))

	// Create or get cached virtual environment
	envPath, err := c.getOrCreateVirtualEnv(additionalPackages, updateChan)
	if err != nil {
		c.sendUpdate(updateChan, model.UpdateTypeError, fmt.Sprintf("Failed to set up virtual environment: %v", err), true, false, nil)
		return nil, fmt.Errorf("failed to set up virtual environment: %w", err)
	}

	c.sendUpdate(updateChan, model.UpdateTypeConversionProgress, "Creating temporary Python file", false, false, Ptr(10.0))
	// Create a temporary Python file with the conversion code
	tmpfile, err := c.createTempPythonFile(pythonCode)
	if err != nil {
		c.sendUpdate(updateChan, model.UpdateTypeError, fmt.Sprintf("Failed to create temporary Python file: %v", err), true, false, nil)
		return nil, fmt.Errorf("failed to create temporary Python file: %w", err)
	}
	//c.buf.Write([]byte(fmt.Sprint("# Processing..")))
	// defer os.Remove(tmpfile.Name())

	c.sendUpdate(updateChan, model.UpdateTypeConversionProgress, "Running conversion script", false, false, Ptr(23.0))
	// Run the conversion script in the virtual environment
	cmd := exec.Command(filepath.Join(envPath, "bin", "python"), tmpfile.Name())
	cmd.Env = append(os.Environ(), fmt.Sprintf("PYTHONPATH=%s", envPath))
	cmd.Env = append(os.Environ(), `TORCH_LOGS=output_code`)
	//cmd.Env = append(os.Environ(), `TORCHINDUCTOR_MAX_AUTOTUNE_GEMM_BACKENDS=TRITON`)

	stdoutBuf := new(bytes.Buffer)
	stderrBuf := new(bytes.Buffer)
	cmd.Stdout = io.MultiWriter(stdoutBuf, os.Stdout)
	cmd.Stderr = io.MultiWriter(stderrBuf, os.Stderr)

	if err := cmd.Start(); err != nil {
		c.sendUpdate(updateChan, model.UpdateTypeError, fmt.Sprintf("Failed to start conversion command: %v", err), true, false, nil)
		return nil, fmt.Errorf("failed to start conversion command: %w", err)
	}

	// go c.streamOutput(stdout, updateChan, false)
	// go c.streamOutput(stderr, updateChan, true)

	if err := cmd.Wait(); err != nil {
		c.sendUpdate(updateChan, model.UpdateTypeError, fmt.Sprintf("Conversion failed: %v", err), true, false, nil)
		return nil, fmt.Errorf("conversion failed: %w", err)
	}
	outputCode, err := resolveOutput1(stderrBuf)
	fmt.Println("Out: ================================")
	fmt.Println("err:", err)
	fmt.Println("outputCode:", string(outputCode))
	fmt.Println("Out2: ================================")
	if err == nil {
		outputCode, err = resolveOutput2(bytes.NewBuffer(outputCode))
		fmt.Println("err:", err)
		fmt.Println("outputCode:", string(outputCode))
	}
	fmt.Println("Out Done: ================================")
	// if err != nil {
	// 	c.sendUpdate(updateChan, model.UpdateTypeError, fmt.Sprintf("Failed to extract output code: %v", err), true, false, nil)
	// 	return nil, fmt.Errorf("failed to extract output code: %w", err)
	// }
	c.buf.Reset()
	io.Copy(c.buf, bytes.NewReader(outputCode))

	fmt.Println("triton:", c.buf.String())
	c.sendUpdate(updateChan, model.UpdateTypeConversionProgress, "Output code generated", false, true, Ptr(100.0))

	return &ConversionResult{
		TritonCode: "Streamed to client",
		Logs:       "Streamed to client",
	}, nil
}

func resolveOutput1(buf *bytes.Buffer) ([]byte, error) {
	return resolveOutput(buf, `Output code written to: (.*)`)
}

func resolveOutput2(buf *bytes.Buffer) ([]byte, error) {
	return resolveOutput(buf, `kernel path: (.*)`)
}

func resolveOutputOld(stderrBuf *bytes.Buffer, pattern string) ([]byte, error) {
	outputPathRe := regexp.MustCompile(pattern)
	outputPath := ""
	// scan output for the regexp (across newlines):
	out := stderrBuf.Bytes()
	matches := outputPathRe.FindStringSubmatch(string(out))
	if len(matches) > 1 {
		outputPath = matches[1]
	}
	spew.Dump(matches)
	// if we find more than one, return the input as is:
	if len(matches) > 2 {
		return out, nil
	}
	if outputPath == "" {
		return out, fmt.Errorf("failed to extract output path from logs (pattern: %s)", pattern)
	}
	outputCode, err := os.ReadFile(outputPath)
	if err != nil {
		return out, fmt.Errorf("failed to read output code: %w", err)
	}
	return outputCode, nil
}

func resolveOutput(stderrBuf *bytes.Buffer, pattern string) ([]byte, error) {
	outputPathRe := regexp.MustCompile(pattern)
	out := stderrBuf.Bytes()
	matches := outputPathRe.FindAllSubmatch(out, -1)

	if len(matches) > 1 {
		return out, nil
	}

	if len(matches) == 0 || len(matches[0]) < 2 {
		return out, fmt.Errorf("failed to extract output path from logs (pattern: %s)", pattern)
	}

	outputPath := string(matches[0][1])
	outputCode, err := os.ReadFile(outputPath)
	if err != nil {
		return out, fmt.Errorf("failed to read output code: %w", err)
	}
	return outputCode, nil
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
		fmt.Fprintln(os.Stderr, scanner.Text())
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
	c.logger.Println("Creating virtual environment:", envPath)
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
	converterCode := pythonCode

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
