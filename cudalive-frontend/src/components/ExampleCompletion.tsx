import { useState, useEffect } from 'react';
import { useSubscription } from '@apollo/client';
import { graphql } from '../gql-gen';

import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";

if (import.meta.env.MODE === 'development') {
  loadDevMessages();
  loadErrorMessages();
}

const completionSubscription = graphql(`
  subscription GenericSubscription($prompt: String!) {
    genericCompletion(prompt: $prompt) {
      text
      isLast
    }
  }
`);

function ExampleCompletion() {
  const [prompt, setPrompt] = useState("Tell me about the number 42.");
  const [debouncedPrompt, setDebouncedPrompt] = useState(prompt);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setResult("");
      setChunks([]);
      setDebouncedPrompt(prompt);
    }, 500);
    return () => clearTimeout(timeout);
  }, [prompt]);

  const [result, setResult] = useState("");
  const [chunks, setChunks] = useState<string[]>([]);

  const { loading } = useSubscription(completionSubscription, {
    variables: { prompt: debouncedPrompt },
    onError: (err) => {
      console.error(err);
    },
    onData: ({ data }) => {
      const completion = data?.data?.genericCompletion;
      if (completion) {
        setChunks((prevChunks) => [...prevChunks, completion.text]);
      }
    },
  });

  useEffect(() => {
    const newResult = chunks.map((chunk) => chunk).join('');
    setResult(newResult);
  }, [chunks]);

  return (
    <div style={{ fontSize: 'small' }}>
      <pre>
        loading: {loading ? 'true' : 'false'}<br/>
      </pre>
      <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}
        style={{ width: '400px', height: '30px' }}
      />
      <br/>
      <textarea readOnly value={result} style={{ width: '400px', height: '400px' }} />
    </div>
  );
}

export default ExampleCompletion;
