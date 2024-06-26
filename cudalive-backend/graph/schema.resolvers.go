package graph

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.
// Code generated by github.com/99designs/gqlgen version v0.17.47

import (
	"context"
	"fmt"

	"github.com/tmc/cudalive/cudalive-backend/graph/model"
)

// CreateCodeSnippet is the resolver for the createCodeSnippet field.
func (r *mutationResolver) CreateCodeSnippet(ctx context.Context, content string, language model.Language) (*model.CodeSnippet, error) {
	panic(fmt.Errorf("not implemented: CreateCodeSnippet - createCodeSnippet"))
}

// UpdateCodeSnippet is the resolver for the updateCodeSnippet field.
func (r *mutationResolver) UpdateCodeSnippet(ctx context.Context, id string, content string) (*model.CodeSnippet, error) {
	panic(fmt.Errorf("not implemented: UpdateCodeSnippet - updateCodeSnippet"))
}

// DeleteCodeSnippet is the resolver for the deleteCodeSnippet field.
func (r *mutationResolver) DeleteCodeSnippet(ctx context.Context, id string) (bool, error) {
	panic(fmt.Errorf("not implemented: DeleteCodeSnippet - deleteCodeSnippet"))
}

// CompileCodeSnippet is the resolver for the compileCodeSnippet field.
func (r *mutationResolver) CompileCodeSnippet(ctx context.Context, id string) (*model.CompilationResult, error) {
	panic(fmt.Errorf("not implemented: CompileCodeSnippet - compileCodeSnippet"))
}

// SaveConversion is the resolver for the saveConversion field.
func (r *mutationResolver) SaveConversion(ctx context.Context, pythonCode string, tritonCode string) (*model.ConversionHistory, error) {
	panic(fmt.Errorf("not implemented: SaveConversion - saveConversion"))
}

// GetCodeSnippet is the resolver for the getCodeSnippet field.
func (r *queryResolver) GetCodeSnippet(ctx context.Context, id string) (*model.CodeSnippet, error) {
	panic(fmt.Errorf("not implemented: GetCodeSnippet - getCodeSnippet"))
}

// GetAllCodeSnippets is the resolver for the getAllCodeSnippets field.
func (r *queryResolver) GetAllCodeSnippets(ctx context.Context) ([]*model.CodeSnippet, error) {
	panic(fmt.Errorf("not implemented: GetAllCodeSnippets - getAllCodeSnippets"))
}

// GetCompilationResult is the resolver for the getCompilationResult field.
func (r *queryResolver) GetCompilationResult(ctx context.Context, id string) (*model.CompilationResult, error) {
	panic(fmt.Errorf("not implemented: GetCompilationResult - getCompilationResult"))
}

// GetConversionHistory is the resolver for the getConversionHistory field.
func (r *queryResolver) GetConversionHistory(ctx context.Context) ([]*model.ConversionHistory, error) {
	panic(fmt.Errorf("not implemented: GetConversionHistory - getConversionHistory"))
}

// CodeSnippetUpdated is the resolver for the codeSnippetUpdated field.
func (r *subscriptionResolver) CodeSnippetUpdated(ctx context.Context, id string) (<-chan *model.CodeSnippet, error) {
	return r.codeSnippetUpdated(ctx, id)
}

// CompilationResultUpdated is the resolver for the compilationResultUpdated field.
func (r *subscriptionResolver) CompilationResultUpdated(ctx context.Context, codeSnippetID string) (<-chan *model.CompilationResult, error) {
	return r.compilationResultUpdated(ctx, codeSnippetID)
}

// ConvertPythonToTriton is the resolver for the convertPythonToTriton field.
func (r *subscriptionResolver) ConvertPythonToTriton(ctx context.Context, input model.TritonConversionRequestInput) (<-chan *model.TritonConversionResult, error) {
	return r.convertPythonToTriton(ctx, input)
}

// GenericCompletion is the resolver for the genericCompletion field.
func (r *subscriptionResolver) GenericCompletion(ctx context.Context, prompt string) (<-chan *model.CompletionChunk, error) {
	return r.genericCompletion(ctx, prompt)
}

// Mutation returns MutationResolver implementation.
func (r *Resolver) Mutation() MutationResolver { return &mutationResolver{r} }

// Query returns QueryResolver implementation.
func (r *Resolver) Query() QueryResolver { return &queryResolver{r} }

// Subscription returns SubscriptionResolver implementation.
func (r *Resolver) Subscription() SubscriptionResolver { return &subscriptionResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
type subscriptionResolver struct{ *Resolver }
