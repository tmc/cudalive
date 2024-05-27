package venv

import (
	"fmt"
	"os"
	"os/exec"
)

// CreateVenv creates a Python virtual environment at the specified path.
func CreateVenv(path string) error {
	cmd := exec.Command("python3", "-m", "venv", path)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to create virtual environment: %w", err)
	}
	return nil
}

// InstallPackage installs a package into the specified Python virtual environment.
func InstallPackage(venvPath, packageName string) error {
	pipPath := fmt.Sprintf("%s/bin/pip", venvPath)
	cmd := exec.Command(pipPath, "install", packageName)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to install package %s: %w", packageName, err)
	}
	return nil
}