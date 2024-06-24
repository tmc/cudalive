import React, { useState, useEffect } from 'react';
import { useSubscription, useMutation, gql } from '@apollo/client';
import { MenubarTrigger, MenubarItem, MenubarSeparator, MenubarContent, MenubarMenu, Menubar } from "@/components/ui/menubar"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Github } from "lucide-react"
import Editor from '@monaco-editor/react';

import { UpdateMessage } from '@/gql-gen/types';

const CONVERT_PYTHON_TO_TRITON_SUBSCRIPTION = gql`
  subscription ConvertPythonToTriton($pythonCode: String!) {
    convertPythonToTriton(pythonCode: $pythonCode) {
      type
      message
      isError
      isComplete
      timestamp
      progress
      tritonCode
    }
  }
`;

const SAVE_CONVERSION_MUTATION = gql`
  mutation SaveConversion($pythonCode: String!, $tritonCode: String!) {
    saveConversion(pythonCode: $pythonCode, tritonCode: $tritonCode) {
      id
      pythonCode
      tritonCode
      timestamp
    }
  }
`;

// GitHub Gist API functions (these should be in a separate file in a real application)
async function createGist(filename: string, content: string, accessToken: string) {
  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': `token ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [filename]: {
          content: content,
        },
      },
      public: false,
    }),
  });
  return response.json();
}

async function loadGist(gistId: string, accessToken: string) {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      'Authorization': `token ${accessToken}`,
    },
  });
  return response.json();
}

export function CUDALiveConverter2() {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "vs-dark" : "vs-light";
  
  const [pythonCode, setPythonCode] = useState('');
  const [tritonCode, setTritonCode] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gistId, setGistId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [saveConversion] = useMutation(SAVE_CONVERSION_MUTATION);

// In your component:
const { data, loading, error: subscriptionError } = useSubscription<{ convertPythonToTriton: UpdateMessage }>(
  CONVERT_PYTHON_TO_TRITON_SUBSCRIPTION,
  {
    variables: { pythonCode },
    skip: !isConverting,
    onSubscriptionData: ({ subscriptionData }) => {
      const update = subscriptionData.data?.convertPythonToTriton;
      if (update) {
        // Handle different update types
        switch (update.type) {
          case 'INITIALIZATION':
            console.log('Conversion initialized');
            break;
          case 'ENVIRONMENT_SETUP':
            console.log('Setting up environment');
            break;
          case 'PACKAGE_INSTALLATION':
            console.log('Installing packages');
            break;
          case 'CONVERSION_PROGRESS':
            if (update.tritonCode) {
              setTritonCode(prevCode => prevCode + update.tritonCode);
            }
            if (update.progress) {
              // Update progress bar
            }
            break;
          case 'COMPLETION':
            setIsConverting(false);
            handleSaveConversion();
            break;
          case 'ERROR':
            setError(update.message);
            setIsConverting(false);
            break;
        }
      }
    },
  }
);

  useEffect(() => {
    if (subscriptionError) {
      setError(subscriptionError.message);
      setIsConverting(false);
    }
  }, [subscriptionError]);

  const handleConvert = () => {
    setIsConverting(true);
    setTritonCode('');
    setError(null);
  };

  const handleSaveConversion = async () => {
    try {
      await saveConversion({
        variables: { pythonCode, tritonCode },
      });
    } catch (err) {
      setError('Failed to save conversion history');
    }
  };

  const handleSaveGist = async () => {
    if (!accessToken) {
      setError('GitHub access token not set. Please set your access token.');
      return;
    }
    try {
      const result = await createGist('python_code.py', pythonCode, accessToken);
      setGistId(result.id);
      alert(`Gist saved! ID: ${result.id}`);
    } catch (error) {
      setError('Failed to save Gist. Please check your access token and try again.');
    }
  };

  const handleLoadGist = async () => {
    if (!accessToken) {
      setError('GitHub access token not set. Please set your access token.');
      return;
    }
    if (!gistId) {
      setError('Please enter a Gist ID to load.');
      return;
    }
    try {
      const result = await loadGist(gistId, accessToken);
      const content = result.files['python_code.py'].content;
      setPythonCode(content);
    } catch (error) {
      setError('Failed to load Gist. Please check the Gist ID and your access token and try again.');
    }
  };

  return (
    <>
      <Menubar className="w-full">
        {/* ... (Menubar content remains the same) ... */}
      </Menubar>

      <div className="flex flex-col h-screen w-full">
        <div className="flex-grow flex">
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col">
            <div className="text-lg font-medium mb-4">Python Code <Badge>Python 3.11</Badge></div>
            <Editor
              height="100%"
              defaultLanguage="python"
              value={pythonCode}
              onChange={(value) => setPythonCode(value || '')}
              theme={theme}
            />
          </div>
          <div className="w-1/2 p-6 flex flex-col">
            <div className="text-lg font-medium mb-4">Triton Code Output <Badge>PyTorch 2.3</Badge></div>
            <Editor
              height="100%"
              defaultLanguage="python"
              value={tritonCode}
              theme={theme}
              options={{ readOnly: true }}
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-4 mb-4">
            <Button onClick={handleConvert} disabled={isConverting || !pythonCode}>
              {isConverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                'Convert to Triton'
              )}
            </Button>
          </div>
          
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="text"
              value={accessToken || ''}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="GitHub Access Token"
              className="flex-grow p-2 border rounded"
            />
            <input
              type="text"
              value={gistId || ''}
              onChange={(e) => setGistId(e.target.value)}
              placeholder="Gist ID"
              className="flex-grow p-2 border rounded"
            />
            <Button onClick={handleSaveGist}>
              <Github className="mr-2 h-4 w-4" />
              Save to Gist
            </Button>
            <Button onClick={handleLoadGist}>
              <Github className="mr-2 h-4 w-4" />
              Load from Gist
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </>
  );
}
