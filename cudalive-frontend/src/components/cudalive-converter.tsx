import { useState, useEffect, useRef, useCallback } from 'react';
import { useSubscription, useMutation, gql } from '@apollo/client';
import { MenubarTrigger, MenubarItem, MenubarSeparator, MenubarContent, MenubarMenu, Menubar } from "@/components/ui/menubar"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Github, ChevronDown, ChevronUp } from "lucide-react"
import Editor from '@monaco-editor/react';
import { TritonConversionResult, UpdateType } from '@/gql-gen/graphql'
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import * as Collapsible from '@radix-ui/react-collapsible';

import { defaultPythonCode } from './default-python-code';
// import { defaultTritonCode } from './default-triton-code';

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
  const [conversionLogs, setConversionLogs] = useState<TritonConversionResult[]>([]);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [isLogsOpen, setIsLogsOpen] = useState(true);

  const logEndRef = useRef<HTMLDivElement>(null);
  const conversionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [saveConversion] = useMutation(SAVE_CONVERSION_MUTATION);

  const handleConvert = useCallback(() => {
     setIsConverting(true);
     //setTritonCode('');
     setError(null);
     setConversionLogs([]);
     setConversionProgress(0);
  }, []);

  const { error: subscriptionError } = useSubscription<{ convertPythonToTriton: TritonConversionResult }>(
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
              if (update.progress !== undefined) {
                setConversionProgress(update.progress!);
              }
              if (update.isComplete) {
                if (update.tritonCode) {
                  setTritonCode(update.tritonCode);
                }
                setIsConverting(false);
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

  useEffect(() => {
    if (conversionTimeoutRef.current) {
      clearTimeout(conversionTimeoutRef.current);
    }
    conversionTimeoutRef.current = setTimeout(() => {
      handleConvert();
    }, 600);

    return () => {
      if (conversionTimeoutRef.current) {
        clearTimeout(conversionTimeoutRef.current);
      }
    };
  }, [pythonCode, handleConvert]);

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

  const renderLogMessage = (index: number, log: TritonConversionResult) => {
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
          <h1 className="text-lg font-medium p-4">CUDALive Converter</h1>
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

      <div className="flex-grow flex flex-col">
        <PanelGroup direction="horizontal">
          <Panel minSize={30}>
            <div className="h-full p-6 flex flex-col">
              <div className="text-lg font-medium mb-4">Python Code <Badge>Python 3.11</Badge></div>
              <Editor
                height="100%"
                defaultLanguage="python"
                value={pythonCode}
                onChange={(value) => setPythonCode(value || '')}
                theme={theme}
              />
            </div>
          </Panel>
          <PanelResizeHandle className="w-2 bg-border hover:bg-primary cursor-col-resize" />
          <Panel minSize={30}>
            <div className="h-full p-6 flex flex-col">
              <div className="text-lg font-medium mb-4 flex items-center">
                Triton Code <Badge className="ml-2">PyTorch 2.3</Badge>
                {isConverting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </div>
              <Editor
                height="100%"
                defaultLanguage="python"
                value={tritonCode}
                theme={theme}
                options={{ readOnly: true }}
              />
            </div>
          </Panel>
        </PanelGroup>

        <div className="ml-6 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-4">
          <Button onClick={handleConvert} disabled={isConverting || !pythonCode}>
            {isConverting ? (
              <>
                <Loader2 className="mr-2 h-2 w-4 animate-spin" />
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
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        </div>
        <Collapsible.Root open={isLogsOpen} onOpenChange={setIsLogsOpen}>
          <Collapsible.Trigger asChild>
            <Button variant="ghost" className="w-full flex justify-between items-center p-2">
              Logs
              {isLogsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="p-2 border-t border-gray-200 dark:border-gray-800">
              <ScrollArea className="h-[160px] border rounded p-2 mt-2">
                {conversionLogs.map((log, index) => renderLogMessage(index, log))}
                <div ref={logEndRef} />
              </ScrollArea>

            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
      
    </div>
  );
}
