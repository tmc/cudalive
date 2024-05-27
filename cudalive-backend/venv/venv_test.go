package venv

import (
	"os"
	"os/exec"
	"testing"
)

func TestCreateVenv(t *testing.T) {
	venvPath := "./testenv"
	err := CreateVenv(venvPath)
	if err != nil {
		t.Fatalf("Failed to create virtual environment: %v", err)
	}

	if _, err := os.Stat(venvPath); os.IsNotExist(err) {
		t.Fatalf("Virtual environment directory does not exist: %v", err)
	}

	// Clean up
	os.RemoveAll(venvPath)
}

func TestInstallPackage(t *testing.T) {
	venvPath := "./testenv"
	err := CreateVenv(venvPath)
	if err != nil {
		t.Fatalf("Failed to create virtual environment: %v", err)
	}

	packageName := "requests"
	err = InstallPackage(venvPath, packageName)
	if err != nil {
		t.Fatalf("Failed to install package: %v", err)
	}

	cmd := exec.Command(venvPath+"/bin/pip", "show", packageName)
	if err := cmd.Run(); err != nil {
		t.Fatalf("Package %s not found in virtual environment: %v", packageName, err)
	}

	// Clean up
	os.RemoveAll(venvPath)
}