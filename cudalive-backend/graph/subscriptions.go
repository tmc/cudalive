package graph

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/tmc/cudalive/graph/model"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/openai"
	"github.com/tmc/langchaingo/schema"
)

func (r *subscriptionResolver) genericCompletion(ctx context.Context, prompt string) (<-chan *model.CompletionChunk, error) {
	llm, err := openai.New()
	if err != nil {
		fmt.Println("Error creating openai client", err)
		return r.fakeGenericCompletion(ctx, prompt)
	}
	ch := make(chan *model.CompletionChunk, 1)
	go func() {
		defer close(ch)
		_, err := llm.Chat(ctx, []schema.ChatMessage{
			schema.HumanChatMessage{Text: prompt + " (be concise)"},
		}, llms.WithStreamingFunc(func(ctx context.Context, chunk []byte) error {
			ch <- &model.CompletionChunk{
				Text: string(chunk),
			}
			return nil
		}),
		)
		if err != nil {
			fmt.Println(err)
		}
		ch <- &model.CompletionChunk{
			Text:   "",
			IsLast: true,
		}
	}()
	return ch, nil
}

func (r *subscriptionResolver) fakeGenericCompletion(ctx context.Context, prompt string) (<-chan *model.CompletionChunk, error) {
	ch := make(chan *model.CompletionChunk, 1)
	response := "Hello! These are generated from the go backend. This is not a very funny joke"
	go func() {
		for i, word := range strings.Split(response, " ") {
			isLast := i == len(response)-1
			text := fmt.Sprintf("%v ", word)
			if isLast {
				text = word
			}
			select {
			case ch <- &model.CompletionChunk{
				Text:   text,
				IsLast: isLast,
			}:
			default:
				return
			}
			time.Sleep(200 * time.Millisecond)
		}
	}()
	return ch, nil
}
