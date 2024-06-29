package graph

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/tmc/cudalive/cudalive-backend/converter"
	"github.com/tmc/cudalive/cudalive-backend/graph/model"
)

var conv *converter.Converter

func init() {
	var err error
	conv, err = converter.NewConverter("/tmp/cudalive_conversions")
	if err != nil {
		panic(fmt.Sprintf("Failed to initialize converter: %v", err))
	}
}

func (r *subscriptionResolver) codeSnippetUpdated(ctx context.Context, id string) (<-chan *model.CodeSnippet, error) {
	ch := make(chan *model.CodeSnippet)
	go func() {
		defer close(ch)
		// This is a placeholder implementation. In a real-world scenario,
		// you would listen for actual updates to the code snippet.
		time.Sleep(2 * time.Second)
		ch <- &model.CodeSnippet{
			ID:        id,
			Content:   "Updated content",
			UpdatedAt: time.Now().Format(time.RFC3339),
		}
	}()
	return ch, nil
}

func (r *subscriptionResolver) compilationResultUpdated(ctx context.Context, codeSnippetID string) (<-chan *model.CompilationResult, error) {
	ch := make(chan *model.CompilationResult)
	go func() {
		defer close(ch)
		// This is a placeholder implementation. In a real-world scenario,
		// you would listen for actual updates to the compilation result.
		time.Sleep(2 * time.Second)
		ch <- &model.CompilationResult{
			ID:            "some-id",
			CodeSnippetID: codeSnippetID,
			Output:        "Compilation complete",
			Status:        model.CompilationStatusCompleted,
			CreatedAt:     time.Now().Format(time.RFC3339),
		}
	}()
	return ch, nil

}

func Ptr[T any](v T) *T {
	return &v
}

func (r *subscriptionResolver) convertPythonToTriton(ctx context.Context, input model.TritonConversionRequestInput) (<-chan *model.TritonConversionResult, error) {
	ch := make(chan *model.TritonConversionResult)

	go func() {
		defer close(ch)

		// Send an initial "processing" message
		ch <- &model.TritonConversionResult{
			Timestamp:  time.Now().Format(time.RFC3339),
			TritonCode: Ptr("# Initializing conversion process..."),
			IsComplete: false,
		}

		// Perform the actual conversion
		tritonCode, err := conv.ConvertPythonToTriton(input.PythonVersion, input.PythonCode, input.PythonPackages, ch)
		fmt.Println("Conversion complete!", tritonCode, err)
		if err != nil {
			ch <- &model.TritonConversionResult{
				Timestamp:  time.Now().Format(time.RFC3339),
				TritonCode: Ptr(fmt.Sprintf("# Error: %v", err)),
				IsComplete: true,
			}
			return
		}
		fmt.Println("Conversion complete!", tritonCode)

		// Split the Triton code into chunks for progressive updates
		chunks := strings.Split(tritonCode.TritonCode, "\n")
		for i, chunk := range chunks {
			ch <- &model.TritonConversionResult{
				Timestamp:  time.Now().Format(time.RFC3339),
				TritonCode: &chunk,
				IsComplete: i == len(chunks)-1,
			}
			time.Sleep(100 * time.Millisecond) // Simulate processing time
		}
	}()

	return ch, nil
}

// func (r *subscriptionResolver) ErrorOccurred(ctx context.Context, codeSnippetID string) (<-chan *model.Error, error) {
// 	ch := make(chan *model.Error)
// 	go func() {
// 		defer close(ch)
// 		// This is a placeholder implementation. In a real-world scenario,
// 		// you would listen for actual errors related to the code snippet.
// 		time.Sleep(2 * time.Second)
// 		ch <- &model.Error{
// 			Message: "An error occurred",
// 		}
// 	}()
// 	return ch, nil
// }

// func (r *subscriptionResolver) ExplanationGenerated(ctx context.Context, codeSnippetID string) (<-chan *model.Explanation, error) {
// 	ch := make(chan *model.Explanation)
// 	go func() {
// 		defer close(ch)
// 		// This is a placeholder implementation. In a real-world scenario,
// 		// you would generate an actual explanation for the code snippet.
// 		time.Sleep(2 * time.Second)
// 		ch <- &model.Explanation{
// 			ID:            "some-id",
// 			CodeSnippetID: codeSnippetID,
// 			Explanation:   "This is a generated explanation.",
// 			CreatedAt:     time.Now().Format(time.RFC3339),
// 			UpdatedAt:     time.Now().Format(time.RFC3339),
// 		}
// 	}()
// 	return ch, nil
// }

func (r *subscriptionResolver) genericCompletion(ctx context.Context, prompt string) (<-chan *model.CompletionChunk, error) {
	ch := make(chan *model.CompletionChunk)
	go func() {
		defer close(ch)
		// This is a placeholder implementation. In a real-world scenario,
		// you would listen for actual completion suggestions.
		time.Sleep(2 * time.Second)
		ch <- &model.CompletionChunk{
			Text: "Completion suggestion",
		}
	}()
	return ch, nil
}
