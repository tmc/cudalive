import React, { useState, useEffect, useRef } from 'react';
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
import { UpdateMessage, UpdateType } from '@/gql-gen/graphql'

import { defaultPythonCode } from './default-python-code';
import { defaultTritonCode } from './default-triton-code';

const CONVERT_PYTHON_TO_TRITON_SUBSCRIPTION = gql`
  subscription ConvertPythonToTriton($input: TritonConversionRequestInput!) {
    convertPythonToTriton(input: $input) {
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
      conversionRequest {
        pythonVersion
        pythonPackages
        pythonCode
      }
      tritonCode
      timestamp
    }
  }
`;

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

export function CUDALiveConverter() {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "vs-dark" : "vs-light";
  
  const [pythonCode, setPythonCode] = useState(defaultPythonCode);
  const [tritonCode, setTritonCode] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gistId, setGistId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [conversionLogs, setConversionLogs] = useState<UpdateMessage[]>([]);
  const [conversionProgress, setConversionProgress] = useState(0);

  const logEndRef = useRef<HTMLDivElement>(null);

  const [saveConversion] = useMutation(SAVE_CONVERSION_MUTATION);

  const { data, loading, error: subscriptionError } = useSubscription<{ convertPythonToTriton: UpdateMessage }>(
    CONVERT_PYTHON_TO_TRITON_SUBSCRIPTION,
    {
      variables: { input: {
        pythonVersion: '3.11',
        pythonPackages: ['numpy'],
        pythonCode: pythonCode,
      }},
      skip: !isConverting,
      onSubscriptionData: ({ subscriptionData }) => {
        const update = subscriptionData.data?.convertPythonToTriton;
        if (update) {
          setConversionLogs(prevLogs => [...prevLogs, update]);
          
          switch (update.type) {
            case UpdateType.ConversionProgress:
              if (update.tritonCode) {
                setTritonCode(update.tritonCode);
              }
              if (update.progress !== undefined) {
                setConversionProgress(update.progress);
              }
              break;
            case UpdateType.Completion:
              setIsConverting(false);
              handleSaveConversion();
              break;
            case UpdateType.Error:
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

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversionLogs]);

  const handleConvert = () => {
    setIsConverting(true);
    setTritonCode('');
    setError(null);
    setConversionLogs([]);
    setConversionProgress(0);
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

  const renderLogMessage = (index: number, log: UpdateMessage) => {
    const getIcon = () => {
      switch (log.type) {
        case UpdateType.Initialization: return '🚀';
        case UpdateType.EnvironmentSetup: return '🔧';
        case UpdateType.PackageInstallation: return '📦';
        case UpdateType.ConversionProgress: return '🔄';
        case UpdateType.Completion: return '✅';
        case UpdateType.Error: return '❌';
        default: return '📌';
      }
    };

    return (
      <div key={index} className={`mb-2 ${log.isError ? 'text-red-500' : ''}`}>
        <Badge variant={log.isError ? "destructive" : "secondary"}>{getIcon()} {log.type}</Badge>
        <p className="ml-6">{log.message}</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <Menubar className="w-full">
        <MenubarMenu>
          <h1 className="text-lg font-medium p-4">CUDA Live Converter</h1>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={handleSaveGist}>Save to Gist</MenubarItem>
            <MenubarItem onClick={handleLoadGist}>Load from Gist</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Undo</MenubarItem>
            <MenubarItem>Redo</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Cut</MenubarItem>
            <MenubarItem>Copy</MenubarItem>
            <MenubarItem>Paste</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Theme</MenubarItem>
            <MenubarItem>Font Size</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Word Wrap</MenubarItem>
            <MenubarItem>Line Numbers</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Documentation</MenubarItem>
            <MenubarItem>Keyboard Shortcuts</MenubarItem>
            <MenubarSeparator />
            <ModeToggle />
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

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
          {isConverting && (
            <div className="flex-grow">
              <div className="text-sm mb-1">Conversion Progress</div>
              <progress value={conversionProgress} max="100" className="w-full" />
            </div>
          )}
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
        
        <ScrollArea className="h-[200px] border rounded p-2 mt-4">
          {conversionLogs.map((log, index) => renderLogMessage(index, log))}
          <div ref={logEndRef} />
        </ScrollArea>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
